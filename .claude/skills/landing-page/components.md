# Biblioteca de Componentes

Catalogo de componentes reutilizaveis para landing pages. Cada componente tem variantes, HTML esqueleto, CSS/JS requeridos e tokens de parametrizacao.

## Tokens de Parametrizacao

```
[BRAND_NAME]    — Nome do produto/empresa
[ACCENT_COLOR]  — Cor primaria hex (ex: #00D4AA)
[HEADING_FONT]  — Fonte dos headings (ex: Space Grotesk)
[BODY_FONT]     — Fonte do body (ex: Inter)
[NICHE]         — Nicho/tema (fintech, saas, etc)
[CTA_TEXT]      — Texto do botao principal
[CTA_URL]       — URL do botao principal
[LANG]          — Idioma (pt-BR ou en-US)
```

**Convencoes de markup:**
- Todas as secoes usam `class="reveal"` para scroll animations
- Botoes primarios: `class="btn-primary magnetic"`
- Botoes secundarios: `class="btn-outline magnetic"`
- Cards interativos: `class="tilt-card"` com `<div class="shine"></div>` dentro
- Elementos com parallax: `data-parallax="-0.3"`

---

## 1. NAV

### Variante A: Minimal
Logo + links inline + CTA. Sem progress bar, sem cursor customizado.

```html
<nav class="fixed top-0 left-0 w-full z-50" id="navbar">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3" aria-label="[BRAND_NAME]">
      <!-- Logo SVG ou img -->
      <span class="font-heading text-lg font-semibold">[BRAND_NAME]</span>
    </a>
    <div class="hidden lg:flex items-center gap-8">
      <!-- Nav links -->
      <a href="#features" class="nav-link">Features</a>
      <a href="#pricing" class="nav-link">Pricing</a>
      <a href="#faq" class="nav-link">FAQ</a>
    </div>
    <div class="flex items-center gap-4">
      <a href="[CTA_URL]" class="hidden sm:inline-flex btn-primary magnetic text-xs">[CTA_TEXT]</a>
      <button class="hamburger lg:hidden flex flex-col gap-[5px] p-2" id="hamburgerBtn">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <!-- Mobile menu -->
  <div class="mobile-menu lg:hidden px-5 pb-4" id="mobileMenu">
    <div class="flex flex-col gap-3 pt-4 border-t border-white/5">
      <a href="#features" class="text-sm py-2 text-secondary">Features</a>
      <a href="#pricing" class="text-sm py-2 text-secondary">Pricing</a>
      <a href="#faq" class="text-sm py-2 text-secondary">FAQ</a>
      <a href="[CTA_URL]" class="btn-primary text-xs !py-3 mt-2 text-center">[CTA_TEXT]</a>
    </div>
  </div>
</nav>
```

**CSS requerido:** nav.scrolled (blur+bg), hamburger, mobile-menu
**JS requerido:** navbar scroll detection, hamburger toggle, anchor smooth scroll
**Tier:** Standard+

### Variante B: Premium (cursor progress)
Tudo da A + scroll progress bar no topo + custom cursor elements.

```html
<!-- Adicionar ANTES do nav -->
<div class="scroll-progress" id="scrollProgress"></div>

<!-- Nav igual ao A mas com nav links com hover mais sofisticado -->
```

**CSS adicional:** .scroll-progress, nav-link underline animation
**JS adicional:** ScrollTrigger progress bar, cursor state changes on interactive elements
**Tier:** Premium+

### Variante C: Centered
Logo centralizado, links divididos esquerda/direita.

```html
<nav class="fixed top-0 left-0 w-full z-50" id="navbar">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-center gap-12">
    <div class="hidden lg:flex items-center gap-6">
      <a href="#features" class="nav-link">Features</a>
      <a href="#pricing" class="nav-link">Pricing</a>
    </div>
    <a href="#" class="flex items-center gap-3" aria-label="[BRAND_NAME]">
      <span class="font-heading text-xl font-semibold">[BRAND_NAME]</span>
    </a>
    <div class="hidden lg:flex items-center gap-6">
      <a href="#faq" class="nav-link">FAQ</a>
      <a href="[CTA_URL]" class="btn-primary magnetic text-xs">[CTA_TEXT]</a>
    </div>
  </div>
</nav>
```

**Tier:** Standard+

---

## 2. HERO

### Variante A: Split (texto esquerda + visual direita)

```html
<section class="relative min-h-screen flex items-center overflow-hidden" id="hero">
  <!-- Parallax orbs (decorative) -->
  <div class="hero-orb" data-parallax="-0.4" style="width:500px;height:500px;..."></div>
  <div class="hero-orb" data-parallax="-0.2" style="width:350px;height:350px;..."></div>

  <div class="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div>
        <div class="flex items-center gap-3 mb-8 hero-badge" style="opacity:0">
          <div class="h-[1px] w-8 bg-accent/40"></div>
          <span class="section-label">[NICHE] description</span>
        </div>
        <h1 class="font-heading text-[clamp(3rem,7.5vw,5.5rem)] leading-[0.95] tracking-tight mb-6">
          <span class="hero-line block overflow-hidden"><span class="hero-line-inner block heading-fade">Line 1</span></span>
          <span class="hero-line block overflow-hidden"><span class="hero-line-inner block gradient-text">Line 2</span></span>
          <span class="hero-line block overflow-hidden"><span class="hero-line-inner block heading-fade">Line 3.</span></span>
        </h1>
        <p class="text-lg leading-relaxed mb-10 max-w-lg hero-desc text-secondary" style="opacity:0">
          Subtitle description text here.
        </p>
        <div class="flex flex-wrap gap-4 hero-ctas" style="opacity:0">
          <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
          <a href="#features" class="btn-outline magnetic">Learn More</a>
        </div>
      </div>
      <div class="flex justify-center lg:justify-end hero-visual" style="opacity:0">
        <!-- Hero visual: image, 3D card, illustration, etc -->
      </div>
    </div>
  </div>
  <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg-primary to-transparent z-10"></div>
</section>
```

**JS:** Hero timeline (badge → lines → desc → ctas → visual), parallax orbs
**Tier:** Standard+

### Variante B: Centered
Texto centralizado, visual abaixo.

```html
<section class="relative min-h-screen flex items-center justify-center overflow-hidden" id="hero">
  <div class="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-28 pb-20 text-center">
    <span class="section-label mb-6 inline-block">[NICHE] tagline</span>
    <h1 class="font-heading text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight mb-6">
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block">Headline that</span></span>
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block gradient-text">captures attention</span></span>
    </h1>
    <p class="text-lg leading-relaxed mb-10 max-w-2xl mx-auto text-secondary hero-desc" style="opacity:0">
      Subtitle text.
    </p>
    <div class="flex flex-wrap justify-center gap-4 hero-ctas" style="opacity:0">
      <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
      <a href="#features" class="btn-outline magnetic">Learn More</a>
    </div>
    <!-- Optional: feature preview image below -->
    <div class="mt-16 hero-visual rounded-xl overflow-hidden border border-white/5" style="opacity:0">
      <img src="placeholder" alt="Product preview" class="w-full blur-up" />
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante C: Video / Canvas Background
Canvas Three.js ou video como fundo, conteudo centralizado.

```html
<section class="relative min-h-screen flex items-center justify-center overflow-hidden" id="hero">
  <canvas id="hero-canvas" class="absolute inset-0 z-0 pointer-events-none"></canvas>
  <div class="relative z-10 max-w-4xl mx-auto px-5 text-center">
    <!-- Same structure as B -->
  </div>
