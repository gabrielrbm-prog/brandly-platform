# STORY-009: Comunidade e Ranking

## Status: TODO
## Prioridade: MEDIA
## Squad: @dev + @ux-design-expert

## Descricao
Modulo de comunidade com ranking de creators, agenda de lives, cases de sucesso
e gamificacao interna.

## Contexto de Negocio (Briefing)
Tela "Comunidade": acesso ao grupo, agenda de lives, ranking de creators, cases de sucesso.
- Lives diarias com instrutoras
- Grupo exclusivo (847+ creators)
- Ranking por producao e performance
- Gamificacao entre creators

## Criterios de Aceitacao
- [ ] Ranking de creators por producao (videos aprovados no mes)
- [ ] Ranking por ganhos (fixo + comissao)
- [ ] Agenda de lives com horarios e instrutora
- [ ] Feed de cases de sucesso (historias de creators)
- [ ] Nivel/badge do creator (baseado em carreira: Seed..Infinity)
- [ ] Notificacoes de lives proximas

## File List
- `packages/api/src/routes/community.ts`
- `packages/core/src/services/ranking.ts`
- `packages/shared/src/types/community.ts`

## Checklist
- [ ] Endpoint GET /community/ranking (com filtros: periodo, tipo)
- [ ] Endpoint GET /community/lives (agenda)
- [ ] Endpoint GET /community/cases (historias de sucesso)
- [ ] Servico de calculo de ranking
- [ ] Admin: CRUD de lives e cases
- [ ] Testes
