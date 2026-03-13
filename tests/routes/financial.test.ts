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
import { financialRoutes } from '@brandly/api/routes/financial.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Financial Routes — /api/financial', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(financialRoutes, { prefix: '/api/financial' });
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

  // ─── GET /balance ───

  it('GET /balance — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/financial/balance' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /balance — retorna saldo calculado corretamente', async () => {
    const token = getTestToken(app);
    // earned, pending, withdrawn — 3 queries encadeadas
    mockDb.where
      .mockResolvedValueOnce([{ total: '500.00' }])   // earned
      .mockResolvedValueOnce([{ total: '100.00' }])   // pending
      .mockResolvedValueOnce([{ total: '150.00' }]);  // withdrawn

    const res = await app.inject({
      method: 'GET',
      url: '/api/financial/balance',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalEarned).toBe('500.00');
    expect(body.available).toBe('350.00'); // 500 - 150
    expect(body.pending).toBe('100.00');
    expect(body.withdrawn).toBe('150.00');
  });

  it('GET /balance — retorna zeros quando sem dados', async () => {
    const token = getTestToken(app);
    mockDb.where
      .mockResolvedValueOnce([{ total: null }])
      .mockResolvedValueOnce([{ total: null }])
      .mockResolvedValueOnce([{ total: null }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/financial/balance',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.available).toBe('0.00');
    expect(body.totalEarned).toBe('0.00');
  });

  // ─── GET /earnings ───

  it('GET /earnings — retorna breakdown do mes atual', async () => {
    const token = getTestToken(app);
    mockDb.groupBy.mockResolvedValueOnce([
      { type: 'video', total: '300.00', count: 30 },
      { type: 'commission', total: '150.00', count: 5 },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/financial/earnings',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.breakdown.videos.total).toBe('300.00');
    expect(body.breakdown.commissions.total).toBe('150.00');
    expect(body.breakdown.bonuses.total).toBe('0.00');
    expect(body.grandTotal).toBe('450.00');
  });

  // ─── GET /history ───

  it('GET /history — retorna lista de pagamentos', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([
      { id: 'p1', type: 'video', amount: '10.00' },
      { id: 'p2', type: 'commission', amount: '50.00' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/financial/history',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().payments.length).toBe(2);
  });

  // ─── POST /withdraw ───

  it('POST /withdraw — retorna 400 sem amount', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/financial/withdraw',
      headers: { authorization: `Bearer ${token}` },
      payload: { pixKey: 'email@test.com' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /withdraw — retorna 400 sem pixKey', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/financial/withdraw',
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: 100 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('pixKey');
  });

  it('POST /withdraw — retorna 400 se saldo insuficiente', async () => {
    const token = getTestToken(app);
    mockDb.where
      .mockResolvedValueOnce([{ total: '50.00' }])    // earned
      .mockResolvedValueOnce([{ total: '0' }]);        // withdrawn

    const res = await app.inject({
      method: 'POST',
      url: '/api/financial/withdraw',
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: 100, pixKey: 'email@pix.com' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('insuficiente');
  });

  it('POST /withdraw — cria saque com sucesso', async () => {
    const token = getTestToken(app);
    mockDb.where
      .mockResolvedValueOnce([{ total: '500.00' }])   // earned
      .mockResolvedValueOnce([{ total: '100.00' }]);   // withdrawn
    mockDb.returning.mockResolvedValueOnce([{
      id: 'w1', userId: 'test-user-id', amount: '200', pixKey: 'pix@email.com', status: 'requested',
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/financial/withdraw',
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: 200, pixKey: 'pix@email.com' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().withdrawal.status).toBe('requested');
  });

  // ─── GET /tracking-links ───

  it('GET /tracking-links — retorna links de afiliado', async () => {
    const token = getTestToken(app);
    mockDb.where.mockResolvedValueOnce([
      { id: 'tl1', code: 'ABC', clicks: 50, conversions: 3, productName: 'Produto X', productPrice: '99.90' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/financial/tracking-links',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().links[0].code).toBe('ABC');
  });
});
