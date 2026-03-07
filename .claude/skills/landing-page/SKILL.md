# /landing-page — Construtor Composicional de Landing Pages AAA+

## Description
Skill avancada para gerar landing pages AAA+ com qualidade de agencia profissional. Monta paginas composicionalmente a partir de uma biblioteca de componentes e tecnicas visuais, adaptando automaticamente ao nicho, tier e estilo escolhidos.

## User-invocable
Trigger: /landing-page
Description: Gera uma landing page AAA+ composicional com animacoes avancadas e design profissional
Arguments:
  - nome: Nome do produto/empresa (obrigatorio, pode ser passado como primeiro argumento posicional)
  - tema: fintech | saas | ecommerce | crypto | health | education | ai | luxury | real-estate | agency (default: saas)
  - cor: Cor primaria hex (opcional, auto-detectada por nicho se omitida)
  - estilo: glassmorphism | neobrutalism | minimal | dark-luxe | gradient-mesh | editorial | light-clean (default: dark-luxe)
  - tier: standard | premium | cinematic (default: premium)
  - secoes: Lista de secoes separadas por virgula (opcional, auto-selecionado por nicho)
  - idioma: pt-BR | en-US (default: pt-BR)

---

## Instructions

Voce e um construtor composicional de landing pages de elite mundial. Seu trabalho e montar paginas que competem com as melhores agencias do mundo (Linear, Stripe, Vercel, Apple) usando a biblioteca de componentes e tecnicas visuais deste projeto.

**IMPORTANTE: Leia os arquivos `components.md`, `techniques.md` e `visuals-guide.md` desta mesma pasta ANTES de iniciar a geracao.** Eles contem os snippets, variantes, padroes e guias de geracao de imagens/videos que voce DEVE usar.

---

### PROCESSO DE GERACAO (seguir em ordem)

#### Passo 1: Resolver Parametros

Receber os argumentos do usuario e preencher os defaults:

**Nichos e defaults:**

| Nicho | Cor | Heading Font | Body Font | Secoes padrao |
|-------|-----|-------------|-----------|---------------|
| fintech | #00D4AA | Space Grotesk | DM Sans | hero-a, ticker-a, problem, feat-b, steps-b, metrics-b, price-b, faq-a, cta-b |
| saas | #7C3AED | Space Grotesk | Inter | hero-b, ticker-a, feat-a, steps-a, metrics-a, testi-a, price-a, faq-a, cta-a |
| ecommerce | #F59E0B | Space Grotesk | Inter | hero-e, ticker-c, feat-c, steps-a, personas, testi-c, price-c, faq-b, cta-c |
| crypto | #3B82F6 | Space Grotesk | Inter | hero-c, ticker-a, feat-b, steps-c, metrics-a, price-a, faq-a, cta-b |
| health | #10B981 | Space Grotesk | Inter | hero-b, ticker-a, feat-a, steps-a, personas, testi-a, price-a, faq-a, cta-a |
| education | #8B5CF6 | Space Grotesk | Inter | hero-b, ticker-a, feat-c, steps-a, personas, testi-b, price-c, faq-b, cta-c |
| ai | #06B6D4 | Space Grotesk | Inter | hero-c, ticker-a, feat-d, steps-c, metrics-b, price-a, faq-a, cta-b |
| luxury | #C9A84C | Instrument Serif | DM Sans | hero-d, ticker-a, origin, feat-b, steps-b, metrics-b, team, testi-b, price-b, cta-b |
| real-estate | #2563EB | Playfair Display | Inter | hero-a, ticker-b, feat-c, steps-a, testi-a, price-a, faq-a, cta-c |
| agency | #EC4899 | Space Grotesk | Inter | hero-d, ticker-a, services, steps-c, team, testi-d, scarcity, comparison, cta-a |

**Se o usuario fornecer `secoes=`**, usar essa lista exata em vez das secoes padrao do nicho.

**Formato de secoes:** `component-variant` (ex: `hero-a`, `feat-b`, `price-c`)
Abreviacoes aceitas:
- `feat` = features, `testi` = testimonials, `price` = pricing
- `problem`, `origin`, `products`, `comparison`, `personas`, `team`, `scarcity`, `services` = sem variante (componente unico)
- `preloader`, `custom-cursor`, `scroll-progress`, `modal-form` = componentes de sistema

#### Passo 2: Selecionar Componentes

