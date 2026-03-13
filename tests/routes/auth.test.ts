import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { buildApp, getTestToken } from '../helpers/build-app.js';

// Mock do @brandly/core (db + services)
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
import { authRoutes } from '@brandly/api/routes/auth.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Auth Routes — /api/auth', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(authRoutes, { prefix: '/api/auth' });
    });

    // Reset chain methods
    for (const key of Object.keys(mockDb)) {
      if (key !== 'returning' && key !== 'limit') {
        mockDb[key].mockReturnThis();
      }
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  // ─── POST /register ───

  it('POST /register — retorna 400 se campos obrigatorios faltam', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Test' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('obrigatorios');
  });

  it('POST /register — retorna 400 se password curto', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Test', email: 'test@test.com', password: '123' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('6 caracteres');
  });

  it('POST /register — retorna 409 se email ja cadastrado', async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: 'existing-id' }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Test', email: 'existing@test.com', password: '123456' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toContain('ja cadastrado');
  });

  it('POST /register — retorna 201 com token ao criar usuario', async () => {
    // Email nao existe
    mockDb.limit
      .mockResolvedValueOnce([])           // email check
      .mockResolvedValueOnce([{ id: 'seed-level-id' }]); // seed level
    mockDb.returning.mockResolvedValueOnce([{
      id: 'new-user-id',
      name: 'Test User',
      email: 'new@test.com',
      role: 'creator',
      referralCode: 'ABC123',
      onboardingCompleted: false,
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Test User', email: 'new@test.com', password: '123456' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe('new@test.com');
    expect(body.token).toBeDefined();
  });

  it('POST /register — busca sponsor por referralCode', async () => {
    mockDb.limit
      .mockResolvedValueOnce([])                          // email check
      .mockResolvedValueOnce([{ id: 'sponsor-id' }])      // sponsor lookup
      .mockResolvedValueOnce([{ id: 'seed-level-id' }]);  // seed level
    mockDb.returning.mockResolvedValueOnce([{
      id: 'new-user-id',
      name: 'Referred User',
      email: 'ref@test.com',
      role: 'creator',
      referralCode: 'DEF456',
      onboardingCompleted: false,
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'Referred User', email: 'ref@test.com', password: '123456', referralCode: 'SPONSOR1' },
    });
    expect(res.statusCode).toBe(201);
  });

  // ─── POST /login ───

  it('POST /login — retorna 400 sem email/password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'test@test.com' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /login — retorna 401 se usuario nao existe', async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'nao@existe.com', password: '123456' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toContain('invalidas');
  });

  it('POST /login — retorna 401 com senha errada', async () => {
    // bcrypt hash de "correta"
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('correta', 10);

    mockDb.limit.mockResolvedValueOnce([{
      id: 'user-id',
      name: 'User',
      email: 'user@test.com',
      passwordHash: hash,
      role: 'creator',
      referralCode: 'XYZ',
      onboardingCompleted: false,
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user@test.com', password: 'errada' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /login — retorna 200 com token quando credenciais validas', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('senha123', 10);

    mockDb.limit.mockResolvedValueOnce([{
      id: 'user-id',
      name: 'User',
      email: 'user@test.com',
      passwordHash: hash,
      role: 'creator',
      referralCode: 'XYZ',
      onboardingCompleted: true,
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'user@test.com', password: 'senha123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.id).toBe('user-id');
    expect(body.token).toBeDefined();
  });

  // ─── GET /me ───

  it('GET /me — retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /me — retorna dados do usuario autenticado', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([{
      id: 'test-user-id',
      name: 'Test',
      email: 'test@test.com',
      role: 'creator',
      referralCode: 'REF',
      status: 'active',
      instagramHandle: '@test',
      tiktokHandle: null,
      onboardingCompleted: true,
      createdAt: new Date(),
    }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.id).toBe('test-user-id');
  });

  it('GET /me — retorna 404 se usuario nao existe mais', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
