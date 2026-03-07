# Catalogo de Tecnicas Visuais AAA+

Referencia de tecnicas visuais organizadas por tier. Use os snippets diretamente ao montar as landing pages.

**Legenda de Tier:**
- `[S]` Standard — incluso em todos os tiers
- `[P]` Premium — incluso em premium e cinematic
- `[C]` Cinematic — apenas no tier cinematic

---

## 1. CSS Nativo

### 1.1 Scroll-Driven Animations `[P]`

```css
/* Progressive enhancement: CSS nativo com fallback GSAP */
@supports (animation-timeline: scroll()) {
  .scroll-reveal-native {
    animation: fadeSlideUp linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

```javascript
// Fallback GSAP (sempre incluir)
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 88%' },
    y: 50, opacity: 0, duration: 0.8, ease: 'power3.out'
  });
});
```

### 1.2 @property para Variaveis Animaveis `[P]`

```css
/* Borda rotativa com conic-gradient */
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.rotating-border {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}
.rotating-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(from var(--border-angle), transparent 60%, [ACCENT_COLOR] 80%, transparent 100%);
  animation: borderSpin 4s linear infinite;
  z-index: -1;
}
.rotating-border::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: var(--bg-secondary);
  z-index: -1;
}
@keyframes borderSpin { to { --border-angle: 360deg; } }
```

```css
/* Gradiente animavel */
@property --gradient-pos {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}
.animated-gradient {
  background: linear-gradient(135deg, [ACCENT_COLOR] var(--gradient-pos), transparent);
  animation: gradientShift 3s ease-in-out infinite alternate;
}
@keyframes gradientShift { to { --gradient-pos: 100%; } }
```

### 1.3 color-mix() para Derivar Cores `[S]`

```css
:root {
  --accent: [ACCENT_COLOR];
  --accent-hover: color-mix(in srgb, var(--accent), white 15%);
  --accent-dim: color-mix(in srgb, var(--accent), black 30%);
  --accent-glass: color-mix(in srgb, var(--accent), transparent 95%);
  --accent-glow: color-mix(in srgb, var(--accent), transparent 70%);
  --accent-border: color-mix(in srgb, var(--accent), transparent 80%);
}
```

### 1.4 Container Queries `[S]`

```css
.card-container { container-type: inline-size; }
@container (min-width: 400px) {
  .card-inner { flex-direction: row; gap: 24px; }
  .card-inner .card-icon { width: 64px; height: 64px; }
}
@container (max-width: 399px) {
  .card-inner { flex-direction: column; text-align: center; }
}
```

### 1.5 :has() para Estilizacao Condicional `[S]`

```css
/* FAQ: estilizar item ativo */
.faq-item:has(.faq-answer[aria-expanded="true"]) {
  background: rgba(255,255,255,0.03);
  border-color: var(--accent-border);
}
/* Pricing: destacar card com toggle ativo */
.pricing-card:has(input:checked) {
  border-color: var(--accent);
  box-shadow: 0 0 60px var(--accent-glow);
}
```

---

## 2. GSAP Premium (Free desde v3.12)

### 2.1 SplitText — Reveal por Char/Word/Line `[P]`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/SplitText.min.js"></script>
```

```javascript
// Word reveal (linhas surgindo de baixo)
function splitReveal(selector, opts = {}) {
  const elements = gsap.utils.toArray(selector);
  elements.forEach(el => {
    const split = new SplitText(el, { type: 'lines,words', linesClass: 'split-line' });
    // Wrap each line content for clip
    split.lines.forEach(line => {
      const wrapper = document.createElement('div');
      wrapper.style.overflow = 'hidden';
      line.parentNode.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });
    gsap.from(split.lines, {
      scrollTrigger: { trigger: el, start: opts.start || 'top 80%' },
      y: '110%', rotateX: -15, stagger: 0.1, duration: 1, ease: 'power4.out',
    });
  });
}
```

```javascript
// Char scramble reveal (hero headings)
function charReveal(selector) {
  const split = new SplitText(selector, { type: 'chars' });
  gsap.from(split.chars, {
    opacity: 0, y: 40, rotateX: -90,
    stagger: { each: 0.03, from: 'start' },
    duration: 0.8, ease: 'power4.out', delay: 0.2
  });
}
```

