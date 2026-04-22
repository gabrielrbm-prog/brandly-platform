import type { FastifyInstance } from 'fastify';
import {
  db,
  brands,
  brandApplications,
  brandUsers,
  creatorBrands,
  users,
} from '@brandly/core';
import { eq, and, desc } from 'drizzle-orm';
import { computeBrandMatch } from '../services/brand-match.js';

// Pega brandId do usuário logado (role=brand)
async function getBrandIdFromUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ brandId: brandUsers.brandId })
    .from(brandUsers)
    .where(eq(brandUsers.userId, userId))
    .limit(1);
  return row?.brandId ?? null;
}

export async function brandApplicationRoutes(app: FastifyInstance) {
  // ============================================================
  // CREATOR: cria candidatura e recebe score IA
  // ============================================================
  app.post<{
    Params: { id: string };
    Body: {
      fullName: string;
      age: number;
      email: string;
      gender: 'female' | 'male' | 'other';
      instagramHandle?: string;
      tiktokHandle?: string;
    };
  }>(
    '/brands/:id/apply',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { userId } = request.user;
      const { id: brandId } = request.params;
      const { fullName, age, email, gender, instagramHandle, tiktokHandle } = request.body;

      if (!fullName || !age || !email || !gender) {
        return reply
          .status(400)
          .send({ error: 'Preencha nome, idade, email e sexo.' });
      }
      if (age < 13 || age > 99) {
        return reply.status(400).send({ error: 'Idade inválida.' });
      }
      if (!['female', 'male', 'other'].includes(gender)) {
        return reply.status(400).send({ error: 'Sexo inválido.' });
      }

      // Marca existe?
      const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
      if (!brand) return reply.status(404).send({ error: 'Marca não encontrada.' });

      // Já tem candidatura pendente pra essa marca?
      const [pending] = await db
        .select({ id: brandApplications.id })
        .from(brandApplications)
        .where(
          and(
            eq(brandApplications.brandId, brandId),
            eq(brandApplications.creatorId, userId),
            eq(brandApplications.status, 'pending'),
          ),
        )
        .limit(1);
      if (pending) {
        return reply
          .status(409)
          .send({ error: 'Você já tem uma candidatura em análise para esta marca.' });
      }

      // Já está conectado?
      const [active] = await db
        .select({ id: creatorBrands.id })
        .from(creatorBrands)
        .where(
          and(
            eq(creatorBrands.brandId, brandId),
            eq(creatorBrands.creatorId, userId),
            eq(creatorBrands.isActive, true),
          ),
        )
        .limit(1);
      if (active) {
        return reply.status(409).send({ error: 'Você já é parceiro desta marca.' });
      }

      // Roda IA de match (pode demorar 2-6s por causa do scraping)
      let match;
      try {
        match = await computeBrandMatch(
          {
            name: brand.name,
            description: brand.description,
            category: brand.category,
            targetAgeMin: brand.targetAgeMin,
            targetAgeMax: brand.targetAgeMax,
            targetGender: brand.targetGender,
            minInstagramFollowers: brand.minInstagramFollowers,
            minTiktokFollowers: brand.minTiktokFollowers,
            instagramHandle: brand.instagramHandle,
            tiktokHandle: brand.tiktokHandle,
            aiCriteria: brand.aiCriteria,
          },
          { fullName, age, email, gender, instagramHandle, tiktokHandle },
        );
      } catch (err: any) {
        request.log.error({ err: err.message }, 'computeBrandMatch falhou');
      }

      const [created] = await db
        .insert(brandApplications)
        .values({
          brandId,
          creatorId: userId,
          fullName: fullName.trim(),
          age,
          email: email.trim().toLowerCase(),
          gender,
          instagramHandle: instagramHandle?.replace(/^@/, '').trim() || null,
          tiktokHandle: tiktokHandle?.replace(/^@/, '').trim() || null,
          matchScore: match?.score ?? null,
          aiAnalysis: match?.analysis ?? null,
          aiReasoning: match?.reasoning ?? null,
          status: 'pending',
        })
        .returning();

      return reply.status(201).send({
        application: {
          id: created.id,
          status: created.status,
          matchScore: created.matchScore,
          createdAt: created.createdAt,
        },
      });
    },
  );

  // ============================================================
  // CREATOR: lista suas candidaturas (p/ mostrar status no app)
  // ============================================================
  app.get(
    '/creator/applications',
    { preHandler: [app.authenticate] },
    async (request) => {
      const { userId } = request.user;
      const rows = await db
        .select({
          id: brandApplications.id,
          brandId: brandApplications.brandId,
          brandName: brands.name,
          brandLogoUrl: brands.logoUrl,
          status: brandApplications.status,
          matchScore: brandApplications.matchScore,
          rejectionReason: brandApplications.rejectionReason,
          createdAt: brandApplications.createdAt,
          reviewedAt: brandApplications.reviewedAt,
        })
        .from(brandApplications)
        .innerJoin(brands, eq(brandApplications.brandId, brands.id))
        .where(eq(brandApplications.creatorId, userId))
        .orderBy(desc(brandApplications.createdAt));

      return { applications: rows };
    },
  );

  // ============================================================
  // MARCA: lista candidaturas recebidas
  // ============================================================
  app.get<{ Querystring: { status?: string } }>(
    '/brand/applications',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const status = request.query.status;
      const conditions = [eq(brandApplications.brandId, brandId)];
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        conditions.push(eq(brandApplications.status, status as 'pending' | 'approved' | 'rejected'));
      }

      const rows = await db
        .select({
          id: brandApplications.id,
          creatorId: brandApplications.creatorId,
          fullName: brandApplications.fullName,
          age: brandApplications.age,
          email: brandApplications.email,
          gender: brandApplications.gender,
          instagramHandle: brandApplications.instagramHandle,
          tiktokHandle: brandApplications.tiktokHandle,
          matchScore: brandApplications.matchScore,
          aiAnalysis: brandApplications.aiAnalysis,
          aiReasoning: brandApplications.aiReasoning,
          status: brandApplications.status,
          rejectionReason: brandApplications.rejectionReason,
          createdAt: brandApplications.createdAt,
          reviewedAt: brandApplications.reviewedAt,
          creatorName: users.name,
          creatorEmail: users.email,
        })
        .from(brandApplications)
        .leftJoin(users, eq(brandApplications.creatorId, users.id))
        .where(and(...conditions))
        .orderBy(desc(brandApplications.createdAt));

      return { applications: rows };
    },
  );

  // ============================================================
  // MARCA: aprovar candidatura (cria creator_brands ativo)
  // ============================================================
  app.post<{ Params: { id: string } }>(
    '/brand/applications/:id/approve',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const { id } = request.params;
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const [app1] = await db
        .select()
        .from(brandApplications)
        .where(
          and(eq(brandApplications.id, id), eq(brandApplications.brandId, brandId)),
        )
        .limit(1);
      if (!app1) return reply.status(404).send({ error: 'Candidatura não encontrada.' });
      if (app1.status !== 'pending')
        return reply.status(400).send({ error: 'Candidatura já foi avaliada.' });

      // Se já tinha conexão inativa, reativa. Senão cria.
      const [existing] = await db
        .select({ id: creatorBrands.id })
        .from(creatorBrands)
        .where(
          and(
            eq(creatorBrands.creatorId, app1.creatorId),
            eq(creatorBrands.brandId, brandId),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .update(creatorBrands)
          .set({ isActive: true })
          .where(eq(creatorBrands.id, existing.id));
      } else {
        await db.insert(creatorBrands).values({
          creatorId: app1.creatorId,
          brandId,
          isActive: true,
        });
      }

      await db
        .update(brandApplications)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(brandApplications.id, id));

      return { ok: true };
    },
  );

  // ============================================================
  // MARCA: rejeitar candidatura
  // ============================================================
  app.post<{ Params: { id: string }; Body: { reason?: string } }>(
    '/brand/applications/:id/reject',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const { userId } = request.user;
      const { id } = request.params;
      const { reason } = request.body ?? {};
      const brandId = await getBrandIdFromUser(userId);
      if (!brandId) return reply.status(403).send({ error: 'Sem marca associada.' });

      const [app1] = await db
        .select()
        .from(brandApplications)
        .where(
          and(eq(brandApplications.id, id), eq(brandApplications.brandId, brandId)),
        )
        .limit(1);
      if (!app1) return reply.status(404).send({ error: 'Candidatura não encontrada.' });
      if (app1.status !== 'pending')
        return reply.status(400).send({ error: 'Candidatura já foi avaliada.' });

      await db
        .update(brandApplications)
        .set({
          status: 'rejected',
          rejectionReason: reason?.trim() || null,
          reviewedAt: new Date(),
          reviewedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(brandApplications.id, id));

      return { ok: true };
    },
  );

  // ============================================================
  // ADMIN: atualizar critérios da marca (usados pela IA)
  // ============================================================
  app.patch<{
    Params: { id: string };
    Body: {
      targetAgeMin?: number | null;
      targetAgeMax?: number | null;
      targetGender?: string | null;
      minInstagramFollowers?: number | null;
      minTiktokFollowers?: number | null;
      instagramHandle?: string | null;
      tiktokHandle?: string | null;
      aiCriteria?: string | null;
    };
  }>(
    '/admin/brands/:id/match-criteria',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const patch: Record<string, unknown> = {};
      if ('targetAgeMin' in body) patch.targetAgeMin = body.targetAgeMin;
      if ('targetAgeMax' in body) patch.targetAgeMax = body.targetAgeMax;
      if ('targetGender' in body) patch.targetGender = body.targetGender;
      if ('minInstagramFollowers' in body) patch.minInstagramFollowers = body.minInstagramFollowers;
      if ('minTiktokFollowers' in body) patch.minTiktokFollowers = body.minTiktokFollowers;
      if ('instagramHandle' in body) patch.instagramHandle = body.instagramHandle;
      if ('tiktokHandle' in body) patch.tiktokHandle = body.tiktokHandle;
      if ('aiCriteria' in body) patch.aiCriteria = body.aiCriteria;

      if (Object.keys(patch).length === 0) {
        return reply.status(400).send({ error: 'Nenhum campo para atualizar.' });
      }

      const [updated] = await db
        .update(brands)
        .set(patch)
        .where(eq(brands.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: 'Marca não encontrada.' });
      return { brand: updated };
    },
  );
}
