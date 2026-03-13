import Anthropic from '@anthropic-ai/sdk';

// ============================================
// 20 PERGUNTAS INTERATIVAS — Onboarding Brandly
// ============================================

export interface OnboardingQuestion {
  id: number;
  category: 'behavioral' | 'content' | 'segments' | 'experience' | 'social' | 'personality';
  type: 'single' | 'multiple' | 'swipe' | 'slider' | 'grid';
  question: string;
  subtitle?: string;
  options?: { value: string; label: string; emoji?: string }[];
  sliderConfig?: { min: string; max: string; minLabel: string; maxLabel: string };
  maxSelections?: number;
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // === BLOCO 1: Motivacao e Contexto (1-4) ===
  {
    id: 1,
    category: 'behavioral',
    type: 'single',
    question: 'O que te trouxe ate a Brandly?',
    subtitle: 'Escolha o que mais combina com voce',
    options: [
      { value: 'extra_income', label: 'Renda extra', emoji: '💰' },
      { value: 'career_change', label: 'Mudar de carreira', emoji: '🔄' },
      { value: 'creator_pro', label: 'Me profissionalizar como creator', emoji: '🎬' },
      { value: 'build_business', label: 'Construir meu negocio', emoji: '🏗️' },
      { value: 'curiosity', label: 'Curiosidade, quero conhecer', emoji: '🤔' },
    ],
  },
  {
    id: 2,
    category: 'experience',
    type: 'single',
    question: 'Qual sua experiencia com criacao de conteudo?',
    options: [
      { value: 'never', label: 'Nunca criei conteudo', emoji: '🆕' },
      { value: 'casual', label: 'Posto nas redes, mas casual', emoji: '📱' },
      { value: 'frequent', label: 'Crio conteudo com frequencia', emoji: '📸' },
      { value: 'professional', label: 'Ja trabalho como creator', emoji: '🎥' },
      { value: 'audience', label: 'Tenho audiencia engajada', emoji: '🔥' },
    ],
  },
  {
    id: 3,
    category: 'behavioral',
    type: 'swipe',
    question: 'Voce se ve mais...',
    options: [
      { value: 'in_front', label: 'Na frente da camera' },
      { value: 'behind', label: 'Nos bastidores' },
    ],
  },
  {
    id: 4,
    category: 'behavioral',
    type: 'slider',
    question: 'Como voce lida com risco?',
    subtitle: 'Arraste para sua preferencia',
    sliderConfig: {
      min: '0',
      max: '100',
      minLabel: 'Ganho garantido, sem risco',
      maxLabel: 'Risco maior, potencial alto',
    },
  },

  // === BLOCO 2: Estilo de Conteudo (5-8) ===
  {
    id: 5,
    category: 'content',
    type: 'single',
    question: 'Que tipo de conteudo voce mais curte criar?',
    subtitle: 'Ou gostaria de criar',
    options: [
      { value: 'tutorial', label: 'Tutorial / Educativo', emoji: '📚' },
      { value: 'entertainment', label: 'Humor / Entretenimento', emoji: '😂' },
      { value: 'review', label: 'Review / Analise', emoji: '🔍' },
      { value: 'motivational', label: 'Motivacional / Inspiracao', emoji: '💪' },
      { value: 'lifestyle', label: 'Lifestyle / Dia a dia', emoji: '✨' },
      { value: 'storytelling', label: 'Storytelling / Historias', emoji: '📖' },
    ],
  },
  {
    id: 6,
    category: 'content',
    type: 'swipe',
    question: 'Seu ritmo ideal de producao',
    options: [
      { value: 'few_perfect', label: 'Poucos videos, mas perfeitos' },
      { value: 'many_improving', label: 'Muitos videos, melhorando sempre' },
    ],
  },
  {
    id: 7,
    category: 'content',
    type: 'single',
    question: 'Qual formato voce domina (ou quer dominar)?',
    options: [
      { value: 'short_video', label: 'Video curto (Reels/TikTok)', emoji: '⚡' },
      { value: 'long_video', label: 'Video longo (YouTube)', emoji: '🎞️' },
      { value: 'photos', label: 'Fotos / Carrossel', emoji: '🖼️' },
      { value: 'live', label: 'Lives', emoji: '🔴' },
      { value: 'text', label: 'Texto (blog/threads)', emoji: '✍️' },
    ],
  },
  {
    id: 8,
    category: 'content',
    type: 'slider',
    question: 'Quanto tempo por dia voce pode dedicar?',
    subtitle: 'Arraste para a sua realidade',
    sliderConfig: {
      min: '1',
      max: '8',
      minLabel: '1 hora/dia',
      maxLabel: '8+ horas/dia',
    },
  },

