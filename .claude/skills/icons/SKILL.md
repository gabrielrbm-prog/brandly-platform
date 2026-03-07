# Icon System Skill v3 — Professional Landing Page Icons

Sistema completo de icones profissionais para landing pages AAA+.
Duas abordagens: Phosphor Duotone (CDN, rapido) e Nano Banana IA (customizado, unico).

---

## Abordagem 1: Phosphor Duotone (CDN)

Para prototipos rapidos e consistencia garantida.

### CDN
```html
<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
```

### Uso
```html
<i class="ph-duotone ph-shield-check text-xl" style="color: rgba(255,255,255,0.6)"></i>
```

Pesos: `ph-thin`, `ph-light`, `ph`, `ph-bold`, `ph-fill`, `ph-duotone`
**Sempre usar `ph-duotone`** para landing pages.

---

## Abordagem 2: Nano Banana IA (Customizado)

Para icones UNICOS por projeto. Gera PNGs 1024x1024 via Gemini Image Generation.

### Uso
```bash
export GEMINI_API_KEY="sua-chave"

# Gerar icones 3D Clay (padrao, melhor resultado)
python3 scripts/generate-icons.py fintech NovaPay '#00D4AA'
python3 scripts/generate-icons.py saas CloudApp '#7C3AED' --style=clay
python3 scripts/generate-icons.py ai BrainAI '#06B6D4' --style=glass
python3 scripts/generate-icons.py luxury LuxBrand '#C9A84C' --style=gradient

# Listar icones e estilos
python3 scripts/generate-icons.py --list-icons fintech
python3 scripts/generate-icons.py --list-styles
```

### 7 Estilos de Geracao

| Estilo | Visual | Melhor para |
|--------|--------|-------------|
| `clay` | **3D matte clay, sombras suaves, Blender/C4D** | **Todos (padrao recomendado)** |
| `glass` | Vidro fosco translucido, premium | saas, ai, crypto |
| `flat` | Cores solidas, minimal, sem 3D | minimal, editorial |
| `isometric` | Perspectiva 45 graus, tech | saas, ai |
| `neon` | Glow neon em fundo escuro | crypto, ai, cinematic |
| `gradient` | Gradiente sofisticado | luxury, premium |
| `outline` | Contorno fino, Linear/Vercel | minimal, clean |

### Output
```
assets/generated/icons/{nicho}-{estilo}/
  security.png      — 1024x1024 PNG
  wallet.png
  analytics.png
  ...
  preview.html      — Preview visual com cards
  manifest.json     — Metadata
```

### Usar no HTML
```html
<div class="feature-card">
  <img src="assets/generated/icons/fintech-clay/security.png"
       alt="Seguranca" width="48" height="48"
       class="rounded-xl" loading="lazy">
  <h4>Seguranca Bancaria</h4>
  <p>Criptografia AES-256 end-to-end.</p>
</div>
```

### 10 Nichos Disponiveis (12 icones cada)
fintech, saas, crypto, ai, health, luxury, ecommerce, education, real-estate, agency

### Icones Pre-gerados (3D Clay)
Ja existem sets completos gerados em:
```
assets/generated/icons/fintech-clay/    (12 icones, #00D4AA)
assets/generated/icons/saas-clay/       (12 icones, #7C3AED)
assets/generated/icons/crypto-clay/     (12 icones, #3B82F6)
assets/generated/icons/ai-clay/         (12 icones, #06B6D4)
assets/generated/icons/luxury-clay/     (12 icones, #C9A84C)
assets/generated/icons/health-clay/     (12 icones, #10B981)
assets/generated/icons/ecommerce-clay/  (12 icones, #F59E0B)
assets/generated/icons/education-clay/  (12 icones, #8B5CF6)
assets/generated/icons/agency-clay/     (12 icones, #EC4899)
assets/generated/icons/real-estate-clay/(12 icones, #2563EB)
```

---

## Mapeamento Semantico por Nicho

