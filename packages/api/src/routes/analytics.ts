import type { FastifyInstance } from 'fastify';
import type {
  PlatformOverview,
  CreatorPerformance,
  ContentMetrics,
  RevenueAnalytics,
  TikTokShopAnalytics,
  AudienceInsights,
  TrendingItem,
} from '@brandly/shared';

// ============================================
// MOCK DATA — Brazilian market context
// ============================================

const mockOverview: PlatformOverview = {
  totalCreators: 2_340,
  activeCreators: 1_856,
  totalBrands: 23,
  totalVideos: 45_678,
  approvedVideos: 38_234,
  totalRevenue: 2_345_678.90,
  totalPaidToCreators: 1_567_890.45,
  averageVideosPerCreator: 19.5,
  period: '2026-03',
};

const mockCreatorPerformance: CreatorPerformance[] = [
  {
    creatorId: 'creator-001',
    creatorName: 'Carolina Silva',
    level: 'Iconic',
    totalVideos: 312,
    approvedVideos: 298,
    approvalRate: 95.5,
    totalEarnings: 45_600,
    totalSales: 234,
    networkSize: 18,
    engagementRate: 12.3,
  },
  {
    creatorId: 'creator-002',
    creatorName: 'Marina Santos',
    level: 'Flow',
    totalVideos: 245,
    approvedVideos: 228,
    approvalRate: 93.1,
    totalEarnings: 34_200,
    totalSales: 178,
    networkSize: 12,
    engagementRate: 9.8,
  },
  {
    creatorId: 'creator-003',
    creatorName: 'Juliana Costa',
    level: 'Flow',
    totalVideos: 198,
    approvedVideos: 186,
    approvalRate: 93.9,
    totalEarnings: 28_900,
    totalSales: 145,
    networkSize: 8,
    engagementRate: 8.5,
  },
  {
    creatorId: 'creator-004',
    creatorName: 'Fernanda Oliveira',
    level: 'Spark',
    totalVideos: 167,
    approvedVideos: 152,
    approvalRate: 91.0,
    totalEarnings: 21_300,
    totalSales: 98,
    networkSize: 5,
    engagementRate: 7.2,
  },
  {
    creatorId: 'creator-005',
    creatorName: 'Beatriz Lima',
    level: 'Spark',
    totalVideos: 134,
    approvedVideos: 119,
    approvalRate: 88.8,
    totalEarnings: 16_800,
    totalSales: 67,
    networkSize: 3,
    engagementRate: 6.9,
  },
  {
    creatorId: 'creator-006',
    creatorName: 'Camila Rocha',
    level: 'Seed',
    totalVideos: 89,
    approvedVideos: 78,
    approvalRate: 87.6,
    totalEarnings: 10_200,
    totalSales: 34,
    networkSize: 2,
    engagementRate: 5.4,
  },
];

const mockContentMetrics: ContentMetrics = {
  totalVideos: 45_678,
  approvedVideos: 38_234,
  rejectedVideos: 4_567,
  pendingVideos: 2_877,
  approvalRate: 83.7,
  averageReviewTime: 4.2, // hours
  topPlatforms: [
    { platform: 'TikTok', videos: 28_900, views: 89_000_000, engagement: 7_120_000 },
    { platform: 'Instagram', videos: 12_400, views: 34_500_000, engagement: 2_760_000 },
    { platform: 'YouTube Shorts', videos: 4_378, views: 12_300_000, engagement: 984_000 },
  ],
  topBrands: [
    { brandId: 'brand-yav', brandName: 'Yav Health', videos: 8_900, views: 27_800_000, conversions: 12_340 },
    { brandId: 'brand-native', brandName: 'Native', videos: 7_200, views: 22_100_000, conversions: 9_870 },
    { brandId: 'brand-foka', brandName: 'Foka', videos: 6_500, views: 19_500_000, conversions: 8_450 },
    { brandId: 'brand-etf', brandName: 'ETF', videos: 5_800, views: 16_200_000, conversions: 6_780 },
    { brandId: 'brand-conectar', brandName: 'Conectar Energy', videos: 4_300, views: 11_900_000, conversions: 5_120 },
  ],
};

