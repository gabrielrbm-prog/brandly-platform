/**
 * Serviço de match score entre candidatura de creator e marca.
 * Combina dados do formulário + scraping social + IA (OpenRouter/Gemini).
 * Devolve score 0-100, análise em texto e breakdown por critério.
 */

import OpenAI from 'openai';
import { fetchInstagramProfile, fetchTiktokProfile, type SocialProfileData } from './social-scraper';

export interface BrandCriteria {
  name: string;
  description: string | null;
  category: string;
  targetAgeMin: number | null;
  targetAgeMax: number | null;
  targetGender: string | null; // any | female | male | other
  minInstagramFollowers: number | null;
  minTiktokFollowers: number | null;
  aiCriteria: string | null;
}

export interface ApplicationInput {
  fullName: string;
  age: number;
  email: string;
  gender: string; // female | male | other
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
}

export interface MatchResult {
  score: number; // 0-100
  analysis: string; // resumo em pt-BR para a marca
  reasoning: {
    age: { ok: boolean; detail: string; weight: number };
    gender: { ok: boolean; detail: string; weight: number };
    instagram: { ok: boolean; detail: string; weight: number; followers: number };
    tiktok: { ok: boolean; detail: string; weight: number; followers: number };
    aiCriteria: { score: number; detail: string; weight: number };
  };
  social: {
    instagram: SocialProfileData | null;
    tiktok: SocialProfileData | null;
  };
}

// Pesos somam 100
const WEIGHTS = {
  age: 15,
  gender: 10,
  instagram: 25,
  tiktok: 25,
  aiCriteria: 25,
};

