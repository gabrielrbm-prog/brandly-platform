import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { buildApp, getTestToken } from '../helpers/build-app.js';

vi.mock('@brandly/core', async () => {
  const actual = await vi.importActual('@brandly/core');
  return {
    ...actual,
    db: {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      leftJoin: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
    },
  };
});

import { db } from '@brandly/core';
import { dashboardRoutes } from '@brandly/api/routes/dashboard.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Dashboard Routes — /api/dashboard', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(dashboardRoutes, { prefix: '/api/dashboard' });
    });
    for (const key of Object.keys(mockDb)) {
      if (key !== 'returning' && key !== 'limit') {
        mockDb[key].mockReturnThis();
      }
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  // ─── GET / — visao geral ───

  it('GET / — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/dashboard' });
    expect(res.statusCode).toBe(401);
  });

  it('GET / — retorna dados do dashboard com db mockado', async () => {
    const token = getTestToken(app);

    // 7 queries sequenciais — mockar where na ordem exata de chamada:
    // Q1: .where().groupBy() — where nao-terminal, groupBy terminal
    // Q2: .where() — terminal (today earnings)
    // Q3: .where() — terminal (month videos)
    // Q4: .where() — terminal (month approved)
    // Q5: .where().groupBy() — where nao-terminal, groupBy terminal
    // Q6: .where() — terminal (active brands)
    // Q7: .innerJoin().where() — terminal (user level)

    mockDb.where
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal
      .mockResolvedValueOnce([{ total: '60.00' }])          // Q2: today earnings
      .mockResolvedValueOnce([{ total: 45 }])               // Q3: month videos
      .mockResolvedValueOnce([{ total: 30 }])               // Q4: month approved
      .mockReturnValueOnce(mockDb)                          // Q5: nao-terminal
      .mockResolvedValueOnce([{ total: 3 }])                // Q6: active brands
      .mockResolvedValueOnce([{ levelName: 'Flow' }]);      // Q7: user level

    mockDb.groupBy
      .mockResolvedValueOnce([                              // Q1: videos hoje por status
        { status: 'approved', total: 3 },
        { status: 'pending', total: 2 },
        { status: 'rejected', total: 1 },
      ])
      .mockResolvedValueOnce([                              // Q5: pagamentos do mes
        { type: 'video', total: '300.00' },
        { type: 'commission', total: '150.00' },
        { type: 'bonus', total: '50.00' },
      ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    // today
    expect(body.today.videosApproved).toBe(3);
    expect(body.today.videosPending).toBe(2);
    expect(body.today.videosRejected).toBe(1);
    expect(body.today.earnings).toBe('60.00');
    expect(body.today.remaining).toBe(4); // 10 - (3+2+1)

    // month
    expect(body.month.totalVideos).toBe(45);
    expect(body.month.approvalRate).toBe('67%');
    expect(body.month.totalEarnings).toBe('500.00');
    expect(body.month.videoEarnings).toBe('300.00');
    expect(body.month.commissionEarnings).toBe('150.00');
    expect(body.month.bonusEarnings).toBe('50.00');

    // brands & level
    expect(body.brands.active).toBe(3);
    expect(body.level.current).toBe('Flow');
  });

  // ─── GET /metrics ───

  it('GET /metrics — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/dashboard/metrics' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /metrics — retorna metricas com periodo padrao (week)', async () => {
    const token = getTestToken(app);

    // Q1: .where() terminal (produced)
    // Q2: .where() terminal (approved)
    // Q3: .where().groupBy() — where nao-terminal, groupBy terminal
    // Q4: .where() terminal (social accounts)
    mockDb.where
      .mockResolvedValueOnce([{ total: 20 }])               // Q1: produced
      .mockResolvedValueOnce([{ total: 15 }])               // Q2: approved
      .mockReturnValueOnce(mockDb)                          // Q3: nao-terminal
      .mockResolvedValueOnce([]);                           // Q4: social accounts

    mockDb.groupBy
      .mockResolvedValueOnce([                              // Q3: financial por tipo
        { type: 'video', total: '100.00' },
        { type: 'commission', total: '50.00' },
      ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/metrics',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.period).toBe('week');
    expect(body.production.videosProduced).toBe(20);
    expect(body.production.videosApproved).toBe(15);
    expect(body.production.approvalRate).toBe('75%');
    expect(body.financial.totalEarnings).toBe('150.00');
    expect(body.financial.videoEarnings).toBe('100.00');
    expect(body.social.instagram.connected).toBe(false);
    expect(body.social.tiktok.connected).toBe(false);
  });

  it('GET /metrics — retorna metricas com period=day', async () => {
    const token = getTestToken(app);

    mockDb.where
      .mockResolvedValueOnce([{ total: 5 }])                // Q1: produced
      .mockResolvedValueOnce([{ total: 4 }])                // Q2: approved
      .mockReturnValueOnce(mockDb)                          // Q3: nao-terminal
      .mockResolvedValueOnce([                              // Q4: social accounts
        {
          platform: 'instagram',
          status: 'connected',
          platformUsername: '@creator',
          followers: 5000,
          avgLikes: 200,
          avgViews: 1000,
          avgComments: 30,
          engagementRate: '4.5',
          isVerified: false,
          lastSyncAt: '2026-03-13T00:00:00Z',
        },
      ]);

    mockDb.groupBy
      .mockResolvedValueOnce([                              // Q3: financial
        { type: 'video', total: '40.00' },
      ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/metrics?period=day',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.period).toBe('day');
    expect(body.production.videosProduced).toBe(5);
    expect(body.production.approvalRate).toBe('80%');
    expect(body.financial.totalEarnings).toBe('40.00');
    expect(body.social.instagram.connected).toBe(true);
    expect(body.social.instagram.followers).toBe(5000);
    expect(body.social.tiktok.connected).toBe(false);
  });

  // ─── GET /ranking ───

  it('GET /ranking — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/dashboard/ranking' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /ranking — retorna posicao e top performers', async () => {
    const token = getTestToken(app);

    // Q1: .where().groupBy().orderBy().limit() — where,groupBy,orderBy nao-terminal, limit terminal
    // Q2: .where().groupBy().orderBy() — where,groupBy nao-terminal, orderBy terminal
    mockDb.where
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal
      .mockReturnValueOnce(mockDb);                         // Q2: nao-terminal

    mockDb.groupBy
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal
      .mockReturnValueOnce(mockDb);                         // Q2: nao-terminal

    mockDb.orderBy
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal (continues to limit)
      .mockResolvedValueOnce([                              // Q2: terminal (all ranking)
        { creatorId: 'c1', approvedCount: 50 },
        { creatorId: 'test-user-id', approvedCount: 35 },
        { creatorId: 'c3', approvedCount: 20 },
        { creatorId: 'c4', approvedCount: 10 },
      ]);

    mockDb.limit
      .mockResolvedValueOnce([                              // Q1: terminal (top 10)
        { creatorId: 'c1', name: 'Creator Um', approvedCount: 50 },
        { creatorId: 'test-user-id', name: 'Test User', approvedCount: 35 },
        { creatorId: 'c3', name: 'Creator Tres', approvedCount: 20 },
      ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/ranking',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.position).toBe(2);
    expect(body.totalCreators).toBe(4);
    expect(body.topPerformers).toHaveLength(3);
    expect(body.topPerformers[0].position).toBe(1);
    expect(body.topPerformers[0].name).toBe('Creator Um');
    expect(body.topPerformers[0].approvedVideos).toBe(50);
    expect(body.topPerformers[1].position).toBe(2);
    expect(body.topPerformers[1].creatorId).toBe('test-user-id');
  });

  it('GET /ranking — retorna posicao 0 quando usuario nao tem videos', async () => {
    const token = getTestToken(app);

    mockDb.where
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal
      .mockReturnValueOnce(mockDb);                         // Q2: nao-terminal

    mockDb.groupBy
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal
      .mockReturnValueOnce(mockDb);                         // Q2: nao-terminal

    mockDb.orderBy
      .mockReturnValueOnce(mockDb)                          // Q1: nao-terminal
      .mockResolvedValueOnce([                              // Q2: terminal
        { creatorId: 'c1', approvedCount: 50 },
      ]);

    mockDb.limit
      .mockResolvedValueOnce([                              // Q1: terminal
        { creatorId: 'c1', name: 'Creator Um', approvedCount: 50 },
      ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/ranking',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.position).toBe(0);
    expect(body.totalCreators).toBe(1);
  });
});
