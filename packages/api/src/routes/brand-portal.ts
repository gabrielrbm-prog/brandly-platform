import type { FastifyInstance } from 'fastify';
import {
  db,
  users,
  brands,
  brandUsers,
  brandInvites,
  brandPayouts,
  creatorBrands,
  videos,
  briefings,
} from '@brandly/core';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { sendBrandInviteEmail } from '../services/email.js';

// Resolve brandId do usuario logado (role='brand')
async function getBrandIdFromUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ brandId: brandUsers.brandId })
    .from(brandUsers)
    .where(eq(brandUsers.userId, userId))
    .limit(1);
  return row?.brandId ?? null;
}

// Calcula precos efetivos (briefing override > brand default)
function resolvePrices(
  brandPriceBrand: string,
  brandPriceCreator: string,
  briefingPriceBrand: string | null,
  briefingPriceCreator: string | null,
) {
  const priceBrand = briefingPriceBrand ?? brandPriceBrand;
  const priceCreator = briefingPriceCreator ?? brandPriceCreator;
  const fee = Number(priceBrand) - Number(priceCreator);
  return {
    priceBrand: Number(priceBrand),
    priceCreator: Number(priceCreator),
    fee,
  };
}

export async function brandPortalRoutes(app: FastifyInstance) {
  // ============================================
  // ADMIN: Gerenciar convites de marca
  // ============================================

  // POST /api/admin/brand-invites — criar convite
  app.post<{ Body: { email: string; brandId: string } }>(
    '/admin/brand-invites',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const { email, brandId } = request.body;
      if (!email || !brandId) {
        return reply.code(400).send({ error: 'email e brandId obrigatorios' });
      }

      const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
      if (!brand) return reply.code(404).send({ error: 'Marca nao encontrada' });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      const [invite] = await db
        .insert(brandInvites)
        .values({
          email: email.toLowerCase().trim(),
          brandId,
          token,
          expiresAt,
          createdBy: request.user.userId,
        })
        .returning();

      const inviteUrl = `https://app.brandlycreator.com.br/marca/aceitar-convite?token=${token}`;

      // Envia email automatico — nao bloqueia resposta caso Resend falhe
      const emailSent = await sendBrandInviteEmail(invite.email, brand.name, inviteUrl).catch(
        (err) => {
          app.log.error(`[brand-invite] email send failed: ${err instanceof Error ? err.message : err}`);
          return false;
        },
      );

      return {
        invite: {
          id: invite.id,
          email: invite.email,
          brandName: brand.name,
          expiresAt: invite.expiresAt,
        },
        inviteUrl,
        emailSent,
      };
    },
  );

  // GET /api/admin/brand-invites — listar convites
  app.get(
    '/admin/brand-invites',
    { preHandler: [app.requireAdmin] },
    async () => {
      const rows = await db
        .select({
          id: brandInvites.id,
          email: brandInvites.email,
          brandName: brands.name,
          brandId: brandInvites.brandId,
          expiresAt: brandInvites.expiresAt,
          acceptedAt: brandInvites.acceptedAt,
          createdAt: brandInvites.createdAt,
        })
        .from(brandInvites)
        .leftJoin(brands, eq(brandInvites.brandId, brands.id))
        .orderBy(desc(brandInvites.createdAt));
      return { invites: rows };
    },
  );

  // DELETE /api/admin/brand-invites/:id — remover convite (e user da marca se aceito)
  app.delete<{ Params: { id: string } }>(
    '/admin/brand-invites/:id',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const [invite] = await db
        .select({
          id: brandInvites.id,
          email: brandInvites.email,
          acceptedAt: brandInvites.acceptedAt,
        })
        .from(brandInvites)
        .where(eq(brandInvites.id, request.params.id))
        .limit(1);
      if (!invite) return reply.code(404).send({ error: 'Convite nao encontrado' });

      // Se foi aceito, remover tambem o user brand e o vinculo com a marca
      if (invite.acceptedAt) {
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.email, invite.email), eq(users.role, 'brand')))
          .limit(1);
        if (user) {
          await db.delete(brandUsers).where(eq(brandUsers.userId, user.id));
          await db.delete(users).where(eq(users.id, user.id));
        }
      }

      await db.delete(brandInvites).where(eq(brandInvites.id, invite.id));
      return { deleted: true, revokedAccess: !!invite.acceptedAt };
    },
  );

  // ============================================
  // PUBLICO: Aceitar convite
  // ============================================

  // GET /api/brand-auth/invite/:token — valida convite
  app.get<{ Params: { token: string } }>(
    '/brand-auth/invite/:token',
    async (request, reply) => {
      const [row] = await db
        .select({
          id: brandInvites.id,
          email: brandInvites.email,
          brandName: brands.name,
          expiresAt: brandInvites.expiresAt,
          acceptedAt: brandInvites.acceptedAt,
        })
        .from(brandInvites)
        .leftJoin(brands, eq(brandInvites.brandId, brands.id))
        .where(eq(brandInvites.token, request.params.token))
        .limit(1);

      if (!row) return reply.code(404).send({ error: 'Convite invalido' });
      if (row.acceptedAt) return reply.code(400).send({ error: 'Convite ja utilizado' });
      if (row.expiresAt < new Date()) return reply.code(400).send({ error: 'Convite expirado' });

      return { email: row.email, brandName: row.brandName };
    },
  );

  // POST /api/brand-auth/accept-invite — cria conta da marca
  app.post<{ Body: { token: string; name: string; password: string } }>(
    '/brand-auth/accept-invite',
    async (request, reply) => {
      const { token, name, password } = request.body;
      if (!token || !name || !password) {
        return reply.code(400).send({ error: 'Campos obrigatorios' });
      }
      if (password.length < 8) {
        return reply.code(400).send({ error: 'Senha deve ter ao menos 8 caracteres' });
      }

      const [invite] = await db
        .select()
        .from(brandInvites)
        .where(eq(brandInvites.token, token))
        .limit(1);

      if (!invite) return reply.code(404).send({ error: 'Convite invalido' });
      if (invite.acceptedAt) return reply.code(400).send({ error: 'Convite ja utilizado' });
      if (invite.expiresAt < new Date()) return reply.code(400).send({ error: 'Convite expirado' });

      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, invite.email))
        .limit(1);
      if (existingUser) {
        return reply.code(400).send({ error: 'Email ja cadastrado' });
      }

      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          email: invite.email,
          name,
          passwordHash,
          role: 'brand',
          status: 'active',
        })
        .returning();

      await db.insert(brandUsers).values({
        userId: newUser.id,
        brandId: invite.brandId,
      });

      await db
        .update(brandInvites)
        .set({ acceptedAt: new Date() })
        .where(eq(brandInvites.id, invite.id));

      const jwtToken = app.jwt.sign({ userId: newUser.id, role: 'brand' });

      return {
        token: jwtToken,
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: 'brand' },
      };
    },
  );

  // ============================================
  // PORTAL: Rotas da marca (requireBrand)
  // ============================================

  // GET /api/brand/me — info da marca logada
  app.get('/brand/me', { preHandler: [app.requireBrand] }, async (request, reply) => {
    const brandId = await getBrandIdFromUser(request.user.userId);
    if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
    return { brand };
  });

  // GET /api/brand/creators — creators vinculados a marca
  app.get('/brand/creators', { preHandler: [app.requireBrand] }, async (request, reply) => {
    const brandId = await getBrandIdFromUser(request.user.userId);
    if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        instagramHandle: users.instagramHandle,
        connectedAt: creatorBrands.connectedAt,
      })
      .from(creatorBrands)
      .innerJoin(users, eq(creatorBrands.creatorId, users.id))
      .where(and(eq(creatorBrands.brandId, brandId), eq(creatorBrands.isActive, true)))
      .orderBy(desc(creatorBrands.connectedAt));

    return { creators: rows };
  });

  // GET /api/brand/videos?status=pending — videos da marca
  app.get<{ Querystring: { status?: string; period?: string } }>(
    '/brand/videos',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const brandId = await getBrandIdFromUser(request.user.userId);
      if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

      const { status } = request.query;

      const conditions = [eq(videos.brandId, brandId)];
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        conditions.push(eq(videos.status, status as 'pending' | 'approved' | 'rejected'));
      }

      const rows = await db
        .select({
          id: videos.id,
          externalUrl: videos.externalUrl,
          platform: videos.platform,
          status: videos.status,
          rejectionReason: videos.rejectionReason,
          createdAt: videos.createdAt,
          reviewedAt: videos.reviewedAt,
          creatorId: videos.creatorId,
          creatorName: users.name,
          creatorEmail: users.email,
          briefingId: videos.briefingId,
          briefingTitle: briefings.title,
        })
        .from(videos)
        .leftJoin(users, eq(videos.creatorId, users.id))
        .leftJoin(briefings, eq(videos.briefingId, briefings.id))
        .where(and(...conditions))
        .orderBy(desc(videos.createdAt));

      return { videos: rows };
    },
  );

  // POST /api/brand/videos/:id/approve
  app.post<{ Params: { id: string } }>(
    '/brand/videos/:id/approve',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const brandId = await getBrandIdFromUser(request.user.userId);
      if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, request.params.id), eq(videos.brandId, brandId)))
        .limit(1);
      if (!video) return reply.code(404).send({ error: 'Video nao encontrado' });
      if (video.status !== 'pending') {
        return reply.code(400).send({ error: 'Video ja foi revisado' });
      }

      await db
        .update(videos)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: request.user.userId,
          rejectionReason: null,
        })
        .where(eq(videos.id, video.id));

      return { status: 'approved' };
    },
  );

  // POST /api/brand/videos/:id/reject
  app.post<{ Params: { id: string }; Body: { reason: string } }>(
    '/brand/videos/:id/reject',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const brandId = await getBrandIdFromUser(request.user.userId);
      if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

      const { reason } = request.body;
      if (!reason || reason.trim().length < 3) {
        return reply.code(400).send({ error: 'Motivo da rejeicao obrigatorio (min 3 chars)' });
      }

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, request.params.id), eq(videos.brandId, brandId)))
        .limit(1);
      if (!video) return reply.code(404).send({ error: 'Video nao encontrado' });
      if (video.status !== 'pending') {
        return reply.code(400).send({ error: 'Video ja foi revisado' });
      }

      await db
        .update(videos)
        .set({
          status: 'rejected',
          rejectionReason: reason.trim(),
          reviewedAt: new Date(),
          reviewedBy: request.user.userId,
        })
        .where(eq(videos.id, video.id));

      return { status: 'rejected' };
    },
  );

  // GET /api/brand/payouts — lista payouts (historico)
  app.get(
    '/brand/payouts',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const brandId = await getBrandIdFromUser(request.user.userId);
      if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

      const rows = await db
        .select({
          id: brandPayouts.id,
          period: brandPayouts.period,
          videoCount: brandPayouts.videoCount,
          amountTotal: brandPayouts.amountTotal,
          amountCreator: brandPayouts.amountCreator,
          amountFee: brandPayouts.amountFee,
          status: brandPayouts.status,
          createdAt: brandPayouts.createdAt,
          creatorId: brandPayouts.creatorId,
          creatorName: users.name,
        })
        .from(brandPayouts)
        .leftJoin(users, eq(brandPayouts.creatorId, users.id))
        .where(eq(brandPayouts.brandId, brandId))
        .orderBy(desc(brandPayouts.createdAt));

      return { payouts: rows };
    },
  );

  // GET /api/brand/payouts/preview?period=YYYY-MM — preview do que seria gerado
  app.get<{ Querystring: { period?: string } }>(
    '/brand/payouts/preview',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const brandId = await getBrandIdFromUser(request.user.userId);
      if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

      const period =
        request.query.period ?? new Date().toISOString().slice(0, 7); // YYYY-MM atual

      const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
      if (!brand) return reply.code(404).send({ error: 'Marca nao encontrada' });

      const approvedVideos = await db
        .select({
          id: videos.id,
          creatorId: videos.creatorId,
          creatorName: users.name,
          reviewedAt: videos.reviewedAt,
          briefingId: videos.briefingId,
          briefingPriceBrand: briefings.videoPriceBrand,
          briefingPriceCreator: briefings.videoPriceCreator,
        })
        .from(videos)
        .leftJoin(users, eq(videos.creatorId, users.id))
        .leftJoin(briefings, eq(videos.briefingId, briefings.id))
        .where(
          and(
            eq(videos.brandId, brandId),
            eq(videos.status, 'approved'),
            sql`TO_CHAR(${videos.reviewedAt}, 'YYYY-MM') = ${period}`,
          ),
        );

      // Filtra videos ja incluidos em payouts existentes (pending/received/paid)
      const existingPayouts = await db
        .select({ creatorId: brandPayouts.creatorId })
        .from(brandPayouts)
        .where(
          and(
            eq(brandPayouts.brandId, brandId),
            eq(brandPayouts.period, period),
            inArray(brandPayouts.status, ['pending', 'received', 'paid']),
          ),
        );
      const excludedCreators = new Set(existingPayouts.map((p) => p.creatorId));

      const grouped = new Map<string, {
        creatorId: string;
        creatorName: string;
        videoCount: number;
        amountTotal: number;
        amountCreator: number;
        amountFee: number;
      }>();

      for (const v of approvedVideos) {
        if (excludedCreators.has(v.creatorId)) continue;
        const prices = resolvePrices(
          brand.videoPriceBrand,
          brand.videoPriceCreator,
          v.briefingPriceBrand,
          v.briefingPriceCreator,
        );
        const existing = grouped.get(v.creatorId) ?? {
          creatorId: v.creatorId,
          creatorName: v.creatorName ?? '—',
          videoCount: 0,
          amountTotal: 0,
          amountCreator: 0,
          amountFee: 0,
        };
        existing.videoCount += 1;
        existing.amountTotal += prices.priceBrand;
        existing.amountCreator += prices.priceCreator;
        existing.amountFee += prices.fee;
        grouped.set(v.creatorId, existing);
      }

      const preview = [...grouped.values()];
      const totals = preview.reduce(
        (acc, row) => ({
          videoCount: acc.videoCount + row.videoCount,
          amountTotal: acc.amountTotal + row.amountTotal,
          amountCreator: acc.amountCreator + row.amountCreator,
          amountFee: acc.amountFee + row.amountFee,
        }),
        { videoCount: 0, amountTotal: 0, amountCreator: 0, amountFee: 0 },
      );

      return { period, preview, totals };
    },
  );

  // POST /api/brand/payouts/generate — gera payouts do periodo (status=pending)
  app.post<{ Body: { period?: string } }>(
    '/brand/payouts/generate',
    { preHandler: [app.requireBrand] },
    async (request, reply) => {
      const brandId = await getBrandIdFromUser(request.user.userId);
      if (!brandId) return reply.code(403).send({ error: 'Usuario sem marca vinculada' });

      const period = request.body?.period ?? new Date().toISOString().slice(0, 7);

      const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
      if (!brand) return reply.code(404).send({ error: 'Marca nao encontrada' });

      const approvedVideos = await db
        .select({
          id: videos.id,
          creatorId: videos.creatorId,
          briefingPriceBrand: briefings.videoPriceBrand,
          briefingPriceCreator: briefings.videoPriceCreator,
        })
        .from(videos)
        .leftJoin(briefings, eq(videos.briefingId, briefings.id))
        .where(
          and(
            eq(videos.brandId, brandId),
            eq(videos.status, 'approved'),
            sql`TO_CHAR(${videos.reviewedAt}, 'YYYY-MM') = ${period}`,
          ),
        );

      const existingPayouts = await db
        .select({ creatorId: brandPayouts.creatorId })
        .from(brandPayouts)
        .where(
          and(
            eq(brandPayouts.brandId, brandId),
            eq(brandPayouts.period, period),
            inArray(brandPayouts.status, ['pending', 'received', 'paid']),
          ),
        );
      const excludedCreators = new Set(existingPayouts.map((p) => p.creatorId));

      const grouped = new Map<string, { videoCount: number; total: number; creator: number; fee: number }>();
      for (const v of approvedVideos) {
        if (excludedCreators.has(v.creatorId)) continue;
        const prices = resolvePrices(
          brand.videoPriceBrand,
          brand.videoPriceCreator,
          v.briefingPriceBrand,
          v.briefingPriceCreator,
        );
        const existing = grouped.get(v.creatorId) ?? { videoCount: 0, total: 0, creator: 0, fee: 0 };
        existing.videoCount += 1;
        existing.total += prices.priceBrand;
        existing.creator += prices.priceCreator;
        existing.fee += prices.fee;
        grouped.set(v.creatorId, existing);
      }

      if (grouped.size === 0) {
        return reply.code(400).send({ error: 'Nenhum video aprovado disponivel para este periodo' });
      }

      const inserted = [];
      for (const [creatorId, totals] of grouped) {
        const [row] = await db
          .insert(brandPayouts)
          .values({
            brandId,
            creatorId,
            period,
            videoCount: totals.videoCount,
            amountTotal: totals.total.toFixed(2),
            amountCreator: totals.creator.toFixed(2),
            amountFee: totals.fee.toFixed(2),
            status: 'pending',
          })
          .returning();
        inserted.push(row);
      }

      return {
        message: `${inserted.length} ordem(ns) de pagamento gerada(s) para ${period}`,
        payouts: inserted,
      };
    },
  );

  // ============================================
  // ADMIN: Gerenciar payouts (confirmar recebimento e pagamento ao creator)
  // ============================================

  // GET /api/admin/brand-payouts — todos payouts
  app.get(
    '/admin/brand-payouts',
    { preHandler: [app.requireAdmin] },
    async () => {
      const rows = await db
        .select({
          id: brandPayouts.id,
          brandId: brandPayouts.brandId,
          brandName: brands.name,
          creatorId: brandPayouts.creatorId,
          period: brandPayouts.period,
          videoCount: brandPayouts.videoCount,
          amountTotal: brandPayouts.amountTotal,
          amountCreator: brandPayouts.amountCreator,
          amountFee: brandPayouts.amountFee,
          status: brandPayouts.status,
          paidToBrandlyAt: brandPayouts.paidToBrandlyAt,
          paidToCreatorAt: brandPayouts.paidToCreatorAt,
          notes: brandPayouts.notes,
          createdAt: brandPayouts.createdAt,
        })
        .from(brandPayouts)
        .leftJoin(brands, eq(brandPayouts.brandId, brands.id))
        .orderBy(desc(brandPayouts.createdAt));
      return { payouts: rows };
    },
  );

  // POST /api/admin/brand-payouts/:id/mark-received — admin confirma que marca pagou Brandly
  app.post<{ Params: { id: string }; Body: { notes?: string } }>(
    '/admin/brand-payouts/:id/mark-received',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const [row] = await db
        .select()
        .from(brandPayouts)
        .where(eq(brandPayouts.id, request.params.id))
        .limit(1);
      if (!row) return reply.code(404).send({ error: 'Payout nao encontrado' });
      if (row.status !== 'pending') {
        return reply.code(400).send({ error: `Payout esta em status ${row.status}` });
      }

      await db
        .update(brandPayouts)
        .set({
          status: 'received',
          paidToBrandlyAt: new Date(),
          notes: request.body?.notes ?? row.notes,
          updatedAt: new Date(),
        })
        .where(eq(brandPayouts.id, row.id));
      return { status: 'received' };
    },
  );

  // POST /api/admin/brand-payouts/:id/mark-paid — admin confirma que pagou o creator
  app.post<{ Params: { id: string }; Body: { notes?: string } }>(
    '/admin/brand-payouts/:id/mark-paid',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const [row] = await db
        .select()
        .from(brandPayouts)
        .where(eq(brandPayouts.id, request.params.id))
        .limit(1);
      if (!row) return reply.code(404).send({ error: 'Payout nao encontrado' });
      if (row.status !== 'received') {
        return reply
          .code(400)
          .send({ error: `Payout precisa estar em status 'received' (atual: ${row.status})` });
      }

      await db
        .update(brandPayouts)
        .set({
          status: 'paid',
          paidToCreatorAt: new Date(),
          notes: request.body?.notes ?? row.notes,
          updatedAt: new Date(),
        })
        .where(eq(brandPayouts.id, row.id));
      return { status: 'paid' };
    },
  );
}