### 2.2 Flip — Transicoes de Layout `[P]`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/Flip.min.js"></script>
```

```javascript
// Tab switch com layout animation
function flipTabs(container) {
  const tabs = container.querySelectorAll('[data-tab]');
  const contents = container.querySelectorAll('[data-tab-content]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const state = Flip.getState(contents);
      contents.forEach(c => c.classList.remove('active'));
      container.querySelector(`[data-tab-content="${tab.dataset.tab}"]`).classList.add('active');
      Flip.from(state, { duration: 0.5, ease: 'power2.inOut', stagger: 0.05 });
    });
  });
}
```

### 2.3 DrawSVG — Animacao de Tracos `[P]`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/DrawSVGPlugin.min.js"></script>
```

```javascript
// Icone SVG desenhando ao aparecer
gsap.utils.toArray('.draw-svg').forEach(svg => {
  const paths = svg.querySelectorAll('path, circle, line, polyline');
  gsap.from(paths, {
    scrollTrigger: { trigger: svg, start: 'top 80%' },
    drawSVG: '0%', stagger: 0.15, duration: 1.2, ease: 'power2.inOut'
  });
});
```

### 2.4 MotionPath — Elementos em Caminhos SVG `[C]`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.7/MotionPathPlugin.min.js"></script>
```

```javascript
// Particula seguindo path orbital
gsap.to('.orbit-particle', {
  motionPath: {
    path: '#orbit-path',
    align: '#orbit-path',
    alignOrigin: [0.5, 0.5],
    autoRotate: true
  },
  duration: 8, repeat: -1, ease: 'none'
});
```

### 2.5 Physics2D — Gravidade e Molas `[C]`

```javascript
// Elementos caindo com gravidade (hero entrance)
gsap.to('.physics-element', {
  y: 'random(-300, -100)',
  x: 'random(-200, 200)',
  rotation: 'random(-180, 180)',
  duration: 0.01
});
gsap.to('.physics-element', {
  y: 0, x: 0, rotation: 0,
  duration: 1.5, ease: 'bounce.out',
  stagger: 0.05
});
```

---

## 3. WebGL / Three.js `[C]`

### 3.1 Shader Background — Noise/Liquid/Gradient

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

```javascript
// Floating geometry (icosahedrons + toruses)
function init3DHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Parse accent color
  const accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '[ACCENT_COLOR]';
  const accentColor = new THREE.Color(accentHex);
  const dimColor = accentColor.clone().multiplyScalar(0.3);

  const material = new THREE.MeshStandardMaterial({
    color: dimColor, emissive: accentColor, emissiveIntensity: 0.15,
    wireframe: true, transparent: true, opacity: 0.12,
  });

  const geometries = [
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.TorusGeometry(1.2, 0.3, 8, 32),
    new THREE.OctahedronGeometry(1, 0),
  ];

  const meshes = [];
  for (let i = 0; i < 5; i++) {
    const geo = geometries[i % geometries.length];
    const mesh = new THREE.Mesh(geo, material.clone());
    mesh.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6 - 3
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
      rotSpeed: { x: (Math.random() - 0.5) * 0.005, y: (Math.random() - 0.5) * 0.005 },
      floatSpeed: 0.3 + Math.random() * 0.5,
      floatAmp: 0.3 + Math.random() * 0.4,
      initY: mesh.position.y,
    };
    scene.add(mesh);
    meshes.push(mesh);
  }

  // Ambient + directional light
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const dirLight = new THREE.DirectionalLight(accentColor, 0.5);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;
    meshes.forEach(m => {
      m.rotation.x += m.userData.rotSpeed.x;
      m.rotation.y += m.userData.rotSpeed.y;
      m.position.y = m.userData.initY + Math.sin(t * m.userData.floatSpeed) * m.userData.floatAmp;
    });
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}
```

### 3.2 GPU Particle System `[C]`

```javascript
// Three.js particle cloud (CTA / hero background)
function initParticleCloud(canvasId, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof THREE === 'undefined') return;

  const count = opts.count || 200;
  const color = opts.color || 0xC9A84C;
  const spread = opts.spread || 10;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    pos[i] = (Math.random() - 0.5) * spread;
    pos[i+1] = (Math.random() - 0.5) * spread * 0.6;
    pos[i+2] = (Math.random() - 0.5) * spread * 0.4 - 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.03, transparent: true, opacity: 0.35 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0004;
    points.rotation.x += 0.0002;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}
