import type { FastifyInstance } from 'fastify';
import { db, generateScripts } from '@brandly/core';
import { scripts, briefings, brands } from '@brandly/core';
import { eq, and, desc } from 'drizzle-orm';

interface GenerateBody {
  briefingId: string;
  count?: number;
  provider?: 'claude' | 'openai';
}

interface ListQuery {
  briefingId?: string;
}

// Fallback mock quando nenhuma API key esta configurada
const MOCK_HOOKS = [
  'Voce precisa conhecer esse produto...',
  'Eu nao acreditava ate testar...',
  'O que ninguem te conta sobre...',
];
const MOCK_BODIES = [
  'Testei por 7 dias e o resultado foi incrivel. A textura e leve, absorve rapido...',
  'Comecei a usar sem expectativa, mas ja no terceiro dia percebi a diferenca...',
  'Minha rotina mudou completamente depois que inclui isso no meu dia a dia...',
];
const MOCK_CTAS = [
  'Link na bio pra voce garantir o seu!',
  'Usa meu cupom pra desconto exclusivo — ta nos comentarios!',
];

export async function scriptRoutes(app: FastifyInstance) {
  // POST /api/scripts/generate — gerar roteiros a partir de briefing
  app.post<{ Body: GenerateBody }>('/generate', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { briefingId, count = 18, provider } = request.body;

    if (!briefingId) {
      return reply.status(400).send({ error: 'briefingId e obrigatorio' });
    }

    // Buscar briefing + marca
    const [briefing] = await db.select({
      id: briefings.id,
      title: briefings.title,
      description: briefings.description,
      tone: briefings.tone,
      doList: briefings.doList,
      dontList: briefings.dontList,
      technicalRequirements: briefings.technicalRequirements,
      brandName: brands.name,
      brandDescription: brands.description,
    })
      .from(briefings)
      .innerJoin(brands, eq(briefings.brandId, brands.id))
      .where(eq(briefings.id, briefingId));

    if (!briefing) {
      return reply.status(404).send({ error: 'Briefing nao encontrado' });
    }

    // Tentar gerar via IA, fallback para mock
    let hooks: string[];
    let bodies: string[];
    let ctas: string[];
    let generatedBy: 'claude' | 'openai' | 'mock';

    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const requestedProvider = provider ?? (process.env.LLM_PROVIDER as 'claude' | 'openai' | undefined);

    if ((requestedProvider === 'claude' && hasAnthropicKey) ||
        (requestedProvider === 'openai' && hasOpenAIKey) ||
        (!requestedProvider && (hasAnthropicKey || hasOpenAIKey))) {

      const useProvider = requestedProvider ?? (hasAnthropicKey ? 'claude' : 'openai');

      try {
        const result = await generateScripts({
          brandName: briefing.brandName,
          productDescription: `${briefing.title} — ${briefing.description}`,
          tone: briefing.tone ?? 'casual',
          doList: briefing.doList ?? [],
          dontList: briefing.dontList ?? [],
          technicalRequirements: briefing.technicalRequirements ?? '',
        }, { provider: useProvider, hooks: 3, bodies: 3, ctas: 2 });

        hooks = result.hooks;
        bodies = result.bodies;
        ctas = result.ctas;
        generatedBy = useProvider;
      } catch (err: any) {
        // Log erro e cai no mock
        request.log.warn({ err: err.message }, 'Falha na geracao IA, usando mock');
        hooks = MOCK_HOOKS;
        bodies = MOCK_BODIES;
        ctas = MOCK_CTAS;
        generatedBy = 'mock';
      }
    } else {
      hooks = MOCK_HOOKS;
      bodies = MOCK_BODIES;
      ctas = MOCK_CTAS;
      generatedBy = 'mock';
    }

    // Gerar combinacoes hooks x bodies x ctas
    const combinations: {
      creatorId: string;
      briefingId: string;
      hook: string;
      body: string;
      cta: string;
      fullScript: string;
    }[] = [];

    let index = 0;
    for (const hook of hooks) {
      for (const body of bodies) {
        for (const cta of ctas) {
          if (index >= count) break;
          combinations.push({
            creatorId: userId,
            briefingId,
            hook,
            body,
            cta,
            fullScript: `${hook}\n\n${body}\n\n${cta}`,
          });
          index++;
        }
      }
    }

    const created = await db.insert(scripts)
      .values(combinations)
      .returning();

    return reply.status(201).send({
      briefingId,
      total: created.length,
      technique: `${hooks.length}x${bodies.length}x${ctas.length}`,
      generatedBy,
      scripts: created,
    });
  });

  // GET /api/scripts — biblioteca de roteiros do creator
  app.get('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { briefingId } = request.query as ListQuery;

    const conditions = [eq(scripts.creatorId, userId)];
    if (briefingId) conditions.push(eq(scripts.briefingId, briefingId));

    const result = await db.select()
      .from(scripts)
      .where(and(...conditions))
      .orderBy(desc(scripts.createdAt))
      .limit(100);

    return { scripts: result, total: result.length };
  });

  // GET /api/scripts/:id — detalhes do roteiro
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params;

    const [script] = await db.select()
      .from(scripts)
      .where(and(eq(scripts.id, id), eq(scripts.creatorId, userId)));

    if (!script) {
      return reply.status(404).send({ error: 'Script nao encontrado' });
    }

    return script;
  });

  // PATCH /api/scripts/:id — editar roteiro (hook, body, cta)
  app.patch<{ Params: { id: string }; Body: { hook?: string; body?: string; cta?: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params;
    const { hook, body, cta } = request.body;

    const [script] = await db.select()
      .from(scripts)
      .where(and(eq(scripts.id, id), eq(scripts.creatorId, userId)));

    if (!script) {
      return reply.status(404).send({ error: 'Script nao encontrado' });
    }

    const newHook = hook ?? script.hook;
    const newBody = body ?? script.body;
    const newCta = cta ?? script.cta;

    const [updated] = await db.update(scripts)
      .set({
        hook: newHook,
        body: newBody,
        cta: newCta,
        fullScript: `${newHook}\n\n${newBody}\n\n${newCta}`,
      })
      .where(eq(scripts.id, id))
      .returning();

    return updated;
  });

  // PATCH /api/scripts/:id/use — marcar roteiro como usado
  app.patch<{ Params: { id: string } }>('/:id/use', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params;

    const [script] = await db.select()
      .from(scripts)
      .where(and(eq(scripts.id, id), eq(scripts.creatorId, userId)));

    if (!script) {
      return reply.status(404).send({ error: 'Script nao encontrado' });
    }

    const [updated] = await db.update(scripts)
      .set({ isUsed: true })
      .where(eq(scripts.id, id))
      .returning();

    return updated;
  });
}