Baseado nas secoes resolvidas, ir ao `components.md` e coletar o HTML/CSS/JS de cada componente selecionado.

**Regras de selecao por tier:**

**Standard (~800 linhas):**
- NAV: sempre A
- Secoes: apenas as do nicho, sem componentes cinematic
- Tecnicas: apenas `[S]` do techniques.md
- SEM: preloader, custom-cursor, Three.js, SplitText, clip-path reveals
- Animacoes: scroll reveal basico, counters, parallax simples, magnetic buttons simples

**Premium (~1200 linhas):**
- NAV: sempre B (com scroll progress)
- Secoes: todas do nicho + componentes premium
- Tecnicas: `[S]` + `[P]` do techniques.md
- INCLUI: SplitText, 3D tilt cards, clip-path reveals, magnetic buttons com inner parallax, velocity skew, advanced staggers, rotating borders, vertical dual carousels
- SEM: preloader, custom-cursor, Three.js
- Componentes opcionais: PROBLEM, ORIGIN, PRODUCTS, COMPARISON, PERSONAS, TEAM, MODAL-FORM

**Cinematic (~1500+ linhas):**
- NAV: B (com scroll progress)
- Secoes: todas do nicho + PRELOADER + CUSTOM-CURSOR
- Tecnicas: `[S]` + `[P]` + `[C]` do techniques.md
- INCLUI: Tudo de premium + preloader cinematico, dual cursor, Three.js backgrounds (hero e/ou CTA), scroll velocity skew, clip-path reveals em secoes
- Hero: usar variante C (canvas) ou manter a do nicho mas adicionar canvas background
- CTA: preferir variante B (particles)

#### Passo 3: Montar Estrutura Base

```html
<!DOCTYPE html>
<html lang="[LANG]">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="[GENERATED_DESCRIPTION]">
  <meta name="theme-color" content="[ACCENT_COLOR]">
  <meta property="og:title" content="[BRAND_NAME]">
  <meta property="og:description" content="[GENERATED_DESCRIPTION]">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <title>[BRAND_NAME] | [TAGLINE]</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=[HEADING_FONT_URL]&family=[BODY_FONT_URL]&display=swap" rel="stylesheet">

  <!-- Tailwind -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            heading: ['[HEADING_FONT]', ...fallbacks],
            body: ['[BODY_FONT]', ...fallbacks],
          },
          colors: {
            accent: { DEFAULT: '[ACCENT_COLOR]', hover: '[DERIVED]', dim: '[DERIVED]' },
            surface: { 0: '#050508', 1: '#0A0A0F', 2: '#0F0F14', 3: '#16161D', 4: '#1E1E28' },
          }
        }
      }
    }
  </script>

  <style>
    /* CSS Variables, resets, typography, component styles */
    /* ... assembled from components.md + techniques.md */
  </style>
</head>
<body class="grain">
  <!-- PRELOADER (cinematic only) -->
  <!-- CUSTOM CURSOR (cinematic only) -->
  <!-- SCROLL PROGRESS (premium+) -->
  <!-- NAV -->
  <!-- HERO -->
  <!-- SECTIONS (in order defined by secoes) -->
  <!-- FOOTER -->

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/ScrollTrigger.min.js"></script>
  <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
  <!-- Premium+ -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/SplitText.min.js"></script>
  <!-- Cinematic only -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

  <script>
  (function(){
    // All JS assembled from components + techniques
    // Wrapped in IIFE
    function initPage() {
      // 1. Check dependencies loaded
      // 2. Register GSAP plugins
      // 3. Check reduced motion
      // 4. Init 3D scenes (cinematic)
      // 5. Init Lenis smooth scroll
      // 6. Init preloader (cinematic)
      // 7. Init scroll progress (premium+)
      // 8. Init navbar
      // 9. Init custom cursor (cinematic)
      // 10. Init hero animations
      // 11. Init scroll reveals
      // 12. Init section-specific animations
      // 13. Init magnetic buttons
      // 14. Init tilt cards (premium+)
      // 15. Init FAQ
      // 16. Init hamburger
      // 17. Init anchor scroll
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPage);
    } else {
      initPage();
    }
  })();
  </script>

  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebPage", "name": "[BRAND_NAME]", "description": "[GENERATED_DESCRIPTION]" }
  </script>
</body>
</html>
```

#### Passo 4: Substituir Tokens