const mockRevenueAnalytics: RevenueAnalytics = {
  totalRevenue: 2_345_678.90,
  revenueByPeriod: [
    { period: '2026-03', revenue: 456_789.12, orders: 3_456, growth: 18.5 },
    { period: '2026-02', revenue: 385_432.67, orders: 2_890, growth: 12.3 },
    { period: '2026-01', revenue: 343_210.45, orders: 2_567, growth: 8.7 },
    { period: '2025-12', revenue: 315_678.90, orders: 2_345, growth: 15.2 },
    { period: '2025-11', revenue: 274_123.34, orders: 2_012, growth: 6.4 },
    { period: '2025-10', revenue: 257_890.12, orders: 1_890, growth: 4.1 },
  ],
  revenueByBrand: [
    { brandId: 'brand-yav', brandName: 'Yav Health', revenue: 678_900, orders: 7_543, percentage: 28.9 },
    { brandId: 'brand-native', brandName: 'Native', revenue: 534_200, orders: 2_671, percentage: 22.8 },
    { brandId: 'brand-foka', brandName: 'Foka', revenue: 445_300, orders: 2_970, percentage: 19.0 },
    { brandId: 'brand-etf', brandName: 'ETF', revenue: 345_600, orders: 3_456, percentage: 14.7 },
    { brandId: 'brand-conectar', brandName: 'Conectar Energy', revenue: 210_400, orders: 1_403, percentage: 9.0 },
    { brandId: 'brand-vyva', brandName: 'Vyva', revenue: 131_278.90, orders: 875, percentage: 5.6 },
  ],
  revenueByCreator: [
    { creatorId: 'creator-001', creatorName: 'Carolina Silva', revenue: 89_400, commissions: 17_880, videos: 312 },
    { creatorId: 'creator-002', creatorName: 'Marina Santos', revenue: 67_200, commissions: 13_440, videos: 245 },
    { creatorId: 'creator-003', creatorName: 'Juliana Costa', revenue: 54_300, commissions: 10_860, videos: 198 },
    { creatorId: 'creator-004', creatorName: 'Fernanda Oliveira', revenue: 38_900, commissions: 7_780, videos: 167 },
    { creatorId: 'creator-005', creatorName: 'Beatriz Lima', revenue: 28_600, commissions: 5_720, videos: 134 },
  ],
  averageOrderValue: 127.45,
  conversionRate: 3.8,
};

const mockTikTokShopAnalytics: TikTokShopAnalytics = {
  gmv: 1_456_789.50,
  totalOrders: 11_234,
  averageOrderValue: 129.70,
  topProducts: [
    { productId: 'tts-001', productName: 'Serum Vitamina C Yav Health', sales: 3_420, revenue: 307_458, views: 890_000 },
    { productId: 'tts-002', productName: 'Kit Skincare Completo Native', sales: 1_780, revenue: 355_822, views: 567_000 },
    { productId: 'tts-003', productName: 'Proteina Vegana Foka 900g', sales: 2_560, revenue: 383_744, views: 445_000 },
    { productId: 'tts-004', productName: 'Colecao Verao ETF', sales: 1_890, revenue: 189_000, views: 334_000 },
    { productId: 'tts-005', productName: 'Energia Natural Conectar', sales: 1_234, revenue: 98_720, views: 234_000 },
  ],
  dailyGMV: [
    { date: '2026-03-12', gmv: 48_900, orders: 378 },
    { date: '2026-03-11', gmv: 52_300, orders: 403 },
    { date: '2026-03-10', gmv: 45_600, orders: 352 },
    { date: '2026-03-09', gmv: 38_200, orders: 295 },
    { date: '2026-03-08', gmv: 56_100, orders: 433 },
    { date: '2026-03-07', gmv: 43_800, orders: 338 },
    { date: '2026-03-06', gmv: 41_200, orders: 318 },
  ],
  conversionRate: 4.2,
};