### fintech
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Seguranca | `ph-duotone ph-shield-check` | `fintech-clay/security.png` |
| Carteira | `ph-duotone ph-wallet` | `fintech-clay/wallet.png` |
| Analytics | `ph-duotone ph-chart-bar` | `fintech-clay/analytics.png` |
| Crescimento | `ph-duotone ph-trend-up` | `fintech-clay/growth.png` |
| Pagamentos | `ph-duotone ph-credit-card` | `fintech-clay/payment.png` |
| Banco | `ph-duotone ph-bank` | `fintech-clay/bank.png` |
| Criptografia | `ph-duotone ph-lock` | `fintech-clay/encryption.png` |
| Global | `ph-duotone ph-globe-hemisphere-west` | `fintech-clay/global.png` |
| Transferencias | `ph-duotone ph-arrows-left-right` | `fintech-clay/transfer.png` |
| Portfolio | `ph-duotone ph-chart-pie` | `fintech-clay/portfolio.png` |
| Biometria | `ph-duotone ph-fingerprint` | `fintech-clay/biometric.png` |
| Faturamento | `ph-duotone ph-receipt` | `fintech-clay/invoice.png` |

### saas
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Integracao | `ph-duotone ph-squares-four` | `saas-clay/integration.png` |
| Automacao | `ph-duotone ph-lightning` | `saas-clay/automation.png` |
| Colaboracao | `ph-duotone ph-users-three` | `saas-clay/collaboration.png` |
| Dashboard | `ph-duotone ph-chart-line-up` | `saas-clay/dashboard.png` |
| Cloud | `ph-duotone ph-cloud` | `saas-clay/cloud.png` |
| Versionamento | `ph-duotone ph-git-branch` | `saas-clay/versioning.png` |
| Database | `ph-duotone ph-database` | `saas-clay/database.png` |
| Notificacoes | `ph-duotone ph-bell` | `saas-clay/notifications.png` |
| Configuracao | `ph-duotone ph-gear` | `saas-clay/settings.png` |
| Plugins | `ph-duotone ph-puzzle-piece` | `saas-clay/plugins.png` |
| Deploy | `ph-duotone ph-rocket-launch` | `saas-clay/deploy.png` |
| API Keys | `ph-duotone ph-key` | `saas-clay/api.png` |

### crypto
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Bitcoin | `ph-duotone ph-currency-btc` | `crypto-clay/bitcoin.png` |
| Blockchain | `ph-duotone ph-link` | `crypto-clay/blockchain.png` |
| Wallet | `ph-duotone ph-wallet` | `crypto-clay/wallet.png` |
| Swap | `ph-duotone ph-swap` | `crypto-clay/swap.png` |
| Trading | `ph-duotone ph-chart-line-up` | `crypto-clay/trading.png` |
| DeFi | `ph-duotone ph-graph` | `crypto-clay/defi.png` |
| Smart Contract | `ph-duotone ph-lock-laminated` | `crypto-clay/contract.png` |
| Mining | `ph-duotone ph-cpu` | `crypto-clay/mining.png` |
| Layer 2 | `ph-duotone ph-stack` | `crypto-clay/layers.png` |
| Auditoria | `ph-duotone ph-shield-checkered` | `crypto-clay/audit.png` |
| Staking | `ph-duotone ph-coins` | `crypto-clay/staking.png` |
| Governance | `ph-duotone ph-scales` | `crypto-clay/governance.png` |

### ai
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| AI Magic | `ph-duotone ph-sparkle` | `ai-clay/magic.png` |
| Neural | `ph-duotone ph-brain` | `ai-clay/neural.png` |
| Chatbot | `ph-duotone ph-robot` | `ai-clay/chatbot.png` |
| Processamento | `ph-duotone ph-cpu` | `ai-clay/processing.png` |
| Computer Vision | `ph-duotone ph-eye` | `ai-clay/vision.png` |
| Speech | `ph-duotone ph-waveform` | `ai-clay/speech.png` |
| Pipeline | `ph-duotone ph-flow-arrow` | `ai-clay/pipeline.png` |
| Performance | `ph-duotone ph-gauge` | `ai-clay/performance.png` |
| Code Gen | `ph-duotone ph-code` | `ai-clay/codegen.png` |
| Image Gen | `ph-duotone ph-image` | `ai-clay/imagegen.png` |
| NLP | `ph-duotone ph-chat-centered-text` | `ai-clay/nlp.png` |
| Inference | `ph-duotone ph-hard-drives` | `ai-clay/inference.png` |

