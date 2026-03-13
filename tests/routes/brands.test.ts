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
      delete: vi.fn().mockReturnThis(),
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
import { brandRoutes } from '@brandly/api/routes/brands.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Brands Routes — /api/brands', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(brandRoutes, { prefix: '/api/brands' });
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

  // ─── GET / — catalogo de marcas ───

  it('GET / — retorna catalogo de marcas com paginacao', async () => {
    const fakeBrands = [
      { id: 'b1', name: 'Yav Health', category: 'supplements', creatorsConnected: 5 },
      { id: 'b2', name: 'Native', category: 'beauty', creatorsConnected: 12 },
    ];

    // Primeira query: select...from...leftJoin...where...groupBy...orderBy...offset...limit
    // where() na 1a query deve retornar this (chain continua), limit() resolve
    mockDb.where.mockReturnValueOnce(mockDb);
    mockDb.limit.mockResolvedValueOnce(fakeBrands);
    // Segunda query: select count...from...where — where() resolve
    mockDb.where.mockResolvedValueOnce([{ total: 2 }]);

    const res = await app.inject({ method: 'GET', url: '/api/brands' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.brands).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.categories).toBeDefined();
  });

  it('GET / — aceita parametros de paginacao e categoria', async () => {
    // where() na 1a query retorna this, limit() resolve
    mockDb.where.mockReturnValueOnce(mockDb);
    mockDb.limit.mockResolvedValueOnce([]);
    // where() na 2a query resolve
    mockDb.where.mockResolvedValueOnce([{ total: 0 }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/brands?page=2&limit=5&category=beauty',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.brands).toHaveLength(0);
    expect(body.total).toBe(0);
    expect(Number(body.page)).toBe(2);
    expect(Number(body.limit)).toBe(5);
  });

  // ─── GET /:id — detalhes da marca ───

  it('GET /:id — retorna 404 quando marca nao existe', async () => {
    // select...from...where retorna vazio
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({ method: 'GET', url: '/api/brands/nonexistent' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('Marca nao encontrada');
  });

  it('GET /:id — retorna detalhes da marca com briefings', async () => {
    const fakeBrand = {
      id: 'b1', name: 'Yav Health', category: 'supplements',
      maxCreators: 50, isActive: true,
    };
    const fakeBriefings = [
      { id: 'br1', brandId: 'b1', title: 'Briefing Verao', isActive: true },
    ];

    // 1a query: select marca
    mockDb.where.mockResolvedValueOnce([fakeBrand]);
    // 2a query: select briefings ativos
    mockDb.where.mockResolvedValueOnce(fakeBriefings);
    // 3a query: select count creators conectados
    mockDb.where.mockResolvedValueOnce([{ total: 10 }]);

    const res = await app.inject({ method: 'GET', url: '/api/brands/b1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.brand.id).toBe('b1');
    expect(body.briefings).toHaveLength(1);
    expect(body.creatorsConnected).toBe(10);
    expect(body.slotsAvailable).toBe(40);
  });

  // ─── POST /:id/connect — conectar a marca ───

  it('POST /:id/connect — retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/brands/b1/connect',
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /:id/connect — retorna 404 se marca nao existe', async () => {
    const token = getTestToken(app);
    // select marca: vazio
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/brands/b1/connect',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('Marca nao encontrada');
  });

  it('POST /:id/connect — retorna 409 se ja esta conectado', async () => {
    const token = getTestToken(app);
    const fakeBrand = { id: 'b1', name: 'Yav', maxCreators: 50, isActive: true };

    // 1a: marca existe
    mockDb.where.mockResolvedValueOnce([fakeBrand]);
    // 2a: count creators (tem vaga)
    mockDb.where.mockResolvedValueOnce([{ total: 5 }]);
    // 3a: ja existe conexao
    mockDb.where.mockResolvedValueOnce([{ id: 'cb1', creatorId: 'test-user-id', brandId: 'b1' }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/brands/b1/connect',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('Voce ja esta conectado a esta marca');
  });

  it('POST /:id/connect — retorna 400 se marca sem vagas', async () => {
    const token = getTestToken(app);
    const fakeBrand = { id: 'b1', name: 'Yav', maxCreators: 10, isActive: true };

    // 1a: marca existe
    mockDb.where.mockResolvedValueOnce([fakeBrand]);
    // 2a: count creators = lotado
    mockDb.where.mockResolvedValueOnce([{ total: 10 }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/brands/b1/connect',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Marca sem vagas disponiveis no momento');
  });

  it('POST /:id/connect — conecta com sucesso (201)', async () => {
    const token = getTestToken(app);
    const fakeBrand = { id: 'b1', name: 'Yav', maxCreators: 50, isActive: true };

    // 1a: marca existe
    mockDb.where.mockResolvedValueOnce([fakeBrand]);
    // 2a: count creators
    mockDb.where.mockResolvedValueOnce([{ total: 5 }]);
    // 3a: nao existe conexao
    mockDb.where.mockResolvedValueOnce([]);
    // insert creatorBrands — values retorna this (no returning)
    // 4a: select produtos ativos da marca
    mockDb.where.mockResolvedValueOnce([{ id: 'prod-1', brandId: 'b1', status: 'active' }]);
    // insert trackingLinks — values retorna this (no returning)

    const res = await app.inject({
      method: 'POST',
      url: '/api/brands/b1/connect',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.message).toContain('Conectado');
    expect(body.brandId).toBe('b1');
  });

  // ─── DELETE /:id/disconnect — desconectar da marca ───

  it('DELETE /:id/disconnect — desconecta com sucesso', async () => {
    const token = getTestToken(app);
    // update...set...where resolve
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/brands/b1/disconnect',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe('Desconectado da marca');
    expect(res.json().brandId).toBe('b1');
  });

  // ─── GET /my — marcas do creator ───

  it('GET /my — retorna marcas conectadas do creator', async () => {
    const token = getTestToken(app);
    const fakeConnections = [
      {
        connectionId: 'cb1',
        connectedAt: '2026-01-15',
        brand: { id: 'b1', name: 'Yav Health', category: 'supplements' },
      },
      {
        connectionId: 'cb2',
        connectedAt: '2026-02-10',
        brand: { id: 'b2', name: 'Native', category: 'beauty' },
      },
    ];

    // select...from...innerJoin...where
    mockDb.where.mockResolvedValueOnce(fakeConnections);

    const res = await app.inject({
      method: 'GET',
      url: '/api/brands/my',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.brands).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.brands[0].brand.name).toBe('Yav Health');
  });
});