  // === BLOCO 3: Segmentos e Afinidade (9-12) ===
  {
    id: 9,
    category: 'segments',
    type: 'grid',
    question: 'Com quais segmentos voce mais se identifica?',
    subtitle: 'Selecione ate 4',
    maxSelections: 4,
    options: [
      { value: 'health', label: 'Saude', emoji: '🏥' },
      { value: 'tech', label: 'Tecnologia', emoji: '💻' },
      { value: 'fashion', label: 'Moda', emoji: '👗' },
      { value: 'beauty', label: 'Beleza', emoji: '💄' },
      { value: 'fitness', label: 'Fitness', emoji: '🏋️' },
      { value: 'food', label: 'Alimentacao', emoji: '🥗' },
      { value: 'home', label: 'Casa / Decoracao', emoji: '🏠' },
      { value: 'sustainability', label: 'Sustentabilidade', emoji: '🌱' },
      { value: 'education', label: 'Educacao', emoji: '🎓' },
      { value: 'finance', label: 'Financas', emoji: '📊' },
      { value: 'pets', label: 'Pets', emoji: '🐾' },
      { value: 'kids', label: 'Infantil / Maternidade', emoji: '👶' },
    ],
  },
  {
    id: 10,
    category: 'segments',
    type: 'single',
    question: 'Qual tipo de produto voce compraria ou recomendaria?',
    options: [
      { value: 'physical', label: 'Produtos fisicos (suplementos, cosmeticos...)', emoji: '📦' },
      { value: 'digital', label: 'Infoprodutos (cursos, mentorias...)', emoji: '💻' },
      { value: 'both', label: 'Ambos, sem preferencia', emoji: '🤝' },
      { value: 'depends', label: 'Depende do nicho', emoji: '🎯' },
    ],
  },
  {
    id: 11,
    category: 'segments',
    type: 'single',
    question: 'Voce ja indicou algum produto/servico para amigos?',
    subtitle: 'Marketing de indicacao / afiliado',
    options: [
      { value: 'never', label: 'Nunca', emoji: '❌' },
      { value: 'informal', label: 'Sim, informalmente', emoji: '💬' },
      { value: 'affiliate', label: 'Sim, como afiliado(a)', emoji: '🔗' },
      { value: 'professional', label: 'Sim, profissionalmente', emoji: '💼' },
    ],
  },
  {
    id: 12,
    category: 'segments',
    type: 'swipe',
    question: 'Na hora de promover um produto...',
    options: [
      { value: 'authentic', label: 'So recomendo o que uso de verdade' },
      { value: 'professional', label: 'Consigo vender qualquer bom produto' },
    ],
  },