</section>
```

**JS adicional:** Three.js scene (floating geometry — ver techniques.md 3.1)
**Tier:** Cinematic

### Variante D: Editorial
Layout assimetrico, tipografia grande, estilo magazine.

```html
<section class="relative min-h-screen flex items-end overflow-hidden" id="hero">
  <div class="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-20 pt-40 w-full">
    <span class="section-label mb-6 block">[NICHE]</span>
    <h1 class="font-heading text-[clamp(4rem,12vw,10rem)] leading-[0.85] tracking-tighter mb-8">
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block heading-fade">Big</span></span>
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block gradient-text">Statement.</span></span>
    </h1>
    <div class="grid lg:grid-cols-3 gap-8 items-end">
      <p class="text-lg leading-relaxed text-secondary hero-desc col-span-1" style="opacity:0">
        Description text.
      </p>
      <div class="col-span-1"></div>
      <div class="flex gap-4 justify-end hero-ctas" style="opacity:0">
        <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Premium+ (ideal para luxury, agency)

### Variante E: Bento Hero
Grid estilo bento com multiplos cards no hero.

```html
<section class="relative min-h-screen flex items-center overflow-hidden" id="hero">
  <div class="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
    <div class="text-center mb-12">
      <h1 class="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-tight mb-4">
        Headline <span class="gradient-text">Highlighted</span>
      </h1>
      <p class="text-lg text-secondary max-w-2xl mx-auto">Subtitle.</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px] lg:auto-rows-[200px]">
      <div class="tilt-card glass rounded-xl p-6 col-span-2 row-span-2 flex flex-col justify-end">
        <div class="shine"></div>
        <!-- Main feature card -->
      </div>
      <div class="tilt-card glass rounded-xl p-5 flex flex-col justify-between">
        <div class="shine"></div>
        <!-- Small card 1 -->
      </div>
      <div class="tilt-card glass rounded-xl p-5 flex flex-col justify-between">
        <div class="shine"></div>
        <!-- Small card 2 -->
      </div>
      <div class="tilt-card glass rounded-xl p-5 col-span-2 flex items-center gap-6">
        <div class="shine"></div>
        <!-- Wide card -->
      </div>
    </div>
    <div class="flex justify-center gap-4 mt-10 hero-ctas" style="opacity:0">
      <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
    </div>
  </div>
</section>
```

**Tier:** Premium+ (ideal para ecommerce, saas)

### Variante F: Video Background
Hero com video loop como fundo. Conteudo centralizado sobre overlay escuro. Video gerado por IA (Runway/Pika/Kling).

```html
<section class="relative min-h-screen flex items-center justify-center overflow-hidden" id="hero">
  <!-- Video background -->
  <div class="absolute inset-0 z-0">
    <video autoplay muted loop playsinline poster="/assets/[BRAND_SLUG]/hero-poster.jpg"
      class="w-full h-full object-cover" aria-hidden="true">
      <source src="/assets/[BRAND_SLUG]/hero-video.webm" type="video/webm">
      <source src="/assets/[BRAND_SLUG]/hero-video.mp4" type="video/mp4">
    </video>
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--bg-0)] to-transparent"></div>
  </div>
  <!-- Content -->
  <div class="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
    <span class="section-label mb-6 inline-block hero-badge" style="opacity:0">[NICHE] tagline</span>
    <h1 class="font-heading text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight mb-6">
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block">Headline</span></span>
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block gradient-text">Impact Word</span></span>
    </h1>
    <p class="text-lg leading-relaxed mb-10 max-w-2xl mx-auto text-white/80 hero-desc" style="opacity:0">
      Subtitle description.
    </p>
    <div class="flex flex-wrap justify-center gap-4 hero-ctas" style="opacity:0">
      <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
      <a href="#features" class="btn-outline magnetic">Learn More</a>
    </div>
  </div>
</section>
```

**CSS adicional:** ver techniques.md 10.1 (mobile fallback, reduced motion)
**Video:** gerar com Runway/Pika (ver visuals-guide.md secao 4)
**Tier:** Premium+

### Variante G: Spline 3D Interactive
Hero com cena 3D interativa do Spline como fundo. Reage ao mouse. Zero codigo 3D — tudo feito no editor visual spline.design.

```html
<section class="relative min-h-screen flex items-center overflow-hidden" id="hero">
  <!-- Spline 3D scene -->
  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"></script>
  <spline-viewer
    url="https://prod.spline.design/[SCENE_ID]/scene.splinecode"
    class="absolute inset-0 z-0"
    loading-anim-type="none"
  ></spline-viewer>
  <!-- Overlay -->
  <div class="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-[var(--bg-0)]"></div>
  <!-- Content -->
  <div class="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
    <h1 class="font-heading text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tight mb-6">
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block">3D</span></span>
      <span class="hero-line block overflow-hidden"><span class="hero-line-inner block gradient-text">Experience.</span></span>
    </h1>
    <p class="text-lg leading-relaxed mb-10 max-w-2xl mx-auto text-secondary hero-desc" style="opacity:0">
      Subtitle.
    </p>
    <div class="flex flex-wrap justify-center gap-4 hero-ctas" style="opacity:0">
      <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
    </div>
  </div>
</section>
```

**Instrucoes para criar cena Spline:** ver techniques.md 10.2
**Tier:** Cinematic

---

## 3. TICKER

### Variante A: Logo/Text Ticker

```html
<section class="py-8 overflow-hidden border-y border-white/5 skew-scroll">
  <div class="ticker-track">
    <div class="flex items-center gap-16 px-8">
      <span class="text-sm font-semibold tracking-wider whitespace-nowrap opacity-30">PARTNER 1</span>
      <span class="text-sm font-semibold tracking-wider whitespace-nowrap opacity-30">PARTNER 2</span>
      <!-- ... more items -->
    </div>
    <!-- Duplicate for seamless loop -->
    <div class="flex items-center gap-16 px-8">
      <span class="text-sm font-semibold tracking-wider whitespace-nowrap opacity-30">PARTNER 1</span>
      <span class="text-sm font-semibold tracking-wider whitespace-nowrap opacity-30">PARTNER 2</span>
    </div>
  </div>
</section>
```

```css
.ticker-track { display:flex; width:max-content; animation:ticker 40s linear infinite; }
@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
```

**Tier:** Standard+

### Variante B: Logos + Quotes
Duas faixas: logos de parceiros + ticker de quotes/depoimentos curtos em direcao oposta.

```html
<section class="py-12 overflow-hidden border-y border-white/5">
  <!-- Row 1: Logos going right -->
  <div class="ticker-track mb-6">
    <div class="flex items-center gap-16 px-8">
      <!-- Logo images with opacity-40 hover:opacity-70 -->
      <img src="logo1.svg" alt="Partner" class="h-8 opacity-40 hover:opacity-70 transition-opacity" />
    </div>
    <div class="flex items-center gap-16 px-8"><!-- duplicate --></div>
  </div>
  <!-- Row 2: Quotes going left -->
  <div class="ticker-track-reverse">
    <div class="flex items-center gap-12 px-8">
      <span class="glass-card rounded-full px-6 py-3 text-xs text-secondary whitespace-nowrap">"Quote 1" — Author</span>
    </div>
    <div class="flex items-center gap-12 px-8"><!-- duplicate --></div>
  </div>
</section>
```

