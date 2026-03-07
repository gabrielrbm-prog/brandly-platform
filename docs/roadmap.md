# Roadmap de Desenvolvimento — MVP Brandly

## Visao Geral
9 stories organizadas em 3 sprints por criticidade.
Fluxo minimo viavel: **Cadastro -> Video -> Pagamento**

---

## Sprint 1 — Fundacao (CRITICO)
Loop minimo para rodar com creators reais.

| Story | Modulo | Prioridade | Squad |
|-------|--------|------------|-------|
| STORY-001 | Onboarding e Perfil | CRITICA | @dev + @ux-design-expert + @analyst |
| STORY-004 | Upload e Validacao de Video | CRITICA | @dev + @qa + @analyst |
| STORY-006 | Financeiro e Pagamentos | CRITICA | @dev + @architect + @analyst |

**Entregavel**: Creator cadastra, sobe video, recebe aprovacao, ve pagamento.

---

## Sprint 2 — Expansao do Core
Escala a producao com marcas, IA e metricas.

| Story | Modulo | Prioridade | Squad |
|-------|--------|------------|-------|
| STORY-002 | Catalogo de Marcas | CRITICA | @dev + @architect + @analyst |
| STORY-003 | Roteiros IA | ALTA | @dev + @architect + @data-engineer |
| STORY-005 | Metricas e Performance | ALTA | @dev + @data-engineer + @ux-design-expert |

**Entregavel**: Creator escolhe marca, recebe briefing, gera roteiro com IA, ve metricas.

---

## Sprint 3 — Crescimento
Motor de rede, formacao e comunidade.

| Story | Modulo | Prioridade | Squad |
|-------|--------|------------|-------|
| STORY-007 | Afiliados e Rede | ALTA | @dev + @architect + @analyst + @qa |
| STORY-008 | Formacao / Area de Membro | MEDIA | @dev + @ux-design-expert |
| STORY-009 | Comunidade e Ranking | MEDIA | @dev + @ux-design-expert |

**Entregavel**: Link de indicacao, arvore de rede, bonus engine, video-aulas, ranking.

---

## Telas do App (mapeamento Briefing -> Stories)

| Tela (Briefing 3.7) | Story |
|----------------------|-------|
| Dashboard Inicial | STORY-005 |
| Catalogo de Marcas | STORY-002 |
| Roteiros IA | STORY-003 |
| Upload e Edicao IA | STORY-004 |
| Metricas e Performance | STORY-005 |
| Financeiro | STORY-006 |
| Formacao | STORY-008 |
| Comunidade | STORY-009 |

## Dependencias entre Stories
```
STORY-001 (Onboarding)
    |
    v
STORY-004 (Videos) --> STORY-006 (Financeiro)
    |
    v
STORY-002 (Marcas) --> STORY-003 (Roteiros IA)
    |
    v
STORY-005 (Metricas)
    |
    v
STORY-007 (Rede) --> precisa de STORY-006
    |
    v
STORY-008 (Formacao) + STORY-009 (Comunidade) [independentes]
```
