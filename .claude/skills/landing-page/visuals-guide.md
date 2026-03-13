# Guia de Visuais IA — Imagens, Videos e 3D

Guia completo para gerar visuais de alta qualidade para landing pages usando ferramentas de IA. Organizado por tipo de visual, nicho e secao.

---

## 1. Ferramentas de Geracao de Imagens IA

### Ranking por Caso de Uso

| Ferramenta | Melhor para | Preco | Acesso |
|------------|-------------|-------|--------|
| **Gemini 2.0 Flash** | Rapido, gratis, bom para iteracao | Gratis | aistudio.google.com |
| **Flux Pro** | Fotorealismo extremo, rostos, produtos | $$ | replicate.com, fal.ai |
| **Midjourney v7** | Arte, ilustracoes, mood boards | $10/mo | midjourney.com |
| **Ideogram 2.0** | Texto em imagens, logos, posters | Gratis/$ | ideogram.ai |
| **DALL-E 3 (ChatGPT)** | Versatil, bom para conceitos rapidos | $20/mo | chatgpt.com |
| **GPT-4o Image** | Workflows mistos (texto+imagem) | $20/mo | chatgpt.com |

### Quando Usar Cada Uma

- **Hero images fotorrealistas** → Flux Pro (DSLR quality)
- **Ilustracoes e arte conceitual** → Midjourney v7 (estilo artistico)
- **Logos e assets com texto** → Ideogram 2.0 (renderiza texto perfeitamente)
- **Iteracao rapida gratis** → Gemini Flash (sem custo, bom o suficiente)
- **Mockups e UI** → DALL-E 3 / GPT-4o (entende contexto de interface)

---

## 2. Prompts de Imagem por Tipo de Secao

### 2.1 Hero Images

```
HERO — Fotorrealista (Flux/Midjourney):
"Cinematic hero image for a [NICHE] brand. Ultra-wide 21:9 aspect ratio.
[SPECIFIC SCENE DESCRIPTION]. Dramatic lighting with [ACCENT_COLOR] color
accent highlights. Shallow depth of field, bokeh background. Shot on Sony A7R V,
f/1.4, golden hour lighting. 8K resolution. No text overlay."

HERO — Abstrato (Midjourney/Gemini):
"Abstract 3D render for a [NICHE] landing page hero. Flowing organic shapes
in [ACCENT_COLOR] and deep black. Iridescent materials, subsurface scattering.
Soft studio lighting. Ultra-wide 21:9. Clean, modern aesthetic. No text."

HERO — Gradient Mesh (Gemini/DALL-E):
"Smooth abstract gradient mesh background. Colors: [ACCENT_COLOR], deep black,
subtle [SECONDARY_COLOR]. Organic flowing shapes. Grain texture overlay.
4K resolution. Perfect for dark theme website hero background."
```

### 2.2 Feature/Product Images

```
FEATURE — Isometrico 3D:
"Clean isometric 3D illustration of [FEATURE_CONCEPT]. [ACCENT_COLOR] as primary
color on dark/transparent background. Minimalist tech-forward style. Glass material
with subtle reflections. Square 1:1 ratio. No text. Suitable for dark UI."

FEATURE — Iconico/Flat:
"Modern flat illustration icon representing [FEATURE_CONCEPT]. [ACCENT_COLOR]
gradient on transparent background. Geometric, minimal lines. 512x512px.
Clean edges, suitable for SVG conversion."

FEATURE — Fotorrealista (produto):
"Product photography of [PRODUCT] on dark surface. Single dramatic light source
from above-left. [ACCENT_COLOR] accent rim lighting. Reflection on glossy surface.
Shot on Hasselblad X2D, 80mm lens. 1:1 square ratio."
```

### 2.3 Background Textures

```
TEXTURE — Noise/Grain:
"Subtle abstract noise texture. Dark gradient from [COLOR1] to [COLOR2].
Fine grain overlay. Organic smooth shapes. 4K seamless tile.
Perfect for dark website background sections."

TEXTURE — Mesh Gradient:
"Vivid mesh gradient background. Colors: [ACCENT_COLOR], [SECONDARY_COLOR],
deep navy blue. Smooth blending, organic blob shapes. Slight motion blur effect.
Ultra high resolution 4K. No objects, pure abstract gradient."

TEXTURE — Topographic:
"Abstract topographic line pattern background. Thin lines in [ACCENT_COLOR]
at 8% opacity on deep black. Flowing contour lines. Subtle, elegant.
Seamless tileable pattern. 2K resolution."
```

### 2.4 Mockups e UI

```
MOCKUP — Dashboard/App:
"Clean dark mode UI dashboard mockup for a [NICHE] app. [ACCENT_COLOR]
accent elements. Charts, data visualization. Glassmorphism cards.
Perspective view at slight angle. High contrast, professional.
16:9 aspect ratio. No readable text."

MOCKUP — Mobile:
"Floating iPhone 15 Pro mockup showing a [NICHE] app screen.
Dark background with [ACCENT_COLOR] glow behind device. Subtle reflection.
Clean, minimal. 3:4 aspect ratio."
```