```css
.ticker-track-reverse { display:flex; width:max-content; animation:ticker-rev 35s linear infinite; }
@keyframes ticker-rev { from{transform:translateX(-50%)} to{transform:translateX(0)} }
```

**Tier:** Premium+

### Variante C: Vertical Dual Carousels
Duas colunas de imagens/cards rolando verticalmente em direcoes opostas. Efeito visual premium para social proof, portfolio ou lifestyle imagery.

```html
<section class="py-section overflow-hidden">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-12">
      <span class="section-label mb-4 block reveal">Social Proof</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Join <span class="gradient-text">thousands</span> already growing
      </h2>
    </div>
    <div class="vertical-carousel-container">
      <!-- Column 1: scrolls up -->
      <div class="vertical-carousel-track scroll-up">
        <img src="img1.webp" alt="Showcase 1" loading="lazy" />
        <img src="img2.webp" alt="Showcase 2" loading="lazy" />
        <img src="img3.webp" alt="Showcase 3" loading="lazy" />
        <img src="img4.webp" alt="Showcase 4" loading="lazy" />
        <img src="img5.webp" alt="Showcase 5" loading="lazy" />
        <img src="img6.webp" alt="Showcase 6" loading="lazy" />
        <!-- Duplicate set for seamless loop -->
        <img src="img1.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img2.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img3.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img4.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img5.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img6.webp" alt="" loading="lazy" aria-hidden="true" />
      </div>
      <!-- Column 2: scrolls down -->
      <div class="vertical-carousel-track scroll-down">
        <img src="img7.webp" alt="Showcase 7" loading="lazy" />
        <img src="img8.webp" alt="Showcase 8" loading="lazy" />
        <img src="img9.webp" alt="Showcase 9" loading="lazy" />
        <img src="img10.webp" alt="Showcase 10" loading="lazy" />
        <img src="img11.webp" alt="Showcase 11" loading="lazy" />
        <img src="img12.webp" alt="Showcase 12" loading="lazy" />
        <!-- Duplicate set for seamless loop -->
        <img src="img7.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img8.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img9.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img10.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img11.webp" alt="" loading="lazy" aria-hidden="true" />
        <img src="img12.webp" alt="" loading="lazy" aria-hidden="true" />
      </div>
    </div>
  </div>
</section>
```

```css
.vertical-carousel-container {
  display: flex; width: 100%; height: 500px;
  overflow: hidden; gap: 12px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
}
.vertical-carousel-track {
  flex: 1; display: flex; flex-direction: column; gap: 12px;
}
.vertical-carousel-track.scroll-up { animation: verticalScrollUp 25s linear infinite; }
.vertical-carousel-track.scroll-down { animation: verticalScrollDown 25s linear infinite; }
@keyframes verticalScrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
@keyframes verticalScrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
.vertical-carousel-track img {
  width: 100%; border-radius: 12px; object-fit: cover; aspect-ratio: 3/4;
}
.vertical-carousel-container:hover .vertical-carousel-track { animation-play-state: paused; }
@media (max-width: 640px) {
  .vertical-carousel-container { height: 350px; }
}
```

**Tier:** Premium+

---

## 4. FEATURES

### Variante A: Grid 3-col

```html
<section class="py-section" id="features">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Features</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Everything you need to <span class="gradient-text">succeed</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Repeat for each feature -->
      <div class="tilt-card glass rounded-xl p-8 reveal">
        <div class="shine"></div>
        <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
          <!-- SVG icon -->
        </div>
        <h3 class="text-lg font-semibold mb-3">Feature Title</h3>
        <p class="text-secondary text-sm leading-relaxed">Feature description.</p>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante B: Bento Grid
Layout assimetrico tipo bento box — cards de tamanhos variados.

```html
<section class="py-section" id="features">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Features</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Built for <span class="gradient-text">performance</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="tilt-card glass rounded-xl p-8 lg:col-span-2 lg:row-span-2 reveal">
        <div class="shine"></div>
        <div class="h-full flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-semibold mb-3">Main Feature</h3>
            <p class="text-secondary leading-relaxed">Description.</p>
          </div>
          <!-- Optional: illustration or visual -->
        </div>
      </div>
      <div class="tilt-card glass rounded-xl p-6 reveal">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Feature 2</h3>
        <p class="text-secondary text-sm">Description.</p>
      </div>
      <div class="tilt-card glass rounded-xl p-6 reveal">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Feature 3</h3>
        <p class="text-secondary text-sm">Description.</p>
      </div>
      <div class="tilt-card glass rounded-xl p-6 lg:col-span-2 reveal">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Wide Feature</h3>
        <p class="text-secondary text-sm">Description.</p>
      </div>
      <div class="tilt-card glass rounded-xl p-6 reveal">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Feature 5</h3>
        <p class="text-secondary text-sm">Description.</p>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Premium+

### Variante C: Alternating Left/Right
Features alternando texto+imagem esquerda/direita.

```html
<section class="py-section" id="features">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 space-y-24">
    <div class="text-center mb-8">
      <span class="section-label mb-4 block reveal">Features</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        How it <span class="gradient-text">works</span>
      </h2>
    </div>
    <!-- Feature 1 (image right) -->
    <div class="grid lg:grid-cols-2 gap-12 items-center reveal">
      <div>
        <span class="section-label mb-4 block">01</span>
        <h3 class="font-heading text-2xl mb-4">Feature Title</h3>
        <p class="text-secondary leading-relaxed mb-6">Description.</p>
        <ul class="space-y-3">
          <li class="flex items-center gap-3 text-sm text-secondary">
            <div class="accent-dot"></div> Bullet point
          </li>
        </ul>
      </div>
      <div class="glass rounded-xl p-8 aspect-video flex items-center justify-center">
        <!-- Visual/illustration -->
      </div>
    </div>
    <!-- Feature 2 (image left) -->
    <div class="grid lg:grid-cols-2 gap-12 items-center reveal">
      <div class="order-2 lg:order-1 glass rounded-xl p-8 aspect-video flex items-center justify-center">
        <!-- Visual -->
      </div>
      <div class="order-1 lg:order-2">
        <span class="section-label mb-4 block">02</span>
        <h3 class="font-heading text-2xl mb-4">Feature Title</h3>
        <p class="text-secondary leading-relaxed">Description.</p>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante D: Tabs Interativas
Tabs que trocam conteudo com animacao.

```html
<section class="py-section" id="features">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Features</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Powerful <span class="gradient-text">capabilities</span>
      </h2>
    </div>
    <!-- Tab buttons -->
    <div class="flex flex-wrap justify-center gap-3 mb-12 reveal">
      <button class="tab-btn active glass rounded-full px-6 py-3 text-sm" data-tab="tab1">Tab 1</button>
      <button class="tab-btn glass rounded-full px-6 py-3 text-sm" data-tab="tab2">Tab 2</button>
      <button class="tab-btn glass rounded-full px-6 py-3 text-sm" data-tab="tab3">Tab 3</button>
    </div>
    <!-- Tab contents -->
    <div class="tab-container">
      <div class="tab-content active" data-tab-content="tab1">
        <div class="grid lg:grid-cols-2 gap-8 items-center">
          <div><h3 class="text-xl font-semibold mb-4">Tab 1 Title</h3><p class="text-secondary">Content.</p></div>
          <div class="glass rounded-xl aspect-video"></div>
        </div>
      </div>
      <div class="tab-content hidden" data-tab-content="tab2"><!-- ... --></div>
      <div class="tab-content hidden" data-tab-content="tab3"><!-- ... --></div>
    </div>
  </div>
