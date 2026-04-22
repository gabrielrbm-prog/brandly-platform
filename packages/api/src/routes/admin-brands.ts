import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  brands,
  briefings,
  products,
  creatorBrands,
  videos,
  users,
} from '@brandly/core';
import { eq, and, sql, desc, ilike, count } from 'drizzle-orm';

// ============================================================
// Helpers
// ============================================================

function parsePage(page?: number, limit?: number) {
  const p = Math.max(1, Number(page ?? 1));
  const l = Math.min(100, Math.max(1, Number(limit ?? 20)));
  return { page: p, limit: l, offset: (p - 1) * l };
}

const VALID_BRAND_CATEGORIES = ['beauty', 'supplements', 'home', 'tech', 'fashion', 'food', 'fitness', 'health', 'wellness', 'education', 'finance', 'lifestyle', 'pets', 'kids', 'automotive', 'travel', 'other'] as const;
type BrandCategory = typeof VALID_BRAND_CATEGORIES[number];

const VALID_PRODUCT_TYPES = ['physical', 'digital'] as const;
type ProductType = typeof VALID_PRODUCT_TYPES[number];

const VALID_PRODUCT_STATUSES = ['active', 'inactive', 'draft'] as const;
type ProductStatus = typeof VALID_PRODUCT_STATUSES[number];

// ============================================================
// Tipos de query / body
// ============================================================

interface BrandsAdminQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

interface CreateBrandBody {
  name: string;
  logoUrl?: string;
  category: BrandCategory;
  description?: string;
  website?: string;
  contactEmail?: string;
  minVideosPerMonth?: number;
  maxCreators?: number;
  status?: 'active' | 'inactive';
}

interface UpdateBrandBody {
  name?: string;
  logoUrl?: string;
  category?: BrandCategory;
  description?: string;
  website?: string;
  contactEmail?: string;
  minVideosPerMonth?: number;
  maxCreators?: number;
}

interface CreateBriefingBody {
  title: string;
  description: string;
  doList?: string[];
  dontList?: string[];
  technicalRequirements?: string;
  tone?: string;
  exampleUrls?: string[];
  status?: 'active' | 'inactive';
}

interface UpdateBriefingBody {
  title?: string;
  description?: string;
  doList?: string[];
  dontList?: string[];
  technicalRequirements?: string;
  tone?: string;
  exampleUrls?: string[];
}

interface CreateProductBody {
  name: string;
  type: ProductType;
  price: number;
  commissionPercent: number;
  trackingType?: 'link' | 'cupom';
  status?: ProductStatus;
}

interface UpdateProductBody {
  name?: string;
  type?: ProductType;
  price?: number;
  commissionPercent?: number;
  trackingType?: 'link' | 'cupom';
}

// ============================================================
// Rotas admin — marcas, briefings, produtos
// ============================================================

