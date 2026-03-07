# STORY-005: Dashboard de Metricas e Performance

## Status: TODO
## Prioridade: ALTA
## Squad: @dev + @data-engineer + @ux-design-expert

## Descricao
Dashboard completo do creator com metricas de producao, performance e redes sociais.
Inclui integracao com Instagram e TikTok para puxar metricas de engajamento.

## Contexto de Negocio (Briefing)
Tela "Dashboard Inicial": visao geral com marcas disponiveis, videos produzidos na semana,
taxa de aprovacao, ganho acumulado e notificacoes.

Tela "Metricas e Performance": views, engajamento, conversoes, insights automaticos,
comparativo semanal e mensal.

Metricas do dashboard:
- Quantidade de videos postados
- Taxa de aprovacao
- Engajamento por video (views, curtidas, comentarios, salvamentos)
- Conversao (vendas geradas por video)
- Ganhos detalhados (fixo + comissao)
- Insights automaticos (ex: "Seus videos tipo X performam 3x melhor")

## Criterios de Aceitacao
- [ ] Dashboard home: marcas ativas, videos da semana, taxa de aprovacao, ganho do mes
- [ ] Painel de metricas detalhado com filtro por periodo (dia, semana, mes)
- [ ] Integracao Instagram: followers, likes, comments, views por post
- [ ] Integracao TikTok: followers, likes, comments, views por video
- [ ] Ranking do creator vs media da plataforma
- [ ] Comparativo semanal/mensal (esta melhorando ou piorando?)
- [ ] Insights automaticos baseados em dados

## File List
- `packages/api/src/routes/dashboard.ts`
- `packages/api/src/routes/metrics.ts`
- `packages/core/src/services/metrics-aggregator.ts`
- `packages/core/src/services/social-integrations.ts`
- `packages/shared/src/types/metrics.ts`

## Checklist
- [ ] Endpoint GET /dashboard (visao geral)
- [ ] Endpoint GET /metrics (detalhado com filtros)
- [ ] Servico de agregacao de metricas internas
- [ ] Integracao Instagram API (Basic Display / Graph API)
- [ ] Integracao TikTok API (Display API)
- [ ] Logica de insights automaticos
- [ ] Testes