### health
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Saude | `ph-duotone ph-heartbeat` | `health-clay/heartbeat.png` |
| Consulta | `ph-duotone ph-stethoscope` | `health-clay/consultation.png` |
| Monitoramento | `ph-duotone ph-activity` | `health-clay/monitoring.png` |
| Neurologia | `ph-duotone ph-brain` | `health-clay/neuro.png` |
| Medicamentos | `ph-duotone ph-pill` | `health-clay/medication.png` |
| Agendamento | `ph-duotone ph-calendar-check` | `health-clay/scheduling.png` |
| Prontuario | `ph-duotone ph-clipboard-text` | `health-clay/records.png` |
| Laboratorio | `ph-duotone ph-microscope` | `health-clay/lab.png` |
| Seguro | `ph-duotone ph-shield-plus` | `health-clay/insurance.png` |
| Fitness | `ph-duotone ph-barbell` | `health-clay/fitness.png` |
| Nutricao | `ph-duotone ph-apple` | `health-clay/nutrition.png` |
| Sono | `ph-duotone ph-moon-stars` | `health-clay/sleep.png` |

### luxury
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Exclusividade | `ph-duotone ph-crown` | `luxury-clay/exclusive.png` |
| Joias | `ph-duotone ph-diamond` | `luxury-clay/jewel.png` |
| Experiencia | `ph-duotone ph-wine` | `luxury-clay/experience.png` |
| Premium | `ph-duotone ph-star` | `luxury-clay/premium.png` |
| Qualidade | `ph-duotone ph-medal` | `luxury-clay/quality.png` |
| Relojoaria | `ph-duotone ph-watch` | `luxury-clay/watch.png` |
| Artesanal | `ph-duotone ph-hand-palm` | `luxury-clay/artisan.png` |
| Boutique | `ph-duotone ph-map-pin` | `luxury-clay/boutique.png` |
| Brilho | `ph-duotone ph-sparkle` | `luxury-clay/sparkle.png` |
| Packaging | `ph-duotone ph-package` | `luxury-clay/packaging.png` |
| Certificado | `ph-duotone ph-seal-check` | `luxury-clay/certified.png` |
| White Glove | `ph-duotone ph-car-profile` | `luxury-clay/delivery.png` |

### ecommerce
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Carrinho | `ph-duotone ph-shopping-cart` | `ecommerce-clay/cart.png` |
| Loja | `ph-duotone ph-storefront` | `ecommerce-clay/store.png` |
| Ofertas | `ph-duotone ph-tag` | `ecommerce-clay/offers.png` |
| Entrega | `ph-duotone ph-truck` | `ecommerce-clay/delivery.png` |
| Produtos | `ph-duotone ph-package` | `ecommerce-clay/products.png` |
| Favoritos | `ph-duotone ph-heart` | `ecommerce-clay/wishlist.png` |
| Desconto | `ph-duotone ph-percent` | `ecommerce-clay/discount.png` |
| Devolucao | `ph-duotone ph-arrow-counter-clockwise` | `ecommerce-clay/returns.png` |
| Avaliacoes | `ph-duotone ph-star` | `ecommerce-clay/reviews.png` |
| Busca | `ph-duotone ph-magnifying-glass` | `ecommerce-clay/search.png` |
| Checkout | `ph-duotone ph-credit-card` | `ecommerce-clay/checkout.png` |
| Suporte | `ph-duotone ph-headset` | `ecommerce-clay/support.png` |

### education
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Formacao | `ph-duotone ph-graduation-cap` | `education-clay/graduation.png` |
| Cursos | `ph-duotone ph-book-open-text` | `education-clay/courses.png` |
| Video Aulas | `ph-duotone ph-video-camera` | `education-clay/video.png` |
| Conquistas | `ph-duotone ph-trophy` | `education-clay/achievements.png` |
| Progresso | `ph-duotone ph-chart-bar` | `education-clay/progress.png` |
| Comunidade | `ph-duotone ph-users-three` | `education-clay/community.png` |
| Exercicios | `ph-duotone ph-pencil-simple` | `education-clay/exercises.png` |
| Certificado | `ph-duotone ph-certificate` | `education-clay/certificate.png` |
| Agenda | `ph-duotone ph-calendar` | `education-clay/schedule.png` |
| Mentoria | `ph-duotone ph-chats` | `education-clay/mentoring.png` |
| Objetivos | `ph-duotone ph-target` | `education-clay/goals.png` |
| Insights | `ph-duotone ph-lightbulb` | `education-clay/insights.png` |

