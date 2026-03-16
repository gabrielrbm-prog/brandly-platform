import type { FastifyInstance } from 'fastify';
import type {
  TikTokConnectInput,
  InstagramConnectInput,
  TikTokMetrics,
  TikTokShopProduct,
  TikTokOrder,
  InstagramMetrics,
  ContentGenerationInput,
  ContentGenerationOutput,
  VideoAnalysisInput,
  VideoAnalysisOutput,
  WebhookPayload,
} from '@brandly/shared';
import {
  generateCaption,
  generateHashtags,
  analyzeVideoContent,
} from '@brandly/core';

// ============================================
// MOCK DATA — Brazilian market context
// ============================================

const mockTikTokMetrics: TikTokMetrics = {
  followers: 45_200,
  following: 892,
  totalViews: 2_340_000,
  totalLikes: 189_500,
  engagementRate: 8.12,
  averageViews: 12_400,
  recentVideos: [
    {
      videoId: 'tt-001',
      title: 'Review Serum Vitamina C - Yav Health',
      views: 34_200,
      likes: 2_890,
      comments: 312,
      shares: 89,
      createdAt: '2026-03-12T14:30:00Z',
    },
    {
      videoId: 'tt-002',
      title: 'Rotina matinal com produtos Native',
      views: 28_100,
      likes: 2_100,
      comments: 198,
      shares: 67,
      createdAt: '2026-03-11T10:15:00Z',
    },
    {
      videoId: 'tt-003',
      title: 'Unboxing Kit Creator Brandly',
      views: 56_300,
      likes: 5_420,
      comments: 567,
      shares: 234,
      createdAt: '2026-03-10T16:45:00Z',
    },
  ],
};

const mockTikTokProducts: TikTokShopProduct[] = [
  {
    productId: 'tts-001',
    name: 'Serum Vitamina C Yav Health',
    price: 89.90,
    salesCount: 342,
    revenue: 30_745.80,
    status: 'active',
    imageUrl: 'https://cdn.brandly.com/products/serum-vitc.jpg',
  },
  {
    productId: 'tts-002',
    name: 'Kit Skincare Completo Native',
    price: 199.90,
    salesCount: 178,
    revenue: 35_582.20,
    status: 'active',
    imageUrl: 'https://cdn.brandly.com/products/kit-native.jpg',
  },
  {
    productId: 'tts-003',
    name: 'Proteina Vegana Foka 900g',
    price: 149.90,
    salesCount: 256,
    revenue: 38_374.40,
    status: 'active',
    imageUrl: 'https://cdn.brandly.com/products/proteina-foka.jpg',
  },
];

const mockTikTokOrders: TikTokOrder[] = [
  {
    orderId: 'ord-001',
    productName: 'Serum Vitamina C Yav Health',
    amount: 89.90,
    commission: 17.98,
    status: 'delivered',
    createdAt: '2026-03-12T18:30:00Z',
    buyerCity: 'Sao Paulo, SP',
  },
  {
    orderId: 'ord-002',
    productName: 'Kit Skincare Completo Native',
    amount: 199.90,
    commission: 39.98,
    status: 'shipped',
    createdAt: '2026-03-12T15:22:00Z',
    buyerCity: 'Rio de Janeiro, RJ',
  },
  {
    orderId: 'ord-003',
    productName: 'Proteina Vegana Foka 900g',
    amount: 149.90,
    commission: 29.98,
    status: 'processing',
    createdAt: '2026-03-12T12:10:00Z',
    buyerCity: 'Belo Horizonte, MG',
  },
  {
    orderId: 'ord-004',
    productName: 'Serum Vitamina C Yav Health',
    amount: 89.90,
    commission: 17.98,
    status: 'delivered',
    createdAt: '2026-03-11T20:45:00Z',
    buyerCity: 'Curitiba, PR',
  },
  {
    orderId: 'ord-005',
    productName: 'Kit Skincare Completo Native',
    amount: 199.90,
    commission: 39.98,
    status: 'delivered',
    createdAt: '2026-03-11T09:30:00Z',
    buyerCity: 'Salvador, BA',
  },
];

