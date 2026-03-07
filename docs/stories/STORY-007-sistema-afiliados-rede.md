# STORY-007: Sistema de Afiliados e Indicacao em Rede

## Status: TODO
## Prioridade: ALTA
## Squad: @dev + @architect + @analyst + @qa

## Descricao
Implementar o sistema de indicacao de creators em rede. Cada creator pode indicar
novos creators e ganhar comissao em rede sobre a producao/vendas deles.
Inclui a engine de bonus (direto, infinito, equiparacao, global).

## Contexto de Negocio (MVP + Plano de Compensacao)
- Creator indica outros creators e ganha em rede
- Produtos digitais (formacao): comissao direta ate 50%, rede total 10%
- Produtos fisicos (marcas): comissao direta ate 20%, rede total 7%
- Niveis de carreira: Seed, Spark, Flow, Iconic, Vision, Empire, Infinity
- Link de indicacao unico por creator
- Bonus: Direto, Infinito (unilevel com compressao), Equiparacao (1%), Global (1% pool)

## Criterios de Aceitacao
- [ ] Link de indicacao unico por creator (gerar e copiar)
- [ ] Arvore de rede visivel (meus diretos, rede expandida)
- [ ] Niveis de carreira com requisitos claros (QV, diretos ativos, PML)
- [ ] Qualificacao automatica mensal
- [ ] Calculo de bonus direto por venda
- [ ] Calculo de bonus infinito com compressao dinamica
- [ ] Calculo de bonus equiparacao (1%)
- [ ] Pool global mensal para Empire + Infinity
- [ ] Painel de rede: total de indicados, ativos, volume da rede

## File List
- `packages/bonus-engine/src/` (todos os calculadores)
- `packages/api/src/routes/network.ts`
- `packages/api/src/routes/referral.ts`
- `packages/core/src/services/qualification.ts`
- `packages/core/src/db/schema.ts` (tabelas lines, qualifications, bonuses, global_pools)

## Checklist
- [ ] Endpoint GET /referral/link (link unico de indicacao)
- [ ] Endpoint GET /network/tree (arvore de rede)
- [ ] Endpoint GET /network/stats (volume, ativos, nivel)
- [ ] Servico de qualificacao mensal automatica
- [ ] Bonus engine: direto, infinito, equiparacao, global
- [ ] Testes unitarios da engine com cenarios complexos
- [ ] Testes de integracao da rede completa
