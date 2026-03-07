import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { users, videos, payments, liveEvents, successCases } from '@brandly/core';
import { eq, and, sql, desc, sum, count, gte, lt } from 'drizzle-orm';

export async function communityRoutes(app: FastifyInstance) {
  // GET /api/community/ranking — ranking de creators
  app.get('/ranking', async (request, reply) => {
    const { period = 'month', type = 'production' } = request.query as {
      period?: 'week' | 'month';
      type?: 'production' | 'earnings';
    };

    const now = new Date();
    let dateFrom: Date;

    if (period === 'week') {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (type === 'production') {
      const ranking = await db.select({
        creatorId: videos.creatorId,
        name: users.name,
        total: count(videos.id),
      })
        .from(videos)
        .innerJoin(users, eq(videos.creatorId, users.id))
        .where(
          and(
            eq(videos.status, 'approved'),
            gte(videos.createdAt, sql`${dateFrom.toISOString()}::timestamp`),
            lt(videos.createdAt, sql`${now.toISOString()}::timestamp`),
          ),
        )
        .groupBy(videos.creatorId, users.name)
        .orderBy(desc(count(videos.id)))
        .limit(20);

      return {
        period,
        type,
        ranking,
        totalCreators: ranking.length,
      };
    }

    // type === 'earnings'
    const ranking = await db.select({
      creatorId: payments.userId,
      name: users.name,
      total: sum(payments.amount),
    })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .where(
        and(
          gte(payments.createdAt, sql`${dateFrom.toISOString()}::timestamp`),
          lt(payments.createdAt, sql`${now.toISOString()}::timestamp`),
        ),
      )
      .groupBy(payments.userId, users.name)
      .orderBy(desc(sum(payments.amount)))
      .limit(20);

    return {
      period,
      type,
      ranking,
      totalCreators: ranking.length,
    };
  });

  // GET /api/community/lives — agenda de lives
  app.get('/lives', async (request, reply) => {
    const now = new Date();

    const upcoming = await db.select()
      .from(liveEvents)
      .where(gte(liveEvents.scheduledAt, sql`${now.toISOString()}::timestamp`))
      .orderBy(liveEvents.scheduledAt);

    const past = await db.select()
      .from(liveEvents)
      .where(lt(liveEvents.scheduledAt, sql`${now.toISOString()}::timestamp`))
      .orderBy(desc(liveEvents.scheduledAt))
      .limit(10);

    return {
      upcoming,
      past,
    };
  });

  // GET /api/community/cases — cases de sucesso
  app.get('/cases', async (request, reply) => {
    const cases = await db.select({
      id: successCases.id,
      creatorId: successCases.creatorId,
      creatorName: users.name,
      title: successCases.title,
      story: successCases.story,
      earnings: successCases.earnings,
      createdAt: successCases.createdAt,
    })
      .from(successCases)
      .innerJoin(users, eq(successCases.creatorId, users.id))
      .where(eq(successCases.isPublished, true))
      .orderBy(desc(successCases.createdAt))
      .limit(20);

    return {
      cases,
      total: cases.length,
    };
  });
}
