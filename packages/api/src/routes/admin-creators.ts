import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  users,
  levels,
  videos,
  payments,
  withdrawals,
  bonuses,
  brands,
  creatorBrands,
  socialAccounts,
  creatorProfiles,
} from '@brandly/core';
import { eq, and, sql, desc, sum, count, gte, lt, isNull, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// ============================================================
// Helpers
// ============================================================

function parsePage(page?: number, limit?: number) {
  const p = Math.max(1, Number(page ?? 1));
  const l = Math.min(100, Math.max(1, Number(limit ?? 20)));
  return { page: p, limit: l, offset: (p - 1) * l };
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

// Conta quantos niveis de profundidade existem abaixo de um creator
// Usa abordagem iterativa BFS com Drizzle inArray (max 10 niveis de profundidade)
async function getNetworkDepthAndTotal(userId: string): Promise<{ depth: number; total: number }> {
  let currentLevelIds = [userId];
  let depth = 0;
  let total = 0;

  while (currentLevelIds.length > 0 && depth < 10) {
    const nextRows = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.sponsorId, currentLevelIds));

    if (nextRows.length === 0) break;

    total += nextRows.length;
    depth += 1;
    currentLevelIds = nextRows.map((r) => r.id);
  }

  return { depth, total };
}

// ============================================================
// Rotas
// ============================================================