```

---

## 4. Micro-interacoes

### 4.1 Text Scramble `[P]`

```javascript
// Scramble effect para headings ou labels
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
  }
  setText(newText) {
    const old = this.el.innerText;
    const length = Math.max(old.length, newText.length);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = old[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    this.frame = 0;
    this.update();
    return new Promise(resolve => this.resolve = resolve);
  }
  update() {
    let output = '', complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) { complete++; output += to; }
      else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span style="opacity:0.4">${char}</span>`;
      } else { output += from; }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) { if (this.resolve) this.resolve(); }
    else { requestAnimationFrame(() => this.update()); this.frame++; }
  }
}
```

### 4.2 Elastic / Spring Animations `[S]`

```javascript
// Spring physics para hover/click
gsap.to('.spring-btn:hover', {
  scale: 1.05, duration: 0.6, ease: 'elastic.out(1, 0.3)'
});
gsap.to('.spring-btn', {
  scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)'
});
```

### 4.3 Advanced Stagger Patterns `[P]`

```javascript
// Center-out stagger (pricing cards, feature grid)
gsap.from('.stagger-item', {
  scrollTrigger: { trigger: '.stagger-container', start: 'top 80%' },
  y: 60, opacity: 0, duration: 0.8, ease: 'power3.out',
  stagger: { each: 0.1, from: 'center' }
});

// Wave stagger (grid items)
gsap.from('.grid-item', {
  scrollTrigger: { trigger: '.grid-container', start: 'top 80%' },
  y: 40, opacity: 0, scale: 0.95, duration: 0.6,
  stagger: { grid: 'auto', from: 'start', each: 0.08, ease: 'power2.out' }
});

// Random stagger (particles, decorations)
gsap.from('.random-item', {
  y: 30, opacity: 0, duration: 0.5,
  stagger: { each: 0.05, from: 'random' }
});
```

### 4.4 Magnetic Elements com Parallax Interno `[P]`

```javascript
// Enhanced magnetic: outer element + inner content parallax
function initMagnetic(selector) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: dx * 0.3, y: dy * 0.3, duration: 0.3, ease: 'power2.out' });
      const inner = btn.querySelector('svg, span, .btn-text');
      if (inner) gsap.to(inner, { x: dx * 0.15, y: dy * 0.15, duration: 0.3 });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.3)' });
      const inner = btn.querySelector('svg, span, .btn-text');
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.3)' });
    });
  });
}
```

### 4.5 Scroll Velocity Skew `[P]`

```javascript
// Sections skew based on scroll speed
function initVelocitySkew(selector) {
  let currentSkew = 0, targetSkew = 0;
  ScrollTrigger.create({
    onUpdate: self => {
      targetSkew = Math.min(Math.max(self.getVelocity() * -0.002, -4), 4);
    }
  });
  gsap.ticker.add(() => {
    currentSkew += (targetSkew - currentSkew) * 0.1;
    targetSkew *= 0.92;
    gsap.set(selector, { skewY: currentSkew });
  });
}
```

### 4.6 Hover Card Tilt com Shine `[P]`

```css
.tilt-card {
  will-change: transform;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.23,1,0.32,1);
}
.tilt-card .shine {
  position: absolute; inset: 0;
  border-radius: inherit; pointer-events: none;
  background: radial-gradient(
    circle at var(--shine-x, 50%) var(--shine-y, 50%),
    rgba(255,255,255,0.08) 0%, transparent 50%
  );
  opacity: 0; transition: opacity 0.3s;
}
.tilt-card:hover .shine { opacity: 1; }
```

```javascript
function initTiltCards(selector) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: x * 12, rotateX: -y * 12,
        duration: 0.4, ease: 'power2.out', transformPerspective: 800
      });
      card.style.setProperty('--shine-x', `${(x+0.5)*100}%`);
      card.style.setProperty('--shine-y', `${(y+0.5)*100}%`);
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
    });
  });
}
```

### 4.7 Button Mouse-Tracking Gradient `[P]`

Botao que reage a posicao do mouse com gradient shift dinamico. Efeito sutil mas sofisticado. Inspirado em A2B Aceleradora.

```css
.btn-tracking {
  position: relative;
  overflow: hidden;
  --btn-glow-x: 50%;
  --btn-glow-y: 50%;
}
.btn-tracking::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    300px circle at var(--btn-glow-x) var(--btn-glow-y),
    rgba(255,255,255,0.15) 0%, transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s;
}
.btn-tracking:hover::before { opacity: 1; }
```

```javascript
function initButtonTracking(selector) {
  document.querySelectorAll(selector || '.btn-tracking').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--btn-glow-x', `${e.clientX - r.left}px`);
      btn.style.setProperty('--btn-glow-y', `${e.clientY - r.top}px`);
    });
  });
}
```

---

## 5. Transicoes de Secao

### 5.1 Clip-Path Reveals `[P]`

```css
.clip-reveal { clip-path: inset(100% 0 0 0); will-change: clip-path; }
```

```javascript
// Scroll-driven wipe (bottom-to-top)
gsap.utils.toArray('.clip-reveal').forEach(section => {
  gsap.fromTo(section,
    { clipPath: 'inset(100% 0 0 0)' },
    {
      clipPath: 'inset(0% 0 0 0)',
      scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 30%', scrub: 0.8 },
      ease: 'none'
    }
  );
});
```

### 5.2 Parallax Depth Layers `[S]`

```javascript
// Multi-speed parallax (orbs, decorations, backgrounds)
gsap.utils.toArray('[data-parallax]').forEach(el => {
  const speed = parseFloat(el.dataset.parallax) || -0.3;
  gsap.to(el, {
    y: () => speed * 300,
    ease: 'none',
    scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.5 }
  });
});
```

### 5.3 Section Pinning `[P]`

```javascript
// Sticky section while content animates
gsap.to('.pinned-content', {
  xPercent: -100 * (panels.length - 1),
  ease: 'none',
  scrollTrigger: {
    trigger: '.pinned-section',
    pin: true,
    scrub: 1,
    end: () => '+=' + document.querySelector('.pinned-content').scrollWidth,
  }
});
```

### 5.4 Horizontal Scroll Section `[P]`

```javascript
// Horizontal scroll para cards (planos, features)
function initHorizontalScroll(sectionSelector, trackSelector) {
  const section = document.querySelector(sectionSelector);
  const track = document.querySelector(trackSelector);
  if (!section || !track) return;

  const scrollWidth = track.scrollWidth - section.offsetWidth;

  gsap.to(track, {
    x: -scrollWidth,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'center center',
      end: () => `+=${scrollWidth}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    }
  });
}
```

### 5.5 Vertical Dual Carousels `[P]`

Duas colunas de imagens/cards rolando em direcoes opostas. Cria efeito visual premium e dinamismo. Inspirado em paginas de alta conversao.

```css
.vertical-carousel-container {
  display: flex;
  width: 100%;
  height: 500px;
  overflow: hidden;
  gap: 12px;
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
}
.vertical-carousel-track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.vertical-carousel-track.scroll-up {
  animation: verticalScrollUp 25s linear infinite;
}
.vertical-carousel-track.scroll-down {
  animation: verticalScrollDown 25s linear infinite;
}
@keyframes verticalScrollUp {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
@keyframes verticalScrollDown {
  0% { transform: translateY(-50%); }
  100% { transform: translateY(0); }
}
.vertical-carousel-track img {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
  aspect-ratio: 3/4;
}
/* Pause on hover */
.vertical-carousel-container:hover .vertical-carousel-track {
  animation-play-state: paused;
}
```

### 5.6 Modal Popup CTA `[S]`

Botoes CTA que abrem um modal com formulario em vez de navegar para uma secao. Aumenta conversao por manter o usuario no contexto.

```css
.modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s ease;
}
.modal-overlay.active {
  opacity: 1; pointer-events: auto;
}
.modal-content {
  background: var(--bg-2);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 40px;
  max-width: 480px;
  width: 90%;
  transform: translateY(20px) scale(0.95);
  transition: transform 0.4s cubic-bezier(0.23,1,0.32,1);
}
.modal-overlay.active .modal-content {
  transform: translateY(0) scale(1);
}
```

```javascript
// Modal open/close
function initModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      overlay.classList.add('active');
    });
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
  overlay.querySelector('.modal-close')?.addEventListener('click', () => {
    overlay.classList.remove('active');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });
}
```

---

## 6. Loading / Entrada

### 6.1 Preloader Cinematico `[C]`

```html
<!-- HTML -->
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