</section>
```

```css
.tab-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
.tab-content { transition: opacity 0.3s, transform 0.3s; }
.tab-content.hidden { display: none; }
```

```javascript
// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelector(`[data-tab-content="${btn.dataset.tab}"]`).classList.remove('hidden');
  });
});
```

**Tier:** Premium+

---

## 5. STEPS

### Variante A: Horizontal Steps

```html
<section class="py-section" id="steps">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">How it works</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Get started in <span class="gradient-text">3 steps</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="text-center reveal">
        <div class="step-num mx-auto mb-6">01</div>
        <h3 class="text-lg font-semibold mb-3">Step Title</h3>
        <p class="text-secondary text-sm leading-relaxed">Description.</p>
      </div>
      <div class="text-center reveal">
        <div class="step-num mx-auto mb-6">02</div>
        <h3 class="text-lg font-semibold mb-3">Step Title</h3>
        <p class="text-secondary text-sm leading-relaxed">Description.</p>
      </div>
      <div class="text-center reveal">
        <div class="step-num mx-auto mb-6">03</div>
        <h3 class="text-lg font-semibold mb-3">Step Title</h3>
        <p class="text-secondary text-sm leading-relaxed">Description.</p>
      </div>
    </div>
  </div>
</section>
```

```css
.step-num {
  font-family: var(--font-heading);
  font-size: 4.5rem; font-weight: 400; line-height: 0.9;
  background: linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent), transparent 85%) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
```

**Tier:** Standard+

### Variante B: Timeline Vertical
Steps em coluna com linha vertical conectando.

```html
<section class="py-section" id="steps">
  <div class="max-w-3xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Process</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Our <span class="gradient-text">method</span>
      </h2>
    </div>
    <div class="relative">
      <!-- Vertical line -->
      <div class="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent/30 via-accent/10 to-transparent"></div>
      <!-- Steps -->
      <div class="space-y-12">
        <div class="flex gap-8 items-start reveal">
          <div class="relative flex-shrink-0">
            <div class="w-12 h-12 rounded-full glass-accent flex items-center justify-center">
              <span class="text-sm font-bold accent-text">01</span>
            </div>
          </div>
          <div class="pt-2">
            <h3 class="text-lg font-semibold mb-2">Step Title</h3>
            <p class="text-secondary text-sm leading-relaxed">Description.</p>
          </div>
        </div>
        <!-- Repeat... -->
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante C: Scroll-Driven Progress
Steps que se revelam conforme scroll com progress indicator.

```html
<section class="py-section" id="steps">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Process</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Step by <span class="gradient-text">step</span>
      </h2>
    </div>
    <div class="grid lg:grid-cols-2 gap-16 items-start">
      <!-- Left: sticky progress -->
      <div class="lg:sticky lg:top-32">
        <div class="space-y-6">
          <div class="step-indicator active flex items-center gap-4 p-4 rounded-xl transition-all">
            <div class="step-dot w-3 h-3 rounded-full bg-accent"></div>
            <span class="font-semibold">Step 1</span>
          </div>
          <div class="step-indicator flex items-center gap-4 p-4 rounded-xl transition-all opacity-40">
            <div class="step-dot w-3 h-3 rounded-full bg-white/20"></div>
            <span class="font-semibold">Step 2</span>
          </div>
          <div class="step-indicator flex items-center gap-4 p-4 rounded-xl transition-all opacity-40">
            <div class="step-dot w-3 h-3 rounded-full bg-white/20"></div>
            <span class="font-semibold">Step 3</span>
          </div>
        </div>
      </div>
      <!-- Right: content cards that trigger on scroll -->
      <div class="space-y-32">
        <div class="step-content min-h-[50vh] flex items-center" data-step="0">
          <div class="glass rounded-xl p-8">
            <h3 class="text-xl font-semibold mb-4">Step 1 Title</h3>
            <p class="text-secondary leading-relaxed">Detailed description.</p>
          </div>
        </div>
        <!-- Repeat... -->
      </div>
    </div>
  </div>
</section>
```

```javascript
// Scroll-driven step activation
document.querySelectorAll('.step-content').forEach((content, i) => {
  ScrollTrigger.create({
    trigger: content,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => activateStep(i),
    onEnterBack: () => activateStep(i),
  });
});
function activateStep(index) {
  document.querySelectorAll('.step-indicator').forEach((ind, i) => {
    ind.classList.toggle('active', i === index);
    ind.style.opacity = i === index ? '1' : '0.4';
    ind.querySelector('.step-dot').style.background = i === index ? 'var(--accent)' : 'rgba(255,255,255,0.2)';
  });
}
```

**Tier:** Premium+

---

## 6. METRICS

### Variante A: Counter Grid

```html
<section class="py-section">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="text-center reveal">
        <div class="counter text-4xl lg:text-5xl font-heading font-bold gradient-text" data-target="500" data-suffix="+">0</div>
        <p class="text-secondary text-sm mt-2">Clients</p>
      </div>
      <div class="text-center reveal">
        <div class="counter text-4xl lg:text-5xl font-heading font-bold gradient-text" data-target="98" data-suffix="%">0</div>
        <p class="text-secondary text-sm mt-2">Satisfaction</p>
      </div>
      <!-- ... -->
    </div>
  </div>
</section>
```

**JS:** Counter animation (ver techniques.md)
**Tier:** Standard+

### Variante B: Big Number Background
Numeros gigantes semi-transparentes como background decorativo.

```html
<section class="py-section overflow-hidden">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
      <div class="relative reveal">
        <div class="big-num absolute -top-4 -left-4 select-none pointer-events-none" data-parallax="-0.1">500+</div>
        <div class="relative z-10 pt-16">
          <div class="counter text-3xl font-heading font-bold" data-target="500" data-suffix="+">0</div>
          <p class="text-secondary text-sm mt-2">Clients worldwide</p>
        </div>
      </div>
      <!-- ... -->
    </div>
  </div>
</section>
```

```css
.big-num {
  font-family: var(--font-heading);
  font-size: clamp(5.5rem, 13vw, 11rem);
  font-weight: 400; line-height: 0.8; letter-spacing: -0.04em;
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent), transparent 88%) 0%, color-mix(in srgb, var(--accent), transparent 98%) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  user-select: none;
}
```

**Tier:** Premium+

---

## 7. TESTIMONIALS

### Variante A: Grid Cards

