import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: string };
    user: { userId: string; role: string };
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
}

export const authPlugin = fp(auth, { name: 'auth' });

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