export async function adminCreatorsRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /api/admin/creators/:id/videos
  // Lista paginada de videos de um creator especifico com stats
  // ----------------------------------------------------------
  app.get<{
    Params: { id: string };
    Querystring: { page?: number; limit?: number; status?: string };
  }>('/creators/:id/videos', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { status, page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    const validStatuses = ['approved', 'pending', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return reply.status(400).send({
        error: `Status invalido. Valores aceitos: ${validStatuses.join(', ')}`,
      });
    }

    // Verificar se o creator existe
    const [creator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id));

    if (!creator) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    const brandAlias = alias(brands, 'b');

    const whereClause = status
      ? and(eq(videos.creatorId, id), sql`${videos.status}::text = ${status}`)
      : eq(videos.creatorId, id);

    const rows = await db
      .select({
        id: videos.id,
        externalUrl: videos.externalUrl,
        platform: videos.platform,
        status: videos.status,
        brandName: brandAlias.name,
        payment: videos.paymentAmount,
        rejectionReason: videos.rejectionReason,
        isPaid: videos.isPaid,
        createdAt: videos.createdAt,
        reviewedAt: videos.reviewedAt,
      })
      .from(videos)
      .leftJoin(brandAlias, eq(videos.brandId, brandAlias.id))
      .where(whereClause)
      .orderBy(desc(videos.createdAt))
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(whereClause);

    // Stats totais (ignorando filtro de status para dar o panorama completo)
    const [statsRow] = await db
      .select({
        approved: count(sql`CASE WHEN ${videos.status} = 'approved' THEN 1 END`),
        pending: count(sql`CASE WHEN ${videos.status} = 'pending' THEN 1 END`),
        rejected: count(sql`CASE WHEN ${videos.status} = 'rejected' THEN 1 END`),
      })
      .from(videos)
      .where(eq(videos.creatorId, id));

    const approvedCount = Number(statsRow?.approved ?? 0);
    const rejectedCount = Number(statsRow?.rejected ?? 0);
    const totalReviewed = approvedCount + rejectedCount;
    const approvalRate = totalReviewed > 0
      ? ((approvedCount / totalReviewed) * 100).toFixed(1) + '%'
      : 'N/A';

    return {
      videos: rows,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
      stats: {
        approved: approvedCount,
        pending: Number(statsRow?.pending ?? 0),
        rejected: rejectedCount,
        approvalRate,
      },
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/creators/:id/financial
  // Resumo financeiro do creator
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/creators/:id/financial', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [creator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id));

    if (!creator) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    // Saldo disponivel = soma de pagamentos aprovados - saques completados
    const [approvedPayments] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(eq(payments.userId, id), sql`${payments.status}::text IN ('approved', 'paid')`));

    const [completedWithdrawalsSum] = await db
      .select({ total: sum(withdrawals.amount) })
      .from(withdrawals)
      .where(and(eq(withdrawals.userId, id), eq(withdrawals.status, 'completed')));

    const totalEarnings = Number(approvedPayments?.total ?? 0);
    const completedWithdrawn = Number(completedWithdrawalsSum?.total ?? 0);
    const balance = Math.max(0, totalEarnings - completedWithdrawn);

    // Ganhos por tipo
    const earningsByType = await db
      .select({
        type: payments.type,
        total: sum(payments.amount),
      })
      .from(payments)
      .where(eq(payments.userId, id))
      .groupBy(payments.type);

    const earningsMap: Record<string, number> = {};
    for (const row of earningsByType) {
      earningsMap[row.type] = Number(row.total ?? 0);
    }

    // Saques pendentes
    const [pendingWithdrawRow] = await db
      .select({ total: sum(withdrawals.amount) })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.userId, id),
          sql`${withdrawals.status}::text IN ('requested', 'processing')`,
        ),
      );

    // Saques completados (total)
    const [completedWithdrawRow] = await db
      .select({ total: sum(withdrawals.amount) })
      .from(withdrawals)
      .where(and(eq(withdrawals.userId, id), eq(withdrawals.status, 'completed')));

    // Ultimos 10 pagamentos
    const recentPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        type: payments.type,
        description: payments.description,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.userId, id))
      .orderBy(desc(payments.createdAt))
      .limit(10);

    return {
      balance: balance.toFixed(2),
      totalEarnings: totalEarnings.toFixed(2),
      videoEarnings: (earningsMap['video'] ?? 0).toFixed(2),
      commissionEarnings: (earningsMap['commission'] ?? 0).toFixed(2),
      bonusEarnings: (earningsMap['bonus'] ?? 0).toFixed(2),
      pendingWithdrawals: Number(pendingWithdrawRow?.total ?? 0).toFixed(2),
      completedWithdrawals: Number(completedWithdrawRow?.total ?? 0).toFixed(2),
      recentPayments,
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/creators/:id/network
  // Informacoes de rede do creator (upline + downline diretos)
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/creators/:id/network', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [creatorRow] = await db
      .select({ id: users.id, sponsorId: users.sponsorId })
      .from(users)
      .where(eq(users.id, id));

    if (!creatorRow) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    // Buscar patrocinador (sponsor)
    let sponsor: { id: string; name: string; email: string; level: string | null } | null = null;
    if (creatorRow.sponsorId) {
      const sponsorAlias = alias(levels, 'sl');
      const [sponsorRow] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          level: sponsorAlias.name,
        })
        .from(users)
        .leftJoin(sponsorAlias, eq(users.levelId, sponsorAlias.id))
        .where(eq(users.id, creatorRow.sponsorId));

      if (sponsorRow) {
        sponsor = {
          id: sponsorRow.id,
          name: sponsorRow.name,
          email: sponsorRow.email,
          level: sponsorRow.level ?? null,
        };
      }
    }

    // Diretos do creator
    const currentMonth = currentPeriod();
    const monthStart = new Date(`${currentMonth}-01`);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const directsAlias = alias(levels, 'dl');
    const directRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        level: directsAlias.name,
        joinedAt: users.createdAt,
      })
      .from(users)
      .leftJoin(directsAlias, eq(users.levelId, directsAlias.id))
      .where(eq(users.sponsorId, id));

    // Videos enviados este mes por cada direto
    const directsWithVideos = await Promise.all(
      directRows.map(async (d) => {
        const [videoCount] = await db
          .select({ total: count() })
          .from(videos)
          .where(
            and(
              eq(videos.creatorId, d.id),
              gte(videos.createdAt, monthStart),
              lt(videos.createdAt, nextMonth),
            ),
          );

        return {
          id: d.id,
          name: d.name,
          email: d.email,
          level: d.level ?? 'Seed',
          status: d.status,
          videosThisMonth: Number(videoCount?.total ?? 0),
          joinedAt: d.joinedAt,
        };
      }),
    );

    // Profundidade e total da rede
    const { depth, total } = await getNetworkDepthAndTotal(id);

    return {
      sponsor,
      directCount: directRows.length,
      directs: directsWithVideos,
      networkDepth: depth,
      totalNetwork: total,
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/creators/:id/brands
  // Marcas conectadas ao creator com estatisticas de videos
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/creators/:id/brands', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [creator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id));

    if (!creator) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    const connections = await db
      .select({
        connectionId: creatorBrands.id,
        connectedAt: creatorBrands.connectedAt,
        isActive: creatorBrands.isActive,
        brandId: brands.id,
        brandName: brands.name,
        brandCategory: brands.category,
      })
      .from(creatorBrands)
      .innerJoin(brands, eq(creatorBrands.brandId, brands.id))
      .where(eq(creatorBrands.creatorId, id));

    const result = await Promise.all(
      connections.map(async (c) => {
        const [videoStats] = await db
          .select({
            total: count(),
            approved: count(sql`CASE WHEN ${videos.status} = 'approved' THEN 1 END`),
          })
          .from(videos)
          .where(and(eq(videos.creatorId, id), eq(videos.brandId, c.brandId)));

        const totalVideos = Number(videoStats?.total ?? 0);
        const approvedVideos = Number(videoStats?.approved ?? 0);
        const approvalRate =
          totalVideos > 0 ? ((approvedVideos / totalVideos) * 100).toFixed(1) + '%' : 'N/A';

        return {
          id: c.brandId,
          name: c.brandName,
          category: c.brandCategory,
          videosCount: totalVideos,
          approvalRate,
          isActive: c.isActive,
          connectedAt: c.connectedAt,
        };
      }),
    );

    return { brands: result };
  });

  // ----------------------------------------------------------
  // GET /api/admin/creators/:id/social
  // Contas sociais conectadas
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/creators/:id/social', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [creator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id));

    if (!creator) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    const accounts = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        username: socialAccounts.platformUsername,
        followers: socialAccounts.followers,
        engagementRate: socialAccounts.engagementRate,
        status: socialAccounts.status,
        lastSyncAt: socialAccounts.lastSyncAt,
        isVerified: socialAccounts.isVerified,
        avgLikes: socialAccounts.avgLikes,
        avgViews: socialAccounts.avgViews,
      })
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, id));

    return { accounts };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/creators/:id/status
  // Altera o status do creator (active | inactive | suspended)
  // ----------------------------------------------------------
  app.patch<{
    Params: { id: string };
    Body: { status: 'active' | 'inactive' | 'suspended' };
  }>('/creators/:id/status', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;
    const { userId: adminId } = request.user;

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return reply.status(400).send({
        error: `Status invalido. Valores aceitos: ${validStatuses.join(', ')}`,
      });
    }

    const [existing] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    // O enum do banco aceita 'active' | 'inactive' | 'pending'
    // 'suspended' sera mapeado como 'inactive' com log de auditoria
    const dbStatus = status === 'suspended' ? 'inactive' : status;

    const [updated] = await db
      .update(users)
      .set({ status: dbStatus as 'active' | 'inactive' | 'pending', updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, status: users.status });

    app.log.info(
      { creatorId: id, newStatus: status, dbStatus, adminId },
      'Status do creator alterado pelo admin',
    );

    return {
      creator: updated,
      message: `Status do creator "${existing.name}" alterado para "${status}"`,
    };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/creators/:id/level
  // Sobrescreve o nivel do creator manualmente
  // ----------------------------------------------------------
  app.patch<{
    Params: { id: string };
    Body: { levelId: string };
  }>('/creators/:id/level', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { levelId } = request.body;
    const { userId: adminId } = request.user;

    if (!levelId) {
      return reply.status(400).send({ error: 'levelId e obrigatorio' });
    }

    const [creator] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id));

    if (!creator) {
      return reply.status(404).send({ error: 'Creator nao encontrado' });
    }

    const [level] = await db
      .select({ id: levels.id, name: levels.name })
      .from(levels)
      .where(eq(levels.id, levelId));

    if (!level) {
      return reply.status(404).send({ error: 'Nivel nao encontrado' });
    }

    const [updated] = await db
      .update(users)
      .set({ levelId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, levelId: users.levelId });

    app.log.info(
      { creatorId: id, newLevelId: levelId, levelName: level.name, adminId },
      'Nivel do creator alterado manualmente pelo admin',
    );

    return {
      creator: updated,
      level: { id: level.id, name: level.name },
      message: `Nivel do creator "${creator.name}" alterado para "${level.name}"`,
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/network/level-distribution
  // Contagem de creators por nivel
  // ----------------------------------------------------------
  app.get('/network/level-distribution', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    // Creators com nivel definido
    const withLevel = await db
      .select({
        levelName: levels.name,
        levelRank: levels.rank,
        qty: count(),
      })
      .from(users)
      .innerJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.role, 'creator'))
      .groupBy(levels.name, levels.rank)
      .orderBy(levels.rank);

    // Creators sem nivel (Seed por default)
    const [withoutLevel] = await db
      .select({ qty: count() })
      .from(users)
      .where(and(eq(users.role, 'creator'), isNull(users.levelId)));

    const seedFromNull = Number(withoutLevel?.qty ?? 0);

    // Montar distribuicao, incluindo Seed (sem nivel)
    const distribution: Array<{ level: string; count: number; percentage: number }> = [];
    let total = seedFromNull;
    for (const row of withLevel) {
      total += Number(row.qty);
    }

    if (seedFromNull > 0) {
      distribution.push({
        level: 'Seed',
        count: seedFromNull,
        percentage: total > 0 ? parseFloat(((seedFromNull / total) * 100).toFixed(1)) : 0,
      });
    }

    for (const row of withLevel) {
      // Se Seed ja esta no array (sem nivel), nao duplicar
      const existing = distribution.find((d) => d.level === row.levelName);
      if (existing) {
        existing.count += Number(row.qty);
        existing.percentage = total > 0
          ? parseFloat(((existing.count / total) * 100).toFixed(1))
          : 0;
      } else {
        distribution.push({
          level: row.levelName,
          count: Number(row.qty),
          percentage: total > 0
            ? parseFloat(((Number(row.qty) / total) * 100).toFixed(1))
            : 0,
        });
      }
    }

    return { distribution, total };
  });

  // ----------------------------------------------------------
  // GET /api/admin/network/top-recruiters?limit=10
  // Creators rankeados por diretos ativos
  // ----------------------------------------------------------
  app.get<{ Querystring: { limit?: number } }>('/network/top-recruiters', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const limitParam = Math.min(50, Math.max(1, Number(request.query.limit ?? 10)));

    // Buscar todos os creators com nivel para poder rankear
    const allCreators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        level: levels.name,
      })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.role, 'creator'));

    // Para cada creator, contar diretos totais e ativos
    const withCounts = await Promise.all(
      allCreators.map(async (c) => {
        const [totalDirects] = await db
          .select({ total: count() })
          .from(users)
          .where(eq(users.sponsorId, c.id));

        const [activeDirects] = await db
          .select({ total: count() })
          .from(users)
          .where(and(eq(users.sponsorId, c.id), eq(users.status, 'active')));

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          level: c.level ?? 'Seed',
          directCount: Number(totalDirects?.total ?? 0),
          activeDirects: Number(activeDirects?.total ?? 0),
        };
      }),
    );

    // Ordenar por diretos ativos (desc) e pegar o top N
    const sorted = withCounts
      .filter((c) => c.directCount > 0)
      .sort((a, b) => b.activeDirects - a.activeDirects)
      .slice(0, limitParam);

    // Adicionar total da rede para cada um
    const recruiters = await Promise.all(
      sorted.map(async (c) => {
        const { total } = await getNetworkDepthAndTotal(c.id);
        return { ...c, totalNetwork: total };
      }),
    );

    return { recruiters };
  });

  // ----------------------------------------------------------
  // GET /api/admin/network/bonus-summary?period=2026-03
  // Resumo de bonus distribuidos num periodo
  // ----------------------------------------------------------
  app.get<{ Querystring: { period?: string } }>('/network/bonus-summary', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const period = request.query.period ?? currentPeriod();

    // Validar formato YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return reply.status(400).send({ error: 'Formato de periodo invalido. Use YYYY-MM.' });
    }

    const bonusByType = await db
      .select({
        type: bonuses.type,
        total: sum(bonuses.amount),
        qty: count(),
      })
      .from(bonuses)
      .where(eq(bonuses.period, period))
      .groupBy(bonuses.type);

    const map: Record<string, { total: number; qty: number }> = {};
    for (const row of bonusByType) {
      map[row.type] = {
        total: Number(row.total ?? 0),
        qty: Number(row.qty ?? 0),
      };
    }

    const directTotal = map['direct']?.total ?? 0;
    const infiniteTotal = map['infinite']?.total ?? 0;
    const matchingTotal = map['matching']?.total ?? 0;
    const globalTotal = map['global']?.total ?? 0;
    const totalDistributed = directTotal + infiniteTotal + matchingTotal + globalTotal;

    // Creators que receberam pelo menos 1 bonus no periodo
    const [creatorsRow] = await db
      .select({ qty: count(sql`DISTINCT ${bonuses.userId}`) })
      .from(bonuses)
      .where(eq(bonuses.period, period));

    return {
      period,
      directBonuses: directTotal.toFixed(2),
      infiniteBonuses: infiniteTotal.toFixed(2),
      matchingBonuses: matchingTotal.toFixed(2),
      globalPool: globalTotal.toFixed(2),
      totalDistributed: totalDistributed.toFixed(2),
      creatorsReceived: Number(creatorsRow?.qty ?? 0),
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/network/at-risk
  // Creators em risco de churn: sem video ha 7+ dias
  // ----------------------------------------------------------
  app.get('/network/at-risk', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentMonth = currentPeriod();
    const monthStart = new Date(`${currentMonth}-01`);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Todos os creators ativos
    const activeCreators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        levelName: levels.name,
        behavioralProfile: creatorProfiles.behavioralProfile,
      })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
      .where(and(eq(users.role, 'creator'), eq(users.status, 'active')));

    // Para cada creator, verificar ultimo video
    const atRisk = (
      await Promise.all(
        activeCreators.map(async (c) => {
          // Ultimo video enviado
          const [lastVideoRow] = await db
            .select({ createdAt: videos.createdAt })
            .from(videos)
            .where(eq(videos.creatorId, c.id))
            .orderBy(desc(videos.createdAt))
            .limit(1);

          const lastVideoAt = lastVideoRow?.createdAt ?? null;

          // Se nunca enviou video, considerar em risco
          const isAtRisk =
            lastVideoAt === null || lastVideoAt < sevenDaysAgo;

          if (!isAtRisk) return null;

          const daysSinceLastVideo = lastVideoAt
            ? Math.floor(
                (Date.now() - lastVideoAt.getTime()) / (1000 * 60 * 60 * 24),
              )
            : null;

          // Videos enviados este mes
          const [monthVideosRow] = await db
            .select({ total: count() })
            .from(videos)
            .where(
              and(
                eq(videos.creatorId, c.id),
                gte(videos.createdAt, monthStart),
                lt(videos.createdAt, nextMonth),
              ),
            );

          // Risco de retencao do perfil comportamental
          const behavioral = c.behavioralProfile as Record<string, unknown> | null;
          const retentionRisk = behavioral?.retentionRisk as string | undefined;

          return {
            id: c.id,
            name: c.name,
            email: c.email,
            level: c.levelName ?? 'Seed',
            lastVideoAt,
            daysSinceLastVideo,
            retentionRisk: retentionRisk ?? 'unknown',
            videosThisMonth: Number(monthVideosRow?.total ?? 0),
          };
        }),
      )
    ).filter(Boolean);

    // Ordenar pelo maior tempo sem video
    atRisk.sort((a, b) => {
      const dA = a!.daysSinceLastVideo ?? 9999;
      const dB = b!.daysSinceLastVideo ?? 9999;
      return dB - dA;
    });

    return { creators: atRisk, total: atRisk.length };
  });
}
