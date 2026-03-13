import type { FastifyInstance } from 'fastify';
import type {
  CampaignStatus,
  CampaignCreateInput,
  CampaignUpdateInput,
  CampaignAnalytics,
} from '@brandly/shared';

// ============================================
// INTERFACES
// ============================================

interface CampaignQuery {
  status?: CampaignStatus;
  brandId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface AssignCreatorsBody {
  creatorIds: string[];
}

interface ChangeStatusBody {
  status: CampaignStatus;
}

// ============================================
// MOCK DATA
// ============================================

const mockCampaigns = [
  {
    id: 'camp-001',
    brandId: 'brand-yav',
    brandName: 'Yav Health',
    name: 'Lancamento Serum Vitamina C - Marco 2026',
    description: 'Campanha de lancamento do novo serum de vitamina C com foco em skincare routine.',
    budget: 50_000,
    spent: 23_450,
    targetVideos: 200,
    completedVideos: 89,
    status: 'active' as CampaignStatus,
    briefing: 'Mostrar o produto na rotina diaria. Tom casual e autentico. Destacar textura, absorcao rapida e resultados em 7 dias. CTA: link na bio.',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    creatorsAssigned: 25,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-03-12T15:30:00Z',
  },
  {
    id: 'camp-002',
    brandId: 'brand-native',
    brandName: 'Native',
    name: 'Kit Skincare Completo - Primavera',
    description: 'Campanha para promover o kit completo de skincare com 5 produtos.',
    budget: 80_000,
    spent: 12_800,
    targetVideos: 350,
    completedVideos: 45,
    status: 'active' as CampaignStatus,
    briefing: 'Mostrar todos os 5 produtos do kit em uma rotina completa. Antes e depois e obrigatorio. Minimo 30 segundos.',
    startDate: '2026-03-10',
    endDate: '2026-04-10',
    creatorsAssigned: 40,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-12T18:00:00Z',
  },
  {
    id: 'camp-003',
    brandId: 'brand-foka',
    brandName: 'Foka',
    name: 'Proteina Vegana - Verao Fitness',
    description: 'Campanha de proteina vegana focada no publico fitness.',
    budget: 35_000,
    spent: 35_000,
    targetVideos: 150,
    completedVideos: 150,
    status: 'completed' as CampaignStatus,
    briefing: 'Mostrar receitas ou shake com a proteina. Destacar sabor e beneficios. Tom motivacional.',
    startDate: '2026-01-15',
    endDate: '2026-02-28',
    creatorsAssigned: 18,
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-02-28T23:59:00Z',
  },
  {
    id: 'camp-004',
    brandId: 'brand-etf',
    brandName: 'ETF',
    name: 'Moda Verao 2026 - Colecao Praia',
    description: 'Campanha para a nova colecao de moda praia.',
    budget: 25_000,
    spent: 0,
    targetVideos: 100,
    completedVideos: 0,
    status: 'draft' as CampaignStatus,
    briefing: 'Look do dia com pecas da colecao. Cenario praia ou piscina. Tom lifestyle aspiracional.',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    creatorsAssigned: 0,
    createdAt: '2026-03-12T14:00:00Z',
    updatedAt: '2026-03-12T14:00:00Z',
  },
];

const mockCampaignVideos = [
  {
    id: 'cv-001',
    campaignId: 'camp-001',
    videoId: 'vid-001',
    creatorName: 'Carolina Silva',
    platform: 'tiktok',
    status: 'approved',
    views: 34_200,
    likes: 2_890,
    externalUrl: 'https://tiktok.com/@carolinasilva/video/001',
    submittedAt: '2026-03-10T14:30:00Z',
    reviewedAt: '2026-03-10T16:00:00Z',
  },
  {
    id: 'cv-002',
    campaignId: 'camp-001',
    videoId: 'vid-002',
    creatorName: 'Marina Santos',
    platform: 'instagram',
    status: 'pending',
    views: 0,
    likes: 0,
    externalUrl: 'https://instagram.com/p/abc123',
    submittedAt: '2026-03-12T10:15:00Z',
    reviewedAt: null,
  },
  {
    id: 'cv-003',
    campaignId: 'camp-001',
    videoId: 'vid-003',
    creatorName: 'Juliana Costa',
    platform: 'tiktok',
    status: 'rejected',
    views: 0,
    likes: 0,
    externalUrl: 'https://tiktok.com/@julianacosta/video/003',
    submittedAt: '2026-03-11T09:00:00Z',
    reviewedAt: '2026-03-11T11:30:00Z',
  },
];

// ============================================
// SCHEMAS
// ============================================

const createCampaignSchema = {
  body: {
    type: 'object' as const,
    required: ['name', 'brandId', 'budget', 'targetVideos', 'startDate', 'endDate'],
    properties: {
      name: { type: 'string' as const, minLength: 3 },
      brandId: { type: 'string' as const },
      description: { type: 'string' as const },
      budget: { type: 'number' as const, minimum: 0 },
      targetVideos: { type: 'integer' as const, minimum: 1 },
      briefing: { type: 'string' as const },
      startDate: { type: 'string' as const, format: 'date' },
      endDate: { type: 'string' as const, format: 'date' },
    },
  },
};

const updateCampaignSchema = {
  body: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const, minLength: 3 },
      description: { type: 'string' as const },
      budget: { type: 'number' as const, minimum: 0 },
      targetVideos: { type: 'integer' as const, minimum: 1 },
      briefing: { type: 'string' as const },
      startDate: { type: 'string' as const, format: 'date' },
      endDate: { type: 'string' as const, format: 'date' },
    },
  },
};

