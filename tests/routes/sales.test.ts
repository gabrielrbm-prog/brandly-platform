import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { buildApp, getTestToken, getAdminToken } from '../helpers/build-app.js';

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
    confirmSale: vi.fn(),
  };
});

import { db, confirmSale } from '@brandly/core';
import { saleRoutes } from '@brandly/api/routes/sales.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockConfirmSale = confirmSale as ReturnType<typeof vi.fn>;

describe('Sales Routes — /api/sales', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(saleRoutes, { prefix: '/api/sales' });
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

  // ─── POST / — registrar venda ───

  it('POST / — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/sales', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('POST / — retorna 400 sem productId/amount', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: 100 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST / — retorna 404 se produto nao existe', async () => {
    const token = getTestToken(app);
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${token}` },
      payload: { productId: 'nonexistent', amount: 100, qualifiedVolume: 100 },
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST / — registra venda com sucesso', async () => {
    const token = getTestToken(app);
    mockDb.where.mockResolvedValueOnce([{ id: 'prod-1', name: 'Produto X' }]);
    mockDb.returning.mockResolvedValueOnce([{
      id: 'sale-1', sellerId: 'test-user-id', productId: 'prod-1',
      amount: '199.90', qualifiedVolume: '199.90', status: 'pending',
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/sales',
      headers: { authorization: `Bearer ${token}` },
      payload: { productId: 'prod-1', amount: 199.90, qualifiedVolume: 199.90 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().sale.id).toBe('sale-1');
  });

  // ─── POST /:id/confirm — confirmar venda + bonus ───

  it('POST /:id/confirm — retorna 403 se nao admin', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/sales/sale-1/confirm',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /:id/confirm — confirma venda e processa bonus', async () => {
    const adminToken = getAdminToken(app);
    mockConfirmSale.mockResolvedValueOnce({
      sale: { id: 'sale-1', status: 'confirmed' },
      bonuses: [
        { userId: 'seller', type: 'direct', amount: 39.98, details: 'Comissao direta 20%' },
        { userId: 'sponsor', type: 'infinite', amount: 5.00, details: 'Bonus infinito' },
      ],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/sales/sale-1/confirm',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.bonusesGenerated).toBe(2);
    expect(body.bonuses[0].type).toBe('direct');
  });

  it('POST /:id/confirm — retorna 400 se confirmSale falha', async () => {
    const adminToken = getAdminToken(app);
    mockConfirmSale.mockRejectedValueOnce(new Error('Venda ja confirmada'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/sales/sale-1/confirm',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Venda ja confirmada');
  });

  // ─── GET / — listar vendas ───

  it('GET / — creator ve apenas suas vendas', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([
      { id: 's1', sellerId: 'test-user-id', amount: '100', productName: 'P1' },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/sales',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().sales.length).toBe(1);
  });
});
