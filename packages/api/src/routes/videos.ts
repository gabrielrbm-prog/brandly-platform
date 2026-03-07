import type { FastifyInstance } from 'fastify';

export async function videoRoutes(app: FastifyInstance) {
  // POST /api/videos — submeter video para aprovacao
  app.post('/', async (request, reply) => {
    // TODO: receber video, validar, salvar
    return { message: 'not implemented' };
  });

  // GET /api/videos — listar videos do creator
  app.get('/', async (request, reply) => {
    // TODO: implementar com filtros (status, creator, data)
    return { videos: [], total: 0 };
  });

  // PATCH /api/videos/:id/review — aprovar/rejeitar video
  app.patch<{ Params: { id: string } }>('/:id/review', async (request, reply) => {
    const { id } = request.params;
    // TODO: aprovar ou rejeitar + calcular pagamento
    return { id, message: 'not implemented' };
  });
}