const mockAudienceInsights: AudienceInsights = {
  totalReach: 135_800_000,
  demographics: {
    ageGroups: [
      { range: '18-24', percentage: 32.5 },
      { range: '25-34', percentage: 38.2 },
      { range: '35-44', percentage: 18.7 },
      { range: '45-54', percentage: 7.3 },
      { range: '55+', percentage: 3.3 },
    ],
    genderSplit: {
      female: 68.4,
      male: 28.9,
      other: 2.7,
    },
    topCities: [
      { city: 'Sao Paulo', state: 'SP', percentage: 22.3 },
      { city: 'Rio de Janeiro', state: 'RJ', percentage: 14.8 },
      { city: 'Belo Horizonte', state: 'MG', percentage: 8.2 },
      { city: 'Brasilia', state: 'DF', percentage: 6.5 },
      { city: 'Curitiba', state: 'PR', percentage: 5.9 },
      { city: 'Salvador', state: 'BA', percentage: 5.1 },
      { city: 'Fortaleza', state: 'CE', percentage: 4.7 },
      { city: 'Recife', state: 'PE', percentage: 4.2 },
      { city: 'Porto Alegre', state: 'RS', percentage: 3.8 },
      { city: 'Goiania', state: 'GO', percentage: 3.1 },
    ],
    topStates: [
      { state: 'SP', percentage: 28.9 },
      { state: 'RJ', percentage: 16.2 },
      { state: 'MG', percentage: 10.5 },
      { state: 'PR', percentage: 7.3 },
      { state: 'BA', percentage: 6.8 },
      { state: 'RS', percentage: 5.4 },
      { state: 'DF', percentage: 4.9 },
      { state: 'CE', percentage: 4.1 },
      { state: 'PE', percentage: 3.6 },
      { state: 'GO', percentage: 3.2 },
    ],
  },
  interests: [
    { interest: 'Beleza e Skincare', percentage: 42.3 },
    { interest: 'Fitness e Saude', percentage: 28.9 },
    { interest: 'Moda e Estilo', percentage: 24.5 },
    { interest: 'Lifestyle', percentage: 22.1 },
    { interest: 'Alimentacao Saudavel', percentage: 18.7 },
    { interest: 'Empreendedorismo', percentage: 15.3 },
    { interest: 'Tecnologia', percentage: 12.8 },
    { interest: 'Viagens', percentage: 10.4 },
  ],
};

const mockTrends: TrendingItem[] = [
  { type: 'content', name: 'Get Ready With Me + Review', metric: 45_600, growth: 34.5, period: '2026-03' },
  { type: 'content', name: 'Antes e Depois 30 Dias', metric: 38_200, growth: 28.3, period: '2026-03' },
  { type: 'product', name: 'Serum Vitamina C', metric: 12_340, growth: 22.1, period: '2026-03' },
  { type: 'hashtag', name: '#tiktokmademebuythis', metric: 890_000, growth: 18.7, period: '2026-03' },
  { type: 'content', name: 'Rotina Matinal Completa', metric: 29_800, growth: 15.4, period: '2026-03' },
  { type: 'product', name: 'Kit Skincare Coreano', metric: 8_900, growth: 42.3, period: '2026-03' },
  { type: 'hashtag', name: '#creatorbrandly', metric: 234_000, growth: 67.8, period: '2026-03' },
  { type: 'content', name: 'Unboxing + Primeira Impressao', metric: 22_400, growth: 12.9, period: '2026-03' },
  { type: 'product', name: 'Proteina Vegana', metric: 6_780, growth: 19.5, period: '2026-03' },
  { type: 'hashtag', name: '#ugcbrasil', metric: 156_000, growth: 45.2, period: '2026-03' },
];

// ============================================
// ROUTES
// ============================================

