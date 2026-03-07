# Constitution - Brandly AIOS

## Missao
Construir a plataforma Brandly seguindo principios de qualidade, observabilidade e entrega incremental.

## Principios Fundamentais

### 1. CLI First -> Observability Second -> UI Third
- Toda funcionalidade DEVE ser implementavel e testavel via CLI antes de qualquer interface grafica
- Logs estruturados e metricas sao prioridade sobre dashboards visuais
- UI e a camada final, construida sobre APIs solidas

### 2. Story-Driven Development
- Todo trabalho e rastreado por stories em `docs/stories/`
- Nenhum codigo e escrito sem uma story associada
- Cada story tem checklist, file list e criterios de aceitacao

### 3. Quality Gates Obrigatorios
- `npm run lint` — zero warnings
- `npm run typecheck` — zero errors
- `npm test` — 100% passing
- Code review via agente antes de merge

### 4. Arquitetura de Pacotes
- Monorepo com workspaces npm
- Cada dominio e um pacote independente em `packages/`
- Dependencias explicitas entre pacotes

### 5. Seguranca por Design
- Nunca commitar secrets (.env, credentials)
- Validacao em boundaries do sistema (input de usuario, APIs externas)
- Sanitizacao de dados em todas as interfaces publicas

### 6. Documentacao Viva
- Codigo autodocumentado com tipos TypeScript
- Stories como documentacao de decisoes
- AGENTS.md e CLAUDE.md sempre atualizados

## Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ / TypeScript 5.5+ |
| API | Fastify |
| Banco de Dados | PostgreSQL + Drizzle ORM |
| Cache | Redis |
| Fila | BullMQ |
| Testes | Vitest |
| Lint | ESLint 9 + Prettier |
| Build | Turbo (monorepo) |
| Mobile | React Native / Expo |
| Deploy | Docker + Railway/Fly.io |

## Modelo de Negocio (fonte: Briefing Estrategico)

A Brandly e o primeiro ecossistema brasileiro de UGC Creators que conecta creators
a marcas pre-contratadas, oferecendo renda garantida por producao de conteudo.

**Fluxo core**: Creator cadastra -> escolhe marca -> recebe briefing -> grava 10 videos/dia
-> envia para aprovacao -> recebe R$10/video aprovado (max R$100/dia) -> comissoes extras por vendas.

**Pilares**: Formacao + Tecnologia IA + Marcas Pre-Contratadas + Comunidade + Progressao de Carreira.

## Entidades de Dominio (Schema)

- **Users** — creators, admins, marcas
- **CreatorProfiles** — perfil comportamental, categorias preferidas, experiencia
- **Levels** — niveis de carreira (Seed..Infinity)
- **Brands** — marcas parceiras (50+, 6 categorias)
- **Briefings** — briefings de producao por marca (tom, do/dont, exemplos)
- **CreatorBrands** — vinculo creator-marca
- **Products** — produtos fisicos e digitais das marcas
- **TrackingLinks** — links/cupons de rastreio por creator/produto
- **Sales** — transacoes de venda rastreadas
- **Videos** — videos produzidos (pending/approved/rejected, R$10/aprovado)
- **Payments** — pagamentos ao creator (video, comissao, bonus)
- **Withdrawals** — solicitacoes de saque
- **Scripts** — roteiros gerados por IA (gancho + corpo + CTA)
- **Lines** — arvore de rede (upline/downline)
- **Qualifications** — QV, diretos ativos, PML
- **Bonuses** — bonus direto, infinito, equiparacao, global
- **GlobalPools** — pool mensal de bonus global
- **Courses/Lessons/UserProgress** — formacao e area de membro
- **LiveEvents/SuccessCases** — comunidade

## Roadmap do MVP

Ver `docs/roadmap.md` e `docs/adrs/ADR-001-mvp-scope.md`.

**Sprint 1** (Fundacao): Onboarding + Videos + Financeiro
**Sprint 2** (Core): Marcas + Roteiros IA + Metricas
**Sprint 3** (Crescimento): Rede + Formacao + Comunidade
