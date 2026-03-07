import type { FastifyInstance } from 'fastify';

export async function communityRoutes(app: FastifyInstance) {
  // GET /api/community/ranking — ranking de creators
  app.get('/ranking', async (request, reply) => {
    const { period = 'month', type = 'production' } = request.query as any;

    // TODO: calcular ranking por videos aprovados ou ganhos

    return {
      period,
      type, // production ou earnings
      ranking: [],
      myPosition: 0,
      totalCreators: 0,
    };
  });

  // GET /api/community/lives — agenda de lives
  app.get('/lives', async (request, reply) => {
    // TODO: buscar live_events proximos

    return {
      upcoming: [],
      past: [],
    };
  });

  // GET /api/community/cases — cases de sucesso
  app.get('/cases', async (request, reply) => {
    // TODO: buscar success_cases publicados

    return {
      cases: [],
      total: 0,
    };
  });
}