const assignCreatorsSchema = {
  body: {
    type: 'object' as const,
    required: ['creatorIds'],
    properties: {
      creatorIds: {
        type: 'array' as const,
        items: { type: 'string' as const },
        minItems: 1,
      },
    },
  },
};

const changeStatusSchema = {
  body: {
    type: 'object' as const,
    required: ['status'],
    properties: {
      status: {
        type: 'string' as const,
        enum: ['draft', 'active', 'paused', 'completed'],
      },
    },
  },
};

// ============================================
// ROUTES
// ============================================

export async function campaignRoutes(app: FastifyInstance) {
  // GET /api/campaigns — List campaigns
  app.get<{ Querystring: CampaignQuery }>('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { status, brandId, startDate, endDate, page = 1, limit = 20 } = request.query;

    let filtered = [...mockCampaigns];

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    if (brandId) {
      filtered = filtered.filter(c => c.brandId === brandId);
    }
    if (startDate) {
      filtered = filtered.filter(c => c.startDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(c => c.endDate <= endDate);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      campaigns: paginated,
      total,
      page,
      limit,
      summary: {
        totalBudget: filtered.reduce((sum, c) => sum + c.budget, 0),
        totalSpent: filtered.reduce((sum, c) => sum + c.spent, 0),
        totalTargetVideos: filtered.reduce((sum, c) => sum + c.targetVideos, 0),
        totalCompletedVideos: filtered.reduce((sum, c) => sum + c.completedVideos, 0),
      },
    };
  });

  // POST /api/campaigns — Create campaign
  app.post<{ Body: CampaignCreateInput }>('/', {
    schema: createCampaignSchema,
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { name, brandId, description, budget, targetVideos, briefing, startDate, endDate } = request.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return reply.status(400).send({ error: 'endDate deve ser posterior a startDate' });
    }

    const newCampaign = {
      id: `camp-${Date.now()}`,
      brandId,
      brandName: 'Marca Parceira',
      name,
      description: description ?? null,
      budget,
      spent: 0,
      targetVideos,
      completedVideos: 0,
      status: 'draft' as CampaignStatus,
      briefing: briefing ?? null,
      startDate,
      endDate,
      creatorsAssigned: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return reply.status(201).send({
      campaign: newCampaign,
      message: 'Campanha criada com sucesso! Status: rascunho.',
    });
  });

  // GET /api/campaigns/:id — Campaign detail
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const campaign = mockCampaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.status(404).send({ error: 'Campanha nao encontrada' });
    }

    return {
      campaign,
      stats: {
        videosApproved: Math.floor(campaign.completedVideos * 0.85),
        videosPending: Math.floor(campaign.completedVideos * 0.10),
        videosRejected: Math.floor(campaign.completedVideos * 0.05),
        totalViews: campaign.completedVideos * 12_400,
        totalEngagement: campaign.completedVideos * 1_050,
        costPerVideo: campaign.spent / Math.max(campaign.completedVideos, 1),
        progressPercent: Math.round((campaign.completedVideos / campaign.targetVideos) * 100),
      },
    };
  });

  // PUT /api/campaigns/:id — Update campaign
  app.put<{ Params: { id: string }; Body: CampaignUpdateInput }>('/:id', {
    schema: updateCampaignSchema,
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const campaign = mockCampaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.status(404).send({ error: 'Campanha nao encontrada' });
    }

    if (campaign.status === 'completed') {
      return reply.status(400).send({ error: 'Nao e possivel editar uma campanha finalizada' });
    }

    const updatedCampaign = {
      ...campaign,
      ...request.body,
      updatedAt: new Date().toISOString(),
    };

    return {
      campaign: updatedCampaign,
      message: 'Campanha atualizada com sucesso!',
    };
  });

  // POST /api/campaigns/:id/assign — Assign creators
  app.post<{ Params: { id: string }; Body: AssignCreatorsBody }>('/:id/assign', {
    schema: assignCreatorsSchema,
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { creatorIds } = request.body;
    const campaign = mockCampaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.status(404).send({ error: 'Campanha nao encontrada' });
    }

    if (campaign.status === 'completed') {
      return reply.status(400).send({ error: 'Nao e possivel atribuir creators a uma campanha finalizada' });
    }

    const assignments = creatorIds.map(creatorId => ({
      campaignId: id,
      creatorId,
      status: 'invited',
      assignedAt: new Date().toISOString(),
    }));

    return reply.status(201).send({
      assignments,
      message: `${creatorIds.length} creator(s) atribuido(s) a campanha.`,
      totalCreators: campaign.creatorsAssigned + creatorIds.length,
    });
  });

  // GET /api/campaigns/:id/videos — Campaign videos
  app.get<{ Params: { id: string }; Querystring: { status?: string; page?: number; limit?: number } }>(
    '/:id/videos',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { status, page = 1, limit = 20 } = request.query;
      const campaign = mockCampaigns.find(c => c.id === id);

      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' });
      }

      let videos = mockCampaignVideos.filter(v => v.campaignId === id);
      if (status) {
        videos = videos.filter(v => v.status === status);
      }

      const total = videos.length;
      const start = (page - 1) * limit;
      const paginated = videos.slice(start, start + limit);

      return {
        videos: paginated,
        total,
        page,
        limit,
      };
    },
  );

  // GET /api/campaigns/:id/analytics — Campaign analytics
  app.get<{ Params: { id: string } }>('/:id/analytics', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const campaign = mockCampaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.status(404).send({ error: 'Campanha nao encontrada' });
    }

    const analytics: CampaignAnalytics = {
      campaignId: id,
      totalVideos: campaign.completedVideos,
      approvedVideos: Math.floor(campaign.completedVideos * 0.85),
      totalViews: campaign.completedVideos * 12_400,
      totalEngagement: campaign.completedVideos * 1_050,
      totalConversions: Math.floor(campaign.completedVideos * 2.3),
      totalRevenue: Math.floor(campaign.completedVideos * 2.3) * 120,
      roi: campaign.spent > 0
        ? Number(((Math.floor(campaign.completedVideos * 2.3) * 120 - campaign.spent) / campaign.spent * 100).toFixed(2))
        : 0,
    };

    return {
      analytics,
      dailyBreakdown: [
        { date: '2026-03-12', videos: 8, views: 98_400, conversions: 18, revenue: 2_160 },
        { date: '2026-03-11', videos: 12, views: 156_200, conversions: 28, revenue: 3_360 },
        { date: '2026-03-10', videos: 10, views: 124_000, conversions: 23, revenue: 2_760 },
        { date: '2026-03-09', videos: 7, views: 89_600, conversions: 16, revenue: 1_920 },
        { date: '2026-03-08', videos: 11, views: 143_000, conversions: 25, revenue: 3_000 },
      ],
      topCreators: [
        { creatorName: 'Carolina Silva', videos: 15, views: 245_000, conversions: 56 },
        { creatorName: 'Marina Santos', videos: 12, views: 189_000, conversions: 42 },
        { creatorName: 'Juliana Costa', videos: 10, views: 134_000, conversions: 31 },
      ],
    };
  });

  // PUT /api/campaigns/:id/status — Change campaign status
  app.put<{ Params: { id: string }; Body: ChangeStatusBody }>('/:id/status', {
    schema: changeStatusSchema,
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;
    const campaign = mockCampaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.status(404).send({ error: 'Campanha nao encontrada' });
    }

    // Validate status transitions
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      draft: ['active'],
      active: ['paused', 'completed'],
      paused: ['active', 'completed'],
      completed: [],
    };

    if (!validTransitions[campaign.status].includes(status)) {
      return reply.status(400).send({
        error: `Transicao invalida: ${campaign.status} -> ${status}`,
        validTransitions: validTransitions[campaign.status],
      });
    }

    return {
      campaign: {
        ...campaign,
        status,
        updatedAt: new Date().toISOString(),
      },
      message: `Status da campanha alterado para "${status}".`,
      previousStatus: campaign.status,
    };
  });
}
