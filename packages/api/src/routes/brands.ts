import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { db } from '@brandly/core';
import { brands, briefings, creatorBrands, products, trackingLinks } from '@brandly/core';
import { eq, and, sql, desc, count } from 'drizzle-orm';

interface BrandQuery {
  category?: string;
  page?: number;
  limit?: number;
}

export async function brandRoutes(app: FastifyInstance) {
  // GET /api/brands — catalogo de marcas
  app.get<{ Querystring: BrandQuery }>('/', async (request, reply) => {
    const { category, page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;

    const conditions = [eq(brands.isActive, true)];
    if (category) {
      conditions.push(eq(brands.category, category as typeof brands.category.enumValues[number]));
    }

    const result = await db.select({
      id: brands.id,
      name: brands.name,
      logoUrl: brands.logoUrl,
      category: brands.category,
      description: brands.description,
      websiteUrl: brands.websiteUrl,
      minVideosPerMonth: brands.minVideosPerMonth,
      maxCreators: brands.maxCreators,
      createdAt: brands.createdAt,
      creatorsConnected: sql<number>`count(DISTINCT ${creatorBrands.id})::int`,
      tone: sql<string>`(SELECT b.tone FROM briefings b WHERE b.brand_id = ${brands.id} AND b.is_active = true LIMIT 1)`,
      contentGuidelines: sql<string>`(SELECT b.content_guidelines FROM briefings b WHERE b.brand_id = ${brands.id} AND b.is_active = true LIMIT 1)`,
      technicalRequirements: sql<string>`(SELECT b.technical_requirements FROM briefings b WHERE b.brand_id = ${brands.id} AND b.is_active = true LIMIT 1)`,
      exampleUrls: sql<string[]>`(SELECT b.example_urls FROM briefings b WHERE b.brand_id = ${brands.id} AND b.is_active = true LIMIT 1)`,
    })
      .from(brands)
      .leftJoin(creatorBrands, and(
        eq(creatorBrands.brandId, brands.id),
        eq(creatorBrands.isActive, true),
      ))
      .where(and(...conditions))
      .groupBy(brands.id)
      .orderBy(desc(brands.createdAt))
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db.select({ total: count() })
      .from(brands)
      .where(and(...conditions));

    return {
      brands: result,
      total: totalRow?.total ?? 0,
      page,
      limit,
      categories: [
        { id: 'beauty', label: 'Beleza e Skincare' },
        { id: 'supplements', label: 'Suplementos e Fitness' },
        { id: 'home', label: 'Casa e Decoracao' },
        { id: 'tech', label: 'Tech e Gadgets' },
        { id: 'fashion', label: 'Moda e Acessorios' },
        { id: 'food', label: 'Alimentos e Bebidas' },
      ],
    };
  });

  // GET /api/brands/my — marcas do creator (ANTES de /:id para nao ser capturada como parametro)
  app.get('/my', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const result = await db.select({
      connectionId: creatorBrands.id,
      connectedAt: creatorBrands.connectedAt,
      brand: {
        id: brands.id,
        name: brands.name,
        logoUrl: brands.logoUrl,
        category: brands.category,
        description: brands.description,
        websiteUrl: brands.websiteUrl,
        minVideosPerMonth: brands.minVideosPerMonth,
        maxCreators: brands.maxCreators,
      },
    })
      .from(creatorBrands)
      .innerJoin(brands, eq(creatorBrands.brandId, brands.id))
      .where(and(eq(creatorBrands.creatorId, userId), eq(creatorBrands.isActive, true)));

    return { brands: result, total: result.length };
  });

  // GET /api/brands/:id — detalhes da marca + briefing
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    const [brand] = await db.select()
      .from(brands)
      .where(eq(brands.id, id));

    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    const activeBriefings = await db.select()
      .from(briefings)
      .where(and(eq(briefings.brandId, id), eq(briefings.isActive, true)));

    const [creatorsRow] = await db.select({ total: count() })
      .from(creatorBrands)
      .where(and(eq(creatorBrands.brandId, id), eq(creatorBrands.isActive, true)));

    const creatorsConnected = creatorsRow?.total ?? 0;
    const slotsAvailable = Math.max(0, (brand.maxCreators ?? 0) - creatorsConnected);

    return {
      brand,
      briefings: activeBriefings,
      creatorsConnected,
      slotsAvailable,
    };
  });

  // POST /api/brands/:id/connect — creator se vincula a marca
  app.post<{ Params: { id: string } }>('/:id/connect', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { userId } = request.user;

    // Verificar se marca existe
    const [brand] = await db.select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.isActive, true)));

    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    // Verificar vagas disponiveis
    const [creatorsRow] = await db.select({ total: count() })
      .from(creatorBrands)
      .where(and(eq(creatorBrands.brandId, id), eq(creatorBrands.isActive, true)));

    const creatorsConnected = creatorsRow?.total ?? 0;
    if (brand.maxCreators && creatorsConnected >= brand.maxCreators) {
      return reply.status(400).send({ error: 'Marca sem vagas disponiveis no momento' });
    }

    // Verificar se ja esta conectado
    const [existing] = await db.select()
      .from(creatorBrands)
      .where(and(
        eq(creatorBrands.creatorId, userId),
        eq(creatorBrands.brandId, id),
        eq(creatorBrands.isActive, true),
      ));

    if (existing) {
      return reply.status(409).send({ error: 'Voce ja esta conectado a esta marca' });
    }

    // Criar vinculo creator-brand
    await db.insert(creatorBrands).values({
      creatorId: userId,
      brandId: id,
      isActive: true,
    });

    // Gerar tracking links para cada produto ativo da marca
    const activeProducts = await db.select()
      .from(products)
      .where(and(eq(products.brandId, id), eq(products.status, 'active')));

    if (activeProducts.length > 0) {
      const linkValues = activeProducts.map((product) => ({
        creatorId: userId,
        productId: product.id,
        code: crypto.randomBytes(6).toString('hex'),
        clicks: 0,
        conversions: 0,
      }));

      await db.insert(trackingLinks).values(linkValues);
    }

    return reply.status(201).send({
      message: 'Conectado a marca com sucesso! Voce ja pode comecar a produzir.',
      brandId: id,
      nextStep: 'Acesse os briefings e gere seus roteiros',
    });
  });

  // DELETE /api/brands/:id/disconnect — creator se desvincula
  app.delete<{ Params: { id: string } }>('/:id/disconnect', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { userId } = request.user;

    await db.update(creatorBrands)
      .set({ isActive: false })
      .where(and(
        eq(creatorBrands.creatorId, userId),
        eq(creatorBrands.brandId, id),
        eq(creatorBrands.isActive, true),
      ));

    return { message: 'Desconectado da marca', brandId: id };
  });
}