```html
<section class="py-section" id="testimonials">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Testimonials</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        What our clients <span class="gradient-text">say</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="glass rounded-xl p-6 reveal">
        <div class="flex items-center gap-1 mb-4">
          <!-- 5 stars SVG -->
        </div>
        <p class="text-secondary text-sm leading-relaxed mb-6">"Testimonial text."</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold">JD</div>
          <div>
            <div class="text-sm font-semibold">Name</div>
            <div class="text-xs text-secondary">Role, Company</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante B: Carousel
Carousel com autoplay e indicadores.

```html
<section class="py-section overflow-hidden" id="testimonials">
  <div class="max-w-4xl mx-auto px-5 sm:px-8 text-center">
    <span class="section-label mb-4 block reveal">Testimonials</span>
    <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight mb-16 reveal">
      Trusted by <span class="gradient-text">leaders</span>
    </h2>
    <div class="testimonial-carousel relative">
      <div class="testimonial-slide active">
        <blockquote class="font-heading text-2xl lg:text-3xl leading-relaxed mb-8">"Quote text."</blockquote>
        <div class="text-sm font-semibold">Name</div>
        <div class="text-xs text-secondary">Role, Company</div>
      </div>
      <!-- More slides (hidden by default) -->
    </div>
    <div class="flex justify-center gap-2 mt-8">
      <button class="carousel-dot w-2 h-2 rounded-full bg-accent" data-slide="0"></button>
      <button class="carousel-dot w-2 h-2 rounded-full bg-white/20" data-slide="1"></button>
      <button class="carousel-dot w-2 h-2 rounded-full bg-white/20" data-slide="2"></button>
    </div>
  </div>
</section>
```

**JS:** Carousel autoplay + dot navigation
**Tier:** Premium+

### Variante C: Masonry
Layout masonry com cards de alturas variadas.

```html
<section class="py-section" id="testimonials">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Reviews</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Real <span class="gradient-text">results</span>
      </h2>
    </div>
    <div class="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      <div class="glass rounded-xl p-6 break-inside-avoid reveal">
        <p class="text-secondary text-sm leading-relaxed mb-4">"Short testimonial."</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold">A</div>
          <span class="text-xs font-semibold">Name — Company</span>
        </div>
      </div>
      <div class="glass rounded-xl p-6 break-inside-avoid reveal">
        <p class="text-secondary text-sm leading-relaxed mb-4">"Longer testimonial with more detailed feedback about the product experience and results achieved."</p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold">B</div>
          <span class="text-xs font-semibold">Name — Company</span>
        </div>
      </div>
      <!-- More cards with varying content lengths -->
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante D: Logo + Quote
Testimonials com logo da empresa em destaque + quote curta focada em resultado. Ideal para B2B e servicos. Inspirado em A2B Aceleradora.

```html
<section class="py-section" id="testimonials">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Results</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Trusted by <span class="gradient-text">industry leaders</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="glass rounded-xl p-8 flex flex-col justify-between reveal">
        <div>
          <img src="client-logo.svg" alt="Company Name" class="h-8 mb-6 opacity-60" loading="lazy" />
          <p class="text-lg leading-relaxed mb-6">"Result-focused quote. Specific metric or outcome achieved."</p>
        </div>
        <div class="flex items-center gap-3 pt-4 border-t border-white/5">
          <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold">JD</div>
          <div>
            <div class="text-sm font-semibold">Full Name</div>
            <div class="text-xs text-secondary">Role — Company</div>
          </div>
        </div>
      </div>
      <!-- More logo+quote cards -->
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 8. PRICING

### Variante A: Comparacao 3-col

```html
<section class="py-section" id="pricing">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Pricing</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Choose your <span class="gradient-text">plan</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6 items-start">
      <!-- Plan 1 -->
      <div class="tilt-card glass rounded-2xl p-8 reveal">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Starter</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-heading font-bold">$29</span>
          <span class="text-secondary text-sm">/mo</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-sm text-secondary">
            <svg class="w-4 h-4 text-accent flex-shrink-0"><!-- check --></svg> Feature 1
          </li>
        </ul>
        <a href="[CTA_URL]" class="btn-outline w-full text-center">Get Started</a>
      </div>
      <!-- Plan 2 (highlighted) -->
      <div class="tilt-card glass rounded-2xl p-8 relative plan-highlight reveal" style="border:1px solid var(--accent-border)">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Pro</h3>
        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-heading font-bold gradient-text">$79</span>
          <span class="text-secondary text-sm">/mo</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-sm text-secondary">
            <svg class="w-4 h-4 text-accent flex-shrink-0"><!-- check --></svg> Everything in Starter
          </li>
        </ul>
        <a href="[CTA_URL]" class="btn-primary w-full text-center magnetic">[CTA_TEXT]</a>
      </div>
      <!-- Plan 3 -->
      <div class="tilt-card glass rounded-2xl p-8 reveal">
        <div class="shine"></div>
        <h3 class="text-lg font-semibold mb-2">Enterprise</h3>
        <div class="mb-6">
          <span class="text-4xl font-heading font-bold">Custom</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-sm text-secondary">
            <svg class="w-4 h-4 text-accent flex-shrink-0"><!-- check --></svg> Everything in Pro
          </li>
        </ul>
        <a href="[CTA_URL]" class="btn-outline w-full text-center">Contact Sales</a>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante B: Conic Border Cards
Cards com rotating conic-gradient border no hover.

Mesma estrutura da A, mas cada card usa `class="plan-glow-border"` e o CSS de `@property --plan-angle` (ver techniques.md 1.2).

**Tier:** Premium+

### Variante C: Toggle Mensal/Anual
Toggle switch para alternar precos mensal vs anual.

```html
<!-- Adicionar antes dos cards -->
<div class="flex items-center justify-center gap-4 mb-12 reveal">
  <span class="text-sm text-secondary">Monthly</span>
  <button class="pricing-toggle w-14 h-7 rounded-full bg-white/10 relative" id="pricingToggle">
    <div class="toggle-knob w-5 h-5 rounded-full bg-accent absolute top-1 left-1 transition-transform"></div>
  </button>
  <span class="text-sm text-secondary">Yearly <span class="text-accent text-xs">-20%</span></span>
</div>
```

```javascript
// Toggle pricing
const toggle = document.getElementById('pricingToggle');
toggle.addEventListener('click', () => {
  const annual = toggle.classList.toggle('active');
  toggle.querySelector('.toggle-knob').style.transform = annual ? 'translateX(28px)' : 'translateX(0)';
  document.querySelectorAll('[data-price-monthly]').forEach(el => {
    el.textContent = annual ? el.dataset.priceYearly : el.dataset.priceMonthly;
  });
});
```

**Tier:** Standard+

---

## 9. FAQ

### Variante A: Accordion Simples

```html
<section class="py-section" id="faq">
  <div class="max-w-3xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">FAQ</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Common <span class="gradient-text">questions</span>
      </h2>
    </div>
    <div class="space-y-2">
      <div class="faq-item border-b border-white/5 reveal">
        <button class="faq-trigger w-full flex items-center justify-between py-5 text-left">
          <span class="font-semibold pr-8">Question text?</span>
          <span class="faq-icon text-accent text-xl flex-shrink-0">+</span>
        </button>
        <div class="faq-answer">
          <p class="text-secondary text-sm leading-relaxed pb-5">Answer text.</p>
        </div>
      </div>
      <!-- More items -->
    </div>
  </div>
</section>
```

```css
.faq-answer { max-height:0; overflow:hidden; transition: max-height 0.5s cubic-bezier(0.4,0,0.2,1); }
.faq-item.active .faq-answer { max-height: 300px; }
.faq-icon { transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
.faq-item.active .faq-icon { transform: rotate(45deg); }
```

```javascript
document.querySelectorAll('.faq-trigger').forEach(t => {
  t.addEventListener('click', () => {
    const item = t.closest('.faq-item');
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
  });
});
```

**Tier:** Standard+

### Variante B: 2 Colunas (categorias + perguntas)