export async function computeBrandMatch(
  criteria: BrandCriteria,
  application: ApplicationInput,
): Promise<MatchResult> {
  // normaliza handles — tira @ e espaços (evita "@@renannreina" nos logs/prompt)
  application = {
    ...application,
    instagramHandle: application.instagramHandle?.replace(/^@/, '').trim() || null,
    tiktokHandle: application.tiktokHandle?.replace(/^@/, '').trim() || null,
  };

  // 1) scraping em paralelo
  const [instagram, tiktok] = await Promise.all([
    application.instagramHandle
      ? fetchInstagramProfile(application.instagramHandle)
      : Promise.resolve(null),
    application.tiktokHandle ? fetchTiktokProfile(application.tiktokHandle) : Promise.resolve(null),
  ]);

  // 2) idade
  let ageOk = true;
  let ageDetail = 'Idade compatível.';
  if (criteria.targetAgeMin != null && application.age < criteria.targetAgeMin) {
    ageOk = false;
    ageDetail = `Abaixo da faixa alvo (mínimo ${criteria.targetAgeMin}).`;
  } else if (criteria.targetAgeMax != null && application.age > criteria.targetAgeMax) {
    ageOk = false;
    ageDetail = `Acima da faixa alvo (máximo ${criteria.targetAgeMax}).`;
  } else if (criteria.targetAgeMin != null || criteria.targetAgeMax != null) {
    ageDetail = `Dentro da faixa ${criteria.targetAgeMin ?? '—'}-${criteria.targetAgeMax ?? '—'}.`;
  } else {
    ageDetail = 'Marca não exige faixa etária específica.';
  }

  // 3) gênero
  let genderOk = true;
  let genderDetail = 'Gênero aceito pela marca.';
  if (criteria.targetGender && criteria.targetGender !== 'any') {
    genderOk = criteria.targetGender === application.gender;
    genderDetail = genderOk
      ? `Match de gênero (alvo: ${criteria.targetGender}).`
      : `Marca busca gênero ${criteria.targetGender}; candidato é ${application.gender}.`;
  }

  // 4) instagram
  const igFollowers = instagram?.followers ?? 0;
  const igMin = criteria.minInstagramFollowers ?? 0;
  const igOk = !criteria.minInstagramFollowers || igFollowers >= igMin;
  let igDetail: string;
  if (!application.instagramHandle) {
    igDetail = 'Sem @Instagram informado.';
  } else if (!instagram?.found) {
    igDetail = `Perfil @${application.instagramHandle} não foi encontrado (perfil privado ou inexistente).`;
  } else if (igMin > 0 && !igOk) {
    igDetail = `${igFollowers.toLocaleString('pt-BR')} seguidores — abaixo do mínimo ${igMin.toLocaleString('pt-BR')}.`;
  } else {
    const bioSnippet = instagram.bio ? ` · Bio: "${instagram.bio.slice(0, 120)}"` : '';
    igDetail = `${igFollowers.toLocaleString('pt-BR')} seguidores no Instagram${bioSnippet}`;
  }

  // 5) tiktok
  const ttFollowers = tiktok?.followers ?? 0;
  const ttMin = criteria.minTiktokFollowers ?? 0;
  const ttOk = !criteria.minTiktokFollowers || ttFollowers >= ttMin;
  let ttDetail: string;
  if (!application.tiktokHandle) {
    ttDetail = 'Sem @TikTok informado.';
  } else if (!tiktok?.found) {
    ttDetail = `Perfil @${application.tiktokHandle} não foi encontrado.`;
  } else if (ttMin > 0 && !ttOk) {
    ttDetail = `${ttFollowers.toLocaleString('pt-BR')} seguidores — abaixo do mínimo ${ttMin.toLocaleString('pt-BR')}.`;
  } else {
    const extras: string[] = [];
    if (tiktok.avgLikes > 0)
      extras.push(`${tiktok.avgLikes.toLocaleString('pt-BR')} likes médios/vídeo`);
    if (tiktok.engagementRate)
      extras.push(`${tiktok.engagementRate}% engagement ${engagementQuality(tiktok.engagementRate)}`);
    const extrasStr = extras.length ? ` · ${extras.join(' · ')}` : '';
    const bioSnippet = tiktok.bio ? ` · Bio: "${tiktok.bio.slice(0, 120)}"` : '';
    ttDetail = `${ttFollowers.toLocaleString('pt-BR')} seguidores no TikTok${extrasStr}${bioSnippet}`;
  }

  // 6) critério IA (texto livre) — só chama IA se houver critério definido
  let aiScore = 70; // default neutro
  let aiDetail = 'Marca não definiu critérios de perfil via IA.';
  if (criteria.aiCriteria && criteria.aiCriteria.trim()) {
    try {
      const aiResult = await evaluateWithAI(criteria, application, instagram, tiktok);
      aiScore = aiResult.score;
      aiDetail = aiResult.detail;
    } catch (err) {
      aiDetail = 'Avaliação IA indisponível no momento — fallback para análise básica.';
    }
  }

  // 7) composição do score
  const parts: Array<[number, number]> = [
    [ageOk ? 100 : 20, WEIGHTS.age],
    [genderOk ? 100 : 0, WEIGHTS.gender],
    [scoreFollowers(instagram, criteria.minInstagramFollowers), WEIGHTS.instagram],
    [scoreFollowers(tiktok, criteria.minTiktokFollowers), WEIGHTS.tiktok],
    [aiScore, WEIGHTS.aiCriteria],
  ];
  const score = Math.round(
    parts.reduce((acc, [s, w]) => acc + (s * w) / 100, 0),
  );

  const analysis = buildAnalysisText(
    criteria,
    application,
    { ageOk, ageDetail, genderOk, genderDetail, igDetail, ttDetail, aiDetail, score },
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    analysis,
    reasoning: {
      age: { ok: ageOk, detail: ageDetail, weight: WEIGHTS.age },
      gender: { ok: genderOk, detail: genderDetail, weight: WEIGHTS.gender },
      instagram: {
        ok: igOk,
        detail: igDetail,
        weight: WEIGHTS.instagram,
        followers: igFollowers,
      },
      tiktok: {
        ok: ttOk,
        detail: ttDetail,
        weight: WEIGHTS.tiktok,
        followers: ttFollowers,
      },
      aiCriteria: { score: aiScore, detail: aiDetail, weight: WEIGHTS.aiCriteria },
    },
    social: { instagram, tiktok },
  };
}

function formatPlatformBlock(
  label: string,
  handle: string | null | undefined,
  profile: SocialProfileData | null,
): string {
  if (!handle) return `${label}: não informado pelo candidato.`;
  if (!profile || !profile.found) {
    return `${label}: @${handle} — perfil não encontrado ou privado. (Sem dados públicos.)`;
  }
  const lines: string[] = [`${label}: @${handle}`];
  if (profile.displayName) lines.push(`  Nome público: ${profile.displayName}`);
  lines.push(`  Seguidores: ${profile.followers.toLocaleString('pt-BR')}`);
  if (profile.following > 0)
    lines.push(`  Seguindo: ${profile.following.toLocaleString('pt-BR')}`);
  if (profile.totalVideos)
    lines.push(`  Total de vídeos: ${profile.totalVideos.toLocaleString('pt-BR')}`);
  if (profile.avgLikes > 0)
    lines.push(`  Média de likes por post: ${profile.avgLikes.toLocaleString('pt-BR')}`);
  if (profile.engagementRate)
    lines.push(
      `  Engagement rate: ${profile.engagementRate}% ${engagementQuality(profile.engagementRate)}`,
    );
  if (profile.isVerified) lines.push('  Verificado: sim');
  if (profile.bio) lines.push(`  Bio: "${profile.bio.slice(0, 400)}"`);
  return lines.join('\n');
}

