import type { FastifyInstance } from 'fastify';

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brandly Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={darkMode:'class',theme:{extend:{colors:{brand:'#7C3AED',brandLight:'#A78BFA'}}}}</script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .tab-active { border-bottom: 2px solid #7C3AED; color: #A78BFA; }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .loader { border: 3px solid #374151; border-top: 3px solid #7C3AED; border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body class="bg-gray-950 text-white min-h-screen">

  <!-- Login -->
  <div id="login-screen" class="flex items-center justify-center min-h-screen">
    <div class="bg-gray-900 rounded-xl border border-gray-800 p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-center mb-2">Brandly Admin</h1>
      <p class="text-gray-400 text-center text-sm mb-6">Painel de gestao da plataforma</p>
      <div id="login-error" class="hidden bg-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-4"></div>
      <input id="login-email" type="email" placeholder="Email" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:border-brand focus:outline-none">
      <input id="login-password" type="password" placeholder="Senha" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-4 text-white placeholder-gray-500 focus:border-brand focus:outline-none">
      <button onclick="doLogin()" class="w-full bg-brand hover:bg-brand/80 text-white font-semibold rounded-lg py-3 transition">Entrar</button>
    </div>
  </div>

  <!-- Dashboard -->
  <div id="dashboard-screen" class="hidden">
    <!-- Top bar -->
    <header class="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 class="text-xl font-bold">Brandly <span class="text-brand">Admin</span></h1>
      <div class="flex items-center gap-4">
        <span id="admin-name" class="text-gray-400 text-sm"></span>
        <button onclick="doLogout()" class="text-gray-500 hover:text-red-400 text-sm">Sair</button>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 flex gap-6 text-sm">
      <button onclick="switchTab('overview')" id="tab-overview" class="py-3 tab-active">Visao Geral</button>
      <button onclick="switchTab('creators')" id="tab-creators" class="py-3 text-gray-500 hover:text-gray-300">Creators</button>
      <button onclick="switchTab('videos')" id="tab-videos" class="py-3 text-gray-500 hover:text-gray-300">Videos</button>
      <button onclick="switchTab('profiles')" id="tab-profiles" class="py-3 text-gray-500 hover:text-gray-300">Perfis IA</button>
    </nav>

    <!-- Content -->
    <main id="tab-content" class="p-6 max-w-7xl mx-auto"></main>
  </div>

<script>
const API = window.location.origin;
let token = localStorage.getItem('admin_token');
let currentTab = 'overview';

// ============ AUTH ============
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  if (r.status === 401) { doLogout(); throw new Error('Nao autorizado'); }
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro'); }
  return r.json();
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  try {
    const res = await api('POST', '/api/auth/login', { email, password });
    if (res.user?.role !== 'admin') { errEl.textContent = 'Acesso restrito a admins'; errEl.classList.remove('hidden'); return; }
    token = res.token;
    localStorage.setItem('admin_token', token);
    showDashboard(res.user);
  } catch (e) { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
}

function doLogout() {
  token = null;
  localStorage.removeItem('admin_token');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard-screen').classList.add('hidden');
}

async function checkAuth() {
  if (!token) return;
  try {
    const res = await api('GET', '/api/auth/me');
    if (res.role === 'admin') showDashboard(res);
    else doLogout();
  } catch { doLogout(); }
}

function showDashboard(user) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard-screen').classList.remove('hidden');
  document.getElementById('admin-name').textContent = user.name || user.email;
  switchTab('overview');
}

// ============ TABS ============
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('nav button').forEach(b => { b.className = 'py-3 text-gray-500 hover:text-gray-300'; });
  document.getElementById('tab-' + tab).className = 'py-3 tab-active';
  document.getElementById('tab-content').innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';
  if (tab === 'overview') loadOverview();
  else if (tab === 'creators') loadCreators();
  else if (tab === 'videos') loadVideos();
  else if (tab === 'profiles') loadProfiles();
}

