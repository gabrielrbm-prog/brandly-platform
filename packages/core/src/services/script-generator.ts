import OpenAI from 'openai';

export interface BriefingContext {
  brandName: string;
  productDescription: string;
  tone: string;
  doList: string[];
  dontList: string[];
  technicalRequirements: string;
}

export interface GeneratedScripts {
  hooks: string[];
  bodies: string[];
  ctas: string[];
}

const SYSTEM_PROMPT = `Voce e um especialista em criacao de roteiros UGC (User Generated Content) para redes sociais.
Sua tarefa e gerar componentes de roteiros curtos (30-60 segundos) para videos de criadores de conteudo.

REGRAS:
- Linguagem natural, como se estivesse falando com um amigo
- Nada de claims exagerados ou promessas irreais
- Tom autentico e conversacional
- Adaptado para TikTok/Reels (formato vertical, ritmo rapido)
- Sempre em portugues brasileiro coloquial
- CADA roteiro deve ser UNICO e DIFERENTE dos outros — varie o estilo, abordagem e angulo`;

function buildUserPrompt(briefing: BriefingContext, hookCount: number, bodyCount: number, ctaCount: number): string {
  return `Gere roteiros UGC para a marca "${briefing.brandName}".

PRODUTO: ${briefing.productDescription}
TOM: ${briefing.tone}
FAZER: ${briefing.doList.join(', ')}
NAO FAZER: ${briefing.dontList.join(', ')}
REQUISITOS: ${briefing.technicalRequirements}

Gere exatamente:
- ${hookCount} HOOKS (frases de abertura que prendem atencao nos primeiros 3 segundos — cada um com estilo DIFERENTE)
- ${bodyCount} BODIES (desenvolvimento do conteudo, 2-4 frases cada — cada um com angulo DIFERENTE)
- ${ctaCount} CTAs (chamadas para acao no final — cada uma com abordagem DIFERENTE)

IMPORTANTE: Cada hook, body e CTA deve ser COMPLETAMENTE DIFERENTE dos outros. Varie o estilo: storytelling, humor, curiosidade, prova social, urgencia, etc.

Responda APENAS em JSON valido neste formato exato:
{
  "hooks": ["hook1", "hook2", "hook3"],
  "bodies": ["body1", "body2", "body3"],
  "ctas": ["cta1", "cta2", "cta3"]
}`;
}

function parseResponse(text: string): GeneratedScripts {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA nao contem JSON valido');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.hooks) || !Array.isArray(parsed.bodies) || !Array.isArray(parsed.ctas)) {
    throw new Error('Formato de resposta invalido — esperado hooks, bodies e ctas');
  }

  return {
    hooks: parsed.hooks,
    bodies: parsed.bodies,
    ctas: parsed.ctas,
  };
}

export async function generateScripts(
  briefing: BriefingContext,
  options?: { hooks?: number; bodies?: number; ctas?: number },
): Promise<GeneratedScripts> {
  const hookCount = options?.hooks ?? 3;
  const bodyCount = options?.bodies ?? 3;
  const ctaCount = options?.ctas ?? 3;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY nao configurada');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-001';

  const response = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    temperature: 0.9,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(briefing, hookCount, bodyCount, ctaCount) },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '';
  return parseResponse(text);
}