```css
#loader {
  position: fixed; inset: 0; z-index: 10000;
  background: var(--bg-primary);
  display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 24px;
}
.loader-counter {
  font-family: var(--font-heading);
  font-size: clamp(4rem, 12vw, 9rem);
  font-weight: 300; letter-spacing: -0.04em;
  color: var(--text-primary); line-height: 1;
}
.loader-label {
  font-size: 0.65rem; font-weight: 500;
  letter-spacing: 0.4em; text-transform: uppercase;
  color: var(--accent); opacity: 0.6;
}
.loader-bar {
  position: fixed; bottom: 0; height: 2px;
  background: linear-gradient(90deg, var(--accent-dim), var(--accent), var(--accent-hover));
  transform-origin: left;
}
.loader-blinds {
  position: fixed; inset: 0; display: flex;
  z-index: 10001; pointer-events: none;
}
.loader-blind { flex: 1; background: var(--bg-primary); transform-origin: top; }
```

```javascript
// Preloader animation sequence
function initPreloader() {
  const loader = document.getElementById('loader');
  const counter = document.getElementById('loaderCounter');
  const bar = document.getElementById('loaderBar');
  const blinds = document.querySelectorAll('.loader-blind');

  const tl = gsap.timeline();
  tl.to({ val: 0 }, {
    val: 100, duration: 2, ease: 'power2.inOut',
    onUpdate: function() {
      const v = Math.round(this.targets()[0].val);
      if (counter) counter.textContent = v;
      if (bar) bar.style.width = v + '%';
    }
  })
  .to(loader, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=0.2')
  .set(loader, { display: 'none' })
  .to(blinds, {
    scaleY: 0, transformOrigin: 'top', duration: 0.7,
    stagger: { each: 0.08, from: 'center' },
    ease: 'power4.inOut'
  }, '-=0.2')
  .set(document.getElementById('loaderBlinds'), { display: 'none' });

  return tl;
}
```

