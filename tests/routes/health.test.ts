import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { buildApp } from '../helpers/build-app.js';
import { healthRoutes } from '@brandly/api/routes/health.js';

describe('Health Routes — /api', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp(async (a) => {
      await a.register(healthRoutes, { prefix: '/api' });
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health — retorna status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('brandly-api');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /health — nao requer autenticacao', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
  });
});