Substituir todos os tokens `[BRAND_NAME]`, `[ACCENT_COLOR]`, `[HEADING_FONT]`, `[BODY_FONT]`, `[CTA_TEXT]`, `[CTA_URL]`, `[NICHE]`, `[LANG]` com valores reais.

Gerar conteudo relevante para o nicho:
- Headlines impactantes e especificos ao nicho
- Feature descriptions realistas
- Testimonials com nomes/cargos plausiveis
- Pricing com valores e features razoaveis para o setor
- FAQ com perguntas reais do nicho
- Metricas e numeros criveis

#### Passo 5: Gerar Pagina Completa

Salvar em `/templates/[nome-slug].html`. Um unico arquivo HTML com tudo inline.

---

### STACK TECNOLOGICO

| Recurso | CDN | Quando incluir |
|---------|-----|---------------|
| Tailwind CSS | `https://cdn.tailwindcss.com` | Sempre |
| GSAP | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/gsap.min.js` | Sempre |
| ScrollTrigger | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/ScrollTrigger.min.js` | Sempre |
| Lenis | `https://unpkg.com/lenis@1.1.18/dist/lenis.min.js` | Sempre |
| SplitText | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/SplitText.min.js` | Premium+ |
| Flip | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/Flip.min.js` | Se usar tabs/layout anim |
| DrawSVG | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/DrawSVGPlugin.min.js` | Se usar SVG anim |
| Three.js | `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` | Cinematic |
| Spline Viewer | `https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js` | Cinematic (hero-g) |
| dotLottie WC | `https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js` | Premium+ (icones) |

**Google Fonts** — usar as fontes definidas na tabela de nichos.

---

### DESIGN SYSTEM

```css
:root {
  /* Derivar TODAS as cores a partir de --accent */
  --accent: [ACCENT_COLOR];
  --accent-hover: color-mix(in srgb, var(--accent), white 15%);
  --accent-dim: color-mix(in srgb, var(--accent), black 30%);
  --accent-glow: color-mix(in srgb, var(--accent), transparent 70%);
  --accent-glow-md: color-mix(in srgb, var(--accent), transparent 55%);
  --accent-glow-strong: color-mix(in srgb, var(--accent), transparent 40%);
  --accent-border: color-mix(in srgb, var(--accent), transparent 80%);
  --accent-glass: color-mix(in srgb, var(--accent), transparent 97%);

  /* Backgrounds */
  --bg-0: #050508;
  --bg-1: #0A0A0F;
  --bg-2: #0F0F14;
  --bg-3: #16161D;
  --bg-4: #1E1E28;
  --bg-5: #282833;

  /* Text */
  --text-1: #F5F0E8;
  --text-2: #B0AAA0;
  --text-3: #7A7468;

  /* Borders */
  --border-subtle: rgba(255,255,255,0.05);

  /* Typography */
  --font-heading: '[HEADING_FONT]', sans-serif;
  --font-body: '[BODY_FONT]', -apple-system, sans-serif;

  /* Sizing */
  --size-hero: clamp(3rem, 8vw, 6rem);
  --size-h2: clamp(2rem, 5vw, 3.5rem);
  --size-body: 1.125rem;

  /* Spacing */
  --section-py: clamp(80px, 12vh, 160px);
  --max-width: 1280px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

**Estilos visuais:**

| Estilo | Caracteristicas |
|--------|----------------|
| dark-luxe | Default. Backgrounds #050508-#0A0A0F. Glass sutil. Gold/accent highlights. |
| glassmorphism | Glass mais pronunciado (blur 32px, bg 0.06). Borders mais visiveis. |
| neobrutalism | Borders solidas 2px. Sombras duras (4px 4px). Cores mais vivas. Sem blur. |
| minimal | Espacamento generoso. Menos efeitos. Tipografia limpa. Poucos decorativos. |
| gradient-mesh | Gradient orbs grandes. Backgrounds com mesh colorido. Transicoes suaves. |
| editorial | Tipografia grande. Layout assimetrico. Muito whitespace. Serif headings. |
| light-clean | Light theme (#FAFAF8 bg). Texto escuro. Whitespace editorial. Glass claro. Botoes escuros. Ver techniques.md secao 9. |

---

### RESPONSIVIDADE

```
BREAKPOINTS:
- Mobile (< 640px): single column, font scaling, hidden nav, hamburger
- Tablet (640-1024px): 2 col grids, adjusted spacing
- Desktop (> 1024px): full layout com todos os efeitos
- Ultra-wide (> 1536px): max-width container

REGRAS:
- Hero title: clamp(2.5rem, 8vw, 6rem)
- Sections: py com clamp()
- Grids: repeat(auto-fit, minmax(300px, 1fr))
- Imagens: object-fit cover + aspect-ratio
- Todos os clamp() para fluid typography
- Testar mentalmente: 375px, 768px, 1024px, 1440px
```

---

### SEO & PERFORMANCE

- Meta tags completas (description, og, twitter)
- Structured data JSON-LD
- `preconnect` para Google Fonts
- Scripts com defer onde possivel
- CSS critico inline
- `will-change` apenas nos elementos que precisam
- `@media (prefers-reduced-motion: reduce)` OBRIGATORIO

---

### ACESSIBILIDADE (OBRIGATORIO em todos os tiers)

- WCAG AA contraste minimo
- `aria-label` em links/buttons sem texto visivel
- `alt` em todas as imagens
- `:focus-visible` com outline visivel
- `prefers-reduced-motion: reduce` disabling animations
- Semantic HTML (nav, main, section, footer, h1-h6)
- Skip-to-content link (opcional mas recomendado)

---

### GERACAO DE VISUAIS (Imagens, Videos, 3D)

**Consultar `visuals-guide.md` para o guia completo.** Resumo rapido:

**Imagens IA:**
- **Gemini Flash** (gratis, rapido) → aistudio.google.com
- **Flux Pro** (fotorrealismo) → replicate.com, fal.ai
- **Midjourney v7** (arte) → midjourney.com
- **Ideogram 2.0** (logos com texto) → ideogram.ai
- Prompts por nicho e secao no `visuals-guide.md` secoes 2-3

**Videos IA (para hero-f background):**
- **Pika 2.5** (loops gratis) → pika.art
- **Runway Gen-3** (cinematico) → runwayml.com
- **Kling 2.6** (rostos) → klingai.com
- Prompts e otimizacao no `visuals-guide.md` secao 4

**3D Interativo (para hero-g):**
- **Spline** (gratis, visual) → spline.design
- Criar cena → exportar URL → embed com spline-viewer

**Scripts do projeto:**
```bash
python scripts/generate-images.py [NICHE] [BRAND_NAME] '[ACCENT_COLOR]'
python scripts/generate-logo.py [BRAND_NAME] [NICHE] '[ACCENT_COLOR]' minimal
```

**Placeholders rapidos:** https://placehold.co/

---

### CHECKLIST FINAL

Antes de entregar, verificar TODOS:
- [ ] Arquivo salvo em `/templates/[nome-slug].html`
- [ ] Unico arquivo HTML com tudo inline (CSS + JS)
- [ ] Zero erros de sintaxe HTML/CSS/JS
- [ ] Smooth scroll (Lenis) funcionando
- [ ] Todas as animacoes GSAP corretas
- [ ] Responsivo em 4 breakpoints
- [ ] Dark theme consistente
- [ ] Hover states em botoes/cards/links
- [ ] `:focus-visible` para acessibilidade
- [ ] `prefers-reduced-motion` handler
- [ ] Imagens com alt text
- [ ] Meta tags completas
- [ ] Conteudo relevante ao nicho (nao lorem ipsum)
- [ ] Tier correto (verificar linhas e features incluidas)
- [ ] Nav hamburger funcional no mobile
- [ ] FAQ accordion funcional
- [ ] Counters animados (se metrics presente)
- [ ] Idioma correto no conteudo

---

### EXEMPLOS DE USO

```
/landing-page "NovaPay" tema=fintech
→ Premium, #00D4AA, DM Sans + Space Grotesk, secoes padrao fintech

/landing-page "LuxBrand" tema=luxury tier=cinematic
→ Cinematic, #C9A84C, DM Sans + Instrument Serif, com preloader + cursor + Three.js

/landing-page "CryptoX" tema=crypto secoes="hero-c,feat-d,price-a,cta-b"
→ Premium, #3B82F6, secoes customizadas

/landing-page "TestApp" tema=saas tier=standard estilo=minimal
→ Standard, #7C3AED, estilo minimal, ~800 linhas

/landing-page "HealthPlus" tema=health idioma=en-US
→ Premium, #10B981, conteudo em ingles

/landing-page "AgencyX" tema=agency tier=cinematic cor=#FF6B35
→ Cinematic, cor customizada #FF6B35, secoes padrao agency
```
