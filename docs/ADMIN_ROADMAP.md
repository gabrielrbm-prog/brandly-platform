# Brandly Admin — Roadmap de Evolucao

## Diagnostico Atual

### O que funciona
- Dashboard overview (4 stat cards, fila de videos, creators recentes)
- Lista de creators com busca e paginacao
- Detalhe do creator com perfil comportamental (DISC, arquetipos, tags)
- Fila de aprovacao de videos (aprovar/rejeitar com modal)
- Grid de perfis comportamentais IA
- Triggers de cron (pool global, sync social)

### Problemas Criticos Encontrados
1. **Financeiro invisivel** — nao existe UI para processar saques, confirmar vendas ou ver receita
2. **Marcas sem gestao** — nao da pra criar/editar marcas, briefings ou produtos pelo admin
3. **Campanhas construidas mas invisiveis** — API completa mas zero paginas no admin
4. **Analytics 100% mock** — `analytics.ts` retorna dados fake, nao consulta o banco
5. **Dashboard stats errados** — `poolMensal` mostra ganhos do admin, nao receita da plataforma
6. **Rede sem visualizacao** — nenhuma visao da arvore de rede, distribuicao de niveis ou bonus
7. **Busca nao funciona no servidor** — parametro `search` nao implementado na rota `/api/users`
8. **N+1 na pagina de perfis** — faz 1 request por creator sequencialmente (100 creators = 100 requests)
9. **Sem feedback de erros** — todos os catches sao silenciosos, admin nao sabe quando algo falha
10. **Sem export de dados** — nenhum CSV/Excel em nenhuma tela

---

## FASE 0 — Correcoes Urgentes (pra funcionar direito)

### 0.1 Fix Dashboard Stats
- Substituir `poolMensal` por receita real da plataforma (soma de margens sobre vendas)
- Adicionar: creators ativos hoje, taxa de aprovacao, saques pendentes
- Queries reais no Drizzle em vez de usar endpoint do creator

### 0.2 Fix Server Search
- Implementar filtro `search` na rota `GET /api/users` (buscar por nome e email com `ilike`)

### 0.3 Fix Perfis N+1
- Criar endpoint admin `GET /api/users/with-profiles` que faz JOIN no banco
- Substituir os 100 requests sequenciais por 1 query

### 0.4 Error Handling
- Adicionar toast/notification system (substituir `alert()` e catches silenciosos)
- Criar componente Toast reutilizavel

### 0.5 Rejeicao Obrigatoria
- Modal de rejeicao deve exigir motivo (API ja valida, frontend nao)
- Substituir `window.prompt()` no dashboard por modal consistente

---

## FASE 1 — Financeiro (P0 — Negocio nao opera sem isso)

### 1.1 Fila de Saques (Withdrawals Queue)
- Tabela: creator, valor, chave PIX, data solicitacao, status
- Botoes: aprovar (com confirmacao), rejeitar (com motivo)
- Aprovacao em lote (selecionar multiplos + aprovar juntos)
- Badge no sidebar: "Saques (N)" com contador vermelho
- **API necessaria**: `GET /api/admin/withdrawals`, `PATCH /api/admin/withdrawals/:id`

### 1.2 Confirmacao de Vendas
- Tabela: vendas pendentes com creator, produto, valor, data
- Botao confirmar → dispara `POST /api/sales/:id/confirm` (ativa bonus engine)
- **API necessaria**: `GET /api/admin/sales?status=pending`

### 1.3 Painel Financeiro (Revenue Overview)
- Cards: GMV total, margem Brandly, total pago a creators, saques pendentes
- Breakdown: receita por tipo (fisico vs digital), por marca, por periodo
- Grafico mensal de receita vs pagamentos
- **API necessaria**: `GET /api/admin/financial/overview`, `GET /api/admin/financial/monthly`

### 1.4 Historico de Pagamentos (Ledger)
- Tabela completa de todos os pagamentos (video, comissao, bonus)
- Filtros: tipo, creator, periodo, status
- Export CSV
- **API necessaria**: `GET /api/admin/payments`

---

## FASE 2 — Gestao de Marcas e Campanhas (P0-P1)

### 2.1 CRUD de Marcas
- Listagem com: nome, categoria, creators ativos, videos/mes, status
- Formulario criar/editar: nome, logo, descricao, website, categoria, `minVideosPerMonth`, `maxCreators`, comissoes
- Toggle ativar/desativar marca
- Detalhe da marca: creators conectados, videos do mes, briefings ativos

### 2.2 Gestor de Briefings
- CRUD de briefings vinculados a marca
- Campos: titulo, descricao, do list, don't list, requisitos tecnicos, tom
- Status: ativo/inativo
- Preview de como o creator vera o briefing

### 2.3 Gestao de Produtos
- CRUD de produtos por marca
- Campos: nome, descricao, preco, tipo (fisico/digital), `commissionPercent`, status
- Visualizacao de tracking links e performance

### 2.4 Centro de Campanhas
- Migrar `campaigns.ts` de mock para queries reais no Drizzle
- Lista de campanhas com status, progresso, budget
- Wizard de criacao: marca → briefing → meta de videos → selecao de creators
- Detalhe: videos submetidos, creators atribuidos, budget burn, taxa aprovacao
- Atribuicao de creators (convidar, remover, reatribuir)

---

## FASE 3 — Gestao de Creators e Rede (P1)