const mockInstagramMetrics: InstagramMetrics = {
  followers: 32_800,
  following: 645,
  totalPosts: 412,
  engagementRate: 5.8,
  averageReach: 8_900,
  averageLikes: 1_204,
  recentPosts: [
    {
      postId: 'ig-001',
      type: 'reel',
      caption: 'Minha rotina de skincare com Yav Health ✨',
      likes: 2_340,
      comments: 156,
      reach: 18_900,
      saves: 342,
      createdAt: '2026-03-12T12:00:00Z',
    },
    {
      postId: 'ig-002',
      type: 'carousel',
      caption: 'Antes e depois: 30 dias usando o kit Native',
      likes: 3_100,
      comments: 287,
      reach: 24_500,
      saves: 567,
      createdAt: '2026-03-11T15:30:00Z',
    },
    {
      postId: 'ig-003',
      type: 'video',
      caption: 'Como eu ganho R$100/dia fazendo videos curtos',
      likes: 4_560,
      comments: 432,
      reach: 35_200,
      saves: 890,
      createdAt: '2026-03-10T09:00:00Z',
    },
  ],
};

// ============================================
// ROUTE SCHEMAS
// ============================================

const tiktokConnectSchema = {
  body: {
    type: 'object' as const,
    required: ['authCode', 'redirectUri'],
    properties: {
      authCode: { type: 'string' as const },
      redirectUri: { type: 'string' as const, format: 'uri' },
    },
  },
};

const instagramConnectSchema = {
  body: {
    type: 'object' as const,
    required: ['authCode', 'redirectUri'],
    properties: {
      authCode: { type: 'string' as const },
      redirectUri: { type: 'string' as const, format: 'uri' },
    },
  },
};

const generateScriptSchema = {
  body: {
    type: 'object' as const,
    required: ['brandName', 'productName'],
    properties: {
      brandName: { type: 'string' as const },
      productName: { type: 'string' as const },
      tone: { type: 'string' as const },
      platform: { type: 'string' as const },
      briefing: { type: 'string' as const },
    },
  },
};

const generateCaptionSchema = {
  body: {
    type: 'object' as const,
    required: ['brandName', 'productName'],
    properties: {
      brandName: { type: 'string' as const },
      productName: { type: 'string' as const },
      tone: { type: 'string' as const },
      platform: { type: 'string' as const },
    },
  },
};

const generateHashtagsSchema = {
  body: {
    type: 'object' as const,
    required: ['brandName', 'productName'],
    properties: {
      brandName: { type: 'string' as const },
      productName: { type: 'string' as const },
      platform: { type: 'string' as const },
    },
  },
};

const analyzeVideoSchema = {
  body: {
    type: 'object' as const,
    required: ['videoUrl', 'platform'],
    properties: {
      videoUrl: { type: 'string' as const, format: 'uri' },
      platform: { type: 'string' as const, enum: ['tiktok', 'instagram', 'youtube'] },
    },
  },
};

// ============================================
// ROUTES
// ============================================