### 2.5 Pessoas e Lifestyle

```
LIFESTYLE — Profissional:
"Professional [PERSON_DESCRIPTION] using technology in modern office.
Natural lighting, shallow depth of field. Candid moment, genuine expression.
[ACCENT_COLOR] elements in environment (brand colors on screen, accessories).
16:9 cinematic crop. Shot on Leica Q3."

LIFESTYLE — Casual/Startup:
"Young diverse team collaborating in modern coworking space. Natural light,
warm tones. Laptops, whiteboards. Authentic, not staged. Shallow depth of field.
21:9 ultra-wide. Documentary photography style."
```

---

## 3. Prompts por Nicho

### Fintech
```
Hero: "Futuristic fintech dashboard hologram floating in dark space. Green (#00D4AA) data streams, charts, and financial graphs. Holographic glass material. Cinematic lighting."
Features: "3D isometric illustration of [digital wallet/blockchain/chart]. Emerald green glass material on dark background. Clean tech aesthetic."
Background: "Abstract financial data visualization. Flowing green lines on black. Matrix-style but elegant. Subtle grain."
```

### SaaS
```
Hero: "Clean SaaS dashboard interface floating in 3D space. Purple (#7C3AED) accents. Glassmorphism cards with data. Isometric perspective. Dark background with subtle grid."
Features: "Minimal line icon of [cloud/api/integration]. Purple gradient. Geometric. On transparent background."
Background: "Gradient mesh from deep purple to dark blue. Subtle geometric grid overlay. Abstract tech atmosphere."
```

### Crypto
```
Hero: "3D render of golden blockchain structure. Blue (#3B82F6) neon lighting. Floating geometric nodes connected by light beams. Dark space background. Cinematic."
Features: "Holographic 3D coin/token with blue glow. Floating in dark space. Reflective metallic surface."
Background: "Neural network pattern. Blue nodes with connecting lines. Deep space black background. Subtle particle effect."
```

### Luxury
```
Hero: "Luxury product arrangement on black marble surface. Gold (#C9A84C) accents. Dramatic chiaroscuro lighting. Premium materials (leather, metal, glass). Shot on Phase One."
Features: "Elegant gold foil detail on dark background. Minimal. Premium material close-up. Macro photography."
Background: "Black marble texture with subtle gold veining. High resolution. Seamless. Luxury brand aesthetic."
```

### Health
```
Hero: "Serene wellness scene. Green (#10B981) botanical elements. Natural light, clean white and green palette. Person in peaceful setting. Soft focus background."
Features: "Clean illustration of [health concept]. Soft green gradient. Organic shapes. Calming aesthetic."
Background: "Soft gradient from white to mint green. Subtle leaf pattern. Clean, fresh, medical-grade aesthetic."
```

### AI/Tech
```
Hero: "AI neural network visualization. Cyan (#06B6D4) glowing nodes and connections in 3D space. Deep learning architecture rendered as beautiful 3D structure. Dark background."
Features: "3D render of AI brain/chip/neural node. Cyan luminescent material. Floating particles. Futuristic."
Background: "Abstract AI circuit pattern. Cyan lines on dark navy. Subtle pulse animation feel. High tech."
```

### Agency
```
Hero: "Creative workspace with bold design elements. Pink (#EC4899) accents. Modern equipment, screens with design work. Editorial photography style."
Features: "Abstract geometric composition. Pink and dark. Memphis style meets minimalism. Bold shapes."
Background: "Gradient mesh. Hot pink to deep purple to black. Smooth organic blobs. Creative energy."
```

---

## 4. Geracao de Video IA

### Ferramentas Recomendadas

| Ferramenta | Melhor para | Duracao | Preco |
|------------|-------------|---------|-------|
| **Runway Gen-3** | Qualidade cinematica, controle fino | 5-10s | $12/mo |
| **Kling 2.6** | Rostos realistas, movimento humano, audio | 5-10s | $10/mo |
| **Pika 2.5** | Loops infinitos, social, rapido | 3-5s | Gratis/$ |
| **Veo 3 (Google)** | Alta qualidade, longa duracao | 10-30s | Labs |
| **Sora 2 (OpenAI)** | Cinematico, cenas complexas | 5-20s | $20/mo |

### Quando Usar Video em Landing Pages

1. **Hero background** — Video loop sutil (5-10s, muted, autoplay)
2. **Section transitions** — Clip curto entre secoes
3. **Product demos** — Demonstracao de uso
4. **Testimonials** — Video depoimentos (mais impacto que texto)
5. **Ambient atmosphere** — Texturas animadas (particulas, fluidos)

### Prompts para Video Hero Background

