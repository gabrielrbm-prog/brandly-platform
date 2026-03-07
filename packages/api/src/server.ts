import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { userRoutes } from './routes/users.js';
import { videoRoutes } from './routes/videos.js';
import { financialRoutes } from './routes/financial.js';
import { saleRoutes } from './routes/sales.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
  },
});

async function start() {
  await app.register(cors, { origin: true });

  // Routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(onboardingRoutes, { prefix: '/api/onboarding' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(videoRoutes, { prefix: '/api/videos' });
  await app.register(financialRoutes, { prefix: '/api/financial' });
  await app.register(saleRoutes, { prefix: '/api/sales' });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port, host });
  app.log.info(`Brandly API rodando em http://${host}:${port}`);
}

start().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});

export { app };