```html
<section class="py-section" id="faq">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">FAQ</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Find your <span class="gradient-text">answers</span>
      </h2>
    </div>
    <div class="grid lg:grid-cols-4 gap-8">
      <!-- Left: categories -->
      <div class="lg:sticky lg:top-32 space-y-2">
        <button class="faq-cat active w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all" data-cat="general">General</button>
        <button class="faq-cat w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-secondary transition-all" data-cat="pricing">Pricing</button>
        <button class="faq-cat w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-secondary transition-all" data-cat="support">Support</button>
      </div>
      <!-- Right: questions -->
      <div class="lg:col-span-3 space-y-2">
        <div class="faq-item border-b border-white/5 reveal" data-category="general">
          <!-- Same as Variante A item structure -->
        </div>
      </div>
    </div>
  </div>
</section>
```

```javascript
// Category filtering
document.querySelectorAll('.faq-cat').forEach(cat => {
  cat.addEventListener('click', () => {
    document.querySelectorAll('.faq-cat').forEach(c => { c.classList.remove('active'); c.classList.add('text-secondary'); });
    cat.classList.add('active'); cat.classList.remove('text-secondary');
    const category = cat.dataset.cat;
    document.querySelectorAll('.faq-item').forEach(item => {
      item.style.display = (category === 'all' || item.dataset.category === category) ? '' : 'none';
    });
  });
});
```

**Tier:** Premium+

---

## 10. CTA

### Variante A: Centered com Glow

```html
<section class="py-section relative overflow-hidden" id="cta">
  <!-- Glow orbs -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style="background:radial-gradient(circle,var(--accent),transparent 70%)"></div>
  <div class="max-w-3xl mx-auto px-5 sm:px-8 text-center relative z-10">
    <span class="section-label mb-6 block reveal">Get Started</span>
    <h2 class="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-tight tracking-tight mb-6 reveal">
      Ready to <span class="gradient-text">transform</span> your business?
    </h2>
    <p class="text-secondary text-lg mb-10 max-w-xl mx-auto reveal">Description text.</p>
    <div class="flex flex-wrap justify-center gap-4 reveal">
      <a href="[CTA_URL]" class="btn-primary magnetic text-base px-10 py-4">[CTA_TEXT]</a>
    </div>
  </div>
</section>
```

**Tier:** Standard+

### Variante B: Canvas Particulas
CTA com Three.js particle background.

```html
<section class="py-section relative overflow-hidden" id="cta">
  <canvas id="cta-canvas" class="absolute inset-0 z-0 pointer-events-none"></canvas>
  <div class="max-w-3xl mx-auto px-5 sm:px-8 text-center relative z-10">
    <h2 class="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-tight tracking-tight mb-6">
      <span class="cta-word block overflow-hidden"><span class="cta-word-inner block">Start your</span></span>
      <span class="cta-word block overflow-hidden"><span class="cta-word-inner block gradient-text">journey today.</span></span>
    </h2>
    <p class="text-secondary text-lg mb-10 reveal">Description.</p>
    <a href="[CTA_URL]" class="btn-primary magnetic text-base px-10 py-4 reveal">[CTA_TEXT]</a>
  </div>
</section>
```

**JS:** initParticleCloud('cta-canvas') — ver techniques.md 3.2
**JS:** CTA word reveal on scroll — ver techniques.md 2.1
**Tier:** Cinematic

### Variante C: Split (texto + form)

```html
<section class="py-section" id="cta">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="grid lg:grid-cols-2 gap-12 items-center glass rounded-2xl p-8 lg:p-12 reveal">
      <div>
        <h2 class="font-heading text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight mb-4">
          Let's <span class="gradient-text">talk</span>
        </h2>
        <p class="text-secondary leading-relaxed">Description of what happens after form submission.</p>
      </div>
      <form class="space-y-4" onsubmit="return false">
        <input type="text" placeholder="Your name" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-accent focus:outline-none transition-colors" />
        <input type="email" placeholder="Email address" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-accent focus:outline-none transition-colors" />
        <textarea placeholder="Tell us about your project" rows="4" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-accent focus:outline-none transition-colors resize-none"></textarea>
        <button type="submit" class="btn-primary w-full magnetic">[CTA_TEXT]</button>
      </form>
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 11. FOOTER

### Variante A: Grid 4-col

```html
<footer class="pt-20 pb-8 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
      <div>
        <span class="font-heading text-lg font-semibold block mb-4">[BRAND_NAME]</span>
        <p class="text-secondary text-sm leading-relaxed">Short brand description.</p>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-4">Product</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-secondary text-sm hover:text-white transition-colors">Features</a></li>
          <li><a href="#" class="text-secondary text-sm hover:text-white transition-colors">Pricing</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-4">Company</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-secondary text-sm hover:text-white transition-colors">About</a></li>
          <li><a href="#" class="text-secondary text-sm hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-4">Newsletter</h4>
        <form class="flex gap-2" onsubmit="return false">
          <input type="email" placeholder="Your email" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none" />
          <button class="btn-primary !px-4 !py-2.5 text-xs">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="divider mb-8"></div>
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
      <span>&copy; 2026 [BRAND_NAME]. All rights reserved.</span>
      <div class="flex gap-4">
        <a href="#" class="hover:text-white transition-colors">Privacy</a>
        <a href="#" class="hover:text-white transition-colors">Terms</a>
      </div>
    </div>
  </div>
</footer>
```

**Tier:** Standard+

### Variante B: Minimal Inline

```html
<footer class="py-8 border-t border-white/5">
  <div class="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
    <span class="font-heading text-sm font-semibold">[BRAND_NAME]</span>
    <div class="flex items-center gap-6 text-xs text-secondary">
      <a href="#" class="hover:text-white transition-colors">Privacy</a>
      <a href="#" class="hover:text-white transition-colors">Terms</a>
      <span>&copy; 2026</span>
    </div>
  </div>
</footer>
```

**Tier:** Standard+

---

## 12. PROBLEM

Pain points com cards numerados. Usado para estabelecer o problema antes de apresentar a solucao.

```html
<section class="py-section clip-reveal" id="problem">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">The Problem</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Why the current approach <span class="gradient-text">fails</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="glass rounded-xl p-6 border-t-2 border-red-500/30 reveal">
        <div class="text-3xl font-heading font-bold text-red-400/30 mb-4">01</div>
        <h3 class="text-lg font-semibold mb-2">Pain Point Title</h3>
        <p class="text-secondary text-sm leading-relaxed">Description of the problem.</p>
      </div>
      <!-- More pain point cards -->
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 13. ORIGIN

Historia/sobre com timeline. Ideal para nichos que valorizam narrativa (luxury, agency).

