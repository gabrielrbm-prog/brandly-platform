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
    analyzeBehavioralProfile: vi.fn().mockResolvedValue({
      creatorDiagnostic: { type: 'Influenciador Natural', strengths: ['Comunicacao'] },
      adminDiagnostic: { disc: 'I', archetype: 'Performer' },
    }),
  };
});

import { db } from '@brandly/core';
import { onboardingRoutes } from '@brandly/api/routes/onboarding.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Onboarding Routes — /api/onboarding', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(onboardingRoutes, { prefix: '/api/onboarding' });
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

  // ─── POST /profile ───

  it('POST /profile — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/onboarding/profile', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('POST /profile — retorna 400 sem categorias', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { preferredCategories: [], contentStyle: 'lifestyle' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('categoria');
  });

  it('POST /profile — retorna 400 para categoria invalida', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { preferredCategories: ['beauty', 'invalid'], contentStyle: 'lifestyle' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('invalidas');
  });

  it('POST /profile — retorna 400 para estilo invalido', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { preferredCategories: ['beauty'], contentStyle: 'invalido' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Estilo invalido');
  });

  it('POST /profile — retorna 400 para nivel invalido', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: { preferredCategories: ['beauty'], experienceLevel: 'expert' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('Nivel invalido');
  });

  it('POST /profile — cria novo perfil se nao existe', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([]); // nao existe

    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        preferredCategories: ['beauty', 'fashion'],
        contentStyle: 'lifestyle',
        experienceLevel: 'beginner',
        availableHoursPerDay: 4,
        motivations: ['renda'],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toContain('salvo');
  });

  it('POST /profile — atualiza perfil se ja existe', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([{ id: 'profile-id' }]); // ja existe

    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        preferredCategories: ['tech'],
        contentStyle: 'review',
        experienceLevel: 'intermediate',
        availableHoursPerDay: 6,
        motivations: ['carreira'],
      },
    });
    expect(res.statusCode).toBe(200);
  });

  // ─── POST /social ───

  it('POST /social — retorna 400 sem platform/handle', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/social',
      headers: { authorization: `Bearer ${token}` },
      payload: { platform: 'instagram' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /social — retorna 400 para plataforma invalida', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/social',
      headers: { authorization: `Bearer ${token}` },
      payload: { platform: 'youtube', handle: '@test' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('instagram ou tiktok');
  });

  it('POST /social — salva handle com sucesso', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/social',
      headers: { authorization: `Bearer ${token}` },
      payload: { platform: 'instagram', handle: '@brandly_creator' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().platform).toBe('instagram');
  });

  // ─── GET /behavioral/questions ───

  it('GET /behavioral/questions — retorna 20 perguntas', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/onboarding/behavioral/questions',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().questions).toBeDefined();
    expect(res.json().total).toBe(20);
  });

  // ─── POST /behavioral ───

  it('POST /behavioral — retorna 400 com menos de 15 respostas', async () => {
    const token = getTestToken(app);
    const fewAnswers: Record<string, string> = {};
    for (let i = 1; i <= 10; i++) fewAnswers[`q${i}`] = 'a';

    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/behavioral',
      headers: { authorization: `Bearer ${token}` },
      payload: { answers: fewAnswers },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('15');
  });

  it('POST /behavioral — analisa perfil com IA e retorna diagnostico', async () => {
    const token = getTestToken(app);
    const answers: Record<string, string> = {};
    for (let i = 1; i <= 20; i++) answers[`q${i}`] = 'a';

    // user lookup
    mockDb.limit
      .mockResolvedValueOnce([{ name: 'Test User' }])  // user name
      .mockResolvedValueOnce([{ id: 'profile-id' }]);   // existing profile

    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/behavioral',
      headers: { authorization: `Bearer ${token}` },
      payload: { answers },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().creatorDiagnostic).toBeDefined();
  });

  // ─── GET /behavioral/result ───

  it('GET /behavioral/result — retorna 404 sem perfil', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/onboarding/behavioral/result',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /behavioral/result — retorna diagnostico salvo', async () => {
    const token = getTestToken(app);
    mockDb.limit.mockResolvedValueOnce([{
      behavioralProfile: {
        creatorDiagnostic: { type: 'Influenciador Natural' },
        adminDiagnostic: { disc: 'I' },
      },
    }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/onboarding/behavioral/result',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().creatorDiagnostic.type).toBe('Influenciador Natural');
  });

  // ─── GET /behavioral/admin/:userId ───

  it('GET /behavioral/admin/:userId — retorna 403 se nao admin', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/onboarding/behavioral/admin/some-user-id',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /behavioral/admin/:userId — admin ve diagnostico completo', async () => {
    const adminToken = getAdminToken(app);
    mockDb.limit
      .mockResolvedValueOnce([{
        behavioralProfile: {
          creatorDiagnostic: { type: 'Influenciador Natural' },
          adminDiagnostic: { disc: 'I', archetype: 'Performer' },
          answeredAt: '2026-03-12T10:00:00Z',
        },
        userId: 'creator-id',
      }])
      .mockResolvedValueOnce([{ name: 'Creator', email: 'creator@test.com' }]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/onboarding/behavioral/admin/creator-id',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.creatorDiagnostic).toBeDefined();
    expect(body.adminDiagnostic).toBeDefined();
  });

  // ─── POST /complete ───

  it('POST /complete — marca onboarding como concluido', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/onboarding/complete',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().nextStep).toBeDefined();
  });
});
