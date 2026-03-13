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
    generateScripts: vi.fn(),
  };
});

import { db } from '@brandly/core';
import { scriptRoutes } from '@brandly/api/routes/scripts.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Script Routes — /api/scripts', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(scriptRoutes, { prefix: '/api/scripts' });
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

  // ─── POST /generate — gerar roteiros ───

  it('POST /generate — retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      payload: { briefingId: 'b1' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /generate — retorna 400 sem briefingId', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('briefingId');
  });

  it('POST /generate — retorna 404 se briefing nao encontrado', async () => {
    const token = getTestToken(app);

    // select().from(briefings).innerJoin(brands).where() → []
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { briefingId: 'b-inexistente' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('Briefing nao encontrado');
  });

  it('POST /generate — retorna 201 com roteiros mock (sem API keys)', async () => {
    const token = getTestToken(app);

    // Briefing encontrado
    mockDb.where.mockResolvedValueOnce([{
      id: 'b1',
      title: 'Produto X',
      description: 'Descricao do briefing',
      tone: 'casual',
      doList: ['falar do beneficio'],
      dontList: ['nao mentir'],
      technicalRequirements: '15-30s vertical',
      brandName: 'Marca Teste',
      brandDescription: 'Descricao da marca',
    }]);

    // Sem API keys → usa mock scripts
    // insert().values().returning() → scripts criados
    const mockScripts = Array.from({ length: 18 }, (_, i) => ({
      id: `script-${i}`,
      creatorId: 'test-user-id',
      briefingId: 'b1',
      hook: 'Voce precisa conhecer esse produto...',
      body: 'Testei por 7 dias e o resultado foi incrivel...',
      cta: 'Link na bio pra voce garantir o seu!',
      fullScript: 'Voce precisa...\n\nTestei...\n\nLink na bio...',
      isUsed: false,
    }));
    mockDb.returning.mockResolvedValueOnce(mockScripts);

    const res = await app.inject({
      method: 'POST',
      url: '/api/scripts/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { briefingId: 'b1' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.briefingId).toBe('b1');
    expect(body.total).toBe(18);
    expect(body.generatedBy).toBe('mock');
    expect(body.scripts).toBeDefined();
  });

  // ─── GET / — biblioteca de roteiros ───

  it('GET / — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/scripts' });
    expect(res.statusCode).toBe(401);
  });

  it('GET / — retorna roteiros do creator', async () => {
    const token = getTestToken(app);

    // select().from(scripts).where().orderBy().limit()
    mockDb.limit.mockResolvedValueOnce([
      { id: 's1', hook: 'Hook 1', body: 'Body 1', cta: 'CTA 1', isUsed: false },
      { id: 's2', hook: 'Hook 2', body: 'Body 2', cta: 'CTA 2', isUsed: true },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/scripts',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.scripts).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  // ─── GET /:id — detalhes do roteiro ───

  it('GET /:id — retorna 404 se roteiro nao encontrado', async () => {
    const token = getTestToken(app);

    // select().from(scripts).where() → []
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/scripts/s-inexistente',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('Script nao encontrado');
  });

  // ─── PATCH /:id/use — marcar como usado ───

  it('PATCH /:id/use — marca roteiro como usado', async () => {
    const token = getTestToken(app);

    // 1. Buscar script — select().from(scripts).where()
    mockDb.where.mockResolvedValueOnce([{
      id: 's1', creatorId: 'test-user-id', hook: 'Hook', body: 'Body', cta: 'CTA', isUsed: false,
    }]);

    // 2. update().set().where().returning()
    mockDb.returning.mockResolvedValueOnce([{
      id: 's1', creatorId: 'test-user-id', hook: 'Hook', body: 'Body', cta: 'CTA', isUsed: true,
    }]);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/scripts/s1/use',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().isUsed).toBe(true);
  });
});
