import type { FastifyInstance } from 'fastify';

interface SubmitVideoBody {
  brandId: string;
  briefingId: string;
  externalUrl: string;
  platform?: string;
}

interface ReviewVideoBody {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

interface VideoQuery {
  status?: string;
  date?: string;     // YYYY-MM-DD
  brandId?: string;
  page?: number;
  limit?: number;
}

export async function videoRoutes(app: FastifyInstance) {
  // POST /api/videos — submeter video para aprovacao
  app.post<{ Body: SubmitVideoBody }>('/', async (request, reply) => {
    const { brandId, briefingId, externalUrl, platform } = request.body;

    if (!brandId || !briefingId || !externalUrl) {
      return reply.status(400).send({
        error: 'brandId, briefingId e externalUrl sao obrigatorios',
      });
    }

    // Validacao basica de URL
    if (!/^https?:\/\/.+/.test(externalUrl)) {
      return reply.status(400).send({ error: 'externalUrl deve ser uma URL valida' });
    }

    // TODO: extrair creatorId do JWT
    // TODO: verificar se creator esta conectado a marca
    // TODO: verificar se briefing pertence a marca
    // TODO: salvar video no banco com status 'pending'

    return reply.status(201).send({
      video: {
        id: 'generated-uuid',
        brandId,
        briefingId,
        externalUrl,
        platform: platform ?? null,
        status: 'pending',
        paymentAmount: '10.00',
        createdAt: new Date().toISOString(),
      },
      message: 'Video enviado para aprovacao. Prazo: 24-48h.',
    });
  });

  // GET /api/videos — listar videos do creator
  app.get<{ Querystring: VideoQuery }>('/', async (request, reply) => {
    const { status, date, brandId, page = 1, limit = 20 } = request.query;

    // TODO: extrair creatorId do JWT
    // TODO: buscar videos no banco com filtros
    // TODO: contar videos por status para o resumo

    return {
      videos: [],
      total: 0,
      page,
      limit,
      summary: {
        pending: 0,
        approved: 0,
        rejected: 0,
        todayApproved: 0,
        todayPaid: 0,
        todayRemaining: 10, // max 10 por dia
      },
    };
  });

  // GET /api/videos/daily — resumo do dia (videos aprovados/pendentes/pagos)
  app.get('/daily', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar videos do dia atual

    return {
      date: new Date().toISOString().split('T')[0],
      approved: 0,
      pending: 0,
      rejected: 0,
      paid: 0,
      earnings: '0.00',
      maxVideos: 10,
      remaining: 10,
    };
  });

  // PATCH /api/videos/:id/review — aprovar/rejeitar video (admin/marca)
  app.patch<{ Params: { id: string }; Body: ReviewVideoBody }>(
    '/:id/review',
    async (request, reply) => {
      const { id } = request.params;
      const { status, rejectionReason } = request.body;

      if (!['approved', 'rejected'].includes(status)) {
        return reply.status(400).send({ error: 'status deve ser approved ou rejected' });
      }

      if (status === 'rejected' && !rejectionReason) {
        return reply.status(400).send({
          error: 'rejectionReason e obrigatorio quando status = rejected',
        });
      }

      // TODO: verificar se user e admin ou marca dona do video
      // TODO: buscar video no banco
      // TODO: atualizar status e reviewedAt
      // TODO: se approved, calcular pagamento (R$10, max 10/dia)
      // TODO: criar registro em payments
      // TODO: notificar creator

      const isApproved = status === 'approved';

      return {
        video: {
          id,
          status,
          rejectionReason: isApproved ? null : rejectionReason,
          reviewedAt: new Date().toISOString(),
          payment: isApproved
            ? { amount: '10.00', status: 'pending' }
            : null,
        },
        message: isApproved
          ? 'Video aprovado! R$10,00 creditado.'
          : `Video rejeitado: ${rejectionReason}`,
      };
    },
  );

  // POST /api/videos/:id/resubmit — reenviar video rejeitado
  app.post<{ Params: { id: string }; Body: { externalUrl: string } }>(
    '/:id/resubmit',
    async (request, reply) => {
      const { id } = request.params;
      const { externalUrl } = request.body;

      if (!externalUrl) {
        return reply.status(400).send({ error: 'externalUrl e obrigatorio' });
      }

      // TODO: verificar se video pertence ao creator
      // TODO: verificar se status atual e 'rejected'
      // TODO: atualizar url e voltar status para 'pending'

      return {
        video: {
          id,
          externalUrl,
          status: 'pending',
        },
        message: 'Video reenviado para aprovacao.',
      };
    },
  );

  // GET /api/videos/review-queue — fila de revisao (admin)
  app.get('/review-queue', async (request, reply) => {
    // TODO: verificar se user e admin
    // TODO: buscar videos com status 'pending' ordenados por createdAt

    return {
      videos: [],
      total: 0,
    };
  });
}
