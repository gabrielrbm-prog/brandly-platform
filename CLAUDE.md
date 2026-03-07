# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visao Geral

**Brandly** e uma plataforma SaaS de creator economy (fase pre-desenvolvimento) que conecta marcas com creators atraves de um modelo de marketing de rede + gamificacao. Toda documentacao do projeto esta em **portugues brasileiro**.

### Modelo de Negocio
- **Creators** vendem produtos fisicos de marcas parceiras e infoprodutos digitais (cursos/mentorias), constroem equipe (rede) e sobem na carreira
- **Marcas** ganham distribuicao via creators com conteudo UGC e vendas por performance (CPA/comissao), pagando margem comercial (alvo 50%) para a Brandly
- **Brandly** ganha com: margem sobre vendas fisicas (~23%), infoprodutos (~30% apos comissoes), taxas de setup, planos premium para creators e possivel white-label

### Oferta Principal — "Profissao Creator Brandly"
- Formacao completa + infraestrutura para se tornar Creator Profissional
- Modelo de remuneracao: R$100/dia GARANTIDO (10 videos/dia) + comissao por vendas
- Sistema SCALE: Selecao de Marcas, Capacitacao Completa, Automacao com IA (roteiros + edicao), Lives de Acompanhamento, Estrutura de Performance
- IA gera roteiros (3 ganchos x 3 corpos x 3 CTAs = 27 combinacoes) e edita videos em 30s
- Preco: 12x R$49,90 ou R$497 a vista | Garantia 30 dias
- Bonus: Kit creator fisico (10 primeiros), pagamento dobrado 3 dias (20 primeiros), meta reduzida 1a semana (50 primeiros), marcas premium (100 primeiros)

### Plano de Compensacao (logica de negocio central)

Dois tipos de produto com estruturas de comissao diferentes:

| | Digital (Infoproduto) | Fisico |
|---|---|---|
| Comissao direta | ate 50% | ate 20% |
| Rede total | 10% | 7% |
| - Bonus Infinito | ate 8% | ate 5% |
| - Bonus Equiparacao | 1% | 1% |
| - Bonus Global | 1% | 1% |

**Niveis de carreira** (ascendente): Seed, Spark, Flow, Iconic, Vision, Empire, Infinity — cada um com requisitos de QV (volume qualificado), diretos ativos e PML (ponto maximo por linha).

**Logica da engine de bonus** (critico para implementacao):
1. **Bonus direto**: `valor_venda * percent_direto[nivel_seller][tipo_produto]`
2. **Bonus Infinito**: Unilevel linear com compressao dinamica — percorre upline, paga diferenca entre niveis, pula membros nao qualificados
3. **Bonus Equiparacao** (1%): Quando um direto alcanca o mesmo nivel do patrocinador, o patrocinador ganha 1% sobre o volume daquela linha em vez da diferenca de nivel
4. **Bonus Global** (1%): Pool mensal distribuido entre Empire + Infinity proporcionalmente por pontos

### Entidades Principais do Banco (do spec)
Users, Levels, Products, Sales, Bonuses, Pools, Lines (rede), Qualifications

### Escopo do MVP
- App mobile com: area de membro, metricas de redes sociais (integracao Instagram/TikTok), ferramentas de estudio (geracao de copy, criacao de imagem, analise de video), painel de pagamentos, sistema de afiliados com indicacao em rede
- Sistema de validacao de qualidade de video (aprovar/rejeitar baseado no briefing da marca)
- Remuneracao por video para creators (R$100/dia por 10 videos)
- Gestao de contratos com marcas (minimo de videos/mes)
- Analise de perfil comportamental no onboarding
- Plataforma IA: geracao de roteiros (27 combinacoes) + edicao automatica de video (30s/video)
- Dashboard de performance: videos aprovados/pendentes, pagamentos em tempo real, ranking

## Personas-Alvo (6 clusters)

1. **Juliana — CLT Cansada** (32 anos, R$3.5k/mes): Medo de demissao, salario congelado, quer renda extra R$1-3k. Trigger: conta atrasada, amiga demitida
2. **Camila — Mae Sobrecarregada** (38 anos, renda R$0): Dona de casa, depende do marido, quer identidade propria. Trigger: "Voce fica em casa o dia todo". Motivacao principal e IDENTIDADE, nao dinheiro
3. **Marina — Jovem em Inicio de Carreira** (24 anos, R$2.2k/mes): CLT junior, quer empreender, anti-CLT. Trigger: amiga largou CLT. Score: 7.9/10
4. **Fernanda — Desempregada em Transicao** (35 anos, renda R$0): Desespero maximo, seguro acabando. Age por NECESSIDADE. Score: 9.05/10. Barreira: R$47 pesa (precisa trial R$1)
5. **Beatriz — Universitaria Empreendedora** (21 anos, R$0-800): Muito tempo livre, mente aberta, mas dispersa e procrastina. Comprometimento baixo
6. **Carolina — Creator sem Previsibilidade** (28 anos, R$800-4k irregular): JA e creator, 15-80k seguidores, dor MAXIMA de imprevisibilidade. **PERSONA #1 — score 9.75/10**. Conversao esperada 80-90%

