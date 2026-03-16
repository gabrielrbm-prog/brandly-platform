import Anthropic from '@anthropic-ai/sdk';

// ============================================
// TIPOS DE ENTRADA E SAIDA
// ============================================

export interface GenerateCaptionParams {
  brandName: string;
  productName: string;
  tone?: string;
  platform?: 'instagram' | 'tiktok';
}

export interface GenerateCaptionResult {
  caption: string;
  hashtags: string[];
  tokensUsed: number;
}

export interface GenerateHashtagsParams {
  brandName: string;
  productName: string;
  platform?: 'instagram' | 'tiktok';
}

export interface GenerateHashtagsResult {
  hashtags: string[];
  tokensUsed: number;
}

export interface AnalyzeVideoParams {
  videoUrl: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  briefingContext?: string;
}

export interface AnalyzeVideoResult {
  score: number;
  recommendations: string[];
  briefingCompliance: string;
  tokensUsed: number;
}

// ============================================
// DADOS MOCK — Fallback quando ANTHROPIC_API_KEY ausente
// ============================================

function mockGenerateCaption(params: GenerateCaptionParams): GenerateCaptionResult {
  const { brandName, productName, platform = 'instagram' } = params;
  const brandTag = brandName.toLowerCase().replace(/\s/g, '');
  const productTag = productName.toLowerCase().replace(/\s/g, '');

  const caption = `Descobri o ${productName} da ${brandName} e nao vivo mais sem!\n\nTestei por 30 dias e o resultado fala por si. Se voce busca qualidade de verdade, precisa experimentar.\n\nLink com desconto exclusivo na bio!`;

  const hashtags = platform === 'tiktok'
    ? [`#${brandTag}`, `#${productTag}`, '#tiktokmademebuythis', '#tiktokshop', '#ugcbrasil', '#creatorbrandly', '#fyp', '#parati']
    : [`#${brandTag}`, `#${productTag}`, '#reels', '#instareview', '#ugcbrasil', '#creatorbrandly', '#lifestyle', '#parceria'];

  return { caption, hashtags, tokensUsed: 0 };
}

function mockGenerateHashtags(params: GenerateHashtagsParams): GenerateHashtagsResult {
  const { brandName, productName, platform = 'tiktok' } = params;
  const brandTag = brandName.toLowerCase().replace(/\s/g, '');
  const productTag = productName.toLowerCase().replace(/\s/g, '');

  const hashtags = platform === 'tiktok'
    ? [
        `#${brandTag}`, `#${productTag}`, `#${brandTag}oficial`,
        '#tiktokmademebuythis', '#tiktokshop', '#review', '#recomendo', '#produtosbons',
        '#creatorbrandly', '#ugcbrasil', '#dicadetiktok', '#fyp', '#parati', '#viral', '#trending',
      ]
    : [
        `#${brandTag}`, `#${productTag}`, `#${brandTag}oficial`,
        '#reels', '#instareview', '#dicadodia', '#produtosfavoritos', '#rotina',
        '#creatorbrandly', '#ugcbrasil', '#conteudodigital', '#influenciadordigital', '#creators', '#parceria', '#lifestyle',
      ];

  return { hashtags, tokensUsed: 0 };
}

function mockAnalyzeVideo(params: AnalyzeVideoParams): AnalyzeVideoResult {
  return {
    score: 72,
    recommendations: [
      'Adicionar CTA mais forte no final do video',
      'Testar ganchos com pergunta para aumentar retencao',
      'Postar entre 18h-21h para maior alcance no Brasil',
      'Responder os 5 primeiros comentarios em ate 30 minutos',
      'Criar versao com duracao de 15s para melhor performance',
    ],
    briefingCompliance: 'Conteudo aparentemente alinhado com o briefing. Verificacao manual recomendada.',
    tokensUsed: 0,
  };
}

// ============================================
// CLIENTE ANTHROPIC — inicializado sob demanda
// ============================================

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY nao configurada');
  }
  return new Anthropic({ apiKey });
}

