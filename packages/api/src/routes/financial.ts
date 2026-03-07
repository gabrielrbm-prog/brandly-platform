import type { FastifyInstance } from 'fastify';

interface WithdrawBody {
  amount: number;
  pixKey: string;
}

interface HistoryQuery {
  type?: string;    // video, commission, bonus
  period?: string;  // YYYY-MM
  page?: number;
  limit?: number;
}

export async function financialRoutes(app: FastifyInstance) {
  // GET /api/financial/balance — saldo atual do creator
  app.get('/balance', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: somar todos os payments approved - withdrawals completed

    return {
      available: '0.00',       // disponivel para saque
      pending: '0.00',         // aguardando aprovacao
      withdrawn: '0.00',       // total ja sacado
      totalEarned: '0.00',     // total ganho historico
    };
  });

  // GET /api/financial/earnings — detalhamento por tipo
  app.get('/earnings', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: agregar por tipo (video, commission, bonus)

    return {
      period: new Date().toISOString().slice(0, 7), // YYYY-MM atual
      breakdown: {
        videos: {
          total: '0.00',
          count: 0,
          label: 'Pagamento por videos aprovados (R$10/video)',
        },
        commissions: {
          total: '0.00',
          count: 0,
          label: 'Comissoes por vendas via link/cupom',
        },
        bonuses: {
          total: '0.00',
          count: 0,
          label: 'Bonus de rede (indicacoes)',
        },
      },
      grandTotal: '0.00',
    };
  });

  // GET /api/financial/history — historico de pagamentos
  app.get<{ Querystring: HistoryQuery }>('/history', async (request, reply) => {
    const { type, period, page = 1, limit = 50 } = request.query;

    // TODO: extrair creatorId do JWT
    // TODO: buscar payments com filtros

    return {
      payments: [],
      total: 0,
      page,
      limit,
      filters: { type, period },
    };
  });

  // GET /api/financial/daily-extract — extrato diario (cada video aprovado)
  app.get('/daily-extract', async (request, reply) => {
    const today = new Date().toISOString().split('T')[0];

    // TODO: extrair creatorId do JWT
    // TODO: buscar payments do tipo 'video' do dia

    return {
      date: today,
      entries: [],
      total: '0.00',
      videosApproved: 0,
      maxDaily: '100.00',
    };
  });

  // POST /api/financial/withdraw — solicitar saque
  app.post<{ Body: WithdrawBody }>('/withdraw', async (request, reply) => {
    const { amount, pixKey } = request.body;

    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: 'amount deve ser maior que zero' });
    }

    if (!pixKey) {
      return reply.status(400).send({ error: 'pixKey e obrigatorio' });
    }

    // TODO: extrair creatorId do JWT
    // TODO: verificar saldo disponivel >= amount
    // TODO: criar withdrawal com status 'requested'
    // TODO: marcar payments correspondentes como 'withdrawn'

    return reply.status(201).send({
      withdrawal: {
        id: 'generated-uuid',
        amount: amount.toFixed(2),
        pixKey,
        status: 'requested',
        createdAt: new Date().toISOString(),
      },
      message: 'Saque solicitado. Processamento em ate 24h uteis.',
    });
  });

  // GET /api/financial/withdrawals — historico de saques
  app.get('/withdrawals', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar withdrawals do creator

    return {
      withdrawals: [],
      total: 0,
    };
  });

  // GET /api/financial/tracking-links — links/cupons do creator
  app.get('/tracking-links', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar tracking_links com dados de produto

    return {
      links: [],
      total: 0,
    };
  });
}
