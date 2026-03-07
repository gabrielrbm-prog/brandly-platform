import type { FastifyInstance } from 'fastify';

interface BrandQuery {
  category?: string;
  page?: number;
  limit?: number;
}

export async function brandRoutes(app: FastifyInstance) {
  // GET /api/brands — catalogo de marcas
  app.get<{ Querystring: BrandQuery }>('/', async (request, reply) => {
    const { category, page = 1, limit = 20 } = request.query;

    // TODO: buscar brands no banco com filtro de categoria
    // TODO: contar creators conectados vs maxCreators para vagas

    return {
      brands: [],
      total: 0,
      page,
      limit,
      categories: [
        { id: 'beauty', label: 'Beleza e Skincare' },
        { id: 'supplements', label: 'Suplementos e Fitness' },
        { id: 'home', label: 'Casa e Decoracao' },
        { id: 'tech', label: 'Tech e Gadgets' },
        { id: 'fashion', label: 'Moda e Acessorios' },
        { id: 'food', label: 'Alimentos e Bebidas' },
      ],
    };
  });

  // GET /api/brands/:id — detalhes da marca + briefing
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // TODO: buscar marca + briefings ativos + contagem de creators

    return {
      brand: null,
      briefings: [],
      creatorsConnected: 0,
      slotsAvailable: 0,
    };
  });

  // POST /api/brands/:id/connect — creator se vincula a marca
  app.post<{ Params: { id: string } }>('/:id/connect', async (request, reply) => {
    const { id } = request.params;

    // TODO: extrair creatorId do JWT
    // TODO: verificar se marca tem vagas (creators < maxCreators)
    // TODO: verificar se creator ja esta conectado
    // TODO: criar registro em creator_brands
    // TODO: gerar tracking_links para produtos da marca

    return reply.status(201).send({
      message: 'Conectado a marca com sucesso! Voce ja pode comecar a produzir.',
      brandId: id,
      nextStep: 'Acesse os briefings e gere seus roteiros',
    });
  });

  // DELETE /api/brands/:id/disconnect — creator se desvincula
  app.delete<{ Params: { id: string } }>('/:id/disconnect', async (request, reply) => {
    const { id } = request.params;

    // TODO: extrair creatorId do JWT
    // TODO: desativar creator_brands

    return { message: 'Desconectado da marca', brandId: id };
  });

  // GET /api/brands/my — marcas do creator
  app.get('/my', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar creator_brands ativas com dados da marca

    return { brands: [], total: 0 };
  });
}