```
LOOP ABSTRATO (Pika/Runway):
"Smooth flowing abstract liquid in [ACCENT_COLOR] and deep black.
Slow motion, seamless loop. Subtle metallic reflections. Dark background.
No camera movement. 16:9, 5 seconds."

LOOP PARTICULAS (Runway/Kling):
"Floating golden particles slowly drifting in dark space. Soft bokeh effect.
Gentle undulating motion. Seamless loop. No camera movement. Ambient,
atmospheric. 16:9, 8 seconds."

LOOP GRADIENTE (Pika):
"Morphing gradient blob animation. Colors: [ACCENT_COLOR], deep purple,
black. Slow organic movement. Seamless loop. Abstract, premium feel.
16:9, 6 seconds."

CENA TECNOLOGIA (Runway/Sora):
"Slow camera pan across futuristic holographic interface. [ACCENT_COLOR]
data visualizations floating in dark space. Cinematic lighting.
Shallow depth of field. 16:9, 10 seconds."
```

### Como Otimizar Video para Web

```
# Converter para formato web otimizado (ffmpeg)
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -an \
  -movflags +faststart -vf "scale=1920:-2" output-web.mp4

# WebM (melhor compressao)
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 35 -b:v 0 -an \
  -vf "scale=1920:-2" output-web.webm

# Gerar poster frame (primeiro frame como imagem)
ffmpeg -i input.mp4 -vframes 1 -q:v 2 poster.jpg

Regras:
- Sempre remover audio (-an) para hero backgrounds
- CRF 28-35 para web (boa qualidade + arquivo pequeno)
- Resolucao max 1920px width
- Formato: MP4 (compatibilidade) + WebM (tamanho)
- Sempre gerar poster frame para loading
- Target: < 2MB para hero background de 5-10s
```

---

## 5. Logo Generation

### Melhores Ferramentas

| Ferramenta | Estilo | Preco |
|------------|--------|-------|
| **Ideogram 2.0** | Logos com texto perfeito | Gratis |
| **LogoMe.ai** | Logos profissionais vetorizados | Gratis/$ |
| **Midjourney** | Logos artisticos/criativos | $10/mo |
| **Gemini** | Logos simples rapidos | Gratis |

### Prompt Template para Logo

```
LOGO MINIMAL:
"Minimal logo icon for [BRAND_NAME]. [NICHE] industry.
Simple geometric shape. Works on dark and light backgrounds.
Single color: [ACCENT_COLOR]. Clean lines, SVG-friendly.
No text, icon only. Flat design."

LOGO COM TEXTO (Ideogram):
"Professional logo for [BRAND_NAME]. Modern sans-serif typography.
[ACCENT_COLOR] accent. Clean, minimal. Works on dark background.
Horizontal layout. Tech/startup aesthetic."

LOGO MONOGRAM:
"Monogram logo using letters [INITIALS]. Geometric interlocking design.
[ACCENT_COLOR] gradient. Modern, premium feel. Suitable for favicon.
Square aspect ratio."
```

### Onde Salvar
```
/assets/logo.svg          — Logo principal (vetorial)
/assets/logo.png          — Fallback PNG (512x512)
/assets/favicon.svg       — Favicon (32x32 ou SVG)
/assets/og-image.jpg      — Open Graph image (1200x630)
```

---

## 6. Geracao de Imagens com Scripts do Projeto

O projeto inclui scripts Python para gerar imagens automaticamente via Gemini API:

```bash
# Instalar dependencias
pip install -r scripts/requirements.txt

# Exportar chave
export GEMINI_API_KEY="sua-chave-do-google-ai-studio"

# Gerar pack de imagens para um nicho
python scripts/generate-images.py [NICHE] [BRAND_NAME] '[ACCENT_COLOR]'
# Exemplo: python scripts/generate-images.py fintech NovaPay '#00D4AA'

# Gerar logo
python scripts/generate-logo.py [BRAND_NAME] [NICHE] '[ACCENT_COLOR]' minimal
# Exemplo: python scripts/generate-logo.py NovaPay fintech '#00D4AA' minimal
```

### Fluxo Recomendado

1. **Rapido (gratis)**: Gemini Flash para hero + features + background
2. **Premium**: Flux Pro para hero fotorrealista + Ideogram para logo com texto
3. **Maximo**: Midjourney para hero art + Flux para features + Ideogram logo + Pika para video background

---

## 7. Organizacao de Assets

```
/assets/
  /[brand-slug]/
    logo.svg              — Logo vetorial
    logo.png              — Logo raster fallback
    favicon.svg           — Favicon
    og-image.jpg          — Open Graph (1200x630)
    hero.webp             — Hero image (2560x1440 ou 21:9)
    hero-mobile.webp      — Hero mobile (1080x1920 ou 9:16)
    hero-video.mp4        — Hero video loop (se cinematic)
    hero-video.webm       — Hero video WebM
    hero-poster.jpg       — Video poster frame
    feature-1.webp        — Feature images (800x800)
    feature-2.webp
    feature-3.webp
    bg-texture.webp       — Background texture (2560x1440)
    testimonial-logo-1.svg — Client logos
    spline-scene.splinecode — Spline 3D scene (se cinematic)
    lottie-hero.lottie    — Lottie animation (se premium+)
```

**Formato de imagem recomendado:**
- **WebP** para fotos e renders (80% quality, muito menor que JPG)
- **SVG** para logos, icones, ilustracoes vetoriais
- **PNG** apenas para transparencia quando WebP nao suportar
- **MP4 + WebM** para videos (dual source para compatibilidade)