export async function analyticsRoutes(app: FastifyInstance) {
  // GET /api/analytics/overview — Platform-wide metrics
  app.get<{ Querystring: { period?: string } }>('/overview', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { period } = request.query;

    return {
      overview: {
        ...mockOverview,
        period: period ?? mockOverview.period,
      },
      highlights: [
        { label: 'Creators ativos este mes', value: mockOverview.activeCreators, change: '+12.3%' },
        { label: 'Videos aprovados', value: mockOverview.approvedVideos, change: '+18.5%' },
        { label: 'Receita total', value: `R$ ${mockOverview.totalRevenue.toLocaleString('pt-BR')}`, change: '+22.1%' },
        { label: 'Pago a creators', value: `R$ ${mockOverview.totalPaidToCreators.toLocaleString('pt-BR')}`, change: '+15.7%' },
      ],
    };
  });

  // GET /api/analytics/creators — Creator performance rankings
  app.get<{ Querystring: { sortBy?: string; order?: string; limit?: number; level?: string } }>('/creators', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { sortBy = 'totalEarnings', order = 'desc', limit = 20, level } = request.query;

    let creators = [...mockCreatorPerformance];

    if (level) {
      creators = creators.filter(c => c.level === level);
    }

    const sortKey = sortBy as keyof CreatorPerformance;
    creators.sort((a, b) => {
      const aVal = a[sortKey] as number;
      const bVal = b[sortKey] as number;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    creators = creators.slice(0, limit);

    return {
      creators,
      total: mockCreatorPerformance.length,
      averages: {
        approvalRate: mockCreatorPerformance.reduce((sum, c) => sum + c.approvalRate, 0) / mockCreatorPerformance.length,
        engagementRate: mockCreatorPerformance.reduce((sum, c) => sum + c.engagementRate, 0) / mockCreatorPerformance.length,
        totalEarnings: mockCreatorPerformance.reduce((sum, c) => sum + c.totalEarnings, 0) / mockCreatorPerformance.length,
      },
    };
  });

  // GET /api/analytics/content — Content performance metrics
  app.get<{ Querystring: { period?: string } }>('/content', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    return {
      metrics: mockContentMetrics,
      insights: [
        'TikTok gera 3.2x mais views que Instagram para o mesmo tipo de conteudo.',
        'Videos de "Antes e Depois" tem taxa de aprovacao 15% maior.',
        'O horario de pico para engajamento e entre 18h e 21h (horario de Brasilia).',
        'Videos com duracao de 15-30 segundos tem melhor retencao.',
        'Conteudo de skincare lidera em conversoes (3.8% taxa de conversao).',
      ],
    };
  });

  // GET /api/analytics/revenue — Revenue analytics
  app.get<{ Querystring: { period?: string; groupBy?: string } }>('/revenue', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { groupBy = 'period' } = request.query;

    return {
      revenue: mockRevenueAnalytics,
      groupBy,
      brandlyMargin: {
        physicalProducts: '23%',
        digitalProducts: '30%',
        setupFees: mockRevenueAnalytics.totalRevenue * 0.05,
        premiumPlans: mockRevenueAnalytics.totalRevenue * 0.08,
      },
    };
  });

  // GET /api/analytics/tiktok-shop — TikTok Shop specific analytics
  app.get<{ Querystring: { days?: number } }>('/tiktok-shop', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { days = 7 } = request.query;

    return {
      analytics: mockTikTokShopAnalytics,
      days,
      growth: {
        gmv: '+18.5% vs periodo anterior',
        orders: '+12.3% vs periodo anterior',
        aov: '+5.5% vs periodo anterior',
      },
    };
  });

  // GET /api/analytics/audience — Audience demographics
  app.get('/audience', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    return {
      audience: mockAudienceInsights,
      insights: [
        'Publico majoritariamente feminino (68.4%), faixa 25-34 anos.',
        'Sao Paulo e Rio de Janeiro concentram 37% da audiencia.',
        'Beleza e Skincare e o interesse principal (42.3%).',
        'Sudeste representa 55.6% da audiencia total.',
        'Crescimento de 23% na faixa 18-24 no ultimo trimestre.',
      ],
    };
  });

  // GET /api/analytics/trends — Trending content and products
  app.get<{ Querystring: { type?: string; limit?: number } }>('/trends', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { type, limit = 10 } = request.query;

    let trends = [...mockTrends];

    if (type) {
      trends = trends.filter(t => t.type === type);
    }

    trends.sort((a, b) => b.growth - a.growth);
    trends = trends.slice(0, limit);

    return {
      trends,
      total: mockTrends.length,
      summary: {
        topContentFormat: 'Get Ready With Me + Review',
        topProduct: 'Serum Vitamina C',
        topHashtag: '#creatorbrandly',
        fastestGrowing: trends[0]?.name ?? 'N/A',
      },
    };
  });
}
