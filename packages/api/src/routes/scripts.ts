import type { FastifyInstance } from 'fastify';
import { db, generateScripts } from '@brandly/core';
import { scripts, briefings, brands } from '@brandly/core';
import { eq, and, desc } from 'drizzle-orm';

interface GenerateBody {
  briefingId: string;
  count?: number;
  provider?: 'claude' | 'openai' | 'gemini';
}

interface ListQuery {
  briefingId?: string;
}

export async function scriptRoutes(app: FastifyInstance) {
  // POST /api/scripts/generate — gerar roteiros via IA
  app.post<{ Body: GenerateBody }>('/generate', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { briefingId, count = 18, provider } = request.body;

    if (!briefingId) {
      return reply.status(400).send({ error: 'briefingId e obrigatorio' });
    }

    // Verificar se a API key esta configurada
    if (!process.env.OPENROUTER_API_KEY) {
      return reply.status(503).send({
        error: 'Geracao de roteiros com IA em configuracao. Configure OPENROUTER_API_KEY.',
      });
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

    // Gerar via IA (OpenRouter + Gemini Flash)
    const result = await generateScripts({
      brandName: briefing.brandName,
      productDescription: `${briefing.title} — ${briefing.description}`,
      tone: briefing.tone ?? 'casual',
      doList: briefing.doList ?? [],
      dontList: briefing.dontList ?? [],
      technicalRequirements: briefing.technicalRequirements ?? '',
    }, { hooks: 3, bodies: 3, ctas: 3 });

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
    for (const hook of result.hooks) {
      for (const body of result.bodies) {
        for (const cta of result.ctas) {
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
      technique: `${result.hooks.length}x${result.bodies.length}x${result.ctas.length}`,
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

  // DELETE /api/scripts/:id — apagar roteiro
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { id } = request.params;

    const [script] = await db.select({ id: scripts.id })
      .from(scripts)
      .where(and(eq(scripts.id, id), eq(scripts.creatorId, userId)));

    if (!script) {
      return reply.status(404).send({ error: 'Script nao encontrado' });
    }

    await db.delete(scripts).where(eq(scripts.id, id));
    return { message: 'Roteiro apagado' };
  });

  // DELETE /api/scripts — apagar todos os roteiros do creator
  app.delete('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const deleted = await db.delete(scripts)
      .where(eq(scripts.creatorId, userId))
      .returning({ id: scripts.id });
    return { message: `${deleted.length} roteiros apagados`, count: deleted.length };
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