### 6.2 Skeleton Screens (CSS-only Shimmer) `[S]`

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 25%,
    rgba(255,255,255,0.06) 50%,
    rgba(255,255,255,0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 6.3 Progressive Image Loading (Blur-Up) `[S]`

```css
.blur-up {
  filter: blur(20px);
  transition: filter 0.6s ease;
}
.blur-up.loaded { filter: blur(0); }
```

```javascript
// Lazy load images with blur-up
document.querySelectorAll('img[data-src]').forEach(img => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = img.dataset.src;
        img.onload = () => img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  observer.observe(img);
});
```

---

## 7. Efeitos Visuais Base

### 7.1 Glassmorphism `[S]`

```css
.glass {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.06);
}
.glass-accent {
  background: color-mix(in srgb, var(--accent), transparent 97%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--accent-border);
}
```

### 7.2 Gradient Text `[S]`

```css
.gradient-text {
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent), white 30%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
/* Animated shimmer variant */
.shimmer-text {
  background: linear-gradient(90deg, var(--accent-dim), var(--accent), var(--accent-hover), var(--accent), var(--accent-dim));
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmerText 4s linear infinite;
}
@keyframes shimmerText { to { background-position: 200% center; } }
```

### 7.3 Grain Overlay `[S]`

```css
.grain::after {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none; z-index: 9998; opacity: 0.022;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

### 7.4 Glow Effects `[S]`

```css
.glow-box { box-shadow: 0 0 60px var(--accent-glow); }
.glow-text { text-shadow: 0 0 40px var(--accent-glow); }
.glow-border { box-shadow: 0 0 0 1px var(--accent-border), 0 0 40px var(--accent-glow); }
```

### 7.5 Animated Gradient Border `[S]`

```css
.gradient-border {
  position: relative;
  background: var(--bg-secondary);
  border-radius: 16px;
}
.gradient-border::before {
  content: '';
  position: absolute; inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent), #7c3aed 50%));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
}
```

---

## 8. Acessibilidade

### 8.1 Reduced Motion `[S]` (OBRIGATORIO em todos os tiers)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .cursor-dot, .cursor-ring, .cursor-glow { display: none !important; }
  body { cursor: auto; }
}
```

```javascript
// JS: check and disable heavy animations
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100);
  ScrollTrigger.config({ limitCallbacks: true });
  // Skip preloader
  document.getElementById('loader')?.remove();
  document.getElementById('loaderBlinds')?.remove();
}
```

### 8.2 Focus Visible `[S]` (OBRIGATORIO)

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: 4px;
}
a:focus:not(:focus-visible),
button:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 9. Light Theme System `[S]`

Alternativa ao dark theme padrao. Ideal para nichos como health, education, real-estate, e estilos editorial/minimal. Inspirado em paginas premium como A2B Aceleradora.

### 9.1 Light Theme Variables

```css
/* Substituir as variaveis dark por light quando estilo=light */
:root {
  --bg-0: #FAFAF8;
  --bg-1: #F5F5F0;
  --bg-2: #EFEFEA;
  --bg-3: #E8E8E2;
  --bg-4: #DDDDD7;
  --bg-5: #D0D0CA;

  --text-1: #111111;
  --text-2: #555555;
  --text-3: #888888;

  --border-subtle: rgba(0,0,0,0.06);

  /* Accent colors permanecem iguais */
  /* Glass muda para escuro sobre claro */
}
```