```html
<section class="py-section" id="origin">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="grid lg:grid-cols-2 gap-16 items-start">
      <div>
        <span class="section-label mb-4 block reveal">Our Story</span>
        <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight mb-6 reveal">
          Built with <span class="gradient-text">purpose</span>
        </h2>
        <p class="text-secondary leading-relaxed reveal">Origin story paragraph.</p>
      </div>
      <div class="space-y-8">
        <div class="origin-step flex gap-6 items-start">
          <div class="flex-shrink-0 w-16 text-right">
            <span class="text-sm font-semibold gradient-text">2020</span>
          </div>
          <div class="flex-1 border-l border-white/10 pl-6 pb-8">
            <h3 class="font-semibold mb-1">Milestone Title</h3>
            <p class="text-secondary text-sm">Description.</p>
          </div>
        </div>
        <!-- More milestones -->
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 14. PRODUCTS

Grid de produtos/servicos com cards.

```html
<section class="py-section" id="products">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Products</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Our <span class="gradient-text">solutions</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="product-card tilt-card reveal">
        <div class="shine"></div>
        <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
          <!-- Icon -->
        </div>
        <h3 class="text-lg font-semibold mb-2">Product Name</h3>
        <p class="text-secondary text-sm leading-relaxed mb-4">Description.</p>
        <a href="#" class="text-accent text-sm font-medium hover:underline">Learn more &rarr;</a>
      </div>
    </div>
  </div>
