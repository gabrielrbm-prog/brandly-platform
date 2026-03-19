import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  courses,
  lessons,
  userProgress,
  liveEvents,
  successCases,
  users,
  levels,
} from '@brandly/core';
import { eq, and, sql, desc, count, isNotNull } from 'drizzle-orm';

// ============================================================
// Helpers
// ============================================================

function parsePage(page?: number, limit?: number) {
  const p = Math.max(1, Number(page ?? 1));
  const l = Math.min(100, Math.max(1, Number(limit ?? 20)));
  return { page: p, limit: l, offset: (p - 1) * l };
}

/**
 * Escapa um valor para uso em CSV:
 * - Se contiver virgula, aspas ou quebra de linha, envolve em aspas duplas
 * - Aspas duplas internas sao dobradas ("" = aspa literal)
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values: unknown[]): string {
  return values.map(csvEscape).join(',');
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(','), ...rows.map(buildCsvRow)];
  return lines.join('\n');
}

// ============================================================
// Interfaces para os bodies e query strings
// ============================================================

interface PaginationQuery {
  page?: number;
  limit?: number;
}

interface CreateCourseBody {
  title: string;
  description?: string;
  isPublished?: boolean;
}

interface UpdateCourseBody {
  title?: string;
  description?: string;
  orderIndex?: number;
  isPublished?: boolean;
}

interface CreateLessonBody {
  title: string;
  videoUrl?: string;
  duration?: number;
  orderIndex?: number;
  isPublished?: boolean;
}

interface UpdateLessonBody {
  title?: string;
  videoUrl?: string;
  duration?: number;
  orderIndex?: number;
  isPublished?: boolean;
}

interface CreateLiveBody {
  title: string;
  instructorName?: string;
  scheduledAt: string;
  meetingUrl?: string;
}

interface UpdateLiveBody {
  title?: string;
  instructorName?: string;
  scheduledAt?: string;
  meetingUrl?: string;
}

interface CreateCaseBody {
  creatorId?: string;
  title: string;
  story: string;
  earnings?: string;
  isPublished?: boolean;
}

interface UpdateCaseBody {
  title?: string;
  story?: string;
  earnings?: string;
  isPublished?: boolean;
}

interface SendNotificationBody {
  title: string;
  body: string;
  target: 'all' | 'level' | 'individual';
  levelFilter?: string;
  userId?: string;
}

interface ExportCreatorsQuery {
  format?: string;
}

interface ExportPaymentsQuery {
  format?: string;
  period?: string;
}

interface ExportVideosQuery {
  format?: string;
}

// ============================================================
// Rotas
// ============================================================

export async function adminOperationsRoutes(app: FastifyInstance) {
  // ==========================================================
  // LMS — GESTAO DE CURSOS
  // ==========================================================

  // ----------------------------------------------------------
  // GET /api/admin/courses — lista todos os cursos com estatisticas
  // ----------------------------------------------------------
  app.get<{ Querystring: PaginationQuery }>('/courses', {
    preHandler: [app.requireAdmin],
  }, async (request, _reply) => {
    const { page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    const allCourses = await db
      .select()
      .from(courses)
      .orderBy(courses.orderIndex)
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db.select({ qty: count() }).from(courses);

    // Para cada curso calcula: total de aulas, creators inscritos (com progresso) e taxa de conclusao
    const coursesWithStats = await Promise.all(
      allCourses.map(async (course) => {
        // Total de aulas no curso
        const [lessonsRow] = await db
          .select({ total: count() })
          .from(lessons)
          .where(eq(lessons.courseId, course.id));

        const lessonsCount = Number(lessonsRow?.total ?? 0);

        // Creators unicos com ao menos uma aula concluida neste curso
        const enrolledResult = await db.execute(
          sql`
            SELECT COUNT(DISTINCT up.user_id)::int AS total
            FROM user_progress up
            INNER JOIN lessons l ON up.lesson_id = l.id
            WHERE l.course_id = ${course.id}
          `,
        );
        const enrolledCreators = Number((enrolledResult as any[])[0]?.total ?? 0);

        let completionRate = 0;
        if (lessonsCount > 0 && enrolledCreators > 0) {
          // Creators que completaram todas as aulas do curso
          const completedResult = await db.execute(
            sql`
              SELECT COUNT(*)::int AS total
              FROM (
                SELECT up.user_id
                FROM user_progress up
                INNER JOIN lessons l ON up.lesson_id = l.id
                WHERE l.course_id = ${course.id}
                GROUP BY up.user_id
                HAVING COUNT(DISTINCT up.lesson_id) >= ${lessonsCount}
              ) AS completed_creators
            `,
          );
          const completedCount = Number((completedResult as any[])[0]?.total ?? 0);
          completionRate = Math.round((completedCount / enrolledCreators) * 100);
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          isPublished: course.isPublished,
          lessonsCount,
          enrolledCreators,
          completionRate,
          createdAt: course.createdAt,
        };
      }),
    );

    return {
      courses: coursesWithStats,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/courses — cria um novo curso
  // ----------------------------------------------------------
  app.post<{ Body: CreateCourseBody }>('/courses', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { title, description, isPublished = false } = request.body;

    if (!title?.trim()) {
      return reply.status(400).send({ error: 'O titulo do curso e obrigatorio' });
    }

    // Determina o proximo orderIndex
    const maxOrderResult = await db.execute(
      sql`SELECT COALESCE(MAX(order_index), 0)::int AS max_order FROM courses`,
    );
    const nextOrderIndex = Number((maxOrderResult as any[])[0]?.max_order ?? 0) + 1;

    const [created] = await db
      .insert(courses)
      .values({
        title: title.trim(),
        description: description?.trim() ?? null,
        orderIndex: nextOrderIndex,
        isPublished,
      })
      .returning();

    app.log.info({ courseId: created.id }, 'Novo curso criado pelo admin');

    return reply.status(201).send({
      course: created,
      message: 'Curso criado com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/courses/:id — atualiza um curso
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateCourseBody }>('/courses/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { title, description, orderIndex, isPublished } = request.body;

    const [existing] = await db.select().from(courses).where(eq(courses.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Curso nao encontrado' });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim() || null;
    if (orderIndex !== undefined) updateData.orderIndex = Number(orderIndex);
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, id))
      .returning();

    app.log.info({ courseId: id }, 'Curso atualizado pelo admin');

    return { course: updated, message: 'Curso atualizado com sucesso' };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/courses/:id/toggle-publish — publica ou despublica
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string } }>('/courses/:id/toggle-publish', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select().from(courses).where(eq(courses.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Curso nao encontrado' });
    }

    const newState = !existing.isPublished;

    const [updated] = await db
      .update(courses)
      .set({ isPublished: newState })
      .where(eq(courses.id, id))
      .returning();

    app.log.info({ courseId: id, isPublished: newState }, 'Publicacao do curso alterada pelo admin');

    return {
      course: updated,
      message: newState ? 'Curso publicado com sucesso' : 'Curso despublicado com sucesso',
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/courses/:id/lessons — lista aulas de um curso
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/courses/:id/lessons', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      return reply.status(404).send({ error: 'Curso nao encontrado' });
    }

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, id))
      .orderBy(lessons.orderIndex);

    // Para cada aula, conta quantos creators a concluiram
    const lessonsWithStats = await Promise.all(
      courseLessons.map(async (lesson) => {
        const [completedRow] = await db
          .select({ total: count() })
          .from(userProgress)
          .where(eq(userProgress.lessonId, lesson.id));

        return {
          id: lesson.id,
          title: lesson.title,
          contentType: 'video', // campo semantico — todos os conteudos sao videos
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          orderIndex: lesson.orderIndex,
          isPublished: lesson.isPublished,
          completedBy: Number(completedRow?.total ?? 0),
          createdAt: lesson.createdAt,
        };
      }),
    );

    return {
      courseId: id,
      courseTitle: course.title,
      lessons: lessonsWithStats,
      total: lessonsWithStats.length,
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/courses/:id/lessons — cria aula no curso
  // ----------------------------------------------------------
  app.post<{ Params: { id: string }; Body: CreateLessonBody }>('/courses/:id/lessons', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { title, videoUrl, duration, orderIndex, isPublished = false } = request.body;

    if (!title?.trim()) {
      return reply.status(400).send({ error: 'O titulo da aula e obrigatorio' });
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      return reply.status(404).send({ error: 'Curso nao encontrado' });
    }

    // Determina orderIndex automatico se nao fornecido
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const maxOrderResult = await db.execute(
        sql`SELECT COALESCE(MAX(order_index), 0)::int AS max_order FROM lessons WHERE course_id = ${id}`,
      );
      finalOrderIndex = Number((maxOrderResult as any[])[0]?.max_order ?? 0) + 1;
    }

    const [created] = await db
      .insert(lessons)
      .values({
        courseId: id,
        title: title.trim(),
        videoUrl: videoUrl ?? null,
        duration: duration ?? null,
        orderIndex: finalOrderIndex,
        isPublished,
      })
      .returning();

    app.log.info({ lessonId: created.id, courseId: id }, 'Nova aula criada pelo admin');

    return reply.status(201).send({
      lesson: created,
      message: 'Aula criada com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/lessons/:id — atualiza uma aula
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateLessonBody }>('/lessons/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { title, videoUrl, duration, orderIndex, isPublished } = request.body;

    const [existing] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Aula nao encontrada' });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
    if (duration !== undefined) updateData.duration = duration;
    if (orderIndex !== undefined) updateData.orderIndex = Number(orderIndex);
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, id))
      .returning();

    app.log.info({ lessonId: id }, 'Aula atualizada pelo admin');

    return { lesson: updated, message: 'Aula atualizada com sucesso' };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/lessons/:id/toggle-publish — publica ou despublica aula
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string } }>('/lessons/:id/toggle-publish', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Aula nao encontrada' });
    }

    const newState = !existing.isPublished;

    const [updated] = await db
      .update(lessons)
      .set({ isPublished: newState })
      .where(eq(lessons.id, id))
      .returning();

    app.log.info({ lessonId: id, isPublished: newState }, 'Publicacao da aula alterada pelo admin');

    return {
      lesson: updated,
      message: newState ? 'Aula publicada com sucesso' : 'Aula despublicada com sucesso',
    };
  });

  // ----------------------------------------------------------
  // GET /api/admin/courses/:id/progress — progresso dos creators no curso
  // ----------------------------------------------------------
  app.get<{ Params: { id: string } }>('/courses/:id/progress', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      return reply.status(404).send({ error: 'Curso nao encontrado' });
    }

    // Total de aulas do curso (todas, para o admin ver o quadro completo)
    const [totalLessonsRow] = await db
      .select({ total: count() })
      .from(lessons)
      .where(eq(lessons.courseId, id));

    const totalLessons = Number(totalLessonsRow?.total ?? 0);

    if (totalLessons === 0) {
      return { progress: [], totalLessons, message: 'Este curso nao possui aulas cadastradas' };
    }

    // Agrega progresso por creator para este curso
    const progressRows = await db.execute(
      sql`
        SELECT
          u.id          AS creator_id,
          u.name        AS creator_name,
          COUNT(DISTINCT up.lesson_id)::int AS completed_lessons,
          MAX(up.completed_at) AS last_activity_at
        FROM user_progress up
        INNER JOIN lessons l   ON up.lesson_id = l.id
        INNER JOIN users u     ON up.user_id   = u.id
        WHERE l.course_id = ${id}
        GROUP BY u.id, u.name
        ORDER BY completed_lessons DESC, last_activity_at DESC
      `,
    );

    const progress = (progressRows as any[]).map((row) => ({
      creatorId: row.creator_id as string,
      creatorName: row.creator_name as string,
      completedLessons: Number(row.completed_lessons),
      totalLessons,
      percentage: Math.round((Number(row.completed_lessons) / totalLessons) * 100),
      lastActivityAt: row.last_activity_at as string,
    }));

    return { progress, totalLessons };
  });

  // ==========================================================
  // COMUNIDADE — GESTAO DE LIVES
  // ==========================================================

  // ----------------------------------------------------------
  // GET /api/admin/lives — lista todas as lives com paginacao
  // ----------------------------------------------------------
  app.get<{ Querystring: PaginationQuery }>('/lives', {
    preHandler: [app.requireAdmin],
  }, async (request, _reply) => {
    const { page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    const rows = await db
      .select()
      .from(liveEvents)
      .orderBy(desc(liveEvents.scheduledAt))
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db.select({ qty: count() }).from(liveEvents);

    const lives = rows.map((live) => ({
      id: live.id,
      title: live.title,
      instructorName: live.instructorName,
      scheduledAt: live.scheduledAt,
      meetingUrl: live.meetingUrl,
      // Status derivado da data agendada
      status: new Date(live.scheduledAt) > new Date() ? 'agendada' : 'realizada',
      createdAt: live.createdAt,
    }));

    return {
      lives,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/lives — cria evento de live
  // ----------------------------------------------------------
  app.post<{ Body: CreateLiveBody }>('/lives', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { title, instructorName, scheduledAt, meetingUrl } = request.body;

    if (!title?.trim()) {
      return reply.status(400).send({ error: 'O titulo da live e obrigatorio' });
    }

    if (!scheduledAt) {
      return reply.status(400).send({ error: 'A data/hora de agendamento e obrigatoria' });
    }

    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return reply.status(400).send({ error: 'Data/hora de agendamento invalida. Use formato ISO 8601' });
    }

    const [created] = await db
      .insert(liveEvents)
      .values({
        title: title.trim(),
        instructorName: instructorName?.trim() ?? null,
        scheduledAt: parsedDate,
        meetingUrl: meetingUrl?.trim() ?? null,
      })
      .returning();

    app.log.info({ liveId: created.id }, 'Nova live criada pelo admin');

    return reply.status(201).send({
      live: created,
      message: 'Live agendada com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/lives/:id — atualiza evento de live
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateLiveBody }>('/lives/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { title, instructorName, scheduledAt, meetingUrl } = request.body;

    const [existing] = await db.select().from(liveEvents).where(eq(liveEvents.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Live nao encontrada' });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (instructorName !== undefined) updateData.instructorName = instructorName.trim() || null;
    if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl.trim() || null;
    if (scheduledAt !== undefined) {
      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return reply.status(400).send({ error: 'Data/hora invalida. Use formato ISO 8601' });
      }
      updateData.scheduledAt = parsedDate;
    }

    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db
      .update(liveEvents)
      .set(updateData)
      .where(eq(liveEvents.id, id))
      .returning();

    app.log.info({ liveId: id }, 'Live atualizada pelo admin');

    return { live: updated, message: 'Live atualizada com sucesso' };
  });

  // ----------------------------------------------------------
  // DELETE /api/admin/lives/:id — remove evento de live
  // ----------------------------------------------------------
  app.delete<{ Params: { id: string } }>('/lives/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { userId: adminId } = request.user;

    const [existing] = await db.select().from(liveEvents).where(eq(liveEvents.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Live nao encontrada' });
    }

    await db.delete(liveEvents).where(eq(liveEvents.id, id));

    app.log.info({ liveId: id, adminId }, 'Live removida pelo admin');

    return { message: 'Live removida com sucesso' };
  });

  // ==========================================================
  // COMUNIDADE — GESTAO DE CASES DE SUCESSO
  // ==========================================================

  // ----------------------------------------------------------
  // GET /api/admin/cases — lista todos os cases (publicados e nao)
  // ----------------------------------------------------------
  app.get<{ Querystring: PaginationQuery }>('/cases', {
    preHandler: [app.requireAdmin],
  }, async (request, _reply) => {
    const { page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    // Left join pois creatorId pode ser nulo no schema
    const rows = await db.execute(
      sql`
        SELECT
          sc.id,
          sc.creator_id,
          sc.title,
          sc.story,
          sc.earnings,
          sc.is_published,
          sc.created_at,
          u.name AS creator_name
        FROM success_cases sc
        LEFT JOIN users u ON sc.creator_id = u.id
        ORDER BY sc.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
    );

    const [totalRow] = await db.select({ qty: count() }).from(successCases);

    const cases = (rows as any[]).map((c) => ({
      id: c.id as string,
      creatorId: c.creator_id as string | null,
      creatorName: c.creator_name as string | null,
      title: c.title as string,
      story: c.story as string,
      earnings: c.earnings as string | null,
      isPublished: c.is_published as boolean,
      createdAt: c.created_at as string,
    }));

    return {
      cases,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
    };
  });

  // ----------------------------------------------------------
  // POST /api/admin/cases — cria case de sucesso
  // ----------------------------------------------------------
  app.post<{ Body: CreateCaseBody }>('/cases', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { creatorId, title, story, earnings, isPublished = false } = request.body;

    if (!title?.trim()) {
      return reply.status(400).send({ error: 'O titulo do case e obrigatorio' });
    }
    if (!story?.trim()) {
      return reply.status(400).send({ error: 'A historia do case e obrigatoria' });
    }

    // Valida creatorId se fornecido
    if (creatorId) {
      const [creator] = await db.select({ id: users.id }).from(users).where(eq(users.id, creatorId));
      if (!creator) {
        return reply.status(400).send({ error: 'Creator nao encontrado' });
      }
    }

    const [created] = await db
      .insert(successCases)
      .values({
        creatorId: creatorId ?? null,
        title: title.trim(),
        story: story.trim(),
        earnings: earnings ?? null,
        isPublished,
      })
      .returning();

    app.log.info({ caseId: created.id }, 'Case de sucesso criado pelo admin');

    return reply.status(201).send({
      case: created,
      message: 'Case de sucesso criado com sucesso',
    });
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/cases/:id — atualiza case de sucesso
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: UpdateCaseBody }>('/cases/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { title, story, earnings, isPublished } = request.body;

    const [existing] = await db.select().from(successCases).where(eq(successCases.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Case nao encontrado' });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (story !== undefined) updateData.story = story.trim();
    if (earnings !== undefined) updateData.earnings = earnings || null;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({ error: 'Nenhum campo para atualizar foi enviado' });
    }

    const [updated] = await db
      .update(successCases)
      .set(updateData)
      .where(eq(successCases.id, id))
      .returning();

    app.log.info({ caseId: id }, 'Case atualizado pelo admin');

    return { case: updated, message: 'Case atualizado com sucesso' };
  });

  // ----------------------------------------------------------
  // PATCH /api/admin/cases/:id/toggle-publish — publica ou despublica case
  // ----------------------------------------------------------
  app.patch<{ Params: { id: string } }>('/cases/:id/toggle-publish', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;

    const [existing] = await db.select().from(successCases).where(eq(successCases.id, id));
    if (!existing) {
      return reply.status(404).send({ error: 'Case nao encontrado' });
    }

    const newState = !existing.isPublished;

    const [updated] = await db
      .update(successCases)
      .set({ isPublished: newState })
      .where(eq(successCases.id, id))
      .returning();

    app.log.info({ caseId: id, isPublished: newState }, 'Publicacao do case alterada pelo admin');

    return {
      case: updated,
      message: newState ? 'Case publicado com sucesso' : 'Case despublicado com sucesso',
    };
  });

  // ==========================================================
  // NOTIFICACOES PUSH
  // ==========================================================

  // ----------------------------------------------------------
  // POST /api/admin/notifications/send — envia push notification
  // ----------------------------------------------------------
  app.post<{ Body: SendNotificationBody }>('/notifications/send', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { title, body, target, levelFilter, userId: targetUserId } = request.body;
    const { userId: adminId } = request.user;

    if (!title?.trim() || !body?.trim()) {
      return reply.status(400).send({ error: 'Titulo e corpo da notificacao sao obrigatorios' });
    }

    if (!['all', 'level', 'individual'].includes(target)) {
      return reply.status(400).send({
        error: 'target invalido. Use: "all", "level" ou "individual"',
      });
    }

    if (target === 'level' && !levelFilter) {
      return reply.status(400).send({ error: 'levelFilter e obrigatorio quando target = "level"' });
    }

    if (target === 'individual' && !targetUserId) {
      return reply.status(400).send({ error: 'userId e obrigatorio quando target = "individual"' });
    }

    // Busca os tokens push dos destinatarios
    let recipients: Array<{ id: string; name: string; pushToken: string | null }>;

    if (target === 'all') {
      recipients = await db
        .select({ id: users.id, name: users.name, pushToken: users.pushToken })
        .from(users)
        .where(isNotNull(users.pushToken));
    } else if (target === 'individual') {
      recipients = await db
        .select({ id: users.id, name: users.name, pushToken: users.pushToken })
        .from(users)
        .where(and(eq(users.id, targetUserId!), isNotNull(users.pushToken)));
    } else {
      // target === 'level' — filtra por nivel via join
      recipients = await db
        .select({ id: users.id, name: users.name, pushToken: users.pushToken })
        .from(users)
        .innerJoin(levels, eq(users.levelId, levels.id))
        .where(
          and(
            isNotNull(users.pushToken),
            sql`${levels.name}::text = ${levelFilter}`,
          ),
        );
    }

    const withTokens = recipients.filter((r) => r.pushToken);

    app.log.info(
      {
        adminId,
        target,
        levelFilter: levelFilter ?? null,
        targetUserId: targetUserId ?? null,
        recipientsFound: withTokens.length,
        title,
      },
      'Envio de notificacao push solicitado pelo admin',
    );

    // Infraestrutura de push (Expo/FCM) ainda nao configurada.
    // Os tokens estao salvos em users.push_token mas o servico de envio
    // (Expo Push API / Firebase) precisa ser integrado.
    // Por ora registramos o log e retornamos os dados para monitoramento.
    if (withTokens.length === 0) {
      return reply.status(200).send({
        success: true,
        sent: 0,
        message: 'Nenhum destinatario com token push encontrado. Verifique se o app mobile foi instalado pelos creators.',
        details: {
          target,
          levelFilter: levelFilter ?? null,
          targetUserId: targetUserId ?? null,
        },
      });
    }

    // TODO: integrar com Expo Push API (https://exp.host/--/api/v2/push/send)
    // Payload por token: { to: token, title, body, data: { adminId } }
    app.log.warn(
      { tokens: withTokens.map((r) => r.pushToken), title, body },
      'PUSH NAO ENVIADO — servico de push nao configurado. Tokens disponiveis para integracao.',
    );

    return reply.status(200).send({
      success: true,
      sent: 0,
      recipientsWithTokens: withTokens.length,
      message: `${withTokens.length} token(s) encontrado(s), mas o servico de envio push (Expo/FCM) ainda nao esta configurado. Integre o envio em adminOperationsRoutes > /notifications/send.`,
      details: {
        target,
        levelFilter: levelFilter ?? null,
        targetUserId: targetUserId ?? null,
      },
    });
  });

  // ==========================================================
  // EXPORTACAO DE DADOS (CSV)
  // ==========================================================

  // ----------------------------------------------------------
  // GET /api/admin/export/creators?format=csv
  // ----------------------------------------------------------
  app.get<{ Querystring: ExportCreatorsQuery }>('/export/creators', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    const rows = await db.execute(
      sql`
        SELECT
          u.name,
          u.email,
          l.name        AS nivel,
          u.status,
          u.onboarding_completed,
          u.created_at,
          u.instagram_handle,
          u.tiktok_handle,
          u.referral_code
        FROM users u
        LEFT JOIN levels l ON u.level_id = l.id
        WHERE u.role = 'creator'
        ORDER BY u.created_at DESC
      `,
    );

    const headers = ['nome', 'email', 'nivel', 'status', 'onboarding', 'data_cadastro', 'instagram', 'tiktok', 'referral_code'];
    const csvRows = (rows as any[]).map((r) => [
      r.name,
      r.email,
      r.nivel ?? '',
      r.status,
      r.onboarding_completed ? 'sim' : 'nao',
      r.created_at,
      r.instagram_handle ?? '',
      r.tiktok_handle ?? '',
      r.referral_code ?? '',
    ]);

    const csv = buildCsv(headers, csvRows);

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="creators_${new Date().toISOString().slice(0, 10)}.csv"`)
      .send(csv);
  });

  // ----------------------------------------------------------
  // GET /api/admin/export/payments?format=csv&period=2026-03
  // ----------------------------------------------------------
  app.get<{ Querystring: ExportPaymentsQuery }>('/export/payments', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { period } = request.query;

    // Valida formato do periodo se fornecido: YYYY-MM
    if (period && !/^\d{4}-\d{2}$/.test(period)) {
      return reply.status(400).send({ error: 'Formato de periodo invalido. Use YYYY-MM (ex: 2026-03)' });
    }

    const rows = period
      ? await db.execute(
          sql`
            SELECT
              u.name  AS creator,
              p.type  AS tipo,
              p.amount AS valor,
              p.description AS descricao,
              p.created_at  AS data
            FROM payments p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.period = ${period}
            ORDER BY p.created_at DESC
          `,
        )
      : await db.execute(
          sql`
            SELECT
              u.name  AS creator,
              p.type  AS tipo,
              p.amount AS valor,
              p.description AS descricao,
              p.created_at  AS data
            FROM payments p
            INNER JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
          `,
        );

    const headers = ['creator', 'tipo', 'valor', 'descricao', 'data'];
    const csvRows = (rows as any[]).map((r) => [
      r.creator,
      r.tipo,
      r.valor,
      r.descricao ?? '',
      r.data,
    ]);

    const csv = buildCsv(headers, csvRows);
    const filename = period
      ? `pagamentos_${period}.csv`
      : `pagamentos_${new Date().toISOString().slice(0, 10)}.csv`;

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // ----------------------------------------------------------
  // GET /api/admin/export/videos?format=csv
  // ----------------------------------------------------------
  app.get<{ Querystring: ExportVideosQuery }>('/export/videos', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    const rows = await db.execute(
      sql`
        SELECT
          u.name          AS creator,
          b.name          AS marca,
          v.platform      AS plataforma,
          v.status,
          v.rejection_reason AS motivo_rejeicao,
          v.payment_amount   AS pagamento,
          v.created_at       AS data
        FROM videos v
        INNER JOIN users  u ON v.creator_id = u.id
        INNER JOIN brands b ON v.brand_id   = b.id
        ORDER BY v.created_at DESC
      `,
    );

    const headers = ['creator', 'marca', 'plataforma', 'status', 'motivo_rejeicao', 'pagamento', 'data'];
    const csvRows = (rows as any[]).map((r) => [
      r.creator,
      r.marca,
      r.plataforma ?? '',
      r.status,
      r.motivo_rejeicao ?? '',
      r.pagamento ?? '',
      r.data,
    ]);

    const csv = buildCsv(headers, csvRows);

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="videos_${new Date().toISOString().slice(0, 10)}.csv"`)
      .send(csv);
  });
}
