import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { userRoutes } from './routes/users.js';
import { videoRoutes } from './routes/videos.js';
import { financialRoutes } from './routes/financial.js';
import { saleRoutes } from './routes/sales.js';
import { brandRoutes } from './routes/brands.js';
import { scriptRoutes } from './routes/scripts.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { networkRoutes } from './routes/network.js';
import { courseRoutes } from './routes/courses.js';
import { communityRoutes } from './routes/community.js';
import { socialRoutes } from './routes/social.js';
import { adminPanelRoutes } from './routes/admin-panel.js';
import { cronRoutes } from './routes/cron.js';
import { notificationRoutes } from './routes/notifications.js';

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
  await app.register(authPlugin);

  // Sprint 1 — Fundacao
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(onboardingRoutes, { prefix: '/api/onboarding' });
  await app.register(videoRoutes, { prefix: '/api/videos' });
  await app.register(financialRoutes, { prefix: '/api/financial' });

  // Sprint 2 — Core
  await app.register(brandRoutes, { prefix: '/api/brands' });
  await app.register(scriptRoutes, { prefix: '/api/scripts' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });

  // Sprint 3 — Crescimento
  await app.register(networkRoutes, { prefix: '/api/network' });
  await app.register(courseRoutes, { prefix: '/api/courses' });
  await app.register(communityRoutes, { prefix: '/api/community' });

  // Social — Integracao Phyllo (Instagram/TikTok)
  await app.register(socialRoutes, { prefix: '/api/social' });

  // Auxiliares
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(saleRoutes, { prefix: '/api/sales' });

  // Admin Panel (HTML)
  await app.register(adminPanelRoutes, { prefix: '/admin' });

  // Cron Jobs (admin triggers)
  await app.register(cronRoutes, { prefix: '/api/cron' });

  // Notifications
  await app.register(notificationRoutes, { prefix: '/api/notifications' });

  // Web App — SPA estático servido em /app/
  const webDistPath = path.resolve(process.cwd(), 'packages/web/dist');
  const webIndexPath = path.join(webDistPath, 'index.html');
  const hasWebDist = fs.existsSync(webIndexPath);

  if (hasWebDist) {
    app.log.info(`Web app encontrado em ${webDistPath}`);

    await app.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/app/',
    });

    // SPA fallback — qualquer rota /app/* que não seja arquivo estático retorna index.html
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/app')) {
        return (reply as any).sendFile('index.html', webDistPath);
      }
      reply.code(404).send({ error: 'Not Found' });
    });
  } else {
    app.log.warn(`Web app NAO encontrado em ${webDistPath} — /app/ desabilitado`);
  }

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
