import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { videos, payments, creatorBrands, users, levels } from '@brandly/core';
import { eq, and, sql, desc, sum, count } from 'drizzle-orm';

interface MetricsQuery {
  period?: 'day' | 'week' | 'month';
}

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard — visao geral do creator
  app.get('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 1. Videos de hoje por status
    const todayVideos = await db.select({
      status: videos.status,
      total: sql<number>`count(*)::int`,
    })
      .from(videos)
      .where(and(
        eq(videos.creatorId, userId),
        sql`${videos.createdAt}::date = CURRENT_DATE`,
      ))
      .groupBy(videos.status);

    const videosByStatus: Record<string, number> = {};
    let todayVideoCount = 0;
    for (const row of todayVideos) {
      videosByStatus[row.status] = row.total;
      todayVideoCount += row.total;
    }

    // 2. Ganhos de hoje
    const [todayEarnings] = await db.select({
      total: sum(payments.amount),
    })
      .from(payments)
      .where(and(
        eq(payments.userId, userId),
        sql`${payments.createdAt}::date = CURRENT_DATE`,
      ));

    // 3. Videos restantes hoje (maximo 10/dia)
    const remaining = Math.max(0, 10 - todayVideoCount);

    // 4. Totais do mes — videos
    const [monthVideos] = await db.select({
      total: sql<number>`count(*)::int`,
    })
      .from(videos)
      .where(and(
        eq(videos.creatorId, userId),
        sql`to_char(${videos.createdAt}, 'YYYY-MM') = ${currentMonth}`,
      ));

    const [monthApproved] = await db.select({
      total: sql<number>`count(*)::int`,
    })
      .from(videos)
      .where(and(
        eq(videos.creatorId, userId),
        eq(videos.status, 'approved'),
        sql`to_char(${videos.createdAt}, 'YYYY-MM') = ${currentMonth}`,
      ));

    // 4. Totais do mes — pagamentos por tipo
    const monthPayments = await db.select({
      type: payments.type,
      total: sum(payments.amount),
    })
      .from(payments)
      .where(and(
        eq(payments.userId, userId),
        eq(payments.period, currentMonth),
      ))
      .groupBy(payments.type);

    const monthByType: Record<string, number> = {};
    let monthGrandTotal = 0;
    for (const row of monthPayments) {
      const val = Number(row.total ?? 0);
      monthByType[row.type] = val;
      monthGrandTotal += val;
    }

    const totalMonthVideos = monthVideos?.total ?? 0;
    const totalMonthApproved = monthApproved?.total ?? 0;
    const approvalRate = totalMonthVideos > 0
      ? ((totalMonthApproved / totalMonthVideos) * 100).toFixed(0) + '%'
      : '0%';

    // 5. Marcas ativas
    const [activeBrands] = await db.select({
      total: sql<number>`count(*)::int`,
    })
      .from(creatorBrands)
      .where(and(
        eq(creatorBrands.creatorId, userId),
        eq(creatorBrands.isActive, true),
      ));

    // 6. Nivel do usuario
    const [userLevel] = await db.select({
      levelName: levels.name,
    })
      .from(users)
      .innerJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.id, userId));

    return {
      today: {
        videosApproved: videosByStatus['approved'] ?? 0,
        videosPending: videosByStatus['pending'] ?? 0,
        videosRejected: videosByStatus['rejected'] ?? 0,
        earnings: Number(todayEarnings?.total ?? 0).toFixed(2),
        remaining,
      },
      month: {
        period: currentMonth,
        totalVideos: totalMonthVideos,
        approvalRate,
        totalEarnings: monthGrandTotal.toFixed(2),
        videoEarnings: (monthByType['video'] ?? 0).toFixed(2),
        commissionEarnings: (monthByType['commission'] ?? 0).toFixed(2),
        bonusEarnings: (monthByType['bonus'] ?? 0).toFixed(2),
      },
      brands: {
        active: activeBrands?.total ?? 0,
      },
      level: {
        current: userLevel?.levelName ?? 'Seed',
      },
    };
  });

  // GET /api/dashboard/metrics — metricas detalhadas
  app.get<{ Querystring: MetricsQuery }>('/metrics', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { period = 'week' } = request.query;

    // Calcular intervalo de datas conforme o periodo
    const dateFilter = period === 'day'
      ? sql`${videos.createdAt}::date = CURRENT_DATE`
      : period === 'week'
        ? sql`${videos.createdAt}::date >= CURRENT_DATE - INTERVAL '7 days'`
        : sql`${videos.createdAt}::date >= CURRENT_DATE - INTERVAL '30 days'`;

    const paymentDateFilter = period === 'day'
      ? sql`${payments.createdAt}::date = CURRENT_DATE`
      : period === 'week'
        ? sql`${payments.createdAt}::date >= CURRENT_DATE - INTERVAL '7 days'`
        : sql`${payments.createdAt}::date >= CURRENT_DATE - INTERVAL '30 days'`;

    // 1. Estatisticas de producao
    const [produced] = await db.select({
      total: sql<number>`count(*)::int`,
    })
      .from(videos)
      .where(and(eq(videos.creatorId, userId), dateFilter));

    const [approved] = await db.select({
      total: sql<number>`count(*)::int`,
    })
      .from(videos)
      .where(and(eq(videos.creatorId, userId), eq(videos.status, 'approved'), dateFilter));

    const videosProduced = produced?.total ?? 0;
    const videosApproved = approved?.total ?? 0;
    const approvalRate = videosProduced > 0
      ? ((videosApproved / videosProduced) * 100).toFixed(0) + '%'
      : '0%';

    // 2. Estatisticas financeiras por tipo
    const financialRows = await db.select({
      type: payments.type,
      total: sum(payments.amount),
    })
      .from(payments)
      .where(and(eq(payments.userId, userId), paymentDateFilter))
      .groupBy(payments.type);

    const byType: Record<string, number> = {};
    let totalEarnings = 0;
    for (const row of financialRows) {
      const val = Number(row.total ?? 0);
      byType[row.type] = val;
      totalEarnings += val;
    }

    return {
      period,
      production: {
        videosProduced,
        videosApproved,
        approvalRate,
      },
      financial: {
        totalEarnings: totalEarnings.toFixed(2),
        videoEarnings: (byType['video'] ?? 0).toFixed(2),
        commissionEarnings: (byType['commission'] ?? 0).toFixed(2),
        bonusEarnings: (byType['bonus'] ?? 0).toFixed(2),
      },
      social: {
        instagram: {
          connected: false,
          followers: 0,
          avgLikes: 0,
          avgViews: 0,
        },
        tiktok: {
          connected: false,
          followers: 0,
          avgLikes: 0,
          avgViews: 0,
        },
      },
    };
  });

  // GET /api/dashboard/ranking — posicao do creator no ranking
  app.get('/ranking', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Top 10 creators por videos aprovados no mes
    const rankingRows = await db.select({
      creatorId: videos.creatorId,
      name: users.name,
      approvedCount: sql<number>`count(*)::int`,
    })
      .from(videos)
      .innerJoin(users, eq(videos.creatorId, users.id))
      .where(and(
        eq(videos.status, 'approved'),
        sql`to_char(${videos.createdAt}, 'YYYY-MM') = ${currentMonth}`,
      ))
      .groupBy(videos.creatorId, users.name)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topPerformers = rankingRows.map((row, index) => ({
      position: index + 1,
      creatorId: row.creatorId,
      name: row.name,
      approvedVideos: row.approvedCount,
    }));

    // Posicao do usuario solicitante
    const allRanking = await db.select({
      creatorId: videos.creatorId,
      approvedCount: sql<number>`count(*)::int`,
    })
      .from(videos)
      .where(and(
        eq(videos.status, 'approved'),
        sql`to_char(${videos.createdAt}, 'YYYY-MM') = ${currentMonth}`,
      ))
      .groupBy(videos.creatorId)
      .orderBy(desc(sql`count(*)`));

    const userPosition = allRanking.findIndex(r => r.creatorId === userId) + 1;

    return {
      position: userPosition || 0,
      totalCreators: allRanking.length,
      topPerformers,
    };
  });
}
