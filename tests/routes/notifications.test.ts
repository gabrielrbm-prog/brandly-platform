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
    },
  };
});

import { notificationRoutes } from '@brandly/api/routes/notifications.js';

describe('Notification Routes — /api/notifications', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(notificationRoutes, { prefix: '/api/notifications' });
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /register — retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/register',
      payload: { pushToken: 'ExponentPushToken[abc]' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /register — retorna 400 para token invalido', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/register',
      headers: { authorization: `Bearer ${token}` },
      payload: { pushToken: 'invalid-token' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('invalido');
  });

  it('POST /register — retorna 400 sem pushToken', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/register',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /register — registra token com sucesso', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/register',
      headers: { authorization: `Bearer ${token}` },
      payload: { pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().pushToken).toContain('ExponentPushToken');
  });
});
