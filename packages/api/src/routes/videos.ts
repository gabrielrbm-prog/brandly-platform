import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { videos, payments, users, brands, briefings, calculateVideoPayment, getVideoPaymentConstants } from '@brandly/core';
import { sendPushNotification, videoApprovedNotification, videoRejectedNotification } from '@brandly/core';
import { eq, and, sql, gte, lte, desc, count } from 'drizzle-orm';

const { perVideo: PAYMENT_PER_VIDEO, maxPerDay: MAX_PAID_PER_DAY } = getVideoPaymentConstants();

interface SubmitVideoBody {
  brandId: string;
  briefingId?: string;
  externalUrl: string;
  platform?: string;
}

interface ReviewVideoBody {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function videoRoutes(app: FastifyInstance) {
  // POST /api/videos — submeter video
  app.post<{ Body: SubmitVideoBody }>('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { brandId, briefingId: providedBriefingId, externalUrl, platform } = request.body;

    if (!brandId || !externalUrl) {
      return reply.status(400).send({ error: 'brandId e externalUrl sao obrigatorios' });
    }

    if (!/^https?:\/\/.+/.test(externalUrl)) {
      return reply.status(400).send({ error: 'externalUrl deve ser uma URL valida' });
    }

    // Se briefingId não foi enviado, buscar o briefing ativo da marca
    let finalBriefingId = providedBriefingId ?? null;
    if (!finalBriefingId) {
      const [activeBriefing] = await db.select({ id: briefings.id })
        .from(briefings)
        .where(and(eq(briefings.brandId, brandId), eq(briefings.isActive, true)))
        .limit(1);
      finalBriefingId = activeBriefing?.id ?? null;
    }

    const [video] = await db.insert(videos).values({
      creatorId: userId,
      brandId,
      briefingId: finalBriefingId,
      externalUrl,
      platform: platform ?? null,
      status: 'pending',
      paymentAmount: String(PAYMENT_PER_VIDEO),
    }).returning();

    return reply.status(201).send({
      video,
      message: 'Video enviado para aprovacao. Prazo: 24-48h.',
    });
  });

