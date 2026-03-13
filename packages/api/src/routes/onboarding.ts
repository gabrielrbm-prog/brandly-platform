import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { users, creatorProfiles } from '@brandly/core';
import { ONBOARDING_QUESTIONS, analyzeBehavioralProfile } from '@brandly/core';
import type { OnboardingAnswers } from '@brandly/core';
import { eq } from 'drizzle-orm';

interface ProfileBody {
  preferredCategories: string[];
  contentStyle: string;
  experienceLevel: string;
  availableHoursPerDay: number;
  motivations: string[];
}

interface SocialBody {
  platform: 'instagram' | 'tiktok';
  handle: string;
}

const VALID_CATEGORIES = ['beauty', 'supplements', 'home', 'tech', 'fashion', 'food'];
const VALID_STYLES = ['lifestyle', 'review', 'tutorial', 'unboxing', 'pov', 'storytelling'];
const VALID_LEVELS = ['none', 'beginner', 'intermediate', 'advanced'];

export async function onboardingRoutes(app: FastifyInstance) {
  // POST /api/onboarding/profile
  app.post<{ Body: ProfileBody }>('/profile', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { preferredCategories, contentStyle, experienceLevel, availableHoursPerDay, motivations } = request.body;

    if (!preferredCategories?.length) {
      return reply.status(400).send({ error: 'Selecione ao menos 1 categoria de marca' });
    }

    const invalidCats = preferredCategories.filter(c => !VALID_CATEGORIES.includes(c));
    if (invalidCats.length) {
      return reply.status(400).send({ error: `Categorias invalidas: ${invalidCats.join(', ')}` });
    }

    if (contentStyle && !VALID_STYLES.includes(contentStyle)) {
      return reply.status(400).send({ error: `Estilo invalido. Use: ${VALID_STYLES.join(', ')}` });
    }

    if (experienceLevel && !VALID_LEVELS.includes(experienceLevel)) {
      return reply.status(400).send({ error: `Nivel invalido. Use: ${VALID_LEVELS.join(', ')}` });
    }

    // Upsert creator profile
    const existing = await db.select({ id: creatorProfiles.id })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db.update(creatorProfiles)
        .set({ preferredCategories, contentStyle, experienceLevel, availableHoursPerDay, motivations })
        .where(eq(creatorProfiles.userId, userId));
    } else {
      await db.insert(creatorProfiles).values({
        userId,
        preferredCategories,
        contentStyle,
        experienceLevel,
        availableHoursPerDay,
        motivations,
      });
    }

    return { message: 'Perfil salvo com sucesso' };
  });

  // POST /api/onboarding/social
  app.post<{ Body: SocialBody }>('/social', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { platform, handle } = request.body;

    if (!platform || !handle) {
      return reply.status(400).send({ error: 'platform e handle sao obrigatorios' });
    }

    if (!['instagram', 'tiktok'].includes(platform)) {
      return reply.status(400).send({ error: 'platform deve ser instagram ou tiktok' });
    }

    const field = platform === 'instagram'
      ? { instagramHandle: handle }
      : { tiktokHandle: handle };

    await db.update(users).set(field).where(eq(users.id, userId));

    return { message: `${platform} conectado com sucesso`, platform, handle };
  });

  // GET /api/onboarding/behavioral/questions — retorna as 20 perguntas
  app.get('/behavioral/questions', {
    preHandler: [app.authenticate],
  }, async (_request, reply) => {
    return {
      questions: ONBOARDING_QUESTIONS,
      total: ONBOARDING_QUESTIONS.length,
      estimatedMinutes: 4,
    };
  });

  // POST /api/onboarding/behavioral — envia respostas e recebe diagnostico IA
  app.post<{ Body: { answers: OnboardingAnswers } }>('/behavioral', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { answers } = request.body;

    if (!answers || Object.keys(answers).length < 15) {
      return reply.status(400).send({
        error: 'Responda ao menos 15 das 20 perguntas para uma analise precisa',
      });
    }

    // Buscar nome do usuario
    const [user] = await db.select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: 'Usuario nao encontrado' });
    }

    // Analisar com IA
    const profile = await analyzeBehavioralProfile(answers, user.name);

    // Salvar no creatorProfiles.behavioralProfile
    const existing = await db.select({ id: creatorProfiles.id })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId))
      .limit(1);

    const profileData = {
      ...profile,
      answeredAt: new Date().toISOString(),
      answersRaw: answers,
    };

    if (existing.length > 0) {
      await db.update(creatorProfiles)
        .set({ behavioralProfile: profileData })
        .where(eq(creatorProfiles.userId, userId));
    } else {
      await db.insert(creatorProfiles).values({
        userId,
        behavioralProfile: profileData,
      });
    }

    return {
      message: 'Perfil comportamental analisado com sucesso!',
      creatorDiagnostic: profile.creatorDiagnostic,
    };
  });

  // GET /api/onboarding/behavioral/result — retorna diagnostico salvo
  app.get('/behavioral/result', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const [profile] = await db.select({ behavioralProfile: creatorProfiles.behavioralProfile })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId))
      .limit(1);

    if (!profile?.behavioralProfile) {
      return reply.status(404).send({ error: 'Perfil comportamental nao encontrado. Complete o onboarding.' });
    }

    const data = profile.behavioralProfile as Record<string, unknown>;
    return {
      creatorDiagnostic: data.creatorDiagnostic,
    };
  });

  // GET /api/onboarding/behavioral/admin/:userId — diagnostico completo para admin
  app.get<{ Params: { userId: string } }>('/behavioral/admin/:userId', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { userId } = request.params;

    const [profile] = await db.select({
      behavioralProfile: creatorProfiles.behavioralProfile,
      userId: creatorProfiles.userId,
    })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId))
      .limit(1);

    if (!profile?.behavioralProfile) {
      return reply.status(404).send({ error: 'Perfil comportamental nao encontrado para este creator' });
    }

    const [user] = await db.select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const data = profile.behavioralProfile as Record<string, unknown>;
    return {
      user: { id: userId, name: user?.name, email: user?.email },
      creatorDiagnostic: data.creatorDiagnostic,
      adminDiagnostic: data.adminDiagnostic,
      answeredAt: data.answeredAt,
    };
  });

  // POST /api/onboarding/complete
  app.post('/complete', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    await db.update(users)
      .set({ onboardingCompleted: true })
      .where(eq(users.id, userId));

    return {
      message: 'Onboarding concluido! Voce ja pode comecar a produzir videos.',
      nextStep: 'Escolha uma marca e comece a gravar',
    };
  });
}