### 9.2 Light Glassmorphism

```css
.glass-light {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(0,0,0,0.06);
}
.glass-light-accent {
  background: color-mix(in srgb, var(--accent), white 95%);
  border: 1px solid color-mix(in srgb, var(--accent), transparent 85%);
}
```

### 9.3 Light Theme Grain

```css
/* Grain mais sutil para light */
.grain-light::after {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none; z-index: 9998; opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}
```

### 9.4 Light Button Styles

```css
.btn-primary-light {
  background: var(--text-1);
  color: var(--bg-0);
  border: none;
  padding: 16px 36px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.35s ease;
}
.btn-primary-light:hover {
  background: var(--accent);
  color: var(--text-1);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px color-mix(in srgb, var(--accent), transparent 60%);
}
.btn-outline-light {
  background: transparent;
  color: var(--text-1);
  border: 1.5px solid rgba(0,0,0,0.15);
  padding: 16px 36px;
  border-radius: 12px;
  transition: all 0.35s ease;
}
.btn-outline-light:hover {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent), transparent 95%);
}
```

### 9.5 Light Gradient Text

```css
.gradient-text-light {
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent), black 20%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 9.6 Editorial Spacing System

Whitespace generoso para sensacao premium. Usa content-width constraints para texto, wide-width para visuais.

```css
/* Largura restrita para texto (melhora leitura) */
.content-narrow { max-width: 680px; margin-inline: auto; }
/* Largura wide para grids e visuais */
.content-wide { max-width: 1340px; margin-inline: auto; }

/* Spacing scale editorial */
.py-section-editorial { padding-block: clamp(80px, 14vh, 200px); }
.gap-editorial { gap: clamp(24px, 4vw, 48px); }

/* Fluid typography avancada */
.text-fluid-sm { font-size: clamp(0.875rem, 0.875rem + 0.2vw, 1.125rem); }
.text-fluid-base { font-size: clamp(1rem, 1rem + 0.2vw, 1.25rem); }
.text-fluid-lg { font-size: clamp(1.125rem, 1.125rem + 0.4vw, 1.5rem); }
.text-fluid-xl { font-size: clamp(1.75rem, 1.75rem + 0.4vw, 2.25rem); }
.text-fluid-2xl { font-size: clamp(2.15rem, 2.15rem + 1.3vw, 3.5rem); }
.text-fluid-hero { font-size: clamp(3rem, 3rem + 3vw, 7rem); }
```

---

## 10. Video e 3D Interativo Avancado

### 10.1 Video Background Hero `[P]`

Video loop como fundo do hero. Autoplay, muted, sem controles. Poster image como fallback.

```html
<section class="relative min-h-screen flex items-center overflow-hidden" id="hero">
  <!-- Video background -->
  <div class="absolute inset-0 z-0">
    <video autoplay muted loop playsinline
      poster="/assets/hero-poster.jpg"
      class="w-full h-full object-cover"
      aria-hidden="true">
      <source src="/assets/hero-video.webm" type="video/webm">
      <source src="/assets/hero-video.mp4" type="video/mp4">
    </video>
    <!-- Overlay escuro para legibilidade -->
    <div class="absolute inset-0 bg-black/60"></div>
    <!-- Gradient fade bottom -->
    <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-0)] to-transparent"></div>
  </div>
  <!-- Content (z-10) por cima do video -->
  <div class="relative z-10 max-w-4xl mx-auto px-5 text-center">
    <!-- ... hero content ... -->
  </div>
</section>
```

```css
/* Reduced motion: para o video e mostra poster */
@media (prefers-reduced-motion: reduce) {
  video { display: none; }
  [poster] + div { background-image: url('/assets/hero-poster.jpg'); background-size: cover; }
}
/* Mobile: video pode ser pesado, usar poster */
@media (max-width: 768px) {
  .hero-video-mobile-hide video { display: none; }
  .hero-video-mobile-hide::before {
    content: ''; position: absolute; inset: 0;
    background: url('/assets/hero-mobile.webp') center/cover;
  }
}
```

### 10.2 Spline 3D Interactive Scene `[C]`

Cena 3D interativa criada no Spline (spline.design). Reage ao mouse, touch, scroll. Zero codigo 3D necessario — tudo visual no editor Spline.

```html
<!-- Opcao 1: Spline Viewer (mais simples) -->
<script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"></script>

