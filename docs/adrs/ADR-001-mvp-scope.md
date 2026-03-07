# ADR-001: Escopo do MVP Brandly

## Status: ACCEPTED
## Data: 2026-03-06
## Autor: @architect + @pm

## Contexto
A Brandly precisa de um MVP funcional para rodar o primeiro ciclo de captacao de creators.
O funil de vendas (webinario "Profissao Creator") ja esta pronto. Precisamos da plataforma
que entrega o que foi prometido: producao de videos com pagamento garantido.

## Decisao
O MVP sera composto por 9 modulos, priorizados pela criticidade para o fluxo do creator:

### Sprint 1 — Fundacao (CRITICO)
- **STORY-001**: Onboarding e Analise de Perfil
- **STORY-004**: Upload de Videos e Validacao de Qualidade
- **STORY-006**: Painel Financeiro e Pagamentos

Justificativa: O creator precisa entrar, produzir videos e ver o dinheiro. Esse e o
loop minimo viavel: cadastro -> video -> pagamento.

### Sprint 2 — Expansao do Core
- **STORY-002**: Catalogo de Marcas e Briefings
- **STORY-003**: Roteiros IA e Geracao de Conteudo
- **STORY-005**: Dashboard de Metricas e Performance

Justificativa: Marca e briefing tornam a producao escalavel. IA de roteiros acelera
o creator. Metricas dao visibilidade.

### Sprint 3 — Crescimento
- **STORY-007**: Sistema de Afiliados e Indicacao em Rede
- **STORY-008**: Formacao e Area de Membro
- **STORY-009**: Comunidade e Ranking

Justificativa: Rede de indicacao e o motor de crescimento. Formacao e comunidade
aumentam retencao e LTV.

## Consequencias
- Sprint 1 permite rodar o MVP com creators reais
- Marcas sao cadastradas manualmente no inicio (admin)
- Roteiros sao manuais ate Sprint 2 (IA de roteiros)
- Sistema de rede/bonus fica para Sprint 3

## Metricas de Sucesso
- 100 creators cadastrados no primeiro mes
- 70%+ de taxa de retencao na semana 2
- 94%+ de taxa de aprovacao de videos
- R$100/dia efetivamente pago a creators ativos
