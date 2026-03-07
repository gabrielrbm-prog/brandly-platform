import type { FastifyInstance } from 'fastify';

export async function saleRoutes(app: FastifyInstance) {
  // POST /api/sales — registrar venda
  app.post('/', async (request, reply) => {
    // TODO: registrar venda + disparar calculo de bonus
    return { message: 'not implemented' };
  });

  // GET /api/sales — listar vendas
  app.get('/', async (request, reply) => {
    // TODO: implementar com filtros
    return { sales: [], total: 0 };
  });
}