<section class="relative min-h-screen flex items-center overflow-hidden" id="hero">
  <!-- Spline 3D background -->
  <spline-viewer
    url="https://prod.spline.design/[SCENE_ID]/scene.splinecode"
    class="absolute inset-0 z-0"
    loading-anim-type="none"
    style="pointer-events: auto;"
  ></spline-viewer>
  <!-- Overlay para legibilidade -->
  <div class="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-[var(--bg-0)]"></div>
  <!-- Content -->
  <div class="relative z-10">
    <!-- ... -->
  </div>
</section>
```

```html
<!-- Opcao 2: Runtime API (mais controle) -->
<canvas id="spline-canvas" class="absolute inset-0 z-0"></canvas>
<script type="module">
  import { Application } from 'https://unpkg.com/@splinetool/runtime@1.9.59/build/runtime.js';
  const canvas = document.getElementById('spline-canvas');
  const app = new Application(canvas);
  app.load('https://prod.spline.design/[SCENE_ID]/scene.splinecode')
    .then(() => {
      // Cena carregada — pode interagir via API
      // app.setVariable('color', '#00D4AA');
    });
</script>
```

**Como criar a cena no Spline:**
1. Acesse spline.design (gratis)
2. Crie cena com geometrias (sphere, torus, abstract)
3. Adicione materiais (glass, metal, gradient)
4. Configure interacoes (mouse follow, scroll, hover)
5. Exporte como "Public URL" → copie o scene ID
6. Recomendacao: max 5-8 objetos para performance

### 10.3 Lottie Animations `[P]`

Animacoes vetoriais leves (~50KB) para icones, loaders, micro-interacoes. Substitui GIFs pesados.

```html
<!-- CDN do dotLottie web component -->
<script src="https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js" type="module"></script>

<!-- Uso basico -->
<dotlottie-wc
  src="https://lottie.host/[ANIMATION_ID].lottie"
  speed="1"
  style="width: 120px; height: 120px"
  loop
  autoplay
></dotlottie-wc>

<!-- Scroll-triggered (play on view) -->
<dotlottie-wc
  src="/assets/animation.lottie"
  style="width: 200px; height: 200px"
  id="lottie-feature"