export async function adminBrandsRoutes(app: FastifyInstance) {

  // ----------------------------------------------------------
  // GET /api/admin/brands
  // Lista todas as marcas com contagem de creators e videos
  // ----------------------------------------------------------
  app.get<{ Querystring: BrandsAdminQuery }>('/brands', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { search, status, page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    // Condicoes de filtro
    const conditions: ReturnType<typeof eq>[] = [];

    if (status === 'active') {
      conditions.push(eq(brands.isActive, true));
    } else if (status === 'inactive') {
      conditions.push(eq(brands.isActive, false));
    }

    // Busca por nome (ilike = case-insensitive)
    const searchCondition = search
      ? ilike(brands.name, `%${search}%`)
      : undefined;

    const whereClause = conditions.length > 0 && searchCondition
      ? and(...conditions, searchCondition)
      : conditions.length > 0
        ? and(...conditions)
        : searchCondition;

    // Mes atual para contagem de videos
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const baseRows = await db.select({
      id: brands.id,
      name: brands.name,
      logoUrl: brands.logoUrl,
      category: brands.category,
      isActive: brands.isActive,
      websiteUrl: brands.websiteUrl,
      minVideosPerMonth: brands.minVideosPerMonth,
      maxCreators: brands.maxCreators,
      createdAt: brands.createdAt,
    })
      .from(brands)
      .where(whereClause)
      .orderBy(desc(brands.createdAt))
      .offset(offset)
      .limit(limit);

    const brandIds = baseRows.map((r) => r.id);
    const countMap = new Map<string, { activeCreators: number; videosThisMonth: number }>();

    if (brandIds.length) {
      const countsRows = await db.execute(sql`
        SELECT
          b.id AS brand_id,
          COALESCE(cc.c, 0)::int AS active_creators,
          COALESCE(vc.c, 0)::int AS videos_this_month
        FROM brands b
        LEFT JOIN (
          SELECT brand_id, COUNT(*) AS c FROM creator_brands
          WHERE is_active = true GROUP BY brand_id
        ) cc ON cc.brand_id = b.id
        LEFT JOIN (
          SELECT brand_id, COUNT(*) AS c FROM videos
          WHERE to_char(created_at, 'YYYY-MM') = ${currentMonth}
          GROUP BY brand_id
        ) vc ON vc.brand_id = b.id
        WHERE b.id IN (${sql.join(brandIds.map((id) => sql`${id}`), sql`, `)})
      `);

      for (const c of countsRows as unknown as Array<{ brand_id: string; active_creators: number; videos_this_month: number }>) {
        countMap.set(c.brand_id, {
          activeCreators: Number(c.active_creators ?? 0),
          videosThisMonth: Number(c.videos_this_month ?? 0),
        });
      }
    }

    const rows = baseRows.map((r) => ({
      ...r,
      activeCreators: countMap.get(r.id)?.activeCreators ?? 0,
      videosThisMonth: countMap.get(r.id)?.videosThisMonth ?? 0,
    }));

    const [totalRow] = await db.select({ total: count() })
      .from(brands)
      .where(whereClause);

    return {
      brands: rows.map((r) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logoUrl,
        category: r.category,
        status: r.isActive ? 'active' : 'inactive',
        website: r.websiteUrl,
        minVideosPerMonth: r.minVideosPerMonth,
        maxCreators: r.maxCreators,
        activeCreators: r.activeCreators,
        videosThisMonth: r.videosThisMonth,
        createdAt: r.createdAt,
      })),
      total: Number(totalRow?.total ?? 0),
      page,
      limit,
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/brands/:id
  // Detalhe completo da marca: creators, briefings, produtos e stats
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/brands/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    // Creators conectados com contagem de videos e taxa de aprovacao
    const creators = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      videosCount: sql<number>`(
        SELECT COUNT(*) FROM videos v
        WHERE v.creator_id = ${users.id} AND v.brand_id = ${id}
      )::int`,
      approvedVideos: sql<number>`(
        SELECT COUNT(*) FROM videos v
        WHERE v.creator_id = ${users.id} AND v.brand_id = ${id}
          AND v.status = 'approved'
      )::int`,
    })
      .from(creatorBrands)
      .innerJoin(users, eq(creatorBrands.creatorId, users.id))
      .where(and(eq(creatorBrands.brandId, id), eq(creatorBrands.isActive, true)));

    const creatorsWithRate = creators.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      videosCount: c.videosCount,
      approvalRate: c.videosCount > 0
        ? Math.round((c.approvedVideos / c.videosCount) * 100)
        : 0,
    }));

    // Briefings da marca
    const brandBriefings = await db.select({
      id: briefings.id,
      title: briefings.title,
      isActive: briefings.isActive,
      createdAt: briefings.createdAt,
    })
      .from(briefings)
      .where(eq(briefings.brandId, id))
      .orderBy(desc(briefings.createdAt));

    // Produtos da marca
    const brandProducts = await db.select({
      id: products.id,
      name: products.name,
      type: products.type,
      price: products.price,
      commissionPercent: products.commissionPercent,
      status: products.status,
    })
      .from(products)
      .where(eq(products.brandId, id))
      .orderBy(desc(products.createdAt));

    // Stats de videos
    const [statsRow] = await db.select({
      totalVideos: sql<number>`COUNT(*)::int`,
      approvedVideos: sql<number>`COUNT(*) FILTER (WHERE ${videos.status} = 'approved')::int`,
      rejectedVideos: sql<number>`COUNT(*) FILTER (WHERE ${videos.status} = 'rejected')::int`,
    })
      .from(videos)
      .where(eq(videos.brandId, id));

    const totalVideos = statsRow?.totalVideos ?? 0;
    const approvedVideos = statsRow?.approvedVideos ?? 0;
    const rejectedVideos = statsRow?.rejectedVideos ?? 0;

    return {
      brand: {
        id: brand.id,
        name: brand.name,
        logoUrl: brand.logoUrl,
        category: brand.category,
        description: brand.description,
        website: brand.websiteUrl,
        status: brand.isActive ? 'active' : 'inactive',
        contactEmail: brand.contactEmail,
        minVideosPerMonth: brand.minVideosPerMonth,
        maxCreators: brand.maxCreators,
        createdAt: brand.createdAt,
      },
      creators: creatorsWithRate,
      briefings: brandBriefings.map((b) => ({
        id: b.id,
        title: b.title,
        status: b.isActive ? 'active' : 'inactive',
        createdAt: b.createdAt,
      })),
      products: brandProducts,
      stats: {
        totalVideos,
        approvedVideos,
        rejectedVideos,
        approvalRate: totalVideos > 0
          ? Math.round((approvedVideos / totalVideos) * 100)
          : 0,
      },
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/brands
  // Cria nova marca
  // ----------------------------------------------------------
  app.post<{ Body: CreateBrandBody }>('/brands', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const {
      name,
      logoUrl,
      category,
      description,
      website,
      contactEmail,
      minVideosPerMonth,
      maxCreators,
      status,
    } = request.body;

    if (!name || !category) {
      return reply.status(400).send({ error: 'Nome e categoria sao obrigatorios' });
    }

    if (!VALID_BRAND_CATEGORIES.includes(category as BrandCategory)) {
      return reply.status(400).send({
        error: `Categoria invalida. Valores aceitos: ${VALID_BRAND_CATEGORIES.join(', ')}`,
      });
    }

    // Verificar duplicata de nome
    const [existing] = await db.select({ id: brands.id })
      .from(brands)
      .where(ilike(brands.name, name));

    if (existing) {
      return reply.status(409).send({ error: 'Ja existe uma marca com este nome' });
    }

    const [created] = await db.insert(brands).values({
      name,
      logoUrl: logoUrl ?? null,
      category: category as BrandCategory,
      description: description ?? null,
      websiteUrl: website ?? null,
      contactEmail: contactEmail ?? null,
      minVideosPerMonth: minVideosPerMonth ?? 0,
      maxCreators: maxCreators ?? null,
      isActive: status !== 'inactive',
    }).returning();

    app.log.info({ brandId: created.id, name }, 'Nova marca criada pelo admin');

    return reply.status(201).send({
      brand: {
        ...created,
        status: created.isActive ? 'active' : 'inactive',
      },
      message: 'Marca criada com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/brands/:id
  // Atualiza campos da marca
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateBrandBody }>('/brands/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const {
      name,
      logoUrl,
      category,
      description,
      website,
      contactEmail,
      minVideosPerMonth,
      maxCreators,
    } = request.body;

    const [existing] = await db.select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    if (category && !VALID_BRAND_CATEGORIES.includes(category as BrandCategory)) {
      return reply.status(400).send({
        error: `Categoria invalida. Valores aceitos: ${VALID_BRAND_CATEGORIES.join(', ')}`,
      });
    }

    // Verificar conflito de nome com outra marca
    if (name) {
      const [nameConflict] = await db.select({ id: brands.id })
        .from(brands)
        .where(and(ilike(brands.name, name), sql`${brands.id} != ${id}`));

      if (nameConflict) {
        return reply.status(409).send({ error: 'Ja existe outra marca com este nome' });
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = name;
    if (logoUrl !== undefined) updatePayload.logoUrl = logoUrl;
    if (category !== undefined) updatePayload.category = category;
    if (description !== undefined) updatePayload.description = description;
    if (website !== undefined) updatePayload.websiteUrl = website;
    if (contactEmail !== undefined) updatePayload.contactEmail = contactEmail;
    if (minVideosPerMonth !== undefined) updatePayload.minVideosPerMonth = minVideosPerMonth;
    if (maxCreators !== undefined) updatePayload.maxCreators = maxCreators;

    if (Object.keys(updatePayload).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db.update(brands)
      .set(updatePayload)
      .where(eq(brands.id, id))
      .returning();

    return {
      brand: {
        ...updated,
        status: updated.isActive ? 'active' : 'inactive',
      },
      message: 'Marca atualizada com sucesso',
    };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/brands/:id/toggle-status
  // Alterna status ativo/inativo da marca
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string } }>('/brands/:id/toggle-status', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select({ id: brands.id, isActive: brands.isActive })
      .from(brands)
      .where(eq(brands.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    const newStatus = !existing.isActive;

    await db.update(brands)
      .set({ isActive: newStatus })
      .where(eq(brands.id, id));

    app.log.info({ brandId: id, isActive: newStatus }, 'Status da marca alterado pelo admin');

    return {
      id,
      status: newStatus ? 'active' : 'inactive',
      message: newStatus ? 'Marca ativada' : 'Marca desativada',
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/brands/:brandId/briefings
  // Lista briefings de uma marca
  // ----------------------------------------------------------
  app.get<{ Params: { brandId: string } }>('/brands/:brandId/briefings', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { brandId } = request.params;

    const [brand] = await db.select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId));

    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    const result = await db.select()
      .from(briefings)
      .where(eq(briefings.brandId, brandId))
      .orderBy(desc(briefings.createdAt));

    return {
      briefings: result.map((b) => ({
        ...b,
        status: b.isActive ? 'active' : 'inactive',
      })),
      total: result.length,
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/brands/:brandId/briefings
  // Cria briefing para uma marca
  // ----------------------------------------------------------
  app.post<{ Params: { brandId: string }; Body: CreateBriefingBody }>('/brands/:brandId/briefings', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { brandId } = request.params;
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
      return reply.status(400).send({ error: 'Titulo e descricao sao obrigatorios' });
    }

    const [brand] = await db.select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId));

    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    const [created] = await db.insert(briefings).values({
      brandId,
      title,
      description,
      doList: doList ?? [],
      dontList: dontList ?? [],
      exampleUrls: exampleUrls ?? [],
      technicalRequirements: technicalRequirements ?? null,
      tone: tone ?? null,
      isActive: status !== 'inactive',
    }).returning();

    app.log.info({ briefingId: created.id, brandId, title }, 'Novo briefing criado pelo admin');

    return reply.status(201).send({
      briefing: {
        ...created,
        status: created.isActive ? 'active' : 'inactive',
      },
      message: 'Briefing criado com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/briefings/:id
  // Atualiza campos de um briefing
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateBriefingBody }>('/briefings/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const {
      title,
      description,
      doList,
      dontList,
      technicalRequirements,
      tone,
      exampleUrls,
    } = request.body;

    const [existing] = await db.select({ id: briefings.id })
      .from(briefings)
      .where(eq(briefings.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Briefing nao encontrado' });
    }

    const updatePayload: Record<string, unknown> = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (doList !== undefined) updatePayload.doList = doList;
    if (dontList !== undefined) updatePayload.dontList = dontList;
    if (technicalRequirements !== undefined) updatePayload.technicalRequirements = technicalRequirements;
    if (tone !== undefined) updatePayload.tone = tone;
    if (exampleUrls !== undefined) updatePayload.exampleUrls = exampleUrls;

    if (Object.keys(updatePayload).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db.update(briefings)
      .set(updatePayload)
      .where(eq(briefings.id, id))
      .returning();

    return {
      briefing: {
        ...updated,
        status: updated.isActive ? 'active' : 'inactive',
      },
      message: 'Briefing atualizado com sucesso',
    };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/briefings/:id/toggle-status
  // Alterna status ativo/inativo do briefing
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string } }>('/briefings/:id/toggle-status', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select({ id: briefings.id, isActive: briefings.isActive })
      .from(briefings)
      .where(eq(briefings.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Briefing nao encontrado' });
    }

    const newStatus = !existing.isActive;

    await db.update(briefings)
      .set({ isActive: newStatus })
      .where(eq(briefings.id, id));

    return {
      id,
      status: newStatus ? 'active' : 'inactive',
      message: newStatus ? 'Briefing ativado' : 'Briefing desativado',
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/brands/:brandId/products
  // Lista produtos de uma marca
  // ----------------------------------------------------------
  app.get<{ Params: { brandId: string } }>('/brands/:brandId/products', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { brandId } = request.params;

    const [brand] = await db.select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId));

    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    const result = await db.select()
      .from(products)
      .where(eq(products.brandId, brandId))
      .orderBy(desc(products.createdAt));

    return {
      products: result,
      total: result.length,
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/brands/:brandId/products
  // Cria produto para uma marca
  // ----------------------------------------------------------
  app.post<{ Params: { brandId: string }; Body: CreateProductBody }>('/brands/:brandId/products', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { brandId } = request.params;
    const {
      name,
      type,
      price,
      commissionPercent,
      trackingType,
      status,
    } = request.body;

    if (!name || !type || price === undefined || commissionPercent === undefined) {
      return reply.status(400).send({
        error: 'Nome, tipo, preco e percentual de comissao sao obrigatorios',
      });
    }

    if (!VALID_PRODUCT_TYPES.includes(type as ProductType)) {
      return reply.status(400).send({
        error: `Tipo invalido. Valores aceitos: ${VALID_PRODUCT_TYPES.join(', ')}`,
      });
    }

    if (price <= 0) {
      return reply.status(400).send({ error: 'Preco deve ser maior que zero' });
    }

    if (commissionPercent < 0 || commissionPercent > 100) {
      return reply.status(400).send({ error: 'Percentual de comissao deve estar entre 0 e 100' });
    }

    if (status && !VALID_PRODUCT_STATUSES.includes(status as ProductStatus)) {
      return reply.status(400).send({
        error: `Status invalido. Valores aceitos: ${VALID_PRODUCT_STATUSES.join(', ')}`,
      });
    }

    const [brand] = await db.select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId));

    if (!brand) {
      return reply.status(404).send({ error: 'Marca nao encontrada' });
    }

    const [created] = await db.insert(products).values({
      name,
      type: type as ProductType,
      price: price.toString(),
      commissionPercent: commissionPercent.toString(),
      brandId,
      trackingType: trackingType ?? 'link',
      status: (status ?? 'draft') as ProductStatus,
    }).returning();

    app.log.info({ productId: created.id, brandId, name }, 'Novo produto criado pelo admin');

    return reply.status(201).send({
      product: created,
      message: 'Produto criado com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/products/:id
  // Atualiza campos de um produto
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateProductBody }>('/products/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const {
      name,
      type,
      price,
      commissionPercent,
      trackingType,
    } = request.body;

    const [existing] = await db.select({ id: products.id })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Produto nao encontrado' });
    }

    if (type && !VALID_PRODUCT_TYPES.includes(type as ProductType)) {
      return reply.status(400).send({
        error: `Tipo invalido. Valores aceitos: ${VALID_PRODUCT_TYPES.join(', ')}`,
      });
    }

    if (price !== undefined && price <= 0) {
      return reply.status(400).send({ error: 'Preco deve ser maior que zero' });
    }

    if (commissionPercent !== undefined && (commissionPercent < 0 || commissionPercent > 100)) {
      return reply.status(400).send({ error: 'Percentual de comissao deve estar entre 0 e 100' });
    }

    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = name;
    if (type !== undefined) updatePayload.type = type;
    if (price !== undefined) updatePayload.price = price.toString();
    if (commissionPercent !== undefined) updatePayload.commissionPercent = commissionPercent.toString();
    if (trackingType !== undefined) updatePayload.trackingType = trackingType;

    if (Object.keys(updatePayload).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db.update(products)
      .set(updatePayload)
      .where(eq(products.id, id))
      .returning();

    return {
      product: updated,
      message: 'Produto atualizado com sucesso',
    };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/products/:id/toggle-status
  // Alterna entre active, inactive e draft para o produto
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string } }>('/products/:id/toggle-status', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select({ id: products.id, status: products.status })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Produto nao encontrado' });
    }

    // Logica de alternancia: active -> inactive, qualquer outro -> active
    const newStatus: ProductStatus = existing.status === 'active' ? 'inactive' : 'active';

    await db.update(products)
      .set({ status: newStatus })
      .where(eq(products.id, id));

    app.log.info({ productId: id, newStatus }, 'Status do produto alterado pelo admin');

    return {
      id,
      status: newStatus,
      message: newStatus === 'active' ? 'Produto ativado' : 'Produto desativado',
    };
  });
}