**Ordem de prioridade de conversao**: Carolina (9.75) > Fernanda (9.05) > Marina (7.9) > Juliana > Camila > Beatriz

## Estrategia de Captacao e Webinario

### Webinario "Profissao Creator" (APN)
- Apresentadores: Raquel Guerreiro (creator) + Gabriel Rubim (CEO)
- Estrutura: 59 slides, ~1:30-1:40h
- Fluxo: Dor do modelo tradicional (afiliado/influencer) → Novo modelo EUA/China (pago por producao) → Sistema SCALE → Empilhamento de valor → Oferta → Bonus urgencia
- Dados-chave usados: 87% creators ganham <R$500/mes (Hotmart 2024), 91% desistem no 1o ano, mercado global US$250bi→500bi ate 2027
- Marcas parceiras mencionadas: Yav Health, Native, Foka, ETF, Conectar Energy, Vyva

### Benchmarking (concorrentes/referencias)
- **Internacionais**: Influee (89.800 creators, 23 paises), Insense, #paid, Twirl, Pearpop, LTK, JoinBrands, SideShift, Amplify, Trend.io
- **Nacionais**: Creators LLC (mais proxima da Brandly), EBAC, Academia UGC Creator, BE UGC, Criador Viral
- **Diferencial Brandly**: Nenhum concorrente garante ganho por PRODUCAO (fixo/dia) — todos sao marketplace ou so educacao

### Funis de Captacao de Creators
1. **DM → Pack → Primeiro Post** (rapido, 30-100 creators/semana)
2. **Landing/Typeform → Lista de Espera → Onboarding** (escalavel)
3. **Creator Challenge 7 Dias** (ativacao + prova social, 1x/mes)
4. **Outbound inteligente** (30 perfis/dia, DM curta)
5. **Indicacao** (cada creator traz 2 novos)

## Estrutura do Projeto

### Documentos de Planejamento
- `Projeto Brandly.docx` — Plano de negocio completo: estrutura de compensacao, margens, niveis de carreira, pseudocodigo da engine de bonus, projecoes de 12 meses
- `MVP BRANDLY.docx` — Requisitos do MVP (transcricao)
- `RoadMap Brandly .docx` — Estrategia TikTok Shop, funis de captacao de creators, frameworks de conteudo, ICP
- `APN Webinario Profissao Creator.docx` — Script completo do webinario de vendas (59 slides)
- `Benckmarketing Oferta Brandly.docx` — Analise de concorrentes internacionais e nacionais + ofertas de captacao
- `Cluster-Persona Brandly.docx` — 6 personas detalhadas com dores, objecoes, triggers, jornadas de compra e scores
- `APN BRANDLY .pdf` / `Brandly Brandbook.pdf` — Identidade visual e apresentacao
- `Todas_as_logos_Brandly.pdf` — Logos oficiais
- `AGENTS.md` — Configuracao de agentes Synkra AIOS

### Skills Disponiveis (copiados de Landing-Pages)

#### `/landing-page` — Construtor de landing pages AAA+
```
Argumentos:
  nome     - Nome do produto/empresa (obrigatorio)
  tema     - fintech | saas | ecommerce | crypto | health | education | ai | luxury | real-estate | agency
  cor      - Cor primaria hex
  estilo   - glassmorphism | neobrutalism | minimal | dark-luxe | gradient-mesh | editorial | light-clean
  tier     - standard (~800 linhas) | premium (~1200 linhas) | cinematic (~1500+ linhas)
  secoes   - Lista de secoes separadas por virgula
  idioma   - pt-BR | en-US

Exemplo: /landing-page "Brandly" tema=saas tier=premium estilo=dark-luxe
```

Stack: HTML5 + Tailwind CSS (CDN) + GSAP + ScrollTrigger + Lenis smooth scroll. Um arquivo HTML por landing page (tudo inline), dark theme padrao, mobile-first.

Arquivos do skill: `.claude/skills/landing-page/SKILL.md`, `components.md` (23 componentes), `techniques.md` (43+ tecnicas), `visuals-guide.md`

#### Sistema de Icones
- `.claude/skills/icons/SKILL.md` — Geracao de icones 3D Clay com Gemini API
- 7 estilos: clay, glass, flat, isometric, neon, gradient, outline
- 10 nichos com 12 icones semanticos cada

## Framework AIOS

Este projeto usa Synkra AIOS. Comandos principais do `AGENTS.md`:
- `npm run lint` / `npm run typecheck` / `npm test` — quality gates
- `npm run validate:structure` / `npm run validate:agents` — validacao de estrutura
- Personas de agentes disponiveis: `@architect`, `@dev`, `@qa`, `@pm`, `@po`, `@sm`, `@analyst`, `@devops`, `@data-engineer`, `@ux-design-expert`
- Ordem de prioridade: CLI First -> Observability Second -> UI Third
- Trabalho organizado por stories em `docs/stories/`