// ============================================
// GERACAO DE CAPTION COM CLAUDE
// ============================================

/**
 * Gera caption autêntica em português brasileiro para Instagram ou TikTok.
 * Se ANTHROPIC_API_KEY não estiver configurada, retorna dados mock.
 */
export async function generateCaption(params: GenerateCaptionParams): Promise<GenerateCaptionResult> {
  // Fallback gracioso quando a chave não está disponível
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockGenerateCaption(params);
  }

  const { brandName, productName, tone = 'casual', platform = 'instagram' } = params;
  const client = getAnthropicClient();

  const platformContext = platform === 'tiktok'
    ? 'TikTok (videos curtos, linguagem jovem, tendencias, hashtags virais)'
    : 'Instagram (estetica visual, stories, reels, comunidade engajada)';

  const prompt = `Voce e um especialista em copywriting UGC para o mercado brasileiro de criadores de conteudo.

Crie uma caption autêntica e engajante para um post de creator no ${platformContext}.

MARCA: ${brandName}
PRODUTO: ${productName}
TOM: ${tone}
PLATAFORMA: ${platform}

REGRAS:
- Linguagem 100% brasileira, coloquial e autêntica (como um creator real falaria)
- Evitar linguagem corporativa ou de propaganda
- Maximo de 3 paragrafos curtos para o texto principal
- Incluir um CTA natural (link na bio, comentar, etc)
- Gerar 8 hashtags relevantes: 2 da marca, 3 do produto/nicho, 3 de alcance/plataforma

Responda SOMENTE em JSON valido, sem markdown:
{
  "caption": "texto completo da caption",
  "hashtags": ["#hashtag1", "#hashtag2", "..."]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  // Extrair JSON da resposta (pode conter bloco markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA nao contem JSON valido para caption');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { caption: string; hashtags: string[] };

  if (typeof parsed.caption !== 'string' || !Array.isArray(parsed.hashtags)) {
    throw new Error('Formato de resposta invalido para caption — esperado caption e hashtags');
  }

  return {
    caption: parsed.caption,
    hashtags: parsed.hashtags,
    tokensUsed,
  };
}

// ============================================
// GERACAO DE HASHTAGS COM CLAUDE
// ============================================

/**
 * Gera 15 hashtags segmentadas para a plataforma especificada:
 * 3 da marca, 5 do produto/nicho, 7 de alcance/tendência.
 * Se ANTHROPIC_API_KEY não estiver configurada, retorna dados mock.
 */
export async function generateHashtags(params: GenerateHashtagsParams): Promise<GenerateHashtagsResult> {
  // Fallback gracioso quando a chave não está disponível
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockGenerateHashtags(params);
  }

  const { brandName, productName, platform = 'tiktok' } = params;
  const client = getAnthropicClient();

  const platformContext = platform === 'tiktok'
    ? 'TikTok Brasil (hashtags virais, FYP, tendencias atuais)'
    : 'Instagram Brasil (reels, explore, comunidade)';

  const prompt = `Voce e um especialista em estrategia de hashtags para o mercado brasileiro de criadores de conteudo.

Gere exatamente 15 hashtags otimizadas para ${platformContext}.

MARCA: ${brandName}
PRODUTO: ${productName}
PLATAFORMA: ${platform}

DISTRIBUICAO OBRIGATORIA:
- 3 hashtags especificas da marca (variações do nome ${brandName})
- 5 hashtags do produto/nicho (relacionadas a ${productName} e segmento)
- 7 hashtags de alcance/tendencia (mix: plataforma, nicho geral, virais BR)

REGRAS:
- Todas em minusculas, sem espacos, com # na frente
- Misturar português e inglês estrategicamente
- Priorizar hashtags com volume medio-alto no Brasil (nem muito competitivas nem muito vazias)

