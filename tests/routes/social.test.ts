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
    createPhylloUser: vi.fn(),
    createSdkToken: vi.fn(),
    getProfiles: vi.fn(),
    getContents: vi.fn(),
    calculateEngagementMetrics: vi.fn(),
    mapPlatformName: vi.fn(),
  };
});

import { db, createPhylloUser, createSdkToken } from '@brandly/core';
import { socialRoutes } from '@brandly/api/routes/social.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockCreatePhylloUser = createPhylloUser as ReturnType<typeof vi.fn>;
const mockCreateSdkToken = createSdkToken as ReturnType<typeof vi.fn>;

describe('Social Routes — /api/social', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(socialRoutes, { prefix: '/api/social' });
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

  // ─── POST /connect — gerar SDK token Phyllo ───

  it('POST /connect — retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/social/connect',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /connect — retorna 404 se usuario nao encontrado', async () => {
    const token = getTestToken(app);

    // select({id, name}).from(users).where() → []
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/social/connect',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('Usuario nao encontrado');
  });

  it('POST /connect — cria usuario Phyllo e retorna SDK token', async () => {
    const token = getTestToken(app);

    // 1. Buscar usuario — select().from(users).where()
    mockDb.where.mockResolvedValueOnce([{ id: 'test-user-id', name: 'Creator Teste' }]);

    // 2. Verificar conta existente — select().from(socialAccounts).where().limit()
    mockDb.limit.mockResolvedValueOnce([]);

    // 3. Criar usuario Phyllo
    mockCreatePhylloUser.mockResolvedValueOnce({ id: 'phyllo-user-123' });

    // 4. Gerar SDK token
    mockCreateSdkToken.mockResolvedValueOnce({ sdk_token: 'sdk-token-abc' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/social/connect',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.sdkToken).toBe('sdk-token-abc');
    expect(body.userId).toBe('phyllo-user-123');
    expect(mockCreatePhylloUser).toHaveBeenCalledWith('Creator Teste', 'test-user-id');
  });

  // ─── POST /account-connected — callback apos conectar ───

  it('POST /account-connected — retorna 400 sem campos obrigatorios', async () => {
    const token = getTestToken(app);

    const res = await app.inject({
      method: 'POST',
      url: '/api/social/account-connected',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('obrigatorios');
  });

  // ─── GET /accounts — listar contas conectadas ───

  it('GET /accounts — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/social/accounts' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /accounts — retorna contas conectadas do creator', async () => {
    const token = getTestToken(app);

    // select().from(socialAccounts).where()
    mockDb.where.mockResolvedValueOnce([
      {
        id: 'sa-1',
        platform: 'instagram',
        platformUsername: '@creator',
        platformUrl: 'https://instagram.com/creator',
        followers: 15000,
        following: 500,
        avgLikes: 300,
        avgViews: 5000,
        avgComments: 50,
        engagementRate: '3.5',
        isVerified: false,
        status: 'connected',
        lastSyncAt: '2026-03-10T10:00:00Z',
      },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/social/accounts',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0].platform).toBe('instagram');
    expect(body.accounts[0].username).toBe('@creator');
    expect(body.accounts[0].engagementRate).toBe(3.5);
  });

  // ─── DELETE /disconnect/:platform — desconectar conta ───

  it('DELETE /disconnect/:platform — retorna 400 para plataforma invalida', async () => {
    const token = getTestToken(app);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/social/disconnect/youtube',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Plataforma invalida');
  });

  it('DELETE /disconnect/:platform — desconecta conta com sucesso', async () => {
    const token = getTestToken(app);

    // update().set().where() — retorna this (void)
    mockDb.where.mockResolvedValueOnce(undefined);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/social/disconnect/instagram',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toContain('instagram desconectado');
  });
});
