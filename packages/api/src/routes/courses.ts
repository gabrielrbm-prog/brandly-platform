import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { courses, lessons, userProgress } from '@brandly/core';
import { eq, and, sql, desc, count } from 'drizzle-orm';

export async function courseRoutes(app: FastifyInstance) {
  // GET /api/courses — lista de modulos da formacao
  app.get('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const allCourses = await db.select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(courses.orderIndex);

    const coursesWithProgress = await Promise.all(
      allCourses.map(async (course) => {
        const [totalResult] = await db.select({
          total: count(),
        })
          .from(lessons)
          .where(and(eq(lessons.courseId, course.id), eq(lessons.isPublished, true)));

        const [completedResult] = await db.select({
          completed: count(),
        })
          .from(userProgress)
          .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
          .where(and(
            eq(userProgress.userId, userId),
            eq(lessons.courseId, course.id),
            eq(lessons.isPublished, true),
          ));

        const totalLessons = totalResult?.total ?? 0;
        const completedLessons = completedResult?.completed ?? 0;
        const progress = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        return {
          ...course,
          totalLessons,
          completedLessons,
          progress: `${progress}%`,
        };
      }),
    );

    const totalLessonsAll = coursesWithProgress.reduce((sum, c) => sum + c.totalLessons, 0);
    const completedLessonsAll = coursesWithProgress.reduce((sum, c) => sum + c.completedLessons, 0);
    const totalProgress = totalLessonsAll > 0
      ? Math.round((completedLessonsAll / totalLessonsAll) * 100)
      : 0;

    return {
      courses: coursesWithProgress,
      totalProgress: `${totalProgress}%`,
      certificateAvailable: totalProgress === 100,
    };
  });

  // GET /api/courses/:id/lessons — aulas do modulo
  app.get<{ Params: { id: string } }>('/:id/lessons', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { userId } = request.user;

    const courseLessons = await db.select()
      .from(lessons)
      .where(and(eq(lessons.courseId, id), eq(lessons.isPublished, true)))
      .orderBy(lessons.orderIndex);

    const completedLessonIds = await db.select({
      lessonId: userProgress.lessonId,
    })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const completedSet = new Set(completedLessonIds.map((r) => r.lessonId));

    const lessonsWithStatus = courseLessons.map((lesson) => ({
      ...lesson,
      completed: completedSet.has(lesson.id),
    }));

    const completedCount = lessonsWithStatus.filter((l) => l.completed).length;
    const progress = courseLessons.length > 0
      ? Math.round((completedCount / courseLessons.length) * 100)
      : 0;

    return {
      courseId: id,
      lessons: lessonsWithStatus,
      progress: `${progress}%`,
    };
  });

  // POST /api/courses/lessons/:id/complete — marcar aula como concluida
  app.post<{ Params: { id: string } }>('/lessons/:id/complete', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { userId } = request.user;

    // Verificar se a aula existe
    const [lesson] = await db.select()
      .from(lessons)
      .where(eq(lessons.id, id));

    if (!lesson) {
      return reply.status(404).send({ error: 'Aula nao encontrada' });
    }

    // Verificar se ja foi completada
    const [existing] = await db.select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.lessonId, id)));

    if (existing) {
      return {
        lessonId: id,
        completedAt: existing.completedAt,
        message: 'Aula ja foi concluida anteriormente',
        courseComplete: false,
      };
    }

    // Inserir progresso
    const [progress] = await db.insert(userProgress).values({
      userId,
      lessonId: id,
    }).returning();

    // Verificar se todas as aulas do curso foram completadas
    const [totalResult] = await db.select({
      total: count(),
    })
      .from(lessons)
      .where(and(eq(lessons.courseId, lesson.courseId), eq(lessons.isPublished, true)));

    const [completedResult] = await db.select({
      completed: count(),
    })
      .from(userProgress)
      .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
      .where(and(
        eq(userProgress.userId, userId),
        eq(lessons.courseId, lesson.courseId),
        eq(lessons.isPublished, true),
      ));

    const courseComplete = (completedResult?.completed ?? 0) >= (totalResult?.total ?? 0);

    return {
      lessonId: id,
      completedAt: progress.completedAt,
      message: 'Aula concluida!',
      courseComplete,
    };
  });

  // GET /api/courses/progress — progresso geral do creator
  app.get('/progress', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const allCourses = await db.select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(courses.orderIndex);

    let totalLessonsAll = 0;
    let completedLessonsAll = 0;

    const modules = await Promise.all(
      allCourses.map(async (course) => {
        const [totalResult] = await db.select({
          total: count(),
        })
          .from(lessons)
          .where(and(eq(lessons.courseId, course.id), eq(lessons.isPublished, true)));

        const [completedResult] = await db.select({
          completed: count(),
        })
          .from(userProgress)
          .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
          .where(and(
            eq(userProgress.userId, userId),
            eq(lessons.courseId, course.id),
            eq(lessons.isPublished, true),
          ));

        const totalLessons = totalResult?.total ?? 0;
        const completedLessons = completedResult?.completed ?? 0;
        const progress = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        totalLessonsAll += totalLessons;
        completedLessonsAll += completedLessons;

        return {
          courseId: course.id,
          title: course.title,
          totalLessons,
          completedLessons,
          progress: `${progress}%`,
        };
      }),
    );

    const overall = totalLessonsAll > 0
      ? Math.round((completedLessonsAll / totalLessonsAll) * 100)
      : 0;

    return {
      overall: `${overall}%`,
      modules,
      completedLessons: completedLessonsAll,
      totalLessons: totalLessonsAll,
    };
  });
}
