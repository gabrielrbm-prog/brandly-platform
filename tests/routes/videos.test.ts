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
    sendPushNotification: vi.fn().mockResolvedValue(undefined),
    videoApprovedNotification: vi.fn().mockReturnValue({}),
    videoRejectedNotification: vi.fn().mockReturnValue({}),
  };
});

import { db } from '@brandly/core';
import { videoRoutes } from '@brandly/api/routes/videos.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Video Routes — /api/videos', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(videoRoutes, { prefix: '/api/videos' });
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

  // ─── POST / — submeter video ───

  it('POST / — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/videos', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('POST / — retorna 400 se campos faltando', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/videos',
      headers: { authorization: `Bearer ${token}` },
      payload: { brandId: 'b1' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('obrigatorios');
  });

  it('POST / — retorna 400 para URL invalida', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/videos',
      headers: { authorization: `Bearer ${token}` },
      payload: { brandId: 'b1', briefingId: 'br1', externalUrl: 'nao-e-url' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('URL valida');
  });

  it('POST / — retorna 201 ao submeter video valido', async () => {
    const token = getTestToken(app);
    const fakeVideo = {
      id: 'vid-1', creatorId: 'test-user-id', brandId: 'b1',
      briefingId: 'br1', externalUrl: 'https://tiktok.com/v1',
      status: 'pending', platform: 'tiktok',
    };
    mockDb.returning.mockResolvedValueOnce([fakeVideo]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/videos',
      headers: { authorization: `Bearer ${token}` },
      payload: { brandId: 'b1', briefingId: 'br1', externalUrl: 'https://tiktok.com/v1', platform: 'tiktok' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().video.id).toBe('vid-1');
    expect(res.json().message).toContain('aprovacao');
  });

  // ─── GET / — listar videos ───

  it('GET / — retorna videos do creator autenticado', async () => {
    const token = getTestToken(app);
    // A rota faz 2 queries:
    // 1. select().from().where().orderBy().limit(50) → lista (limit resolve)
    // 2. select({aggregates}).from().where(and(eq,gte,lte)) → todayStats (where resolve como array)
    // Mockamos limit pra primeira e where pra segunda
    mockDb.limit.mockResolvedValueOnce([
      { id: 'v1', status: 'approved' },
      { id: 'v2', status: 'pending' },
    ]);

    // O segundo select encadeia where(and(...)) como terminal — precisa retornar array
    // Usamos um counter: where e chamado 1x na primeira query (retorna this pra orderBy->limit)
    // e 1x na segunda query (precisa resolver como array)
    let whereCount = 0;
    const mockWhere = mockDb.where as ReturnType<typeof vi.fn>;
    mockWhere.mockImplementation(function (this: typeof mockDb) {
      whereCount++;
      if (whereCount === 1) {
        // Primeira query — encadear com orderBy
        return this;
      }
      // Segunda query (todayStats) — resolver diretamente
      return [{ approved: '1', pending: '1', rejected: '0', paid: '0' }];
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/videos',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.videos).toBeDefined();
    expect(body.today).toBeDefined();
  });

  // ─── GET /review-queue — fila admin ───

  it('GET /review-queue — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/videos/review-queue' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /review-queue — retorna 403 se nao admin', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/videos/review-queue',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /review-queue — admin recebe fila de pendentes', async () => {
    const adminToken = getAdminToken(app);
    mockDb.limit.mockResolvedValueOnce([{ id: 'v1', status: 'pending' }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/videos/review-queue',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().videos).toBeDefined();
  });

  // ─── PATCH /:id/review — aprovar/rejeitar ───

  it('PATCH /:id/review — retorna 403 se nao admin', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/videos/vid-1/review',
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'approved' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('PATCH /:id/review — retorna 400 para status invalido', async () => {
    const adminToken = getAdminToken(app);
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/videos/vid-1/review',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'invalid' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /:id/review — retorna 400 rejeicao sem motivo', async () => {
    const adminToken = getAdminToken(app);
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/videos/vid-1/review',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'rejected' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('rejectionReason');
  });

  it('PATCH /:id/review — retorna 404 se video nao existe', async () => {
    const adminToken = getAdminToken(app);
    // A query faz select().from().where(eq).limit(1)
    // where retorna this, limit resolve
    mockDb.limit.mockResolvedValueOnce([]);

    // Garantir que where retorna this pra encadear com limit
    mockDb.where.mockReturnThis();

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/videos/vid-inexistente/review',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'approved' },
    });
    expect(res.statusCode).toBe(404);
  });

  // ─── POST /:id/resubmit ───

  it('POST /:id/resubmit — retorna 400 sem URL', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/videos/vid-1/resubmit',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /:id/resubmit — retorna 404 se video nao pertence ao creator', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/videos/vid-1/resubmit',
      headers: { authorization: `Bearer ${token}` },
      payload: { externalUrl: 'https://tiktok.com/v2' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /:id/resubmit — retorna 400 se video nao foi rejeitado', async () => {
    const token = getTestToken(app);
    // where(and(...)) retorna this, limit(1) resolve
    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValueOnce([{ id: 'vid-1', status: 'pending', creatorId: 'test-user-id' }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/videos/vid-1/resubmit',
      headers: { authorization: `Bearer ${token}` },
      payload: { externalUrl: 'https://tiktok.com/v2' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('rejeitados');
  });
});
