/**
 * Endpoints que a marca (role='brand') usa para gerenciar o próprio perfil,
 * briefings, produtos e critérios de match. Paralelo aos endpoints de admin,
 * mas sempre operando apenas sobre a marca vinculada ao usuário logado.
 *
 * Campos sensíveis (preço por vídeo, isActive) NÃO são editáveis por aqui —
 * somente admin.
 */
import type { FastifyInstance } from 'fastify';
import {
  db,
  brands,
  brandUsers,
  briefings,
  products,
} from '@brandly/core';
import { eq, and, desc } from 'drizzle-orm';

const VALID_PRODUCT_TYPES = ['physical', 'digital'] as const;
type ProductType = (typeof VALID_PRODUCT_TYPES)[number];

const VALID_PRODUCT_STATUSES = ['active', 'inactive', 'draft'] as const;
type ProductStatus = (typeof VALID_PRODUCT_STATUSES)[number];

async function getBrandIdFromUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ brandId: brandUsers.brandId })
    .from(brandUsers)
    .where(eq(brandUsers.userId, userId))
    .limit(1);
  return row?.brandId ?? null;
}

export async function brandSelfServiceRoutes(app: FastifyInstance) {
  // ============================================================
  // GET /api/brand/profile — dados da marca logada
  // ============================================================
  app.get('/brand/profile', { preHandler: [app.requireBrand] }, async (request, reply) => {
    const { userId } = request.user;
    const brandId = await getBrandIdFromUser(userId);
    if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
    if (!brand) return reply.status(404).send({ error: 'Marca não encontrada.' });

    return { brand };
  });

  // ============================================================
  // PATCH /api/brand/profile — edita dados da própria marca
  // (não mexe em videoPrice nem isActive)
  // ============================================================
  app.patch<{
    Body: {
      name?: string;
      logoUrl?: string | null;
      description?: string | null;
      website?: string | null;
      contactEmail?: string | null;
      minVideosPerMonth?: number | null;
      maxCreators?: number | null;
    };
  }>(
    '/brand/profile',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const b = request.body ?? {};
      const patch: Record<string, unknown> = {};
      if ('name' in b && b.name && b.name.trim()) patch.name = b.name.trim();
      if ('logoUrl' in b) patch.logoUrl = b.logoUrl ?? null;
      if ('description' in b) patch.description = b.description ?? null;
      if ('website' in b) patch.websiteUrl = b.website ?? null;
      if ('contactEmail' in b) patch.contactEmail = b.contactEmail ?? null;
      if ('minVideosPerMonth' in b) patch.minVideosPerMonth = b.minVideosPerMonth ?? null;
      if ('maxCreators' in b) patch.maxCreators = b.maxCreators ?? null;

      if (Object.keys(patch).length === 0) {
        return reply.status(400).send({ error: 'Nenhum campo para atualizar.' });
      }

      const [updated] = await db
        .update(brands)
        .set(patch)
        .where(eq(brands.id, brandId))
        .returning();

      return { brand: updated };
    },
  );

  // ============================================================
  // PATCH /api/brand/match-criteria — critérios para match IA
  // ============================================================
  app.patch<{
    Body: {
      targetAgeMin?: number | null;
      targetAgeMax?: number | null;
      targetGender?: string | null;
      minInstagramFollowers?: number | null;
      minTiktokFollowers?: number | null;
      aiCriteria?: string | null;
    };
  }>(
    '/brand/match-criteria',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const b = request.body ?? {};
      const patch: Record<string, unknown> = {};
      if ('targetAgeMin' in b) patch.targetAgeMin = b.targetAgeMin;
      if ('targetAgeMax' in b) patch.targetAgeMax = b.targetAgeMax;
      if ('targetGender' in b) patch.targetGender = b.targetGender;
      if ('minInstagramFollowers' in b) patch.minInstagramFollowers = b.minInstagramFollowers;
      if ('minTiktokFollowers' in b) patch.minTiktokFollowers = b.minTiktokFollowers;
      if ('aiCriteria' in b) patch.aiCriteria = b.aiCriteria;

      if (Object.keys(patch).length === 0) {
        return reply.status(400).send({ error: 'Nenhum campo para atualizar.' });
      }

      const [updated] = await db
        .update(brands)
        .set(patch)
        .where(eq(brands.id, brandId))
        .returning();
      return { brand: updated };
    },
  );

  // ============================================================
  // BRIEFINGS
  // ============================================================
  app.get('/brand/briefings', { preHandler: [app.requireBrand] }, async (request, reply) => {
    const { userId } = request.user;
    const brandId = await getBrandIdFromUser(userId);
    if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

    const rows = await db
      .select()
      .from(briefings)
      .where(eq(briefings.brandId, brandId))
      .orderBy(desc(briefings.createdAt));

    return {
      briefings: rows.map((r) => ({
        ...r,
        status: r.isActive ? 'active' : 'inactive',
      })),
    };
  });

  app.post<{
    Body: {
      title: string;
      description: string;
      doList?: string[];
      dontList?: string[];
      technicalRequirements?: string;
      tone?: string;
      exampleUrls?: string[];
      status?: 'active' | 'inactive';
    };
  }>(
    '/brand/briefings',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const {
        title,
        description,
        doList,
        dontList,
        technicalRequirements,
        tone,
        exampleUrls,
        status,
      } = request.body;

      if (!title || !description) {
        return reply.status(400).send({ error: 'Título e descrição obrigatórios.' });
      }

      const [created] = await db
        .insert(briefings)
        .values({
          brandId,
          title,
          description,
          doList: doList ?? [],
          dontList: dontList ?? [],
          exampleUrls: exampleUrls ?? [],
          technicalRequirements: technicalRequirements ?? null,
          tone: tone ?? null,
          isActive: status !== 'inactive',
        })
        .returning();

      return reply.status(201).send({
        briefing: { ...created, status: created.isActive ? 'active' : 'inactive' },
      });
    },
  );

  app.patch<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      doList?: string[];
      dontList?: string[];
      technicalRequirements?: string;
      tone?: string;
      exampleUrls?: string[];
    };
  }>(
    '/brand/briefings/:id',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { id } = request.params;
      const [existing] = await db
        .select({ id: briefings.id, brandId: briefings.brandId })
        .from(briefings)
        .where(eq(briefings.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: 'Briefing não encontrado.' });
      if (existing.brandId !== brandId)
        return reply.status(403).send({ error: 'Briefing não pertence a sua marca.' });

      const b = request.body;
      const patch: Record<string, unknown> = {};
      if (b.title !== undefined) patch.title = b.title;
      if (b.description !== undefined) patch.description = b.description;
      if (b.doList !== undefined) patch.doList = b.doList;
      if (b.dontList !== undefined) patch.dontList = b.dontList;
      if (b.technicalRequirements !== undefined)
        patch.technicalRequirements = b.technicalRequirements;
      if (b.tone !== undefined) patch.tone = b.tone;
      if (b.exampleUrls !== undefined) patch.exampleUrls = b.exampleUrls;

      if (Object.keys(patch).length === 0) {
        return reply.status(400).send({ error: 'Nenhum campo para atualizar.' });
      }

      const [updated] = await db
        .update(briefings)
        .set(patch)
        .where(eq(briefings.id, id))
        .returning();

      return {
        briefing: { ...updated, status: updated.isActive ? 'active' : 'inactive' },
      };
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/brand/briefings/:id/toggle-status',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { id } = request.params;
      const [existing] = await db
        .select({ id: briefings.id, brandId: briefings.brandId, isActive: briefings.isActive })
        .from(briefings)
        .where(eq(briefings.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: 'Briefing não encontrado.' });
      if (existing.brandId !== brandId)
        return reply.status(403).send({ error: 'Briefing não pertence a sua marca.' });

      const newStatus = !existing.isActive;
      await db.update(briefings).set({ isActive: newStatus }).where(eq(briefings.id, id));
      return { id, status: newStatus ? 'active' : 'inactive' };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/brand/briefings/:id',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { id } = request.params;
      const [existing] = await db
        .select({ id: briefings.id, brandId: briefings.brandId })
        .from(briefings)
        .where(eq(briefings.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: 'Briefing não encontrado.' });
      if (existing.brandId !== brandId)
        return reply.status(403).send({ error: 'Briefing não pertence a sua marca.' });

      await db.delete(briefings).where(eq(briefings.id, id));
      return { ok: true };
    },
  );

  // ============================================================
  // PRODUTOS
  // ============================================================
  app.get('/brand/products', { preHandler: [app.requireBrand] }, async (request, reply) => {
    const { userId } = request.user;
    const brandId = await getBrandIdFromUser(userId);
    if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

    const rows = await db
      .select()
      .from(products)
      .where(eq(products.brandId, brandId))
      .orderBy(desc(products.createdAt));
    return { products: rows };
  });

  app.post<{
    Body: {
      name: string;
      type: ProductType;
      price: number;
      commissionPercent: number;
      trackingType?: 'link' | 'cupom';
      status?: ProductStatus;
    };
  }>(
    '/brand/products',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { name, type, price, commissionPercent, trackingType, status } = request.body;
      if (!name || !type || price === undefined || commissionPercent === undefined) {
        return reply
          .status(400)
          .send({ error: 'Nome, tipo, preço e comissão são obrigatórios.' });
      }
      if (!VALID_PRODUCT_TYPES.includes(type)) {
        return reply.status(400).send({ error: 'Tipo inválido.' });
      }
      if (price <= 0) return reply.status(400).send({ error: 'Preço deve ser maior que zero.' });
      if (commissionPercent < 0 || commissionPercent > 100)
        return reply.status(400).send({ error: 'Comissão deve estar entre 0 e 100.' });

      const [created] = await db
        .insert(products)
        .values({
          brandId,
          name,
          type,
          price: price.toString(),
          commissionPercent: commissionPercent.toString(),
          trackingType: trackingType ?? 'link',
          status: (status ?? 'draft') as ProductStatus,
        })
        .returning();

      return reply.status(201).send({ product: created });
    },
  );

  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      type?: ProductType;
      price?: number;
      commissionPercent?: number;
      trackingType?: 'link' | 'cupom';
    };
  }>(
    '/brand/products/:id',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { id } = request.params;
      const [existing] = await db
        .select({ id: products.id, brandId: products.brandId })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: 'Produto não encontrado.' });
      if (existing.brandId !== brandId)
        return reply.status(403).send({ error: 'Produto não pertence a sua marca.' });

      const b = request.body;
      if (b.type !== undefined && !VALID_PRODUCT_TYPES.includes(b.type))
        return reply.status(400).send({ error: 'Tipo inválido.' });
      if (b.price !== undefined && b.price <= 0)
        return reply.status(400).send({ error: 'Preço inválido.' });
      if (
        b.commissionPercent !== undefined &&
        (b.commissionPercent < 0 || b.commissionPercent > 100)
      )
        return reply.status(400).send({ error: 'Comissão inválida.' });

      const patch: Record<string, unknown> = {};
      if (b.name !== undefined) patch.name = b.name;
      if (b.type !== undefined) patch.type = b.type;
      if (b.price !== undefined) patch.price = b.price.toString();
      if (b.commissionPercent !== undefined)
        patch.commissionPercent = b.commissionPercent.toString();
      if (b.trackingType !== undefined) patch.trackingType = b.trackingType;

      if (Object.keys(patch).length === 0) {
        return reply.status(400).send({ error: 'Nenhum campo para atualizar.' });
      }

      const [updated] = await db
        .update(products)
        .set(patch)
        .where(eq(products.id, id))
        .returning();
      return { product: updated };
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/brand/products/:id/toggle-status',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { id } = request.params;
      const [existing] = await db
        .select({ id: products.id, brandId: products.brandId, status: products.status })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: 'Produto não encontrado.' });
      if (existing.brandId !== brandId)
        return reply.status(403).send({ error: 'Produto não pertence a sua marca.' });

      const newStatus: ProductStatus = existing.status === 'active' ? 'inactive' : 'active';
      await db.update(products).set({ status: newStatus }).where(eq(products.id, id));
      return { id, status: newStatus };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/brand/products/:id',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const { id } = request.params;
      const [existing] = await db
        .select({ id: products.id, brandId: products.brandId })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!existing) return reply.status(404).send({ error: 'Produto não encontrado.' });
      if (existing.brandId !== brandId)
        return reply.status(403).send({ error: 'Produto não pertence a sua marca.' });

      await db.delete(products).where(eq(products.id, id));
      return { ok: true };
    },
  );
}
