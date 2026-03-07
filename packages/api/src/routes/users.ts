import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { users, levels, creatorProfiles } from '@brandly/core';
import { eq, sql, count } from 'drizzle-orm';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/users — lista creators (admin)
  app.get('/', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const offset = (Number(page) - 1) * Number(limit);

    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      referralCode: users.referralCode,
      onboardingCompleted: users.onboardingCompleted,
      levelName: levels.name,
      createdAt: users.createdAt,
    })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .orderBy(users.createdAt)
      .offset(offset)
      .limit(Number(limit));

    const [totalRow] = await db.select({ total: count() }).from(users);

    return { users: result, total: totalRow?.total ?? 0, page: Number(page), limit: Number(limit) };
  });

  // GET /api/users/:id — detalhes do creator
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      referralCode: users.referralCode,
      instagramHandle: users.instagramHandle,
      tiktokHandle: users.tiktokHandle,
      onboardingCompleted: users.onboardingCompleted,
      levelName: levels.name,
      createdAt: users.createdAt,
    })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.id, id));

    if (!user) {
      return reply.status(404).send({ error: 'Usuario nao encontrado' });
    }

    const [profile] = await db.select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, id));

    return { user, profile: profile ?? null };
  });

  // GET /api/users/:id/network — rede do creator
  app.get<{ Params: { id: string } }>('/:id/network', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const downline = await db.select({
      id: users.id,
      name: users.name,
      status: users.status,
      levelName: levels.name,
      createdAt: users.createdAt,
    })
      .from(users)
      .leftJoin(levels, eq(users.levelId, levels.id))
      .where(eq(users.sponsorId, id));

    const [sponsor] = await db.select({
      sponsorId: users.sponsorId,
    })
      .from(users)
      .where(eq(users.id, id));

    let upline = null;
    if (sponsor?.sponsorId) {
      const [up] = await db.select({
        id: users.id,
        name: users.name,
        levelName: levels.name,
      })
        .from(users)
        .leftJoin(levels, eq(users.levelId, levels.id))
        .where(eq(users.id, sponsor.sponsorId));
      upline = up ?? null;
    }

    return { userId: id, upline, downline };
  });
}