  // === BLOCO 4: Redes Sociais (13-16) ===
  {
    id: 13,
    category: 'social',
    type: 'multiple',
    question: 'Quais redes sociais voce usa ativamente?',
    subtitle: 'Selecione todas que se aplicam',
    options: [
      { value: 'instagram', label: 'Instagram', emoji: '📸' },
      { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
      { value: 'youtube', label: 'YouTube', emoji: '▶️' },
      { value: 'twitter', label: 'X (Twitter)', emoji: '🐦' },
      { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
      { value: 'facebook', label: 'Facebook', emoji: '👤' },
      { value: 'kwai', label: 'Kwai', emoji: '🎬' },
      { value: 'none', label: 'Nenhuma ativamente', emoji: '❌' },
    ],
  },
  {
    id: 14,
    category: 'social',
    type: 'single',
    question: 'Quantos seguidores voce tem (na maior rede)?',
    options: [
      { value: 'under_1k', label: 'Menos de 1.000', emoji: '🌱' },
      { value: '1k_5k', label: '1.000 a 5.000', emoji: '🌿' },
      { value: '5k_10k', label: '5.000 a 10.000', emoji: '🌳' },
      { value: '10k_50k', label: '10.000 a 50.000', emoji: '🔥' },
      { value: '50k_100k', label: '50.000 a 100.000', emoji: '⭐' },
      { value: 'over_100k', label: '100.000+', emoji: '👑' },
    ],
  },
  {
    id: 15,
    category: 'social',
    type: 'single',
    question: 'Com que frequencia voce posta conteudo?',
    options: [
      { value: 'never', label: 'Nunca ou raramente', emoji: '😴' },
      { value: 'weekly', label: '1-2x por semana', emoji: '📅' },
      { value: 'several_week', label: '3-5x por semana', emoji: '⚡' },
      { value: 'daily', label: 'Todo dia', emoji: '🔥' },
      { value: 'multiple_daily', label: 'Varias vezes ao dia', emoji: '🚀' },
    ],
  },
  {
    id: 16,
    category: 'social',
    type: 'swipe',
    question: 'Seu conteudo hoje e mais...',
    options: [
      { value: 'personal', label: 'Pessoal (dia a dia, opiniao)' },
      { value: 'professional', label: 'Profissional (nicho definido)' },
    ],
  },

  // === BLOCO 5: Personalidade e Comportamento (17-20) ===
  {
    id: 17,
    category: 'personality',
    type: 'single',
    question: 'Numa festa, voce normalmente...',
    subtitle: 'Escolha o mais proximo de voce',
    options: [
      { value: 'leads', label: 'Organiza e lidera a conversa', emoji: '👑' },
      { value: 'socializes', label: 'Conversa com todo mundo', emoji: '🗣️' },
      { value: 'small_group', label: 'Fica no grupinho de confianca', emoji: '👥' },
      { value: 'observes', label: 'Observa e participa quando quer', emoji: '👀' },
    ],
  },
  {
    id: 18,
    category: 'personality',
    type: 'single',
    question: 'Como voce prefere aprender algo novo?',
    options: [
      { value: 'doing', label: 'Fazendo na pratica', emoji: '🛠️' },
      { value: 'watching', label: 'Assistindo tutoriais', emoji: '📺' },
      { value: 'reading', label: 'Lendo / pesquisando', emoji: '📖' },
      { value: 'mentoring', label: 'Com mentor / grupo', emoji: '🤝' },
    ],
  },
  {
    id: 19,
    category: 'personality',
    type: 'slider',
    question: 'Quando recebe um feedback negativo...',
    subtitle: 'Arraste para sua reacao mais comum',
    sliderConfig: {
      min: '0',
      max: '100',
      minLabel: 'Fico abalado(a), demoro pra reagir',
      maxLabel: 'Absorvo rapido e ajusto',
    },
  },
  {
    id: 20,
    category: 'personality',
    type: 'single',
    question: 'O que mais te motiva a continuar?',
    subtitle: 'Escolha seu combustivel principal',
    options: [
      { value: 'money', label: 'Resultado financeiro', emoji: '💰' },
      { value: 'recognition', label: 'Reconhecimento e visibilidade', emoji: '⭐' },
      { value: 'impact', label: 'Impactar pessoas', emoji: '❤️' },
      { value: 'freedom', label: 'Liberdade e autonomia', emoji: '🕊️' },
      { value: 'growth', label: 'Crescimento pessoal', emoji: '📈' },
      { value: 'community', label: 'Fazer parte de algo maior', emoji: '🌐' },
    ],
  },
];

// ============================================
// TIPOS DO PERFIL COMPORTAMENTAL
// ============================================

export interface BehavioralProfileResult {
  // Diagnostico Creator (visual, Spotify Wrapped style)
  creatorDiagnostic: {
    archetype: string;           // "Educador", "Entertainer", "Motivador", "Conector", "Curador", "Estrategista"
    archetypeEmoji: string;
    title: string;               // "O Educador Nato" / "A Entertainer Carismatica"
    shortDescription: string;    // 2 frases
    strengths: string[];         // 3 pontos fortes
    superpower: string;          // 1 frase impactante
    contentStyle: string;        // estilo recomendado
    idealFormats: string[];      // formatos ideais
    productMatch: string[];      // segmentos que mais combina
    motivationPhrase: string;    // frase motivacional personalizada
    level: 'iniciante' | 'intermediario' | 'avancado' | 'expert';
    readinessScore: number;      // 0-100, quao pronto esta pra comecar
  };
  // Diagnostico Admin (analitico, dados para matching e gestao)
  adminDiagnostic: {
    disc: { D: number; I: number; S: number; C: number }; // 0-100 cada
    primaryDisc: string;
    riskTolerance: 'low' | 'medium' | 'high';
    cameraComfort: 'low' | 'medium' | 'high';
    experienceLevel: string;
    dedicationHours: number;
    socialPresence: {
      platforms: string[];
      followers: string;
      frequency: string;
      contentType: string;
    };
    segmentAffinity: { segment: string; fitScore: number; reason: string }[];
    productTypePreference: string;
    networkExperience: string;
    learningStyle: string;
    resilienceScore: number;     // 0-100
    motivationDrivers: string[];
    onboardingPath: 'accelerated' | 'standard' | 'guided';
    predictedOutput: 'high' | 'medium' | 'low';
    retentionRisk: 'low' | 'medium' | 'high';
    recommendedActions: string[]; // acoes especificas para o admin
    tags: string[];               // tags para filtragem
  };
}

export interface OnboardingAnswers {
  [questionId: number]: string | string[] | number;
}

// ============================================
// ANALISE COM CLAUDE API
// ============================================

export async function analyzeBehavioralProfile(
  answers: OnboardingAnswers,
  userName: string,
): Promise<BehavioralProfileResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY nao configurada');
  }

