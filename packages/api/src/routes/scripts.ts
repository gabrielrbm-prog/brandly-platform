import type { FastifyInstance } from 'fastify';

interface GenerateBody {
  briefingId: string;
  count?: number;  // quantas combinacoes gerar (default: 18 = 3x3x2)
}

export async function scriptRoutes(app: FastifyInstance) {
  // POST /api/scripts/generate — gerar roteiros a partir de briefing
  app.post<{ Body: GenerateBody }>('/generate', async (request, reply) => {
    const { briefingId, count = 18 } = request.body;

    if (!briefingId) {
      return reply.status(400).send({ error: 'briefingId e obrigatorio' });
    }

    // TODO: extrair creatorId do JWT
    // TODO: buscar briefing no banco
    // TODO: chamar LLM API para gerar hooks, bodies, ctas
    // TODO: combinar 3x3x2 = 18 variacoes
    // TODO: salvar scripts no banco

    // Exemplo de resposta com combinacoes 3x3x2
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

    const scripts = [];
    let index = 0;
    for (const hook of hooks) {
      for (const body of bodies) {
        for (const cta of ctas) {
          if (index >= count) break;
          scripts.push({
            id: `script-${index + 1}`,
            hook,
            body,
            cta,
            fullScript: `${hook}\n\n${body}\n\n${cta}`,
            isUsed: false,
          });
          index++;
        }
      }
    }

    return reply.status(201).send({
      briefingId,
      total: scripts.length,
      technique: '3x3x2 (3 hooks x 3 bodies x 2 CTAs)',
      scripts,
    });
  });

  // GET /api/scripts — biblioteca de roteiros do creator
  app.get('/', async (request, reply) => {
    // TODO: extrair creatorId do JWT
    // TODO: buscar scripts do creator com filtros

    return { scripts: [], total: 0 };
  });

  // GET /api/scripts/:id — detalhes do roteiro
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // TODO: buscar script por id

    return { id, message: 'not implemented' };
  });

  // PATCH /api/scripts/:id/use — marcar roteiro como usado
  app.patch<{ Params: { id: string } }>('/:id/use', async (request, reply) => {
    const { id } = request.params;

    // TODO: marcar isUsed = true

    return { id, isUsed: true };
  });
}
