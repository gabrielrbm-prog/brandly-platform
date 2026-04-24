import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
import { integrationRoutes } from './routes/integrations.js';
import { campaignRoutes } from './routes/campaigns.js';
import { analyticsRoutes } from './routes/analytics.js';
import { legalRoutes } from './routes/legal.js';
import { adminFinancialRoutes } from './routes/admin-financial.js';
import { adminBrandsRoutes } from './routes/admin-brands.js';
import { adminCreatorsRoutes } from './routes/admin-creators.js';
import { adminTeamRoutes } from './routes/admin-team.js';
import { adminAnalyticsRoutes } from './routes/admin-analytics.js';
import { adminOperationsRoutes } from './routes/admin-operations.js';
import { shipmentRoutes } from './routes/shipments.js';
import { webhookRoutes } from './routes/webhooks.js';
import { brandPortalRoutes } from './routes/brand-portal.js';
import { brandApplicationRoutes } from './routes/brand-applications.js';
import { brandSelfServiceRoutes } from './routes/brand-self-service.js';

const app = Fastify({
  bodyLimit: 5_242_880, // 5MB max — suporta base64 de logos de marcas
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
  },
});

async function start() {
  // --- Seguranca: Helmet (headers HTTP) ---
  // CSP desabilitado pois servimos uma SPA
  await app.register(helmet, { contentSecurityPolicy: false });

  // --- Seguranca: Rate Limiting global ---
  await app.register(rateLimit, {
    max: 100,        // 100 requisicoes por janela
    timeWindow: '1 minute',
  });

  // --- Seguranca: Rate limit estrito em rotas de autenticacao (anti-brute-force) ---
  app.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url?.startsWith('/api/auth')) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: { max: 10, timeWindow: '1 minute' },
      };
    }
  });

  // --- CORS — whitelist explicita em vez de origin: true ---
  await app.register(cors, {
    origin: [
      'http://localhost:5173',      // web dev (Vite)
      'http://localhost:8081',      // expo dev
      'http://localhost:19006',     // expo web
      'https://api-production-3a6f.up.railway.app',
      'https://gabrielrbm-prog.github.io',
      'https://brandly-app.pages.dev',  // Cloudflare Pages
      'https://app.brandlycreator.com.br',  // Domínio de produção
      /\.brandly-app\.pages\.dev$/,     // Cloudflare preview deploys
      /\.brandlycreator\.com\.br$/,     // Subdomínios brandlycreator
      /\.brandly\.com$/,                // dominio customizado futuro
    ],
    credentials: true,
  });

  // --- Plugin de autenticacao JWT ---
  await app.register(authPlugin);

  // --- Tratamento global de erros ---
  app.setErrorHandler((error: FastifyError, request, reply) => {
    app.log.error(
      { err: error, url: request.url, method: request.method },
      'Erro nao tratado',
    );

    if (error.statusCode === 429) {
      return reply
        .status(429)
        .send({ error: 'Muitas requisicoes. Tente novamente em alguns minutos.' });
    }

    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
    });
  });

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

  // Sprint 4 — Integracoes & Analytics
  await app.register(integrationRoutes, { prefix: '/api/integrations' });
  await app.register(campaignRoutes, { prefix: '/api/campaigns' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });

  // Auxiliares
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(saleRoutes, { prefix: '/api/sales' });

  // Rastreamento de envios (Correios)
  await app.register(shipmentRoutes, { prefix: '/api/shipments' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  await app.register(brandPortalRoutes, { prefix: '/api' });
  await app.register(brandApplicationRoutes, { prefix: '/api' });
  await app.register(brandSelfServiceRoutes, { prefix: '/api' });

  // Admin Panel (HTML)
  await app.register(adminPanelRoutes, { prefix: '/admin' });

  // Admin API — financeiro e operacoes administrativas
  await app.register(adminFinancialRoutes, { prefix: '/api/admin' });

  // Admin API — gestao de marcas, briefings e produtos
  await app.register(adminBrandsRoutes, { prefix: '/api/admin' });

  // Admin API — gestao avancada de creators e analytics de rede
  await app.register(adminCreatorsRoutes, { prefix: '/api/admin' });

  // Admin API — gestao do time admin e cargos
  await app.register(adminTeamRoutes, { prefix: '/api/admin' });

  // Admin API — analytics de plataforma e monitor de uso de IA
  await app.register(adminAnalyticsRoutes, { prefix: '/api/admin' });

  // Admin API — LMS (cursos/aulas), comunidade, notificacoes e exportacao CSV
  await app.register(adminOperationsRoutes, { prefix: '/api/admin' });

  // Paginas legais (Termos de Uso e Politica de Privacidade)
  await app.register(legalRoutes, { prefix: '/legal' });

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

    // Redirect raiz e rotas sem /app/ para /app/
    app.get('/', (_request, reply) => {
      reply.redirect('/app/');
    });

    // SPA fallback — qualquer rota /app/* que não seja arquivo estático retorna index.html
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/app')) {
        return (reply as any).sendFile('index.html', webDistPath);
      }
      // Rotas como /login, /register etc. redirecionam para /app/...
      if (!request.url.startsWith('/api') && !request.url.startsWith('/app')) {
        return reply.redirect(`/app${request.url}`);
      }
      reply.code(404).send({ error: 'Not Found' });
    });
  } else {
    app.log.warn(`Web app NAO encontrado em ${webDistPath} — /app/ desabilitado`);
  }

  // --- Graceful shutdown ---
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`${signal} recebido — encerrando servidor...`);
      await app.close();
      process.exit(0);
    });
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
