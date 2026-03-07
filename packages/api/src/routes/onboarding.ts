import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { users, creatorProfiles } from '@brandly/core';
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