function engagementQuality(rate: number): string {
  if (rate > 50) return '(muito alto — likes vêm de fora dos seguidores, sinal de alcance viral)';
  if (rate >= 6) return '(excelente)';
  if (rate >= 3) return '(bom)';
  if (rate >= 1) return '(médio)';
  return '(baixo)';
}

function scoreFollowers(profile: SocialProfileData | null, min: number | null): number {
  if (!profile) return 50; // sem handle — neutro
  if (!profile.found) return 30; // handle passou, perfil não achado
  if (!min) {
    // sem mínimo — pontuação em curva logarítmica (1k+ vira quase 100)
    if (profile.followers >= 100_000) return 100;
    if (profile.followers >= 10_000) return 90;
    if (profile.followers >= 1_000) return 75;
    if (profile.followers >= 100) return 60;
    return 40;
  }
  if (profile.followers >= min) {
    const excess = profile.followers / min;
    return Math.min(100, 80 + Math.log10(excess) * 10);
  }
  return Math.max(10, Math.round((profile.followers / min) * 60));
}

async function evaluateWithAI(
  criteria: BrandCriteria,
  application: ApplicationInput,
  instagram: SocialProfileData | null,
  tiktok: SocialProfileData | null,
): Promise<{ score: number; detail: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY ausente');

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-001';

  const systemPrompt = `Você é um analista sênior de creators de UGC que avalia compatibilidade entre creator e marca para campanhas pagas por produção (não afiliação).

Sua análise deve considerar:
- Coerência entre bio/nicho do creator e o posicionamento da marca
- Sinais de autenticidade (linguagem, emojis, estilo)
- Engagement rate (likes/seguidores) como proxy de qualidade de audiência
- Tamanho da audiência proporcional às expectativas da marca
- Red flags (conteúdo conflitante, nicho incompatível, perfil suspeito)

Responda SEMPRE em JSON: {"score": <0-100>, "detail": "<análise em pt-BR, 2-4 frases, específica e acionável>"}.

Score: 80-100 match excelente · 60-79 bom · 40-59 mediano · 0-39 baixo.
Na explicação, SEMPRE mencione evidências concretas da bio quando disponível. Se a bio estiver vazia ou genérica, aponte isso como limitação. Não invente informações que não estão no contexto.`;

  const igBlock = formatPlatformBlock('Instagram', application.instagramHandle, instagram);
  const ttBlock = formatPlatformBlock('TikTok', application.tiktokHandle, tiktok);

  const userPrompt = `MARCA
Nome: ${criteria.name}
Categoria: ${criteria.category}
Descrição: ${criteria.description ?? '—'}
Perfil de creator ideal:
"""
${criteria.aiCriteria}
"""

CANDIDATO
Nome: ${application.fullName}
Idade: ${application.age} anos
Gênero: ${application.gender}

REDES SOCIAIS
${igBlock}

${ttBlock}

Avalie de 0 a 100 a compatibilidade com os critérios da marca. Explique com base nos dados disponíveis. Se os dados sobre conteúdo do creator forem limitados (ex: só bio), cite isso na análise para a marca ter transparência. Responda só o JSON.`;

  const response = await client.chat.completions.create({
    model,
    max_tokens: 300,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta IA sem JSON');
  const parsed = JSON.parse(jsonMatch[0]) as { score?: number; detail?: string };
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 50))));
  const detail = String(parsed.detail ?? 'Avaliação concluída.').slice(0, 400);
  return { score, detail };
}

function buildAnalysisText(
  criteria: BrandCriteria,
  application: ApplicationInput,
  ctx: {
    ageOk: boolean;
    ageDetail: string;
    genderOk: boolean;
    genderDetail: string;
    igDetail: string;
    ttDetail: string;
    aiDetail: string;
    score: number;
  },
): string {
  const verdict =
    ctx.score >= 80
      ? 'Match excelente'
      : ctx.score >= 60
        ? 'Match bom'
        : ctx.score >= 40
          ? 'Match mediano'
          : 'Match baixo';

  return [
    `${verdict} (${ctx.score}/100) para ${criteria.name}.`,
    `• Idade: ${ctx.ageDetail}`,
    `• Gênero: ${ctx.genderDetail}`,
    `• Instagram: ${ctx.igDetail}`,
    `• TikTok: ${ctx.ttDetail}`,
    `• Critérios da marca: ${ctx.aiDetail}`,
  ].join('\n');
}
