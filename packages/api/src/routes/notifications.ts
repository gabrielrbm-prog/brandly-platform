import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { users } from '@brandly/core';
import { eq } from 'drizzle-orm';

export async function notificationRoutes(app: FastifyInstance) {
  // POST /api/notifications/register — registra push token do device
  app.post<{ Body: { pushToken: string } }>('/register', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { pushToken } = request.body;

    if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
      return reply.status(400).send({ error: 'pushToken invalido' });
    }

    await db.update(users)
      .set({ pushToken })
      .where(eq(users.id, userId));

    return { message: 'Push token registrado', pushToken };
  });
}