### real-estate
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Imoveis | `ph-duotone ph-buildings` | `real-estate-clay/buildings.png` |
| Residencial | `ph-duotone ph-house` | `real-estate-clay/house.png` |
| Localizacao | `ph-duotone ph-map-pin` | `real-estate-clay/location.png` |
| Metragem | `ph-duotone ph-ruler` | `real-estate-clay/area.png` |
| Chaves | `ph-duotone ph-key` | `real-estate-clay/keys.png` |
| Negociacao | `ph-duotone ph-handshake` | `real-estate-clay/deal.png` |
| Tour Virtual | `ph-duotone ph-video-camera` | `real-estate-clay/tour.png` |
| Documentacao | `ph-duotone ph-file-check` | `real-estate-clay/docs.png` |
| Simulacao | `ph-duotone ph-calculator` | `real-estate-clay/calculator.png` |
| Area Verde | `ph-duotone ph-tree` | `real-estate-clay/green.png` |
| Garagem | `ph-duotone ph-car` | `real-estate-clay/parking.png` |
| Seguranca | `ph-duotone ph-shield-check` | `real-estate-clay/security.png` |

### agency
| Conceito | Phosphor | PNG gerado |
|----------|----------|------------|
| Design | `ph-duotone ph-palette` | `agency-clay/design.png` |
| Branding | `ph-duotone ph-pen-nib` | `agency-clay/branding.png` |
| Marketing | `ph-duotone ph-megaphone` | `agency-clay/marketing.png` |
| Metricas | `ph-duotone ph-chart-line-up` | `agency-clay/metrics.png` |
| UI/UX | `ph-duotone ph-layout` | `agency-clay/uiux.png` |
| Desenvolvimento | `ph-duotone ph-code` | `agency-clay/dev.png` |
| Fotografia | `ph-duotone ph-camera` | `agency-clay/photo.png` |
| Video | `ph-duotone ph-film-strip` | `agency-clay/video.png` |
| CRO | `ph-duotone ph-cursor-click` | `agency-clay/cro.png` |
| SEO | `ph-duotone ph-magnifying-glass` | `agency-clay/seo.png` |
| Social Media | `ph-duotone ph-share-network` | `agency-clay/social.png` |
| Email Mkt | `ph-duotone ph-envelope` | `agency-clay/email.png` |

---

## Container Styles para Icones PNG (IA)

Quando usar icones PNG gerados por IA, aplicar containers simples:

```html
<!-- Sem container (recomendado para clay 3D — ja tem volume proprio) -->
<img src="assets/generated/icons/fintech-clay/security.png"
     alt="Seguranca" width="48" height="48"
     class="rounded-xl" loading="lazy">

<!-- Com container sutil -->
<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;
     border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
  <img src="assets/generated/icons/fintech-clay/security.png"
       alt="" width="40" height="40" class="rounded-lg">
</div>
```

**Regra:** Icones 3D Clay ja tem volume e sombra proprios — container pesado e redundante.

---

## Quando usar cada abordagem

| Cenario | Usar | Por que |
|---------|------|---------|
| MVP rapido, prototipo | Phosphor Duotone (CDN) | Instantaneo, consistente |
| Marca propria, visual unico | **generate-icons.py (3D Clay)** | **Icones unicos, AAA+** |
| Cliente exigente | **generate-icons.py** | Personalizado por projeto |
| Muitas paginas, design system | Phosphor Duotone (CDN) | Escalavel, leve |
| Tier cinematic | generate-icons.py + glass/neon | Maximo impacto visual |

---

## GSAP Animacoes

### Scroll Reveal
```js
gsap.utils.toArray('.feature-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: 'top 90%', once: true },
    y: 24, opacity: 0,
    duration: 0.7,
    delay: (i % 3) * 0.1,
    ease: 'power2.out'
  });
});
```

### Hover sutil (card-level)
```css
.feature-card {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.feature-card:hover {
  background: rgba(255,255,255,0.02);
  border-color: rgba(255,255,255,0.08);
  transform: translateY(-4px);
}
```

---

## Regras de Ouro

1. **3D Clay via IA > bibliotecas genericas** para projetos unicos
2. **Phosphor Duotone** como fallback rapido (CDN)
3. **Max 6 icones diferentes por secao**
4. **Tamanho uniforme** — 48px para PNG, text-xl para Phosphor
5. **Um estilo por pagina** — nunca misturar clay com outline
6. **Icones 3D Clay nao precisam de container pesado** — ja tem volume
7. **Fundo branco nos PNGs** — combina com cards dark usando border-radius
8. **Hover no card, nao no icone**
9. **Gerar com a cor do nicho** para manter harmonia
10. **Sempre gerar preview.html** para validar antes de usar
