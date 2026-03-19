import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  users,
  videos,
  payments,
  socialAccounts,
  creatorProfiles,
  contentGenerations,
} from '@brandly/core';
import { eq, sql, and, gte, lt, lte, count, sum, desc, isNotNull } from 'drizzle-orm';

// ============================================================
// Helpers
// ============================================================

/** Retorna o intervalo de datas para o parametro de periodo */
function parsePeriod(period: string): { start: Date; end: Date; groupBy: 'day' | 'month' } {
  const now = new Date();

  if (period === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start, end: now, groupBy: 'day' };
  }

  if (period === '90d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 90);
    return { start, end: now, groupBy: 'day' };
  }

  if (period === '12m') {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 12);
    return { start, end: now, groupBy: 'month' };
  }

  // Padrao: 30 dias
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return { start, end: now, groupBy: 'day' };
}

/** Inicio do mes atual */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Inicio da semana atual (domingo) */
function startOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Inicio e fim do dia de hoje */
function todayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Custo estimado Claude Sonnet: ~$0.003 por 1k tokens de entrada + $0.015 por 1k tokens de saida
// Usamos uma media conservadora de $0.003/1k para estimativa simplificada
const ESTIMATED_COST_PER_1K_TOKENS = 0.003;

// ============================================================
// Rotas
// ============================================================

