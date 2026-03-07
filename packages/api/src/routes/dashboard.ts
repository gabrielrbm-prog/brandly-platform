import type { FastifyInstance } from 'fastify';

interface MetricsQuery {
  period?: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard — visao geral do creator
  app.get('/', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: agregar dados de videos, pagamentos, marcas

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    return {
      today: {
        videosApproved: 0,
        videosPending: 0,
        videosRejected: 0,
        earnings: '0.00',
        remaining: 10,
      },
      month: {
        period: currentMonth,
        totalVideos: 0,
        approvalRate: '0%',
        totalEarnings: '0.00',
        videoEarnings: '0.00',
        commissionEarnings: '0.00',
        bonusEarnings: '0.00',
      },
      brands: {
        active: 0,
        available: 0,
      },
      level: {
        current: 'Seed',
        nextLevel: 'Spark',
        progress: '0%',
      },
      notifications: [],
    };
  });

  // GET /api/dashboard/metrics — metricas detalhadas
  app.get<{ Querystring: MetricsQuery }>('/metrics', async (request, reply) => {
    const { period = 'week' } = request.query;

    // TODO: extrair creatorId do JWT
    // TODO: agregar metricas por periodo

    return {
      period,
      production: {
        videosProduced: 0,
        videosApproved: 0,
        approvalRate: '0%',
        avgPerDay: '0',
      },
      financial: {
        totalEarnings: '0.00',
        videoEarnings: '0.00',
        commissionEarnings: '0.00',
        bonusEarnings: '0.00',
      },
      social: {
        instagram: {
          connected: false,
          followers: 0,
          avgLikes: 0,
          avgViews: 0,
        },
        tiktok: {
          connected: false,
          followers: 0,
          avgLikes: 0,
          avgViews: 0,
        },
      },
      comparison: {
        vsLastPeriod: {
          videos: '0%',
          earnings: '0%',
          approvalRate: '0%',
        },
        vsPlatformAvg: {
          videos: '0%',
          earnings: '0%',
          approvalRate: '0%',
        },
      },
      insights: [],
    };
  });

  // GET /api/dashboard/ranking — posicao do creator no ranking
  app.get('/ranking', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: calcular posicao no ranking

    return {
      position: 0,
      totalCreators: 0,
      topPerformers: [],
    };
  });
}
