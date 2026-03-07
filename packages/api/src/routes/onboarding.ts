import type { FastifyInstance } from 'fastify';

interface ProfileBody {
  preferredCategories: string[];  // beauty, supplements, home, tech, fashion, food
  contentStyle: string;           // lifestyle, review, tutorial, unboxing
  experienceLevel: string;        // none, beginner, intermediate, advanced
  availableHoursPerDay: number;
  motivations: string[];          // renda, identidade, carreira, liberdade
}

interface SocialBody {
  platform: 'instagram' | 'tiktok';
  handle: string;
}

const VALID_CATEGORIES = ['beauty', 'supplements', 'home', 'tech', 'fashion', 'food'];
const VALID_STYLES = ['lifestyle', 'review', 'tutorial', 'unboxing', 'pov', 'storytelling'];
const VALID_LEVELS = ['none', 'beginner', 'intermediate', 'advanced'];

export async function onboardingRoutes(app: FastifyInstance) {
  // POST /api/onboarding/profile — salvar perfil comportamental
  app.post<{ Body: ProfileBody }>('/profile', async (request, reply) => {
    const { preferredCategories, contentStyle, experienceLevel, availableHoursPerDay, motivations } = request.body;

    // Validacoes
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

    // TODO: extrair userId do JWT
    // TODO: salvar/atualizar creator_profiles no banco

    return {
      message: 'Perfil salvo com sucesso',
      profile: {
        preferredCategories,
        contentStyle,
        experienceLevel,
        availableHoursPerDay,
        motivations,
      },
    };
  });

  // POST /api/onboarding/social — conectar rede social
  app.post<{ Body: SocialBody }>('/social', async (request, reply) => {
    const { platform, handle } = request.body;

    if (!platform || !handle) {
      return reply.status(400).send({ error: 'platform e handle sao obrigatorios' });
    }

    if (!['instagram', 'tiktok'].includes(platform)) {
      return reply.status(400).send({ error: 'platform deve ser instagram ou tiktok' });
    }

    // TODO: extrair userId do JWT
    // TODO: atualizar instagram_handle ou tiktok_handle no banco
    // TODO: futuramente, validar handle via API da rede social

    return {
      message: `${platform} conectado com sucesso`,
      platform,
      handle,
    };
  });

  // POST /api/onboarding/complete — marcar onboarding como completo
  app.post('/complete', async (request, reply) => {
    // TODO: extrair userId do JWT
    // TODO: verificar se profile e social foram preenchidos
    // TODO: marcar onboarding_completed = true

    return {
      message: 'Onboarding concluido! Voce ja pode comecar a produzir videos.',
      nextStep: 'Escolha uma marca e comece a gravar',
    };
  });
}
