# STORY-008: Formacao e Area de Membro

## Status: TODO
## Prioridade: MEDIA (pode comecar com conteudo externo)
## Squad: @dev + @ux-design-expert

## Descricao
Area de membro com modulos de formacao do creator: video-aulas, progresso,
certificados e conteudo complementar. Sistema SCALE de formacao profissional.

## Contexto de Negocio (Briefing)
Formacao transforma qualquer pessoa em creator profissional em ate 3 semanas:
- Modulo 1: Fundamentos de Creator (Semana 1) — comunicacao, estrutura UGC, psicologia da conversao
- Modulo 2: Producao Acelerada (Semana 1-2) — tecnica 3x3x2, roteiros, edicao IA
- Modulo 3: Brand Pessoal (Semana 2-3) — marca pessoal, crescimento organico

Tela "Formacao": modulos de video-aulas, progresso, certificados, conteudo complementar.

## Criterios de Aceitacao
- [ ] Lista de modulos com aulas (titulo, descricao, duracao, video)
- [ ] Player de video integrado
- [ ] Progresso por modulo e geral (% concluido)
- [ ] Marcacao de aula como concluida
- [ ] Pre-requisitos entre modulos (Modulo 2 requer Modulo 1)
- [ ] Certificado ao concluir todos os modulos
- [ ] Conteudo complementar (materiais de apoio, PDFs)

## File List
- `packages/api/src/routes/courses.ts`
- `packages/core/src/db/schema.ts` (tabelas courses, modules, lessons, progress)
- `packages/shared/src/types/course.ts`

## Checklist
- [ ] Schema de courses, modules, lessons, user_progress
- [ ] GET /courses (lista de modulos)
- [ ] GET /courses/:id/lessons (aulas do modulo)
- [ ] POST /courses/lessons/:id/complete (marcar concluida)
- [ ] GET /courses/progress (progresso geral)
- [ ] Admin: CRUD de cursos, modulos, aulas
- [ ] Testes