  const client = new Anthropic({ apiKey });

  const questionsContext = ONBOARDING_QUESTIONS.map(q => {
    const answer = answers[q.id];
    const answerLabel = Array.isArray(answer)
      ? answer.map(a => q.options?.find(o => o.value === a)?.label ?? a).join(', ')
      : q.options?.find(o => o.value === String(answer))?.label ?? String(answer);
    return `Pergunta ${q.id}: "${q.question}" → Resposta: ${answerLabel}`;
  }).join('\n');

  const prompt = `Voce e um psicologo organizacional especialista em creator economy e perfis comportamentais. Analise as respostas do onboarding de um novo creator na plataforma Brandly e gere dois diagnosticos completos.

CONTEXTO: Brandly e uma plataforma brasileira de creator economy. Creators produzem videos UGC para marcas, vendem produtos (fisicos e digitais) e constroem rede. Remuneracao: R$100/dia (10 videos) + comissoes por vendas + bonus de rede.

NOME DO CREATOR: ${userName}

RESPOSTAS DO ONBOARDING:
${questionsContext}

FRAMEWORK DE ANALISE:
- DISC simplificado: D(Dominancia), I(Influencia), S(Estabilidade), C(Conformidade)
- 6 Arquetipos de Creator: Educador (ensina), Entertainer (diverte), Motivador (inspira), Conector (relaciona), Curador (seleciona/review), Estrategista (planeja/analisa)
- Niveis: iniciante, intermediario, avancado, expert

GERE um JSON valido com EXATAMENTE esta estrutura (sem comentarios, sem markdown, apenas o JSON puro):

{
  "creatorDiagnostic": {
    "archetype": "string (um dos 6 arquetipos)",
    "archetypeEmoji": "string (emoji que representa)",
    "title": "string (titulo criativo tipo 'O Educador Nato')",
    "shortDescription": "string (2 frases sobre o perfil, em PT-BR, personalizado)",
    "strengths": ["string", "string", "string"],
    "superpower": "string (superpoder unico em 1 frase impactante)",
    "contentStyle": "string (estilo de conteudo recomendado)",
    "idealFormats": ["string", "string"],
    "productMatch": ["string", "string", "string"],
    "motivationPhrase": "string (frase motivacional personalizada)",
    "level": "string (iniciante|intermediario|avancado|expert)",
    "readinessScore": number (0-100)
  },
  "adminDiagnostic": {
    "disc": { "D": number, "I": number, "S": number, "C": number },
    "primaryDisc": "string (D, I, S ou C)",
    "riskTolerance": "string (low|medium|high)",
    "cameraComfort": "string (low|medium|high)",
    "experienceLevel": "string",
    "dedicationHours": number,
    "socialPresence": {
      "platforms": ["string"],
      "followers": "string",
      "frequency": "string",
      "contentType": "string"
    },
    "segmentAffinity": [{ "segment": "string", "fitScore": number, "reason": "string" }],
    "productTypePreference": "string",
    "networkExperience": "string",
    "learningStyle": "string",
    "resilienceScore": number (0-100),
    "motivationDrivers": ["string"],
    "onboardingPath": "string (accelerated|standard|guided)",
    "predictedOutput": "string (high|medium|low)",
    "retentionRisk": "string (low|medium|high)",
    "recommendedActions": ["string", "string", "string"],
    "tags": ["string", "string", "string"]
  }
}

REGRAS:
- Tudo em PT-BR exceto valores de enum (low/medium/high etc)
- Seja especifico e personalizado, nao generico
- segmentAffinity deve ter 3-5 segmentos com fitScore 0-100
- tags deve ter 3-6 tags uteis para filtragem (ex: "creator-iniciante", "alto-engajamento", "foco-beleza")
- recommendedActions deve ter 3 acoes praticas para o admin sobre como lidar com esse creator
- readinessScore e resilienceScore sao 0-100
- disc soma nao precisa ser 100 (cada dimensao e independente)`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Resposta inesperada da IA');
  }

  // Extrair JSON da resposta (pode vir com markdown code block)
  let jsonStr = textContent.text.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const result = JSON.parse(jsonStr) as BehavioralProfileResult;
  return result;
}