// ============ OVERVIEW ============
async function loadOverview() {
  try {
    const [usersRes, videosRes] = await Promise.all([
      api('GET', '/api/users?limit=5'),
      api('GET', '/api/videos/review-queue'),
    ]);
    const c = document.getElementById('tab-content');
    c.innerHTML = \`
      <div class="fade-in grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p class="text-gray-400 text-sm">Total Creators</p>
          <p class="text-2xl font-bold mt-1">\${usersRes.total}</p>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p class="text-gray-400 text-sm">Videos Pendentes</p>
          <p class="text-2xl font-bold mt-1 text-yellow-400">\${videosRes.total}</p>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p class="text-gray-400 text-sm">Videos na Fila</p>
          <p class="text-2xl font-bold mt-1">\${videosRes.videos.length}</p>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p class="text-gray-400 text-sm">Ultimos Cadastros</p>
          <p class="text-2xl font-bold mt-1">\${usersRes.users.length}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 class="font-semibold mb-4">Fila de Aprovacao</h3>
          \${videosRes.videos.length === 0 ? '<p class="text-gray-500 text-sm">Nenhum video pendente</p>' :
            videosRes.videos.slice(0,5).map(v => \`
              <div class="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <div>
                  <p class="text-sm font-medium">\${v.externalUrl ? v.externalUrl.substring(0,50)+'...' : 'Video #'+v.id.substring(0,8)}</p>
                  <p class="text-xs text-gray-500">Creator: \${v.creatorId.substring(0,8)}...</p>
                </div>
                <div class="flex gap-2">
                  <button onclick="reviewVideo('\${v.id}','approved')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg">Aprovar</button>
                  <button onclick="promptReject('\${v.id}')" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg">Rejeitar</button>
                </div>
              </div>
            \`).join('')}
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 class="font-semibold mb-4">Ultimos Creators</h3>
          \${usersRes.users.map(u => \`
            <div class="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <div class="w-8 h-8 rounded-full bg-brand/30 flex items-center justify-center text-sm font-bold text-brandLight">\${u.name.charAt(0)}</div>
              <div class="flex-1">
                <p class="text-sm font-medium">\${u.name}</p>
                <p class="text-xs text-gray-500">\${u.email}</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full \${u.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">\${u.status}</span>
              <span class="text-xs text-gray-600">\${u.levelName || 'Seed'}</span>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  } catch (e) { document.getElementById('tab-content').innerHTML = '<p class="text-red-400">Erro: '+e.message+'</p>'; }
}

// ============ VIDEOS ============
async function loadVideos() {
  try {
    const res = await api('GET', '/api/videos/review-queue');
    const c = document.getElementById('tab-content');
    c.innerHTML = \`
      <div class="fade-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">Fila de Aprovacao (\${res.total})</h2>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-800/50">
              <tr>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Video</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Creator</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Plataforma</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Enviado em</th>
                <th class="text-right px-4 py-3 text-gray-400 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              \${res.videos.length === 0 ? '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Nenhum video pendente</td></tr>' :
                res.videos.map(v => \`
                  <tr class="border-t border-gray-800 hover:bg-gray-800/30">
                    <td class="px-4 py-3">
                      <a href="\${v.externalUrl}" target="_blank" class="text-brandLight hover:underline">\${v.externalUrl ? v.externalUrl.substring(0,40)+'...' : '-'}</a>
                    </td>
                    <td class="px-4 py-3 text-gray-400">\${v.creatorId.substring(0,8)}...</td>
                    <td class="px-4 py-3 text-gray-400">\${v.platform || '-'}</td>
                    <td class="px-4 py-3 text-gray-400">\${new Date(v.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td class="px-4 py-3 text-right">
                      <button onclick="reviewVideo('\${v.id}','approved')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg mr-1">Aprovar</button>
                      <button onclick="promptReject('\${v.id}')" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg">Rejeitar</button>
                    </td>
                  </tr>
                \`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    \`;
  } catch (e) { document.getElementById('tab-content').innerHTML = '<p class="text-red-400">Erro: '+e.message+'</p>'; }
}

async function reviewVideo(id, status, reason) {
  try {
    const body = { status };
    if (reason) body.rejectionReason = reason;
    const res = await api('PATCH', '/api/videos/' + id + '/review', body);
    alert(res.message);
    if (currentTab === 'videos') loadVideos();
    else if (currentTab === 'overview') loadOverview();
  } catch (e) { alert('Erro: ' + e.message); }
}

function promptReject(id) {
  const reason = prompt('Motivo da rejeicao:');
  if (reason) reviewVideo(id, 'rejected', reason);
}

// ============ CREATORS ============
async function loadCreators(page) {
  page = page || 1;
  try {
    const res = await api('GET', '/api/users?page=' + page + '&limit=20');
    const c = document.getElementById('tab-content');
    c.innerHTML = \`
      <div class="fade-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold">Creators (\${res.total})</h2>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-800/50">
              <tr>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Creator</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Nivel</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th class="text-left px-4 py-3 text-gray-400 font-medium">Onboarding</th>
                <th class="text-right px-4 py-3 text-gray-400 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              \${res.users.map(u => \`
                <tr class="border-t border-gray-800 hover:bg-gray-800/30">
                  <td class="px-4 py-3 font-medium">\${u.name}</td>
                  <td class="px-4 py-3 text-gray-400">\${u.email}</td>
                  <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full bg-brand/20 text-brandLight">\${u.levelName || 'Seed'}</span></td>
                  <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full \${u.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">\${u.status}</span></td>
                  <td class="px-4 py-3">\${u.onboardingCompleted ? '<span class="text-green-400">✓</span>' : '<span class="text-gray-600">—</span>'}</td>
                  <td class="px-4 py-3 text-right">
                    <button onclick="viewCreator('\${u.id}')" class="text-brandLight hover:underline text-xs">Ver perfil</button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
        <div class="flex justify-center gap-2 mt-4">
          \${page > 1 ? '<button onclick="loadCreators('+(page-1)+')" class="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg">Anterior</button>' : ''}
          <span class="text-gray-500 text-sm py-2">Pagina \${page}</span>
          \${res.users.length === 20 ? '<button onclick="loadCreators('+(page+1)+')" class="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg">Proxima</button>' : ''}
        </div>
      </div>
    \`;
  } catch (e) { document.getElementById('tab-content').innerHTML = '<p class="text-red-400">Erro: '+e.message+'</p>'; }
}

async function viewCreator(id) {
  try {
    const [userRes, profileRes] = await Promise.all([
      api('GET', '/api/users/' + id),
      api('GET', '/api/onboarding/behavioral/admin/' + id).catch(() => null),
    ]);
    const u = userRes.user;
    const p = userRes.profile;
    const bp = profileRes;
    const c = document.getElementById('tab-content');

    let behavioralHtml = '<p class="text-gray-500 text-sm">Perfil comportamental nao realizado</p>';
    if (bp && bp.adminDiagnostic) {
      const ad = bp.adminDiagnostic;
      const cd = bp.creatorDiagnostic;
      behavioralHtml = \`
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold text-brandLight mb-2">\${cd?.archetypeEmoji || ''} \${cd?.title || 'N/A'}</h4>
            <p class="text-gray-400 text-sm mb-3">\${cd?.shortDescription || ''}</p>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">Nivel:</span> <span class="text-white">\${cd?.level || '-'}</span></div>
              <div><span class="text-gray-500">Prontidao:</span> <span class="text-white">\${cd?.readinessScore || 0}%</span></div>
              <div><span class="text-gray-500">Superpoder:</span> <span class="text-white">\${cd?.superpower || '-'}</span></div>
              <div><span class="text-gray-500">Segmentos:</span> <span class="text-white">\${cd?.productMatch?.join(', ') || '-'}</span></div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Diagnostico Admin</h4>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">DISC:</span> D:\${ad.disc?.D} I:\${ad.disc?.I} S:\${ad.disc?.S} C:\${ad.disc?.C}</div>
              <div><span class="text-gray-500">Risco retencao:</span> <span class="\${ad.retentionRisk === 'high' ? 'text-red-400' : ad.retentionRisk === 'medium' ? 'text-yellow-400' : 'text-green-400'}">\${ad.retentionRisk}</span></div>
              <div><span class="text-gray-500">Tolerancia risco:</span> \${ad.riskTolerance}</div>
              <div><span class="text-gray-500">Camera:</span> \${ad.cameraComfort}</div>
              <div><span class="text-gray-500">Output previsto:</span> \${ad.predictedOutput}</div>
              <div><span class="text-gray-500">Onboarding:</span> \${ad.onboardingPath}</div>
              <div><span class="text-gray-500">Tags:</span> \${ad.tags?.map(t => '<span class="inline-block bg-gray-800 text-xs px-2 py-0.5 rounded mr-1">'+t+'</span>').join('') || '-'}</div>
              <div class="mt-2"><span class="text-gray-500">Acoes recomendadas:</span>
                <ul class="mt-1 text-gray-300 list-disc list-inside">\${ad.recommendedActions?.map(a => '<li>'+a+'</li>').join('') || ''}</ul>
              </div>
            </div>
          </div>
        </div>
      \`;
    }

    c.innerHTML = \`
      <div class="fade-in">
        <button onclick="loadCreators()" class="text-brandLight hover:underline text-sm mb-4 block">&larr; Voltar para lista</button>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Info basica -->
          <div class="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-full bg-brand/30 flex items-center justify-center text-lg font-bold text-brandLight">\${u.name.charAt(0)}</div>
              <div>
                <h3 class="font-bold">\${u.name}</h3>
                <p class="text-gray-400 text-sm">\${u.email}</p>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-500">Role</span><span>\${u.role}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="\${u.status === 'active' ? 'text-green-400' : 'text-yellow-400'}">\${u.status}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Nivel</span><span class="text-brandLight">\${u.levelName || 'Seed'}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Referral</span><span>\${u.referralCode || '-'}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Instagram</span><span>\${u.instagramHandle || '-'}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">TikTok</span><span>\${u.tiktokHandle || '-'}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Onboarding</span><span>\${u.onboardingCompleted ? '✓ Completo' : 'Pendente'}</span></div>
              <div class="flex justify-between"><span class="text-gray-500">Cadastro</span><span>\${new Date(u.createdAt).toLocaleDateString('pt-BR')}</span></div>
            </div>
          </div>

          <!-- Perfil comportamental -->
          <div class="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 class="font-bold mb-4">Perfil Comportamental</h3>
            \${behavioralHtml}
          </div>
        </div>

        \${p ? \`
        <div class="bg-gray-900 rounded-xl border border-gray-800 p-5 mt-6">
          <h3 class="font-bold mb-3">Preferencias do Onboarding</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span class="text-gray-500 block">Categorias</span>\${p.preferredCategories?.join(', ') || '-'}</div>
            <div><span class="text-gray-500 block">Estilo</span>\${p.contentStyle || '-'}</div>
            <div><span class="text-gray-500 block">Experiencia</span>\${p.experienceLevel || '-'}</div>
            <div><span class="text-gray-500 block">Horas/dia</span>\${p.availableHoursPerDay || '-'}</div>
          </div>
        </div>
        \` : ''}
      </div>
    \`;
  } catch (e) { document.getElementById('tab-content').innerHTML = '<p class="text-red-400">Erro: '+e.message+'</p>'; }
}

// ============ PROFILES ============
async function loadProfiles(page) {
  page = page || 1;
  try {
    const res = await api('GET', '/api/users?page=' + page + '&limit=50');
    // Filtrar creators que tem perfil comportamental
    const creatorsWithProfile = [];
    for (const u of res.users) {
      try {
        const bp = await api('GET', '/api/onboarding/behavioral/admin/' + u.id);
        if (bp && bp.creatorDiagnostic) {
          creatorsWithProfile.push({ ...u, diagnostic: bp });
        }
      } catch { /* sem perfil */ }
    }

    const c = document.getElementById('tab-content');
    c.innerHTML = \`
      <div class="fade-in">
        <h2 class="text-lg font-bold mb-4">Perfis Comportamentais IA (\${creatorsWithProfile.length})</h2>
        \${creatorsWithProfile.length === 0 ? '<div class="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">Nenhum creator completou a analise comportamental ainda</div>' :
          '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">' +
          creatorsWithProfile.map(u => {
            const cd = u.diagnostic.creatorDiagnostic;
            const ad = u.diagnostic.adminDiagnostic;
            return \`
              <div class="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-brand/50 transition cursor-pointer" onclick="viewCreator('\${u.id}')">
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-2xl">\${cd.archetypeEmoji}</span>
                  <div>
                    <p class="font-semibold text-sm">\${u.name}</p>
                    <p class="text-brandLight text-xs">\${cd.title}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="text-gray-500">Prontidao</span>
                  <span class="font-bold text-brandLight">\${cd.readinessScore}%</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                  <div class="bg-brand h-1.5 rounded-full" style="width:\${cd.readinessScore}%"></div>
                </div>
                <div class="flex flex-wrap gap-1">
                  \${ad?.tags?.map(t => '<span class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">'+t+'</span>').join('') || ''}
                </div>
                <div class="mt-2 flex items-center justify-between text-xs">
                  <span class="\${ad?.retentionRisk === 'high' ? 'text-red-400' : ad?.retentionRisk === 'medium' ? 'text-yellow-400' : 'text-green-400'}">Risco: \${ad?.retentionRisk || '-'}</span>
                  <span class="text-gray-500">\${cd.level}</span>
                </div>
              </div>
            \`;
          }).join('') + '</div>'}
      </div>
    \`;
  } catch (e) { document.getElementById('tab-content').innerHTML = '<p class="text-red-400">Erro: '+e.message+'</p>'; }
}

// ============ INIT ============
checkAuth();
</script>
</body>
</html>`;

export async function adminPanelRoutes(app: FastifyInstance) {
  // GET /admin — serve o painel admin (HTML)
  app.get('/', async (_request, reply) => {
    reply.type('text/html').send(ADMIN_HTML);
  });
}