export async function adminAnalyticsRoutes(app: FastifyInstance) {
  // ──────────────────────────────────────────────────────────
  // GET /api/admin/analytics/overview
  // Metricas gerais da plataforma em tempo real
  // ──────────────────────────────────────────────────────────
  app.get('/analytics/overview', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    const monthStart = startOfCurrentMonth();
    const weekStart = startOfCurrentWeek();
    const { start: todayStart, end: todayEnd } = todayRange();
    const now = new Date();

    // ── Creators ──
    const [totalCreatorsRow] = await db
      .select({ qty: count() })
      .from(users)
      .where(eq(users.role, 'creator'));

    const [activeCreatorsRow] = await db
      .select({ qty: count() })
      .from(users)
      .where(and(eq(users.role, 'creator'), eq(users.status, 'active')));

    const [newThisMonthRow] = await db
      .select({ qty: count() })
      .from(users)
      .where(and(
        eq(users.role, 'creator'),
        gte(users.createdAt, monthStart),
        lte(users.createdAt, now),
      ));

    const [newThisWeekRow] = await db
      .select({ qty: count() })
      .from(users)
      .where(and(
        eq(users.role, 'creator'),
        gte(users.createdAt, weekStart),
        lte(users.createdAt, now),
      ));

    // ── Videos ──
    const [totalVideosRow] = await db
      .select({ qty: count() })
      .from(videos);

    const [approvedTodayRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(and(
        eq(videos.status, 'approved'),
        gte(videos.reviewedAt, todayStart),
        lte(videos.reviewedAt, todayEnd),
      ));

    const [pendingNowRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(eq(videos.status, 'pending'));

    const [rejectedTodayRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(and(
        eq(videos.status, 'rejected'),
        gte(videos.reviewedAt, todayStart),
        lte(videos.reviewedAt, todayEnd),
      ));

    // Taxa de aprovacao historica
    const [videoStatsRow] = await db
      .select({
        approved: count(sql`CASE WHEN ${videos.status} = 'approved' THEN 1 END`),
        rejected: count(sql`CASE WHEN ${videos.status} = 'rejected' THEN 1 END`),
      })
      .from(videos);

    const approvedTotal = Number(videoStatsRow?.approved ?? 0);
    const rejectedTotal = Number(videoStatsRow?.rejected ?? 0);
    const reviewed = approvedTotal + rejectedTotal;
    const approvalRate = reviewed > 0
      ? ((approvedTotal / reviewed) * 100).toFixed(1) + '%'
      : '0%';

    // ── Financeiro ──
    const [totalRevenueRow] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(sql`${payments.status}::text IN ('approved', 'paid')`);

    const [revenueThisMonthRow] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(
        sql`${payments.status}::text IN ('approved', 'paid')`,
        gte(payments.createdAt, monthStart),
        lte(payments.createdAt, now),
      ));

    const [paidToCreatorsThisMonthRow] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(
        sql`${payments.status}::text = 'paid'`,
        gte(payments.createdAt, monthStart),
        lte(payments.createdAt, now),
      ));

    // ── Engajamento social ──
    const [socialStatsRow] = await db
      .select({
        avgFollowers: sql<number>`ROUND(AVG(${socialAccounts.followers}))::int`,
        avgEngagement: sql<number>`ROUND(AVG(${socialAccounts.engagementRate})::numeric, 2)`,
        connected: count(),
      })
      .from(socialAccounts)
      .where(eq(socialAccounts.status, 'connected'));

    return {
      creators: {
        total: Number(totalCreatorsRow?.qty ?? 0),
        active: Number(activeCreatorsRow?.qty ?? 0),
        newThisMonth: Number(newThisMonthRow?.qty ?? 0),
        newThisWeek: Number(newThisWeekRow?.qty ?? 0),
      },
      videos: {
        total: Number(totalVideosRow?.qty ?? 0),
        approvedToday: Number(approvedTodayRow?.qty ?? 0),
        pendingNow: Number(pendingNowRow?.qty ?? 0),
        rejectedToday: Number(rejectedTodayRow?.qty ?? 0),
        approvalRate,
      },
      financial: {
        totalRevenue: Number(totalRevenueRow?.total ?? 0).toFixed(2),
        revenueThisMonth: Number(revenueThisMonthRow?.total ?? 0).toFixed(2),
        paidToCreatorsThisMonth: Number(paidToCreatorsThisMonthRow?.total ?? 0).toFixed(2),
      },
      engagement: {
        avgFollowers: Number(socialStatsRow?.avgFollowers ?? 0),
        avgEngagementRate: Number(socialStatsRow?.avgEngagement ?? 0).toFixed(2) + '%',
        connectedSocialAccounts: Number(socialStatsRow?.connected ?? 0),
      },
    };
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/admin/analytics/growth?period=30d|90d|12m
  // Metricas de crescimento ao longo do tempo
  // ──────────────────────────────────────────────────────────
  app.get<{ Querystring: { period?: string } }>('/analytics/growth', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const period = request.query.period ?? '30d';
    const { start, end, groupBy } = parsePeriod(period);

    const truncUnit = groupBy === 'month' ? 'month' : 'day';

    // Registros de creators por periodo
    const registrationRows = await db.execute(sql`
      SELECT
        date_trunc(${truncUnit}, created_at) AS bucket,
        COUNT(*)::int AS qty
      FROM users
      WHERE role = 'creator'
        AND created_at >= ${start.toISOString()}::timestamp
        AND created_at <= ${end.toISOString()}::timestamp
      GROUP BY bucket
      ORDER BY bucket
    `);

    // Videos enviados por periodo
    const videosRows = await db.execute(sql`
      SELECT
        date_trunc(${truncUnit}, created_at) AS bucket,
        COUNT(*)::int AS qty
      FROM videos
      WHERE created_at >= ${start.toISOString()}::timestamp
        AND created_at <= ${end.toISOString()}::timestamp
      GROUP BY bucket
      ORDER BY bucket
    `);

    // Receita gerada por periodo
    const revenueRows = await db.execute(sql`
      SELECT
        date_trunc(${truncUnit}, created_at) AS bucket,
        ROUND(SUM(amount)::numeric, 2) AS total
      FROM payments
      WHERE status IN ('approved', 'paid')
        AND created_at >= ${start.toISOString()}::timestamp
        AND created_at <= ${end.toISOString()}::timestamp
      GROUP BY bucket
      ORDER BY bucket
    `);

    function formatBucket(raw: unknown): string {
      if (raw instanceof Date) {
        return groupBy === 'month'
          ? raw.toISOString().slice(0, 7)
          : raw.toISOString().slice(0, 10);
      }
      const s = String(raw);
      return groupBy === 'month' ? s.slice(0, 7) : s.slice(0, 10);
    }

    return {
      period,
      registrations: (registrationRows as any[]).map((r) => ({
        date: formatBucket(r.bucket),
        count: Number(r.qty),
      })),
      videosSubmitted: (videosRows as any[]).map((r) => ({
        date: formatBucket(r.bucket),
        count: Number(r.qty),
      })),
      revenue: (revenueRows as any[]).map((r) => ({
        date: formatBucket(r.bucket),
        amount: Number(r.total ?? 0),
      })),
    };
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/admin/analytics/onboarding-funnel
  // Funil de ativacao dos creators
  // ──────────────────────────────────────────────────────────
  app.get('/analytics/onboarding-funnel', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    // Total de usuarios creators registrados
    const [registeredRow] = await db
      .select({ qty: count() })
      .from(users)
      .where(eq(users.role, 'creator'));

    // Iniciaram onboarding = possuem creator_profile
    const [startedOnboardingRow] = await db
      .select({ qty: count() })
      .from(creatorProfiles);

    // Completaram perfil comportamental = behavioral_profile JSONB nao nulo
    const [completedBehavioralRow] = await db
      .select({ qty: count() })
      .from(creatorProfiles)
      .where(isNotNull(creatorProfiles.behavioralProfile));

    // Enviaram pelo menos 1 video
    const creatorsWithVideo = await db.execute(sql`
      SELECT COUNT(DISTINCT creator_id)::int AS qty
      FROM videos
    `);

    // Atingiram meta diaria (10+ videos em um unico dia)
    const creatorsHitDaily = await db.execute(sql`
      SELECT COUNT(DISTINCT creator_id)::int AS qty
      FROM (
        SELECT creator_id, DATE(created_at) AS day, COUNT(*)::int AS daily_count
        FROM videos
        GROUP BY creator_id, DATE(created_at)
        HAVING COUNT(*) >= 10
      ) sub
    `);

    const registered = Number(registeredRow?.qty ?? 0);
    const startedOnboarding = Number(startedOnboardingRow?.qty ?? 0);
    const completedBehavioral = Number(completedBehavioralRow?.qty ?? 0);
    const submittedFirstVideo = Number((creatorsWithVideo as any[])[0]?.qty ?? 0);
    const hitDailyTarget = Number((creatorsHitDaily as any[])[0]?.qty ?? 0);

    const conversionRate = registered > 0
      ? ((hitDailyTarget / registered) * 100).toFixed(1) + '%'
      : '0%';

    return {
      registered,
      startedOnboarding,
      completedBehavioral,
      submittedFirstVideo,
      hitDailyTarget,
      conversionRate,
    };
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/admin/analytics/rejection-reasons
  // Analise agregada de motivos de rejeicao de videos
  // ──────────────────────────────────────────────────────────
  app.get('/analytics/rejection-reasons', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    // Total de videos rejeitados
    const [totalRejectedRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(eq(videos.status, 'rejected'));

    const totalRejected = Number(totalRejectedRow?.qty ?? 0);

    // Agrupar por motivo de rejeicao (normalizado: trim + lower)
    const reasonRows = await db.execute(sql`
      SELECT
        TRIM(LOWER(rejection_reason)) AS reason,
        COUNT(*)::int AS qty
      FROM videos
      WHERE status = 'rejected'
        AND rejection_reason IS NOT NULL
        AND TRIM(rejection_reason) <> ''
      GROUP BY TRIM(LOWER(rejection_reason))
      ORDER BY qty DESC
      LIMIT 20
    `);

    const reasons = (reasonRows as any[]).map((r) => ({
      reason: String(r.reason ?? 'sem motivo'),
      count: Number(r.qty),
      percentage: totalRejected > 0
        ? ((Number(r.qty) / totalRejected) * 100).toFixed(1) + '%'
        : '0%',
    }));

    // Top creators com mais rejeicoes
    const topRejectedRows = await db.execute(sql`
      SELECT
        v.creator_id AS id,
        u.name,
        COUNT(*)::int AS rejected_count
      FROM videos v
      JOIN users u ON u.id = v.creator_id
      WHERE v.status = 'rejected'
      GROUP BY v.creator_id, u.name
      ORDER BY rejected_count DESC
      LIMIT 5
    `);

    const topCreatorsRejected = (topRejectedRows as any[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      rejectedCount: Number(r.rejected_count),
    }));

    return {
      reasons,
      totalRejected,
      topCreatorsRejected,
    };
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/admin/analytics/video-sla
  // Metricas de velocidade de revisao (SLA)
  // ──────────────────────────────────────────────────────────
  app.get('/analytics/video-sla', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    const { start: todayStart, end: todayEnd } = todayRange();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Tempo medio de revisao em horas (apenas videos revisados)
    const avgReviewRows = await db.execute(sql`
      SELECT ROUND(
        AVG(
          EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600
        )::numeric,
        2
      ) AS avg_hours
      FROM videos
      WHERE reviewed_at IS NOT NULL
        AND status IN ('approved', 'rejected')
    `);

    const avgReviewTimeHours = Number((avgReviewRows as any[])[0]?.avg_hours ?? 0);

    // Pendentes ha mais de 24h
    const [pendingOver24hRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(and(
        eq(videos.status, 'pending'),
        lte(videos.createdAt, twentyFourHoursAgo),
      ));

    // Revisados hoje
    const [reviewedTodayRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(and(
        isNotNull(videos.reviewedAt),
        gte(videos.reviewedAt, todayStart),
        lte(videos.reviewedAt, todayEnd),
      ));

    // Pendentes agora
    const [pendingNowRow] = await db
      .select({ qty: count() })
      .from(videos)
      .where(eq(videos.status, 'pending'));

    return {
      avgReviewTimeHours,
      pendingOver24h: Number(pendingOver24hRow?.qty ?? 0),
      reviewedToday: Number(reviewedTodayRow?.qty ?? 0),
      pendingNow: Number(pendingNowRow?.qty ?? 0),
    };
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/admin/analytics/ai-usage?period=30d
  // Monitor de uso de IA (contentGenerations)
  // ──────────────────────────────────────────────────────────
  app.get<{ Querystring: { period?: string } }>('/analytics/ai-usage', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const period = request.query.period ?? '30d';
    const { start, end } = parsePeriod(period);

    // Total de geracoes no periodo
    const [totalRow] = await db
      .select({ qty: count() })
      .from(contentGenerations)
      .where(and(
        gte(contentGenerations.createdAt, start),
        lte(contentGenerations.createdAt, end),
      ));

    // Agrupado por tipo com tokens medios
    const byTypeRows = await db.execute(sql`
      SELECT
        type,
        COUNT(*)::int AS qty,
        ROUND(AVG(tokens_used)::numeric, 0)::int AS avg_tokens
      FROM content_generations
      WHERE created_at >= ${start.toISOString()}::timestamp
        AND created_at <= ${end.toISOString()}::timestamp
      GROUP BY type
      ORDER BY qty DESC
    `);

    // Total de tokens usados no periodo
    const [tokensRow] = await db
      .select({ total: sum(contentGenerations.tokensUsed) })
      .from(contentGenerations)
      .where(and(
        gte(contentGenerations.createdAt, start),
        lte(contentGenerations.createdAt, end),
      ));

    const totalTokensUsed = Number(tokensRow?.total ?? 0);
    const estimatedCostUSD = (totalTokensUsed / 1000) * ESTIMATED_COST_PER_1K_TOKENS;

    // Ultimas 10 geracoes
    const recentRows = await db
      .select({
        id: contentGenerations.id,
        type: contentGenerations.type,
        provider: contentGenerations.provider,
        tokensUsed: contentGenerations.tokensUsed,
        createdAt: contentGenerations.createdAt,
      })
      .from(contentGenerations)
      .orderBy(desc(contentGenerations.createdAt))
      .limit(10);

    return {
      period,
      totalGenerations: Number(totalRow?.qty ?? 0),
      byType: (byTypeRows as any[]).map((r) => ({
        type: String(r.type),
        count: Number(r.qty),
        avgTokens: Number(r.avg_tokens ?? 0),
      })),
      totalTokensUsed,
      estimatedCost: `USD ${estimatedCostUSD.toFixed(4)}`,
      recentGenerations: recentRows.map((r) => ({
        id: r.id,
        type: r.type,
        provider: r.provider,
        tokensUsed: r.tokensUsed,
        createdAt: r.createdAt,
      })),
    };
  });
}
