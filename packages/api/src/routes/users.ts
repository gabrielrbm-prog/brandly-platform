import type { FastifyInstance } from 'fastify';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/users — lista creators
  app.get('/', async (request, reply) => {
    // TODO: implementar com @brandly/core
    return { users: [], total: 0 };
  });

  // GET /api/users/:id — detalhes do creator
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    // TODO: implementar com @brandly/core
    return { id, message: 'not implemented' };
  });

  // GET /api/users/:id/network — rede do creator
  app.get<{ Params: { id: string } }>('/:id/network', async (request, reply) => {
    const { id } = request.params;
    // TODO: implementar arvore de rede
    return { userId: id, upline: [], downline: [] };
  });
}
