import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { buildApp } from '../helpers/build-app.js';

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
import { communityRoutes } from '@brandly/api/routes/community.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Community Routes — /api/community', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(communityRoutes, { prefix: '/api/community' });
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

  // ─── GET /ranking — ranking de creators ───

  it('GET /ranking — retorna ranking de producao (publico, sem auth)', async () => {
    // select().from(videos).innerJoin().where().groupBy().orderBy().limit()
    mockDb.limit.mockResolvedValueOnce([
      { creatorId: 'u1', name: 'Creator 1', total: 15 },
      { creatorId: 'u2', name: 'Creator 2', total: 10 },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/community/ranking',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.type).toBe('production');
    expect(body.ranking).toHaveLength(2);
    expect(body.totalCreators).toBe(2);
  });

  it('GET /ranking?type=earnings — retorna ranking por ganhos', async () => {
    // select().from(payments).innerJoin().where().groupBy().orderBy().limit()
    mockDb.limit.mockResolvedValueOnce([
      { creatorId: 'u1', name: 'Creator 1', total: '5000.00' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/community/ranking?type=earnings',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.type).toBe('earnings');
    expect(body.ranking).toHaveLength(1);
    expect(body.totalCreators).toBe(1);
  });

  // ─── GET /lives — agenda de lives ───

  it('GET /lives — retorna lives futuras e passadas', async () => {
    // Primeira query: select().from(liveEvents).where().orderBy() → upcoming
    mockDb.orderBy
      .mockResolvedValueOnce([
        { id: 'live-1', title: 'Live de Estrategia', scheduledAt: '2027-01-15T19:00:00Z' },
      ]);

    // Segunda query: select().from(liveEvents).where().orderBy().limit() → past
    mockDb.limit.mockResolvedValueOnce([
      { id: 'live-2', title: 'Live Passada', scheduledAt: '2026-01-10T19:00:00Z' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/community/lives',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.upcoming).toBeDefined();
    expect(body.past).toBeDefined();
  });

  // ─── GET /cases — cases de sucesso ───

  it('GET /cases — retorna cases de sucesso publicados', async () => {
    // select().from(successCases).innerJoin().where().orderBy().limit()
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 'case-1',
        creatorId: 'u1',
        creatorName: 'Marina',
        title: 'De CLT para R$10k/mes',
        story: 'Historia de sucesso...',
        earnings: '10000.00',
        createdAt: '2026-02-01T10:00:00Z',
      },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/community/cases',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cases).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.cases[0].creatorName).toBe('Marina');
  });
});
