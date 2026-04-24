import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { canDo, type AdminAction, type AdminRole } from '@brandly/core';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: string; adminRole?: AdminRole | null };
    user: { userId: string; role: string; adminRole?: AdminRole | null };
  }
}

async function auth(app: FastifyInstance) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'brandly-dev-secret-change-in-prod',
    sign: { expiresIn: '7d' },
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Token invalido ou expirado' });
    }
  });

  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'admin') {
        reply.status(403).send({ error: 'Acesso restrito a administradores' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Token invalido ou expirado' });
    }
  });

  /**
   * Gate by specific admin action. Caller must already be admin.
   * Tokens issued before adminRole was introduced are treated as super_admin
   * for backward compatibility (avoids logging everyone out at deploy).
   */
  app.decorate(
    'requireAdminPermission',
    (action: AdminAction) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
          if (request.user.role !== 'admin') {
            reply.status(403).send({ error: 'Acesso restrito a administradores' });
            return;
          }
          // Backward-compat: legacy tokens (no adminRole field) get full access.
          // New tokens always carry adminRole; null means no permission set.
          const adminRole =
            request.user.adminRole === undefined ? 'super_admin' : request.user.adminRole;
          if (!canDo(adminRole, action)) {
            reply.status(403).send({
              error: 'Sem permissao para esta acao',
              required: action,
            });
          }
        } catch (err) {
          reply.status(401).send({ error: 'Token invalido ou expirado' });
        }
      },
  );

  app.decorate('requireBrand', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'brand') {
        reply.status(403).send({ error: 'Acesso restrito a marcas' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Token invalido ou expirado' });
    }
  });
}

export const authPlugin = fp(auth, { name: 'auth' });

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdminPermission: (
      action: AdminAction,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireBrand: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
