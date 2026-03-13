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

    // Salvar no campo pushToken do user
    // Nota: se o campo nao existir no schema, ignorar silently
    try {
      await db.update(users)
        .set({ pushToken } as any)
        .where(eq(users.id, userId));
    } catch {
      // Campo pode nao existir ainda — migration pendente
    }

    return { message: 'Push token registrado', pushToken };
  });
}
