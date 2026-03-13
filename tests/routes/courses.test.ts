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
  };
});

import { db } from '@brandly/core';
import { courseRoutes } from '@brandly/api/routes/courses.js';

const mockDb = db as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('Course Routes — /api/courses', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp(async (a) => {
      await a.register(courseRoutes, { prefix: '/api/courses' });
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

  // ─── GET / — listar cursos ───

  it('GET / — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/courses' });
    expect(res.statusCode).toBe(401);
  });

  it('GET / — retorna cursos com progresso', async () => {
    const token = getTestToken(app);

    // A rota faz:
    // 1. select().from(courses).where().orderBy() → lista de cursos
    // 2. Para cada curso: select({total}).from(lessons).where() → total aulas
    // 3. Para cada curso: select({completed}).from(userProgress).innerJoin().where() → completadas

    // orderBy resolve a primeira query (lista de cursos)
    mockDb.orderBy.mockResolvedValueOnce([
      { id: 'c1', title: 'Modulo 1', isPublished: true, orderIndex: 1 },
    ]);

    // Total de aulas do curso c1 — where resolve como array [{ total: 5 }]
    let whereCount = 0;
    mockDb.where.mockImplementation(function (this: typeof mockDb) {
      whereCount++;
      if (whereCount === 1) {
        // Primeira where (courses.isPublished) → encadeia com orderBy
        return this;
      }
      if (whereCount === 2) {
        // Total lessons
        return [{ total: 5 }];
      }
      if (whereCount === 3) {
        // Completed lessons
        return [{ completed: 2 }];
      }
      return this;
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/courses',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.courses).toBeDefined();
    expect(body.totalProgress).toBeDefined();
    expect(body.certificateAvailable).toBeDefined();
  });

  // ─── GET /:id/lessons — aulas do modulo ───

  it('GET /:id/lessons — retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/courses/c1/lessons' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /:id/lessons — retorna aulas com status de conclusao', async () => {
    const token = getTestToken(app);

    // 1. select().from(lessons).where().orderBy() → lista de aulas
    mockDb.orderBy.mockResolvedValueOnce([
      { id: 'l1', courseId: 'c1', title: 'Aula 1', orderIndex: 1, isPublished: true },
      { id: 'l2', courseId: 'c1', title: 'Aula 2', orderIndex: 2, isPublished: true },
    ]);

    // 2. select({lessonId}).from(userProgress).where() → aulas completadas
    let whereCount = 0;
    mockDb.where.mockImplementation(function (this: typeof mockDb) {
      whereCount++;
      if (whereCount === 1) {
        // lessons where → encadeia com orderBy
        return this;
      }
      if (whereCount === 2) {
        // userProgress where → resolve como array
        return [{ lessonId: 'l1' }];
      }
      return this;
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/courses/c1/lessons',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.courseId).toBe('c1');
    expect(body.lessons).toHaveLength(2);
    expect(body.lessons[0].completed).toBe(true);
    expect(body.lessons[1].completed).toBe(false);
    expect(body.progress).toBe('50%');
  });

  // ─── POST /lessons/:id/complete — marcar aula como concluida ───

  it('POST /lessons/:id/complete — retorna 404 se aula nao encontrada', async () => {
    const token = getTestToken(app);

    // select().from(lessons).where() → []
    mockDb.where.mockResolvedValueOnce([]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/courses/lessons/l-inexistente/complete',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain('Aula nao encontrada');
  });

  it('POST /lessons/:id/complete — marca aula como concluida', async () => {
    const token = getTestToken(app);

    let whereCount = 0;
    mockDb.where.mockImplementation(function (this: typeof mockDb) {
      whereCount++;
      if (whereCount === 1) {
        // Buscar aula — select().from(lessons).where()
        return [{ id: 'l1', courseId: 'c1', isPublished: true }];
      }
      if (whereCount === 2) {
        // Verificar se ja completada — select().from(userProgress).where()
        return [];
      }
      if (whereCount === 3) {
        // Total lessons do curso
        return [{ total: 5 }];
      }
      if (whereCount === 4) {
        // Completed lessons do curso
        return [{ completed: 3 }];
      }
      return this;
    });

    // insert().values().returning()
    mockDb.returning.mockResolvedValueOnce([{
      userId: 'test-user-id',
      lessonId: 'l1',
      completedAt: new Date().toISOString(),
    }]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/courses/lessons/l1/complete',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.lessonId).toBe('l1');
    expect(body.message).toContain('concluida');
  });

  // ─── GET /progress — progresso geral ───

  it('GET /progress — retorna progresso geral do creator', async () => {
    const token = getTestToken(app);

    // 1. select().from(courses).where().orderBy() → lista de cursos
    mockDb.orderBy.mockResolvedValueOnce([
      { id: 'c1', title: 'Modulo 1', isPublished: true, orderIndex: 1 },
    ]);

    let whereCount = 0;
    mockDb.where.mockImplementation(function (this: typeof mockDb) {
      whereCount++;
      if (whereCount === 1) {
        return this; // courses where → encadeia com orderBy
      }
      if (whereCount === 2) {
        return [{ total: 10 }]; // Total lessons
      }
      if (whereCount === 3) {
        return [{ completed: 7 }]; // Completed lessons
      }
      return this;
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/courses/progress',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.overall).toBe('70%');
    expect(body.modules).toBeDefined();
    expect(body.completedLessons).toBe(7);
    expect(body.totalLessons).toBe(10);
  });
});
