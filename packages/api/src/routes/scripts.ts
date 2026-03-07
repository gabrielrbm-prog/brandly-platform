import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { scripts, briefings } from '@brandly/core';
import { eq, and, desc } from 'drizzle-orm';

interface GenerateBody {
  briefingId: string;
  count?: number;  // quantas combinacoes gerar (default: 18 = 3x3x2)
}

interface ListQuery {
  briefingId?: string;
}

export async function scriptRoutes(app: FastifyInstance) {
  // POST /api/scripts/generate — gerar roteiros a partir de briefing
  app.post<{ Body: GenerateBody }>('/generate', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { briefingId, count = 18 } = request.body;

    if (!briefingId) {
      return reply.status(400).send({ error: 'briefingId e obrigatorio' });
    }

    // Verificar se o briefing existe
    const [briefing] = await db.select()
      .from(briefings)
      .where(eq(briefings.id, briefingId));

    if (!briefing) {
      return reply.status(404).send({ error: 'Briefing nao encontrado' });
    }

    // Mock hooks/bodies/ctas — futuramente gerados via LLM
    const hooks = [
      'Voce precisa conhecer esse produto...',
      'Eu nao acreditava ate testar...',
      'O que ninguem te conta sobre...',
    ];

    const bodies = [
      'Testei por 7 dias e o resultado foi incrivel. A textura e leve, absorve rapido...',
      'Comecei a usar sem expectativa, mas ja no terceiro dia percebi a diferenca...',
      'Minha rotina mudou completamente depois que inclui isso no meu dia a dia...',
    ];

    const ctas = [
      'Link na bio pra voce garantir o seu!',
      'Usa meu cupom pra desconto exclusivo — ta nos comentarios!',
    ];

    // Gerar combinacoes 3x3x2 = 18
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
      technique: '3x3x2 (3 hooks x 3 bodies x 2 CTAs)',
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
