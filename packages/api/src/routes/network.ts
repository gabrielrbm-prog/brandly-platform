import type { FastifyInstance } from 'fastify';

export async function networkRoutes(app: FastifyInstance) {
  // GET /api/network/referral-link — link unico de indicacao
  app.get('/referral-link', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar referralCode do user

    return {
      referralCode: 'ABC123',
      referralUrl: 'https://brandly.com.br/r/ABC123',
      totalReferrals: 0,
      activeReferrals: 0,
    };
  });

  // GET /api/network/tree — arvore de rede
  app.get('/tree', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar diretos e rede expandida (depth limitado)

    return {
      directs: [],
      totalNetwork: 0,
      depth: 0,
    };
  });

  // GET /api/network/stats — estatisticas da rede
  app.get('/stats', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: calcular volume da rede, ativos, nivel

    const currentMonth = new Date().toISOString().slice(0, 7);

    return {
      period: currentMonth,
      level: {
        current: 'Seed',
        rank: 1,
        nextLevel: 'Spark',
        requirements: {
          qv: { current: 0, required: 500 },
          directs: { current: 0, required: 2 },
          pml: { current: 0, required: 200 },
        },
      },
      network: {
        totalMembers: 0,
        activeMembers: 0,
        directsActive: 0,
        totalVolume: '0.00',
      },
      bonuses: {
        direct: '0.00',
        infinite: '0.00',
        matching: '0.00',
        global: '0.00',
        total: '0.00',
      },
    };
  });

  // GET /api/network/bonuses — historico de bonus da rede
  app.get('/bonuses', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar bonuses do creator

    return { bonuses: [], total: 0 };
  });
}
