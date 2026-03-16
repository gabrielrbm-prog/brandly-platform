import Anthropic from '@anthropic-ai/sdk';
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

type LLMProvider = 'claude' | 'openai';

const SYSTEM_PROMPT = `Voce e um especialista em criacao de roteiros UGC (User Generated Content) para redes sociais.
Sua tarefa e gerar componentes de roteiros curtos (30-60 segundos) para videos de criadores de conteudo.

REGRAS:
- Linguagem natural, como se estivesse falando com um amigo
- Nada de claims exagerados ou promessas irreais
- Tom autentico e conversacional
- Adaptado para TikTok/Reels (formato vertical, ritmo rapido)
- Sempre em portugues brasileiro coloquial`;

function buildUserPrompt(briefing: BriefingContext, hookCount: number, bodyCount: number, ctaCount: number): string {
  return `Gere roteiros UGC para a marca "${briefing.brandName}".

PRODUTO: ${briefing.productDescription}
TOM: ${briefing.tone}
FAZER: ${briefing.doList.join(', ')}
NAO FAZER: ${briefing.dontList.join(', ')}
REQUISITOS: ${briefing.technicalRequirements}

Gere exatamente:
- ${hookCount} HOOKS (frases de abertura que prendem atencao nos primeiros 3 segundos)
- ${bodyCount} BODIES (desenvolvimento do conteudo, 2-4 frases cada)
- ${ctaCount} CTAs (chamadas para acao no final)

Responda APENAS em JSON valido neste formato exato:
{
  "hooks": ["hook1", "hook2", "hook3"],
  "bodies": ["body1", "body2", "body3"],
  "ctas": ["cta1", "cta2", "cta3"]
}`;
}

function parseResponse(text: string): GeneratedScripts {
  // Extract JSON from response (may have markdown code blocks)
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

async function generateWithClaude(briefing: BriefingContext, hookCount: number, bodyCount: number, ctaCount: number): Promise<GeneratedScripts> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: buildUserPrompt(briefing, hookCount, bodyCount, ctaCount),
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseResponse(text);
}

async function generateWithOpenAI(briefing: BriefingContext, hookCount: number, bodyCount: number, ctaCount: number): Promise<GeneratedScripts> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(briefing, hookCount, bodyCount, ctaCount) },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '';
  return parseResponse(text);
}

export async function generateScripts(
  briefing: BriefingContext,
  options?: { provider?: LLMProvider; hooks?: number; bodies?: number; ctas?: number },
): Promise<GeneratedScripts> {
  const provider = options?.provider ?? (process.env.LLM_PROVIDER as LLMProvider) ?? 'claude';
  const hookCount = options?.hooks ?? 3;
  const bodyCount = options?.bodies ?? 3;
  const ctaCount = options?.ctas ?? 3;

  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY nao configurada');
    }
    return generateWithOpenAI(briefing, hookCount, bodyCount, ctaCount);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY nao configurada');
  }
  return generateWithClaude(briefing, hookCount, bodyCount, ctaCount);
}
