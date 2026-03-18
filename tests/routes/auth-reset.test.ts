import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { buildApp } from '../helpers/build-app.js';

// Mock do @brandly/core (db + schemas)
// Mock do email service
vi.mock('@brandly/api/services/email.js', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

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

describe('Auth Routes — Recuperacao de Senha', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(authRoutes, { prefix: '/api/auth' });
    });

    // Restaura o encadeamento dos metodos mock apos cada clear
    for (const key of Object.keys(mockDb)) {
      if (key !== 'returning' && key !== 'limit') {
        mockDb[key].mockReturnThis();
      }
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  // ─── POST /forgot-password ───

  it('POST /forgot-password — retorna 200 mesmo quando email nao existe (sem enumeracao)', async () => {
    // Simula email nao encontrado no banco
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'nao-existe@example.com' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toContain('Se o email existir');
  });

  it('POST /forgot-password — retorna 200 e registra token quando email existe', async () => {
    // Simula usuario encontrado no banco (primeira query)
    mockDb.limit.mockResolvedValueOnce([{ id: 'user-existente-id' }]);
    // Simula insert do token sem erro
    mockDb.values.mockReturnThis();
    // Simula segunda query para buscar nome do usuario
    mockDb.limit.mockResolvedValueOnce([{ name: 'Creator Teste' }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'creator@brandly.com.br' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toContain('Se o email existir');
  });

  it('POST /forgot-password — retorna 400 sem o campo email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toContain('email');
  });

  // ─── POST /reset-password ───

  it('POST /reset-password — retorna 400 sem o campo token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { newPassword: 'novaSenha123' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toContain('obrigatorios');
  });

  it('POST /reset-password — retorna 400 sem o campo newPassword', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'qualquer-token' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toContain('obrigatorios');
  });

  it('POST /reset-password — retorna 400 com token invalido ou expirado', async () => {
    // Simula busca que nao encontra token valido
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'token-invalido-ou-expirado', newPassword: 'novaSenha123' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toContain('invalido');
  });

  it('POST /reset-password — retorna 400 com senha curta (menos de 6 caracteres)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'token-valido-qualquer', newPassword: '123' },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toContain('6 caracteres');
  });

  it('POST /reset-password — retorna 200 e altera senha com token valido', async () => {
    const agora = new Date();
    const expiracao = new Date(agora.getTime() + 60 * 60 * 1000); // 1h no futuro

    // Simula token valido encontrado no banco
    mockDb.limit.mockResolvedValueOnce([{
      id: 'reset-token-id',
      userId: 'user-id',
      token: 'token-correto-e-valido',
      expiresAt: expiracao,
      usedAt: null,
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'token-correto-e-valido', newPassword: 'novaSenhaSegura' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toContain('sucesso');
  });
});
