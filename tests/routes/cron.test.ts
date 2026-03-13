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
    distributeMonthlyGlobalPool: vi.fn(),
    syncAllSocialMetrics: vi.fn(),
  };
});

import { distributeMonthlyGlobalPool, syncAllSocialMetrics } from '@brandly/core';
import { cronRoutes } from '@brandly/api/routes/cron.js';

const mockDistribute = distributeMonthlyGlobalPool as ReturnType<typeof vi.fn>;
const mockSyncSocial = syncAllSocialMetrics as ReturnType<typeof vi.fn>;

describe('Cron Routes — /api/cron', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(cronRoutes, { prefix: '/api/cron' });
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  // ─── POST /global-pool — distribuir bonus global mensal ───

  it('POST /global-pool — retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/cron/global-pool',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /global-pool — retorna 403 com token de creator (nao admin)', async () => {
    const token = getTestToken(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/cron/global-pool',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /global-pool — distribui pool com token admin', async () => {
    const adminToken = getAdminToken(app);

    mockDistribute.mockResolvedValueOnce({
      poolAmount: '5000.00',
      distributed: 3,
      period: '2026-03',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/cron/global-pool',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toContain('Pool distribuido');
    expect(body.distributed).toBe(3);
    expect(body.poolAmount).toBe('5000.00');
    expect(mockDistribute).toHaveBeenCalledTimes(1);
  });

  // ─── POST /sync-social — sincronizar metricas sociais ───

  it('POST /sync-social — retorna 401 sem token admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/cron/sync-social',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /sync-social — sincroniza metricas com token admin', async () => {
    const adminToken = getAdminToken(app);

    mockSyncSocial.mockResolvedValueOnce({
      synced: 10,
      errors: 1,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/cron/sync-social',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message).toContain('Sync concluido');
    expect(body.synced).toBe(10);
    expect(body.errors).toBe(1);
    expect(mockSyncSocial).toHaveBeenCalledTimes(1);
  });
});