### 3.1 Creator Detail Completo
Expandir o detalhe do creator com abas:
- **Info**: dados basicos + perfil comportamental (ja existe)
- **Videos**: todos os videos do creator (aprovados, pendentes, rejeitados) com filtros
- **Financeiro**: saldo, ganhos por tipo, historico de saques
- **Rede**: patrocinador, diretos, arvore (depth 1-3)
- **Marcas**: marcas conectadas, videos por marca
- **Social**: contas Phyllo, metricas de engajamento
- **Formacao**: cursos em andamento, licoes concluidas

### 3.2 Acoes sobre Creator
- Alterar status (ativo/inativo/suspenso) com confirmacao
- Alterar nivel manualmente (override de carreira)
- Alterar role (creator/admin)
- Enviar notificacao push individual

### 3.3 Painel de Risco (At-Risk)
- Creators com `retentionRisk: high` + inativos ha 7+ dias
- Metricas: dias desde ultimo video, nivel, engajamento social
- Acoes rapidas: enviar notificacao, flag para follow-up

### 3.4 Analytics de Rede
- Distribuicao por nivel (grafico de barras)
- Bonus distribuidos por tipo (direto, infinito, equiparacao, pool)
- Top recrutadores (creators que mais indicaram)
- Alertas de desqualificacao (creators que cairam abaixo do QV)
- Arvore de rede pesquisavel (buscar por creator → ver upline/downline)

---

## FASE 4 — Inteligencia e Analytics (P1-P2)

### 4.1 Analytics Real (substituir mocks)
- Migrar `analytics.ts` para queries reais no Drizzle
- Dashboard de metricas: registros/semana, onboarding completion rate, video volume/dia
- Funil de aquisicao: registro → onboarding → 1o video → 10 videos/dia

### 4.2 Video Intelligence
- Filtros na fila: por marca, plataforma, data, nivel do creator
- Analytics de rejeicao: motivos mais comuns, tendencias
- Score IA ao lado da review manual (usar endpoint `analyze-video` existente)
- Tracking de resubmissao (video rejeitado → resubmetido → resultado)
- SLA de review (tempo medio submissao → aprovacao, alertar se > 24h)

### 4.3 IA Usage Monitor
- Tabela de `contentGenerations`: tipo, tokens usados, provider, custo estimado
- Total de tokens consumidos por periodo
- Breakdown por feature (caption vs hashtags vs video analysis vs scripts vs behavioral)

### 4.4 Quality Score do Creator
- Score composto: taxa aprovacao (40%) + consistencia producao (30%) + engajamento social (30%)
- Ranking de creators por quality score
- Usado para matching com marcas premium

---

## FASE 5 — Operacional e Comunicacao (P2)

### 5.1 Gestao de Cursos (LMS Admin)
- CRUD de cursos e licoes
- Toggle publicar/despublicar
- Dashboard de progresso dos creators (quem completou o que)

### 5.2 Gestao de Comunidade
- CRUD de lives (agendar, editar, cancelar)
- CRUD de cases de sucesso (publicar/despublicar)

### 5.3 Central de Notificacoes
- Enviar push para: todos, segmento (nivel, at-risk), ou individual
- Mensagem in-app (anuncios, lancamentos de marca, mudancas de regra)
- Historico de notificacoes enviadas

### 5.4 Utilities
- Export CSV em todas as tabelas do admin
- Busca global no header (creators, marcas, videos por URL)
- Acoes em lote (mudar status de multiplos creators)
- Audit log (quem fez o que, quando)

### 5.5 Portal da Marca (Read-Only)
- Login separado para contato da marca
- Dashboard da marca: videos produzidos, creators ativos, taxa aprovacao, reach estimado
- Relatorio exportavel PDF/CSV

---

## Ordem de Implementacao Sugerida

```
SPRINT 1 (Urgente)    → Fase 0 (correcoes) + Fase 1.1 (saques) + Fase 1.2 (vendas)
SPRINT 2 (Financeiro) → Fase 1.3 (revenue) + Fase 1.4 (ledger) + Toast system
SPRINT 3 (Marcas)     → Fase 2.1 (CRUD marcas) + Fase 2.2 (briefings) + Fase 2.3 (produtos)
SPRINT 4 (Campanhas)  → Fase 2.4 (centro de campanhas, migrar mock → real)
SPRINT 5 (Creators)   → Fase 3.1 (detail completo) + Fase 3.2 (acoes) + Fase 3.3 (at-risk)
SPRINT 6 (Rede)       → Fase 3.4 (analytics rede, distribuicao, arvore)
SPRINT 7 (Intel)      → Fase 4.1 (analytics real) + Fase 4.2 (video intelligence)
SPRINT 8 (Polish)     → Fase 4.3 + 4.4 + Fase 5 (LMS, comunidade, notificacoes, utilities)
```

---

## Impacto por Fase

| Fase | Impacto no Negocio | Complexidade |
|------|-------------------|-------------|
| 0 - Correcoes | Alto (estabilidade) | Baixa |
| 1 - Financeiro | **Critico** (opera pagamentos) | Media |
| 2 - Marcas/Campanhas | **Alto** (onboarda marcas) | Media-Alta |
| 3 - Creators/Rede | Alto (gestao do core) | Media |
| 4 - Analytics/IA | Medio-Alto (decisoes) | Media |
| 5 - Operacional | Medio (escala) | Baixa-Media |