></dotlottie-wc>
```

```javascript
// Controlar Lottie com ScrollTrigger
function initLottieScroll() {
  document.querySelectorAll('dotlottie-wc[data-scroll]').forEach(el => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.play();
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  });
}
```

**Onde encontrar Lottie animations gratis:**
- lottiefiles.com/free-animations (maior biblioteca)
- iconscout.com/lottie-animations
- lordicon.com (icones animados)

**Uso recomendado:**
- Icones de features (ao inves de SVG estatico)
- Preloader customizado
- Empty states
- Success/error feedback
- Hero illustration (leve, interativo)

### 10.4 Stripe-Style Mesh Gradient WebGL `[P]`

Gradient animado estilo Stripe. Suave, premium, leve (~10KB de JS). Perfeito para hero ou CTA backgrounds.

```html
<canvas id="gradient-canvas" class="absolute inset-0 z-0" style="width:100%;height:100%"></canvas>
```

```javascript
// Mesh gradient simplificado (baseado no MiniGl do Stripe)
function initMeshGradient(canvasId, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const gl = canvas.getContext('webgl');
  if (!gl) return;

  // Resize
  function resize() {
    canvas.width = canvas.clientWidth * Math.min(window.devicePixelRatio, 2);
    canvas.height = canvas.clientHeight * Math.min(window.devicePixelRatio, 2);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // Shaders
  const vertSrc = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragSrc = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;

    // Simplex-like noise
    vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
    vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float n1 = snoise(uv * 2.0 + u_time * 0.15);
      float n2 = snoise(uv * 3.0 - u_time * 0.1 + 5.0);
      float n3 = snoise(uv * 1.5 + u_time * 0.08 + 10.0);
      vec3 color = mix(u_color1, u_color2, smoothstep(-0.5, 0.5, n1));
      color = mix(color, u_color3, smoothstep(-0.3, 0.6, n2) * 0.5);
      color += n3 * 0.05;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Compile shaders
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_resolution');
  const uC1 = gl.getUniformLocation(prog, 'u_color1');
  const uC2 = gl.getUniformLocation(prog, 'u_color2');
  const uC3 = gl.getUniformLocation(prog, 'u_color3');

  // Parse hex colors to RGB [0-1]
  function hexToRGB(hex) {
    const r = parseInt(hex.slice(1,3), 16) / 255;
    const g = parseInt(hex.slice(3,5), 16) / 255;
    const b = parseInt(hex.slice(5,7), 16) / 255;
    return [r, g, b];
  }
  const c1 = hexToRGB(colors[0] || '#0a0a0f');
  const c2 = hexToRGB(colors[1] || '#1a1a2e');
  const c3 = hexToRGB(colors[2] || '#00D4AA');

  gl.uniform3f(uC1, ...c1);
  gl.uniform3f(uC2, ...c2);
  gl.uniform3f(uC3, ...c3);

  function render(time) {
    gl.uniform1f(uTime, time * 0.001);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// Uso: initMeshGradient('gradient-canvas', ['#0a0a0f', '#1a1a2e', '#00D4AA']);
```

### 10.5 Three.js Post-Processing (Bloom + Film Grain) `[C]`

Efeitos de pos-processamento para cenas Three.js. Bloom glow + film grain cinematico.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- Post-processing requer imports separados -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
  }
}
</script>
```

```javascript
// Post-processing setup (via ES modules)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';

// Depois de criar scene, camera, renderer:
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Bloom (glow nas emissoes)
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloom);

// Film grain
const film = new FilmPass(0.15, false); // intensity, grayscale
composer.addPass(film);

// No loop de animacao, usar composer.render() ao inves de renderer.render()
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
```

### 10.6 Video como Textura Three.js `[C]`

Mapear video em uma geometria 3D (tela flutuante, cubo, esfera).

```javascript
// Video texture em Three.js
function initVideoTexture(videoSrc, meshGeometry) {
  const video = document.createElement('video');
  video.src = videoSrc;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.play();

  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(meshGeometry, material);
  // Posicionar e adicionar a cena
  return mesh;
}

// Exemplo: video em tela flutuante
const screen = initVideoTexture('/assets/demo.mp4', new THREE.PlaneGeometry(4, 2.25));
screen.position.set(0, 0, -2);
scene.add(screen);

// Animacao: leve float
gsap.to(screen.rotation, { y: 0.1, x: -0.05, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
```

---

## Resumo por Tier

| Tecnica | Standard | Premium | Cinematic |
|---------|----------|---------|-----------|
| color-mix() | ✓ | ✓ | ✓ |
| Container queries | ✓ | ✓ | ✓ |
| :has() | ✓ | ✓ | ✓ |
| Glassmorphism | ✓ | ✓ | ✓ |
| Gradient text | ✓ | ✓ | ✓ |
| Grain overlay | ✓ | ✓ | ✓ |
| Glow effects | ✓ | ✓ | ✓ |
| Parallax layers | ✓ | ✓ | ✓ |
| Elastic springs | ✓ | ✓ | ✓ |
| Skeleton shimmer | ✓ | ✓ | ✓ |
| Blur-up images | ✓ | ✓ | ✓ |
| Reduced motion | ✓ | ✓ | ✓ |
| Focus visible | ✓ | ✓ | ✓ |
| Scroll-driven CSS | | ✓ | ✓ |
| @property borders | | ✓ | ✓ |
| SplitText reveal | | ✓ | ✓ |
| Flip transitions | | ✓ | ✓ |
| DrawSVG | | ✓ | ✓ |
| Advanced staggers | | ✓ | ✓ |
| Magnetic buttons | | ✓ | ✓ |
| Velocity skew | | ✓ | ✓ |
| Tilt cards + shine | | ✓ | ✓ |
| Clip-path reveals | | ✓ | ✓ |
| Section pinning | | ✓ | ✓ |
| Horizontal scroll | | ✓ | ✓ |
| Vertical dual carousels | | ✓ | ✓ |
| Modal popup CTA | ✓ | ✓ | ✓ |
| Button mouse tracking | | ✓ | ✓ |
| Light theme system | ✓ | ✓ | ✓ |
| Editorial spacing | ✓ | ✓ | ✓ |
| Text scramble | | ✓ | ✓ |
| Three.js geometries | | | ✓ |
| GPU particles | | | ✓ |
| MotionPath | | | ✓ |
| Physics2D | | | ✓ |
| Preloader cinematico | | | ✓ |
| Custom cursor dual | | | ✓ |
| Video background hero | | ✓ | ✓ |
| Spline 3D interactive | | | ✓ |
| Lottie animations | | ✓ | ✓ |
| Mesh gradient WebGL | | ✓ | ✓ |
| Three.js post-processing | | | ✓ |
| Video as 3D texture | | | ✓ |