  // GET /api/videos — listar videos do creator
  app.get('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const rows = await db.select({
      video: videos,
      brandName: brands.name,
      brandLogoUrl: brands.logoUrl,
    })
      .from(videos)
      .leftJoin(brands, eq(videos.brandId, brands.id))
      .where(eq(videos.creatorId, userId))
      .orderBy(desc(videos.createdAt))
      .limit(50);

    const result = rows.map((r) => ({
      ...r.video,
      brandName: r.brandName,
      brandLogoUrl: r.brandLogoUrl,
    }));

    const { start, end } = todayRange();

    const [todayStats] = await db.select({
      approved: count(sql`CASE WHEN ${videos.status} = 'approved' THEN 1 END`),
      pending: count(sql`CASE WHEN ${videos.status} = 'pending' THEN 1 END`),
      rejected: count(sql`CASE WHEN ${videos.status} = 'rejected' THEN 1 END`),
      paid: count(sql`CASE WHEN ${videos.isPaid} = true THEN 1 END`),
    })
      .from(videos)
      .where(and(
        eq(videos.creatorId, userId),
        gte(videos.createdAt, start),
        lte(videos.createdAt, end),
      ));

    return {
      videos: result,
      total: result.length,
      today: {
        ...todayStats,
        remaining: Math.max(0, MAX_PAID_PER_DAY - Number(todayStats?.paid ?? 0)),
      },
    };
  });

  // GET /api/videos/daily
  app.get('/daily', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { start, end } = todayRange();

    const todayVideos = await db.select()
      .from(videos)
      .where(and(
        eq(videos.creatorId, userId),
        gte(videos.createdAt, start),
        lte(videos.createdAt, end),
      ))
      .orderBy(desc(videos.createdAt));

    const paid = todayVideos.filter(v => v.isPaid).length;
    const approved = todayVideos.filter(v => v.status === 'approved').length;

    return {
      date: start.toISOString().split('T')[0],
      videos: todayVideos,
      approved,
      pending: todayVideos.filter(v => v.status === 'pending').length,
      rejected: todayVideos.filter(v => v.status === 'rejected').length,
      paid,
      earnings: (paid * PAYMENT_PER_VIDEO).toFixed(2),
      remaining: Math.max(0, MAX_PAID_PER_DAY - paid),
    };
  });

  // PATCH /api/videos/:id/review — aprovar/rejeitar (admin)
  app.patch<{ Params: { id: string }; Body: ReviewVideoBody }>(
    '/:id/review',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params;
      const { status, rejectionReason } = request.body;
      const { userId: reviewerId } = request.user;

      if (!['approved', 'rejected'].includes(status)) {
        return reply.status(400).send({ error: 'status deve ser approved ou rejected' });
      }

      if (status === 'rejected' && !rejectionReason) {
        return reply.status(400).send({ error: 'rejectionReason obrigatorio para rejeicao' });
      }

      // Buscar video
      const [video] = await db.select()
        .from(videos)
        .where(eq(videos.id, id))
        .limit(1);

      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        status,
        reviewedAt: now,
        reviewedBy: reviewerId,
      };

      if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason;
      }

      // Se aprovado, calcular pagamento usando o service
      let paymentResult = null;
      if (status === 'approved') {
        const { start, end } = todayRange();

        const [dailyApproved] = await db.select({
          total: sql<number>`count(*)::int`,
        })
          .from(videos)
          .where(and(
            eq(videos.creatorId, video.creatorId),
            eq(videos.status, 'approved'),
            gte(videos.createdAt, start),
            lte(videos.createdAt, end),
          ));

        const [dailyPaid] = await db.select({
          total: sql<number>`count(*)::int`,
        })
          .from(videos)
          .where(and(
            eq(videos.creatorId, video.creatorId),
            eq(videos.isPaid, true),
            gte(videos.createdAt, start),
            lte(videos.createdAt, end),
          ));

        paymentResult = calculateVideoPayment({
          approvedToday: (dailyApproved?.total ?? 0) + 1, // +1 inclui o atual
          paidToday: dailyPaid?.total ?? 0,
        });

        if (paymentResult.shouldPay) {
          updateData.isPaid = true;

          const period = now.toISOString().slice(0, 7);
          await db.insert(payments).values({
            userId: video.creatorId,
            type: 'video',
            referenceId: id,
            amount: String(paymentResult.amount),
            description: paymentResult.reason,
            status: 'approved',
            period,
          });
        }
      }

      const [updated] = await db.update(videos)
        .set(updateData)
        .where(eq(videos.id, id))
        .returning();

      // Push notification para o creator
      try {
        const [creator] = await db.select({ pushToken: users.pushToken })
          .from(users)
          .where(eq(users.id, video.creatorId))
          .limit(1);
        const pushToken = creator?.pushToken;
        if (pushToken) {
          if (status === 'approved' && paymentResult?.shouldPay) {
            await sendPushNotification(videoApprovedNotification(pushToken, paymentResult.amount));
          } else if (status === 'rejected' && rejectionReason) {
            await sendPushNotification(videoRejectedNotification(pushToken, rejectionReason));
          }
        }
      } catch {
        // Push e best-effort, nao bloqueia o fluxo
      }

      return {
        video: updated,
        payment: paymentResult ? {
          paid: paymentResult.shouldPay,
          amount: paymentResult.amount,
          dailyTotal: paymentResult.dailyTotal,
          dailyRemaining: paymentResult.dailyRemaining,
          reason: paymentResult.reason,
        } : null,
        message: status === 'approved'
          ? paymentResult?.shouldPay
            ? `Video aprovado! R$${paymentResult.amount} creditado. ${paymentResult.dailyRemaining} slots restantes.`
            : `Video aprovado! Limite diario atingido, sem pagamento.`
          : `Video rejeitado: ${rejectionReason}`,
      };
    },
  );

  // POST /api/videos/:id/resubmit
  app.post<{ Params: { id: string }; Body: { externalUrl: string } }>(
    '/:id/resubmit',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { externalUrl } = request.body;
      const { userId } = request.user;

      if (!externalUrl) {
        return reply.status(400).send({ error: 'externalUrl e obrigatorio' });
      }

      const [video] = await db.select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.creatorId, userId)))
        .limit(1);

      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' });
      }

      if (video.status !== 'rejected') {
        return reply.status(400).send({ error: 'So e possivel reenviar videos rejeitados' });
      }

      const [updated] = await db.update(videos)
        .set({ externalUrl, status: 'pending', rejectionReason: null, reviewedAt: null })
        .where(eq(videos.id, id))
        .returning();

      return { video: updated, message: 'Video reenviado para aprovacao.' };
    },
  );

  // PATCH /api/videos/:id — creator edita URL/platform/brand do proprio video (nao aprovado)
  app.patch<{ Params: { id: string }; Body: { externalUrl?: string; platform?: string; brandId?: string } }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { externalUrl, platform, brandId } = request.body ?? {};
      const { userId } = request.user;

      if (!externalUrl && !platform && !brandId) {
        return reply.status(400).send({ error: 'Informe externalUrl, platform ou brandId' });
      }

      if (externalUrl && !/^https?:\/\/.+/.test(externalUrl)) {
        return reply.status(400).send({ error: 'externalUrl deve ser uma URL valida' });
      }

      const [video] = await db.select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.creatorId, userId)))
        .limit(1);

      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' });
      }

      if (video.status === 'approved') {
        return reply.status(400).send({ error: 'Video ja aprovado nao pode ser editado' });
      }

      const patch: Record<string, unknown> = {};
      if (externalUrl) patch.externalUrl = externalUrl;
      if (platform) patch.platform = platform;
      if (brandId && brandId !== video.brandId) {
        const [brand] = await db.select({ id: brands.id })
          .from(brands)
          .where(eq(brands.id, brandId))
          .limit(1);
        if (!brand) {
          return reply.status(404).send({ error: 'Marca nao encontrada' });
        }
        patch.brandId = brandId;
        // trocar marca limpa briefingId (vai rebuscar no proximo submit ou deixa null)
        patch.briefingId = null;
      }
      if (video.status === 'rejected') {
        patch.status = 'pending';
        patch.rejectionReason = null;
        patch.reviewedAt = null;
      }

      const [updated] = await db.update(videos)
        .set(patch)
        .where(eq(videos.id, id))
        .returning();

      return { video: updated, message: 'Video atualizado.' };
    },
  );

  // DELETE /api/videos/:id — creator remove o proprio video (nao aprovado)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.user;

      const [video] = await db.select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.creatorId, userId)))
        .limit(1);

      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' });
      }

      if (video.status === 'approved') {
        return reply.status(400).send({ error: 'Video aprovado nao pode ser removido' });
      }

      await db.delete(videos).where(eq(videos.id, id));
      return { success: true };
    },
  );

  // GET /api/videos/review-queue (admin)
  // query: status=pending|approved|rejected|all (default pending), brandId, limit (default 50)
  app.get<{ Querystring: { status?: string; brandId?: string; limit?: string } }>(
    '/review-queue',
    { preHandler: [app.requireAdmin] },
    async (request, reply) => {
      const { status, brandId, limit: rawLimit } = request.query;
      const limit = Math.min(200, Math.max(1, Number(rawLimit ?? 50)));

      const conditions = [];
      if (!status || status === 'pending') {
        conditions.push(eq(videos.status, 'pending'));
      } else if (status === 'approved' || status === 'rejected') {
        conditions.push(eq(videos.status, status));
      }
      if (brandId) {
        conditions.push(eq(videos.brandId, brandId));
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const rows = await db.select({
        id: videos.id,
        creatorId: videos.creatorId,
        brandId: videos.brandId,
        briefingId: videos.briefingId,
        externalUrl: videos.externalUrl,
        platform: videos.platform,
        status: videos.status,
        rejectionReason: videos.rejectionReason,
        paymentAmount: videos.paymentAmount,
        isPaid: videos.isPaid,
        createdAt: videos.createdAt,
        reviewedAt: videos.reviewedAt,
        creatorName: users.name,
        creatorEmail: users.email,
        brandName: brands.name,
        brandLogoUrl: brands.logoUrl,
      })
        .from(videos)
        .leftJoin(users, eq(videos.creatorId, users.id))
        .leftJoin(brands, eq(videos.brandId, brands.id))
        .where(whereClause)
        .orderBy(desc(videos.createdAt))
        .limit(limit);

      return { videos: rows, total: rows.length };
    },
  );
}
