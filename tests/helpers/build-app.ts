import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authPlugin } from '@brandly/api/plugins/auth.js';

/**
 * Cria instancia do Fastify pronta para testes com inject().
 * Registra apenas o auth plugin + as rotas que voce passar.
 */
export async function buildApp(
  registerRoutes: (app: ReturnType<typeof Fastify>) => Promise<void>,
) {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });
  await app.register(authPlugin);
  await registerRoutes(app);
  await app.ready();
  return app;
}

/**
 * Gera JWT token para testes.
 */
export function getTestToken(
  app: ReturnType<typeof Fastify>,
  payload: { userId: string; role: string } = { userId: 'test-user-id', role: 'creator' },
) {
  return app.jwt.sign(payload);
}

export function getAdminToken(app: ReturnType<typeof Fastify>) {
  return getTestToken(app, { userId: 'admin-user-id', role: 'admin' });
}
