# STORY-004: Upload de Videos e Validacao de Qualidade

## Status: TODO
## Prioridade: CRITICA (fluxo de pagamento depende disso)
## Squad: @dev + @qa + @analyst

## Descricao
Implementar o fluxo de upload de video, validacao automatica de qualidade,
aprovacao/rejeicao por admin/marca e calculo de pagamento ao creator.
Este e o fluxo mais critico do MVP — e dele que sai o pagamento de R$100/dia.

## Contexto de Negocio (Briefing)
- Creator grava 10 videos/dia seguindo roteiro (1 hora de gravacao)
- IA edita em 30 segundos (corta pausas, adiciona legendas, auto-crop)
- Creator envia para aprovacao
- Marca aprova ou envia feedback especifico para ajuste
- 94% de taxa de aprovacao seguindo o padrao
- R$100 liberado na conta (24h apos aprovacao)
- R$10 por video aprovado, maximo 10 por dia = R$100/dia

## Criterios de Aceitacao
- [ ] Upload de video com associacao a marca e briefing
- [ ] Validacao: video associado a briefing ativo, formato valido, duracao minima
- [ ] Status do video: pending -> approved/rejected
- [ ] Rejeicao com motivo especifico (feedback para o creator ajustar)
- [ ] Resubmissao de video rejeitado
- [ ] Calculo automatico: R$10 por video aprovado
- [ ] Limite: maximo 10 videos pagos por dia por creator
- [ ] Dashboard: contagem de videos por status por dia
- [ ] Prazo de aprovacao: 24-48h visivel para o creator
- [ ] Admin: tela de revisao de videos em fila

## File List
- `packages/api/src/routes/videos.ts`
- `packages/core/src/services/video-validator.ts`
- `packages/core/src/services/video-payment.ts`
- `packages/core/src/db/schema.ts` (tabela videos)
- `packages/shared/src/types/video.ts`

## Checklist
- [ ] Schema de videos com todos os campos necessarios
- [ ] POST /videos (upload com marca + briefing)
- [ ] GET /videos (lista do creator com filtros: status, data, marca)
- [ ] PATCH /videos/:id/review (admin aprova/rejeita com motivo)
- [ ] POST /videos/:id/resubmit (creator reenvia)
- [ ] Servico de validacao de qualidade
- [ ] Servico de calculo de pagamento (R$10/video, max 10/dia)
- [ ] Testes unitarios (validacao, pagamento, limites)
- [ ] Testes de integracao