Responda SOMENTE em JSON valido, sem markdown:
{
  "hashtags": ["#tag1", "#tag2", ..., "#tag15"],
  "breakdown": {
    "brand": ["#tag1", "#tag2", "#tag3"],
    "product": ["#tag4", ..., "#tag8"],
    "reach": ["#tag9", ..., "#tag15"]
  }
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA nao contem JSON valido para hashtags');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { hashtags: string[] };

  if (!Array.isArray(parsed.hashtags)) {
    throw new Error('Formato de resposta invalido para hashtags — esperado array');
  }

  return {
    hashtags: parsed.hashtags,
    tokensUsed,
  };
}

// ============================================
// ANALISE DE VIDEO COM CLAUDE
// ============================================

/**
 * Analisa metadados de URL de video e conformidade com briefing da marca.
 * Como não é possível assistir ao video diretamente, a IA avalia o contexto
 * da URL (plataforma, ID, padroes) e o briefing fornecido para gerar
 * recomendacoes de melhoria.
 * Se ANTHROPIC_API_KEY não estiver configurada, retorna dados mock.
 */
export async function analyzeVideoContent(params: AnalyzeVideoParams): Promise<AnalyzeVideoResult> {
  // Fallback gracioso quando a chave não está disponível
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockAnalyzeVideo(params);
  }

  const { videoUrl, platform, briefingContext } = params;
  const client = getAnthropicClient();

  const platformLabel = {
    tiktok: 'TikTok',
    instagram: 'Instagram Reels',
    youtube: 'YouTube Shorts',
  }[platform] ?? platform;

  const briefingSection = briefingContext
    ? `BRIEFING DA MARCA:\n${briefingContext}`
    : 'BRIEFING: Nenhum briefing especifico fornecido. Avalie com base nas melhores praticas de UGC.';

  const prompt = `Voce e um especialista em analise de conteudo UGC para o mercado brasileiro de creator economy.

Analise o video submetido por um creator na plataforma Brandly e gere um relatorio de conformidade e recomendacoes.

PLATAFORMA: ${platformLabel}
URL DO VIDEO: ${videoUrl}
${briefingSection}

CONTEXTO: O video foi submetido por um creator da Brandly para aprovacao de pagamento. Creators recebem R$10 por video aprovado (maximo 10/dia = R$100/dia). Um video e aprovado se seguir o briefing da marca e as boas praticas de UGC.

ANALISE NECESSARIA:
1. Extrair informacoes possiveis da URL (plataforma, ID do video, padroes de URL)
2. Avaliar conformidade provavel com briefing fornecido
3. Identificar riscos de rejeicao baseados no briefing
4. Gerar recomendacoes de melhoria especificas e acionaveis
5. Atribuir score de 0-100 (0=reprovado definitivo, 100=aprovacao garantida)

CRITERIOS DE SCORE:
- 90-100: Excelente, aprovacao recomendada
- 70-89: Bom, aprovacao provavel com pequenos ajustes
- 50-69: Regular, necessita revisao manual
- 0-49: Problematico, risco alto de rejeicao

Responda SOMENTE em JSON valido, sem markdown:
{
  "score": number (0-100),
  "briefingCompliance": "string (avaliacao objetiva de conformidade com o briefing, 2-3 frases)",
  "recommendations": ["string", "string", "string", "string", "string"]
}

REGRAS:
- Todas as strings em portugues brasileiro
- recommendations deve ter 4-6 itens especificos e acionaveis
- Seja honesto: se nao ha briefing, avalie com base em boas praticas gerais de UGC`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA nao contem JSON valido para analise de video');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    score: number;
    briefingCompliance: string;
    recommendations: string[];
  };

  if (
    typeof parsed.score !== 'number' ||
    typeof parsed.briefingCompliance !== 'string' ||
    !Array.isArray(parsed.recommendations)
  ) {
    throw new Error('Formato de resposta invalido para analise de video');
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score))),
    recommendations: parsed.recommendations,
    briefingCompliance: parsed.briefingCompliance,
    tokensUsed,
  };
}
