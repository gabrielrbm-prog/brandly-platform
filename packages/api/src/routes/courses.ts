import type { FastifyInstance } from 'fastify';

export async function courseRoutes(app: FastifyInstance) {
  // GET /api/courses — lista de modulos da formacao
  app.get('/', async (request, reply) => {
    // TODO: buscar courses ordenados por orderIndex
    // TODO: incluir progresso do creator (% concluido)

    return {
      courses: [],
      totalProgress: '0%',
      certificateAvailable: false,
    };
  });

  // GET /api/courses/:id/lessons — aulas do modulo
  app.get<{ Params: { id: string } }>('/:id/lessons', async (request, reply) => {
    const { id } = request.params;

    // TODO: buscar lessons do curso ordenadas por orderIndex
    // TODO: marcar quais o creator ja completou

    return {
      courseId: id,
      lessons: [],
      progress: '0%',
    };
  });

  // POST /api/courses/lessons/:id/complete — marcar aula como concluida
  app.post<{ Params: { id: string } }>('/lessons/:id/complete', async (request, reply) => {
    const { id } = request.params;

    // TODO: extrair creatorId do JWT
    // TODO: verificar se ja nao esta completa
    // TODO: criar user_progress
    // TODO: verificar se completou o modulo inteiro

    return {
      lessonId: id,
      completedAt: new Date().toISOString(),
      message: 'Aula concluida!',
    };
  });

  // GET /api/courses/progress — progresso geral do creator
  app.get('/progress', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: calcular progresso por modulo e geral

    return {
      overall: '0%',
      modules: [],
      completedLessons: 0,
      totalLessons: 0,
    };
  });
}
