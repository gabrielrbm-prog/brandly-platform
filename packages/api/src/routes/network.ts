import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { users, lines, qualifications, bonuses, levels, sales } from '@brandly/core';
import { eq, and, sql, desc, sum, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export async function networkRoutes(app: FastifyInstance) {
  // GET /api/network/referral-link — link unico de indicacao
  app.get('/referral-link', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const [user] = await db.select({
      referralCode: users.referralCode,
    })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return reply.status(404).send({ error: 'Usuario nao encontrado' });
    }

    const [totalResult] = await db.select({
      total: count(),
    })
      .from(users)
      .where(eq(users.sponsorId, userId));

    const [activeResult] = await db.select({
      total: count(),
    })
      .from(users)
      .where(and(eq(users.sponsorId, userId), eq(users.status, 'active')));

    return {
      referralCode: user.referralCode,
      referralUrl: `https://brandly.com.br/r/${user.referralCode}`,
      totalReferrals: totalResult?.total ?? 0,
      activeReferrals: activeResult?.total ?? 0,
    };
  });

  // GET /api/network/tree — arvore de rede
  app.get('/tree', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    // Buscar diretos (depth 1)
    const subUsers = alias(users, 'sub_users');

    const directs = await db.select({
      id: users.id,
      name: users.name,
      status: users.status,
      createdAt: users.createdAt,
      levelName: levels.name,
    })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.sponsorId, userId));

    // Para cada direto, contar seus diretos (depth 2)
    const directsWithSubCount = await Promise.all(
      directs.map(async (direct) => {
        const [subCount] = await db.select({
          total: count(),
        })
          .from(users)
          .where(eq(users.sponsorId, direct.id));

        return {
          id: direct.id,
          name: direct.name,
          level: direct.levelName ?? 'Seed',
          status: direct.status,
          createdAt: direct.createdAt,
          directCount: subCount?.total ?? 0,
        };
      }),
    );

    return {
      directs: directsWithSubCount,
      totalNetwork: directsWithSubCount.length,
      depth: 2,
    };
  });

  // GET /api/network/stats — estatisticas da rede
  app.get('/stats', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 1. Nivel atual do usuario
    const [userWithLevel] = await db.select({
      levelName: levels.name,
      levelRank: levels.rank,
      requiredQV: levels.requiredQV,
      requiredDirects: levels.requiredDirects,
      requiredPML: levels.requiredPML,
    })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.id, userId));

    const currentRank = userWithLevel?.levelRank ?? 1;
    const currentLevelName = userWithLevel?.levelName ?? 'Seed';

    // 2. Proximo nivel
    const [nextLevel] = await db.select({
      name: levels.name,
      requiredQV: levels.requiredQV,
      requiredDirects: levels.requiredDirects,
      requiredPML: levels.requiredPML,
    })
      .from(levels)
      .where(eq(levels.rank, currentRank + 1));

    // 3. Dados de qualificacao do periodo atual
    const [qualification] = await db.select()
      .from(qualifications)
      .where(and(eq(qualifications.userId, userId), eq(qualifications.period, currentMonth)));

    // 4. Estatisticas da rede
    const [totalMembers] = await db.select({
      total: count(),
    })
      .from(lines)
      .where(eq(lines.sponsorId, userId));

    const [activeMembers] = await db.select({
      total: count(),
    })
      .from(lines)
      .innerJoin(users, eq(lines.userId, users.id))
      .where(and(eq(lines.sponsorId, userId), eq(users.status, 'active')));

    const [directsActive] = await db.select({
      total: count(),
    })
      .from(users)
      .where(and(eq(users.sponsorId, userId), eq(users.status, 'active')));

    // 5. Totais de bonus por tipo no periodo atual
    const bonusByType = await db.select({
      type: bonuses.type,
      total: sum(bonuses.amount),
    })
      .from(bonuses)
      .where(and(eq(bonuses.userId, userId), eq(bonuses.period, currentMonth)))
      .groupBy(bonuses.type);

    const bonusMap: Record<string, string> = {};
    let bonusTotal = 0;
    for (const row of bonusByType) {
      const val = Number(row.total ?? 0);
      bonusMap[row.type] = val.toFixed(2);
      bonusTotal += val;
    }

    // 6. Volume total da rede (soma de QV das qualifications dos membros da rede)
    const [networkVolume] = await db.select({
      total: sum(qualifications.qualifiedVolume),
    })
      .from(qualifications)
      .innerJoin(lines, eq(qualifications.userId, lines.userId))
      .where(and(eq(lines.sponsorId, userId), eq(qualifications.period, currentMonth)));

    return {
      period: currentMonth,
      level: {
        current: currentLevelName,
        rank: currentRank,
        nextLevel: nextLevel?.name ?? null,
        requirements: {
          qv: {
            current: Number(qualification?.qualifiedVolume ?? 0),
            required: Number(nextLevel?.requiredQV ?? userWithLevel?.requiredQV ?? 0),
          },
          directs: {
            current: qualification?.directsActive ?? 0,
            required: nextLevel?.requiredDirects ?? userWithLevel?.requiredDirects ?? 0,
          },
          pml: {
            current: Number(qualification?.maxLinePML ?? 0),
            required: Number(nextLevel?.requiredPML ?? userWithLevel?.requiredPML ?? 0),
          },
        },
      },
      network: {
        totalMembers: totalMembers?.total ?? 0,
        activeMembers: activeMembers?.total ?? 0,
        directsActive: directsActive?.total ?? 0,
        totalVolume: Number(networkVolume?.total ?? 0).toFixed(2),
      },
      bonuses: {
        direct: bonusMap['direct'] ?? '0.00',
        infinite: bonusMap['infinite'] ?? '0.00',
        matching: bonusMap['matching'] ?? '0.00',
        global: bonusMap['global'] ?? '0.00',
        total: bonusTotal.toFixed(2),
      },
    };
  });

  // GET /api/network/bonuses — historico de bonus da rede
  app.get('/bonuses', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const result = await db.select({
      id: bonuses.id,
      type: bonuses.type,
      amount: bonuses.amount,
      period: bonuses.period,
      status: bonuses.status,
      createdAt: bonuses.createdAt,
    })
      .from(bonuses)
      .where(eq(bonuses.userId, userId))
      .orderBy(desc(bonuses.createdAt))
      .limit(100);

    return { bonuses: result, total: result.length };
  });
}