export async function integrationRoutes(app: FastifyInstance) {
  // ---- TikTok Integration ----

  // POST /api/integrations/tiktok/connect
  app.post<{ Body: TikTokConnectInput }>('/tiktok/connect', {
    schema: tiktokConnectSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { authCode, redirectUri } = request.body;
    const { userId } = request.user;

    if (!authCode || !redirectUri) {
      return reply.status(400).send({ error: 'authCode e redirectUri sao obrigatorios' });
    }

    // Mock: In production, exchange authCode for access_token via TikTok OAuth
    return reply.status(201).send({
      message: 'Conta TikTok conectada com sucesso!',
      integration: {
        id: 'int-tiktok-001',
        userId,
        provider: 'tiktok',
        providerUserId: 'tiktok_user_12345',
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  });

  // GET /api/integrations/tiktok/metrics
  app.get('/tiktok/metrics', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    return {
      metrics: mockTikTokMetrics,
      lastUpdated: new Date().toISOString(),
    };
  });

  // GET /api/integrations/tiktok/products
  app.get('/tiktok/products', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    return {
      products: mockTikTokProducts,
      total: mockTikTokProducts.length,
    };
  });

  // GET /api/integrations/tiktok/orders
  app.get<{ Querystring: { page?: number; limit?: number } }>('/tiktok/orders', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query;
    const start = (page - 1) * limit;
    const paginatedOrders = mockTikTokOrders.slice(start, start + limit);

    return {
      orders: paginatedOrders,
      total: mockTikTokOrders.length,
      page,
      limit,
      totalRevenue: mockTikTokOrders.reduce((sum, o) => sum + o.amount, 0),
      totalCommission: mockTikTokOrders.reduce((sum, o) => sum + o.commission, 0),
    };
  });

  // ---- Instagram Integration ----

  // POST /api/integrations/instagram/connect
  app.post<{ Body: InstagramConnectInput }>('/instagram/connect', {
    schema: instagramConnectSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { authCode, redirectUri } = request.body;
    const { userId } = request.user;

    if (!authCode || !redirectUri) {
      return reply.status(400).send({ error: 'authCode e redirectUri sao obrigatorios' });
    }

    return reply.status(201).send({
      message: 'Conta Instagram conectada com sucesso!',
      integration: {
        id: 'int-ig-001',
        userId,
        provider: 'instagram',
        providerUserId: 'ig_user_67890',
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  });

  // GET /api/integrations/instagram/metrics
  app.get('/instagram/metrics', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    return {
      metrics: mockInstagramMetrics,
      lastUpdated: new Date().toISOString(),
    };
  });

  // GET /api/integrations/instagram/content
  app.get<{ Querystring: { limit?: number } }>('/instagram/content', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { limit = 10 } = request.query;
    const posts = mockInstagramMetrics.recentPosts.slice(0, limit);

    return {
      posts,
      total: mockInstagramMetrics.recentPosts.length,
      summary: {
        totalReach: posts.reduce((sum, p) => sum + p.reach, 0),
        totalLikes: posts.reduce((sum, p) => sum + p.likes, 0),
        totalComments: posts.reduce((sum, p) => sum + p.comments, 0),
        totalSaves: posts.reduce((sum, p) => sum + p.saves, 0),
        averageEngagementRate: mockInstagramMetrics.engagementRate,
      },
    };
  });

  // ---- Webhook Receivers ----

  // POST /api/integrations/webhooks/tiktok
  app.post<{ Body: WebhookPayload }>('/webhooks/tiktok', async (request, reply) => {
    const { event, data, timestamp, signature } = request.body;

    if (!event || !data || !signature) {
      return reply.status(400).send({ error: 'Payload invalido: event, data e signature sao obrigatorios' });
    }

    // Mock: In production, verify HMAC signature
    app.log.info({ event, timestamp }, 'TikTok webhook recebido');

    switch (event) {
      case 'order.created':
      case 'order.updated':
      case 'order.completed':
      case 'order.cancelled':
        // Process order event
        app.log.info({ orderId: data.orderId, status: data.status }, 'Ordem TikTok processada');
        break;
      default:
        app.log.warn({ event }, 'Evento TikTok desconhecido');
    }

    return reply.status(200).send({ received: true, event });
  });

  // POST /api/integrations/webhooks/payment
  app.post<{ Body: WebhookPayload }>('/webhooks/payment', async (request, reply) => {
    const { event, data, timestamp, signature } = request.body;

    if (!event || !data || !signature) {
      return reply.status(400).send({ error: 'Payload invalido: event, data e signature sao obrigatorios' });
    }

    app.log.info({ event, timestamp }, 'Payment webhook recebido');

    switch (event) {
      case 'payment.approved':
        app.log.info({ paymentId: data.paymentId, amount: data.amount }, 'Pagamento aprovado');
        break;
      case 'payment.refunded':
        app.log.info({ paymentId: data.paymentId }, 'Pagamento estornado');
        break;
      case 'withdrawal.completed':
        app.log.info({ withdrawalId: data.withdrawalId }, 'Saque processado');
        break;
      default:
        app.log.warn({ event }, 'Evento de pagamento desconhecido');
    }

    return reply.status(200).send({ received: true, event });
  });

  // ---- Content API ----

  // POST /api/integrations/content/generate-script
  app.post<{ Body: ContentGenerationInput }>('/content/generate-script', {
    schema: generateScriptSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { brandName, productName, tone = 'casual', platform = 'tiktok', briefing } = request.body;

    // Mock: In production, calls Claude/GPT API
    const mockOutput: ContentGenerationOutput = {
      id: `gen-script-${Date.now()}`,
      type: 'script',
      content: [
        `[GANCHO] Voce sabia que ${productName} da ${brandName} ta bombando no TikTok? Eu testei por 30 dias e olha o resultado...`,
        `[CORPO] Entao gente, eu comecei a usar o ${productName} ha um mes atras porque vi varios creators falando. A textura e incrivel, o resultado aparece rapido e o preco e super justo. O que mais me surpreendeu foi ${briefing ? 'exatamente o que o briefing fala: ' + briefing : 'a qualidade do produto'}.`,
        `[CTA] Link na bio com desconto exclusivo! Corre que e por tempo limitado. Comenta "EU QUERO" que eu te mando o link direto!`,
      ],
      provider: 'claude',
      tokensUsed: 342,
      createdAt: new Date().toISOString(),
    };

    return reply.status(201).send({
      generation: mockOutput,
      message: 'Roteiro gerado com sucesso!',
      tip: 'Lembre-se: 3 ganchos x 3 corpos x 3 CTAs = 27 combinacoes possiveis.',
    });
  });

  // POST /api/integrations/content/generate-caption
  app.post<{ Body: ContentGenerationInput }>('/content/generate-caption', {
    schema: generateCaptionSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { brandName, productName, tone = 'casual', platform = 'instagram' } = request.body;

    try {
      // Chama o servico real (com fallback para mock se a chave nao estiver configurada)
      const result = await generateCaption({
        brandName,
        productName,
        tone,
        platform: platform as 'instagram' | 'tiktok',
      });

      const output: ContentGenerationOutput = {
        id: `gen-caption-${Date.now()}`,
        type: 'caption',
        // Combina caption + hashtags em um unico campo de conteudo
        content: `${result.caption}\n\n${result.hashtags.join(' ')}`,
        provider: 'claude',
        tokensUsed: result.tokensUsed,
        createdAt: new Date().toISOString(),
      };

      return reply.status(201).send({
        generation: output,
        caption: result.caption,
        hashtags: result.hashtags,
        message: 'Caption gerada com sucesso!',
        aiPowered: result.tokensUsed > 0,
      });
    } catch (err) {
      app.log.error({ err, brandName, productName }, 'Erro ao gerar caption com IA');
      return reply.status(500).send({
        error: 'Falha ao gerar caption',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  });

  // POST /api/integrations/content/generate-hashtags
  app.post<{ Body: ContentGenerationInput }>('/content/generate-hashtags', {
    schema: generateHashtagsSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { brandName, productName, platform = 'tiktok' } = request.body;

    try {
      // Chama o servico real (com fallback para mock se a chave nao estiver configurada)
      const result = await generateHashtags({
        brandName,
        productName,
        platform: platform as 'instagram' | 'tiktok',
      });

      const output: ContentGenerationOutput = {
        id: `gen-hashtags-${Date.now()}`,
        type: 'hashtags',
        content: result.hashtags,
        provider: 'claude',
        tokensUsed: result.tokensUsed,
        createdAt: new Date().toISOString(),
      };

      return reply.status(201).send({
        generation: output,
        hashtags: result.hashtags,
        message: `${result.hashtags.length} hashtags geradas para ${platform}!`,
        aiPowered: result.tokensUsed > 0,
      });
    } catch (err) {
      app.log.error({ err, brandName, productName }, 'Erro ao gerar hashtags com IA');
      return reply.status(500).send({
        error: 'Falha ao gerar hashtags',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  });

  // POST /api/integrations/content/analyze-video
  app.post<{ Body: VideoAnalysisInput & { briefingContext?: string } }>('/content/analyze-video', {
    schema: analyzeVideoSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { videoUrl, platform, briefingContext } = request.body as VideoAnalysisInput & { briefingContext?: string };

    try {
      // Chama o servico real (com fallback para mock se a chave nao estiver configurada)
      const result = await analyzeVideoContent({
        videoUrl,
        platform: platform as 'tiktok' | 'instagram' | 'youtube',
        briefingContext,
      });

      // Monta resposta compativel com VideoAnalysisOutput do shared + campos extras da IA
      const analysis: VideoAnalysisOutput = {
        id: `analysis-${Date.now()}`,
        // Campos de metricas reais nao estao disponiveis via analise de URL — retornam 0
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagementRate: 0,
        estimatedReach: 0,
        sentiment: result.score >= 70 ? 'positive' : result.score >= 40 ? 'neutral' : 'negative',
        topCommentThemes: [],
        recommendations: result.recommendations,
      };

      return reply.status(200).send({
        analysis,
        videoUrl,
        platform,
        score: result.score,
        briefingCompliance: result.briefingCompliance,
        recommendations: result.recommendations,
        tokensUsed: result.tokensUsed,
        aiPowered: result.tokensUsed > 0,
        message: 'Analise concluida com sucesso!',
      });
    } catch (err) {
      app.log.error({ err, videoUrl, platform }, 'Erro ao analisar video com IA');
      return reply.status(500).send({
        error: 'Falha ao analisar video',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  });
}