</section>
```

```css
.product-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-top: 3px solid var(--accent);
  border-radius: 12px; padding: 24px;
  transition: all 0.35s ease;
}
.product-card:hover {
  background: color-mix(in srgb, var(--accent), transparent 96%);
  border-color: var(--accent-border);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
```

**Tier:** Standard+

---

## 15. COMPARISON

Tabela comparativa antes/depois ou nos vs concorrencia.

```html
<section class="py-section" id="comparison">
  <div class="max-w-5xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Comparison</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Why choose <span class="gradient-text">[BRAND_NAME]</span>
      </h2>
    </div>
    <div class="glass rounded-2xl overflow-hidden reveal">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-white/5">
            <th class="text-left p-5 text-secondary font-medium">Feature</th>
            <th class="p-5 text-center text-secondary font-medium">Others</th>
            <th class="p-5 text-center font-semibold gradient-text">[BRAND_NAME]</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td class="p-5">Feature name</td>
            <td class="p-5 text-center text-secondary">Basic</td>
            <td class="p-5 text-center">
              <span class="inline-flex items-center gap-1 text-accent">
                <svg class="w-4 h-4"><!-- check --></svg> Advanced
              </span>
            </td>
          </tr>
          <!-- More rows -->
        </tbody>
      </table>
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 16. PRELOADER

### Counter Cinematico + Blinds

```html
<!-- Colocar IMEDIATAMENTE apos <body> -->
<div id="loader">
  <div class="loader-label">[BRAND_NAME]</div>
  <div class="loader-counter" id="loaderCounter">0</div>
  <div class="loader-bar" id="loaderBar" style="width:0%"></div>
</div>
<div class="loader-blinds" id="loaderBlinds">
  <div class="loader-blind"></div><div class="loader-blind"></div>
  <div class="loader-blind"></div><div class="loader-blind"></div>
  <div class="loader-blind"></div>
</div>
```

**CSS e JS:** Ver techniques.md secao 6.1
**Tier:** Cinematic

---

## 17. CUSTOM-CURSOR

### Dual Cursor (dot + ring + glow)

```html
<!-- Colocar apos preloader elements -->
<div class="cursor-dot" id="cursorDot"></div>
<div class="cursor-ring" id="cursorRing"></div>
<div class="cursor-glow" id="cursorGlow"></div>
```

```css
@media (hover: hover) {
  body { cursor: none; }
  a, button, [role="button"] { cursor: none; }
}
.cursor-dot {
  position:fixed; width:6px; height:6px; background:var(--accent);
  border-radius:50%; pointer-events:none; z-index:9999;
  mix-blend-mode:difference; transform:translate(-50%,-50%);
  opacity:0; transition:transform 0.15s, opacity 0.3s;
}
.cursor-ring {
  position:fixed; width:40px; height:40px;
  border:1px solid color-mix(in srgb, var(--accent), transparent 60%);
  border-radius:50%; pointer-events:none; z-index:9999;
  transform:translate(-50%,-50%); opacity:0;
  transition:width 0.3s, height 0.3s, border-color 0.3s, opacity 0.3s;
}
.cursor-ring.hover {
  width:64px; height:64px; border-color:var(--accent);
  background:color-mix(in srgb, var(--accent), transparent 96%);
}
.cursor-dot.hover { transform:translate(-50%,-50%) scale(0); }
.cursor-glow {
  position:fixed; width:400px; height:400px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb, var(--accent), transparent 95%) 0%, transparent 65%);
  pointer-events:none; transform:translate(-50%,-50%);
  z-index:1; opacity:0; mix-blend-mode:screen;
}
```

```javascript
// Dual cursor init
function initCustomCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const glow = document.getElementById('cursorGlow');
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (isTouch || !dot || !ring) return;

  document.addEventListener('mousemove', e => {
    gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'power2.out' });
    gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.25, ease: 'power2.out' });
    gsap.to(glow, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power2.out' });
  });
  document.addEventListener('mouseenter', () => gsap.to([dot, ring, glow], { opacity: 1, duration: 0.3 }));
  document.addEventListener('mouseleave', () => gsap.to([dot, ring, glow], { opacity: 0, duration: 0.3 }));

  // Interactive elements hover state
  document.querySelectorAll('a, button, .magnetic, .tilt-card, .faq-trigger').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('hover'); dot.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('hover'); dot.classList.remove('hover'); });
  });
}
```

**Tier:** Cinematic

---

## 18. SCROLL-PROGRESS

### Barra de Progresso Top

```html
<div class="scroll-progress" id="scrollProgress"></div>
```

```css
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 2px; z-index: 200;
  background: linear-gradient(90deg, var(--accent-dim), var(--accent), var(--accent-hover));
  transform-origin: left; transform: scaleX(0); will-change: transform;
}
```

```javascript
ScrollTrigger.create({
  trigger: document.body,
  start: 'top top', end: 'bottom bottom',
  onUpdate: self => gsap.set('#scrollProgress', { scaleX: self.progress })
});
```

**Tier:** Premium+

---

## 19. PERSONAS

Cards direcionados a diferentes perfis do publico-alvo. Estrategia de conversao: expandir audiencia mostrando que o produto serve para varios perfis.

```html
<section class="py-section" id="personas">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Who it's for</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Made for <span class="gradient-text">you</span>
      </h2>
      <p class="text-secondary text-lg mt-4 max-w-2xl mx-auto reveal">No matter where you are in your journey.</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="tilt-card glass rounded-xl p-6 text-center reveal">
        <div class="shine"></div>
        <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <!-- Emoji or icon representing persona -->
          <span class="text-2xl">🚀</span>
        </div>
        <h3 class="font-semibold mb-2">Entrepreneurs</h3>
        <p class="text-secondary text-sm leading-relaxed">"I want to scale but don't know where to start."</p>
      </div>
      <div class="tilt-card glass rounded-xl p-6 text-center reveal">
        <div class="shine"></div>
        <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">💼</span>
        </div>
        <h3 class="font-semibold mb-2">Professionals</h3>
        <p class="text-secondary text-sm leading-relaxed">"I need a side income without quitting my job."</p>
      </div>
      <div class="tilt-card glass rounded-xl p-6 text-center reveal">
        <div class="shine"></div>
        <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">🎓</span>
        </div>
        <h3 class="font-semibold mb-2">Students</h3>
        <p class="text-secondary text-sm leading-relaxed">"I want flexibility and income while studying."</p>
      </div>
      <div class="tilt-card glass rounded-xl p-6 text-center reveal">
        <div class="shine"></div>
        <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">🏠</span>
        </div>
        <h3 class="font-semibold mb-2">Remote Workers</h3>
        <p class="text-secondary text-sm leading-relaxed">"I want to work from anywhere on my own terms."</p>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 20. TEAM

Secao de equipe/fundadores com fotos e credenciais. Humaniza a marca e gera confianca.

```html
<section class="py-section" id="team">
  <div class="max-w-5xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Our Team</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        Meet the <span class="gradient-text">founders</span>
      </h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
      <div class="text-center reveal">
        <div class="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-2 border-accent/20">
          <img src="founder1.webp" alt="Founder Name" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <h3 class="font-semibold text-lg">Founder Name</h3>
        <p class="text-accent text-sm mb-2">CEO & Co-founder</p>
        <p class="text-secondary text-sm leading-relaxed max-w-xs mx-auto">Brief bio or credibility statement.</p>
      </div>
      <div class="text-center reveal">
        <div class="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-2 border-accent/20">
          <img src="founder2.webp" alt="Founder Name" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <h3 class="font-semibold text-lg">Founder Name</h3>
        <p class="text-accent text-sm mb-2">CTO & Co-founder</p>
        <p class="text-secondary text-sm leading-relaxed max-w-xs mx-auto">Brief bio or credibility statement.</p>
      </div>
      <div class="text-center reveal">
        <div class="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-2 border-accent/20">
          <img src="founder3.webp" alt="Founder Name" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <h3 class="font-semibold text-lg">Founder Name</h3>
        <p class="text-accent text-sm mb-2">COO & Co-founder</p>
        <p class="text-secondary text-sm leading-relaxed max-w-xs mx-auto">Brief bio or credibility statement.</p>
      </div>
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## 21. MODAL-FORM

Modal popup com formulario de captura. CTAs na pagina disparam o modal em vez de navegar para uma secao. Aumenta conversao mantendo o usuario no contexto.

```html
<!-- Modal overlay (colocar antes de </body>) -->
<div class="modal-overlay" id="modal-overlay">
  <div class="modal-content glass">
    <button class="modal-close absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" aria-label="Fechar">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <h3 class="font-heading text-2xl mb-2 text-center">Get Started</h3>
    <p class="text-secondary text-sm text-center mb-8">Fill in your details to begin.</p>
    <form class="space-y-4" onsubmit="return false">
      <input type="text" placeholder="Your name" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-accent focus:outline-none transition-colors" required />
      <input type="email" placeholder="Email address" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-accent focus:outline-none transition-colors" required />
      <input type="tel" placeholder="Phone (optional)" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-accent focus:outline-none transition-colors" />
      <button type="submit" class="btn-primary w-full magnetic">[CTA_TEXT]</button>
    </form>
  </div>
</div>

<!-- Em qualquer CTA da pagina, usar data-modal para disparar -->
<a href="#" class="btn-primary magnetic" data-modal>[CTA_TEXT]</a>
```

```css
.modal-overlay {
  position:fixed; inset:0; z-index:10000;
  background:rgba(0,0,0,0.7);
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center;
  opacity:0; pointer-events:none; transition:opacity 0.3s ease;
}
.modal-overlay.active { opacity:1; pointer-events:auto; }
.modal-content {
  position:relative;
  border-radius:20px; padding:40px;
  max-width:480px; width:90%;
  transform:translateY(20px) scale(0.95);
  transition:transform 0.4s cubic-bezier(0.23,1,0.32,1);
}
.modal-overlay.active .modal-content { transform:translateY(0) scale(1); }
```

```javascript
// Ver techniques.md 5.6 para JS do modal
```

**Tier:** Standard+

---

## 22. SCARCITY

Faixa de escassez/exclusividade para aumentar urgencia. "Apenas X vagas/projetos por mes." Pode ser colocada antes de pricing ou CTA. Inspirada em A2B Aceleradora ("Produzimos apenas 4 videos por mes").

```html
<section class="py-12 relative overflow-hidden">
  <div class="max-w-3xl mx-auto px-5 sm:px-8 text-center">
    <div class="glass-accent rounded-2xl p-8 lg:p-12 reveal">
      <span class="section-label mb-4 block">Limited Availability</span>
      <h3 class="font-heading text-[clamp(1.5rem,4vw,2.5rem)] leading-tight mb-4">
        We only take <span class="gradient-text">X clients</span> per month
      </h3>
      <p class="text-secondary leading-relaxed mb-6 max-w-lg mx-auto">
        To guarantee premium quality, we limit our capacity. Secure your spot now.
      </p>
      <a href="[CTA_URL]" class="btn-primary magnetic">[CTA_TEXT]</a>
    </div>
  </div>
</section>
```

**Variacao inline (para inserir dentro de outras secoes):**
```html
<div class="flex items-center justify-center gap-3 py-4 reveal">
  <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
  <span class="text-sm font-medium">Only <strong class="accent-text">X spots</strong> remaining this month</span>
</div>
```

**Tier:** Standard+

---

## 23. SERVICES-GRID

Grid de servicos com cards uniformes. Ideal para agency, consultoria, servicos profissionais. Diferente de FEATURES por focar em servicos oferecidos, nao em funcionalidades de produto.

```html
<section class="py-section" id="services">
  <div class="max-w-7xl mx-auto px-5 sm:px-8">
    <div class="text-center mb-16">
      <span class="section-label mb-4 block reveal">Services</span>
      <h2 class="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight reveal">
        What we <span class="gradient-text">deliver</span>
      </h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="tilt-card glass rounded-xl p-8 group reveal">
        <div class="shine"></div>
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-semibold tracking-wider text-secondary uppercase">01</span>
          <svg class="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </div>
        <h3 class="text-lg font-semibold mb-3">Service Name</h3>
        <p class="text-secondary text-sm leading-relaxed">Brief description of the service and what the client gets.</p>
      </div>
      <div class="tilt-card glass rounded-xl p-8 group reveal">
        <div class="shine"></div>
        <div class="flex items-center justify-between mb-6">
          <span class="text-xs font-semibold tracking-wider text-secondary uppercase">02</span>
          <svg class="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </div>
        <h3 class="text-lg font-semibold mb-3">Service Name</h3>
        <p class="text-secondary text-sm leading-relaxed">Brief description.</p>
      </div>
      <!-- Repeat for 4-6 services -->
    </div>
  </div>
</section>
```

**Tier:** Standard+

---

## Componentes Requeridos por Tier

### Standard (~800 linhas)
NAV-A, HERO (A ou B), TICKER-A, FEATURES (A ou C), STEPS-A, METRICS-A, TESTIMONIALS (A ou C ou D), PRICING (A ou C), FAQ-A, CTA-A, FOOTER (A ou B)

### Premium (~1200 linhas)
NAV-B, HERO (qualquer), TICKER (qualquer incluindo C), FEATURES (qualquer), STEPS (qualquer), METRICS (qualquer), TESTIMONIALS (qualquer), PRICING (qualquer), FAQ (qualquer), CTA (A ou C), FOOTER-A, SCROLL-PROGRESS
+ Componentes opcionais: PROBLEM, ORIGIN, PRODUCTS, COMPARISON, PERSONAS, TEAM, MODAL-FORM, SCARCITY, SERVICES-GRID

### Cinematic (~1500+ linhas)
Tudo de Premium + PRELOADER, CUSTOM-CURSOR, HERO-C (Three.js), CTA-B (particles)
+ Todas as tecnicas visuais ativas
