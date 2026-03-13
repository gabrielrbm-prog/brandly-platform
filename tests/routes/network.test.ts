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
import { networkRoutes } from '@brandly/api/routes/network.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Network Routes — /api/network', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(networkRoutes, { prefix: '/api/network' });
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

  // ─── GET /referral-link ───

  it('GET /referral-link — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/network/referral-link' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /referral-link — retorna dados de indicacao', async () => {
    const token = getTestToken(app);
    // 1) user referralCode, 2) totalReferrals, 3) activeReferrals
    mockDb.where
      .mockResolvedValueOnce([{ referralCode: 'ABC123' }])
      .mockResolvedValueOnce([{ total: 10 }])
      .mockResolvedValueOnce([{ total: 5 }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/network/referral-link',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.referralCode).toBe('ABC123');
    expect(body.referralUrl).toBe('https://brandly.com.br/r/ABC123');
    expect(body.totalReferrals).toBe(10);
    expect(body.activeReferrals).toBe(5);
  });

  it('GET /referral-link — retorna 404 se usuario nao encontrado', async () => {
    const token = getTestToken(app);
    mockDb.where
      .mockResolvedValueOnce([]); // user not found

    const res = await app.inject({
      method: 'GET',
      url: '/api/network/referral-link',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('nao encontrado');
  });

  // ─── GET /tree ───

  it('GET /tree — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/network/tree' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /tree — retorna arvore de rede com subdiretos', async () => {
    const token = getTestToken(app);
    // 1) directs query (ends in .where)
    mockDb.where.mockResolvedValueOnce([
      { id: 'u1', name: 'Creator A', status: 'active', createdAt: '2026-01-01', levelName: 'Spark' },
      { id: 'u2', name: 'Creator B', status: 'inactive', createdAt: '2026-02-01', levelName: null },
    ]);
    // 2) subcount for each direct (Promise.all — 2 .where calls)
    mockDb.where
      .mockResolvedValueOnce([{ total: 3 }])   // u1 directs
      .mockResolvedValueOnce([{ total: 0 }]);   // u2 directs

    const res = await app.inject({
      method: 'GET',
      url: '/api/network/tree',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.directs).toHaveLength(2);
    expect(body.directs[0].name).toBe('Creator A');
    expect(body.directs[0].level).toBe('Spark');
    expect(body.directs[0].directCount).toBe(3);
    expect(body.directs[1].level).toBe('Seed'); // fallback when null
    expect(body.totalNetwork).toBe(2);
    expect(body.depth).toBe(2);
  });

  // ─── GET /stats ───

  it('GET /stats — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/network/stats' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /stats — retorna estatisticas completas da rede', async () => {
    const token = getTestToken(app);
    // 1) userWithLevel — select.from.leftJoin.where (resolves)
    mockDb.where.mockResolvedValueOnce([{
      levelName: 'Flow', levelRank: 3, requiredQV: '500', requiredDirects: 5, requiredPML: '200',
    }]);
    // 2) nextLevel — select.from.where (resolves)
    mockDb.where.mockResolvedValueOnce([{
      name: 'Iconic', requiredQV: '1000', requiredDirects: 10, requiredPML: '500',
    }]);
    // 3) qualification — select.from.where (resolves)
    mockDb.where.mockResolvedValueOnce([{
      qualifiedVolume: '750', directsActive: 7, maxLinePML: '300',
    }]);
    // 4) totalMembers — select.from.where (resolves)
    mockDb.where.mockResolvedValueOnce([{ total: 25 }]);
    // 5) activeMembers — select.from.innerJoin.where (resolves)
    mockDb.where.mockResolvedValueOnce([{ total: 18 }]);
    // 6) directsActive — select.from.where (resolves)
    mockDb.where.mockResolvedValueOnce([{ total: 7 }]);
    // 7) bonusByType — select.from.where.groupBy (where returns this, groupBy resolves)
    mockDb.where.mockReturnValueOnce(mockDb);
    mockDb.groupBy.mockResolvedValueOnce([
      { type: 'direct', total: '200.00' },
      { type: 'infinite', total: '80.00' },
    ]);
    // 8) networkVolume — select.from.innerJoin.where (resolves)
    mockDb.where.mockResolvedValueOnce([{ total: '5000.00' }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/network/stats',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.level.current).toBe('Flow');
    expect(body.level.nextLevel).toBe('Iconic');
    expect(body.level.requirements.qv.current).toBe(750);
    expect(body.level.requirements.directs.current).toBe(7);
    expect(body.network.totalMembers).toBe(25);
    expect(body.network.activeMembers).toBe(18);
    expect(body.network.directsActive).toBe(7);
    expect(body.network.totalVolume).toBe('5000.00');
    expect(body.bonuses.direct).toBe('200.00');
    expect(body.bonuses.infinite).toBe('80.00');
    expect(body.bonuses.matching).toBe('0.00');
    expect(body.bonuses.total).toBe('280.00');
  });

  // ─── GET /bonuses ───

  it('GET /bonuses — retorna historico de bonus', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([
      { id: 'b1', type: 'direct', amount: '50.00', period: '2026-03', status: 'paid', createdAt: '2026-03-10' },
      { id: 'b2', type: 'infinite', amount: '20.00', period: '2026-03', status: 'pending', createdAt: '2026-03-11' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/network/bonuses',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.bonuses).toHaveLength(2);
    expect(body.bonuses[0].type).toBe('direct');
    expect(body.bonuses[1].type).toBe('infinite');
    expect(body.total).toBe(2);
  });
});
