# STORY-003: Roteiros IA e Geracao de Conteudo

## Status: TODO
## Prioridade: ALTA
## Squad: @dev + @architect + @data-engineer

## Descricao
Implementar o sistema de geracao de roteiros com IA. A partir do briefing da marca,
o sistema gera combinacoes de ganchos, corpos e CTAs. Tecnica 3x3x2 = 18 combinacoes
unicas por briefing base.

## Contexto de Negocio (Briefing)
- Banco de roteiros validados (ja testados, ja aprovaram com marcas)
- Gerador de variacoes automaticas
- Sugestoes de gancho baseado em trending topics
- Tecnica 3x3x2: 3 ganchos x 3 corpos x 2 CTAs = 18 combinacoes
- Resultado: creator so le e grava

## Criterios de Aceitacao
- [ ] Gerar roteiros a partir de briefing da marca (gancho + corpo + CTA)
- [ ] Tecnica 3x3x2: combinar 3 ganchos x 3 corpos x 2 CTAs = 18 variacoes
- [ ] Biblioteca historica de roteiros usados
- [ ] Botao de "gerar novas variacoes"
- [ ] Roteiros prontos para ler (formatacao clara, sem jargao tecnico)
- [ ] Integracao com API de LLM (Claude/OpenAI) para geracao
- [ ] Cache de roteiros gerados (nao regenerar desnecessariamente)

## File List
- `packages/api/src/routes/scripts.ts`
- `packages/core/src/services/script-generator.ts`
- `packages/shared/src/types/script.ts`
- `packages/core/src/db/schema.ts` (tabelas scripts, script_templates)

## Checklist
- [ ] Schema de scripts e templates
- [ ] POST /scripts/generate (gerar a partir de briefing)
- [ ] GET /scripts (biblioteca do creator)
- [ ] GET /scripts/:id (detalhes do roteiro)
- [ ] Integracao com LLM API
- [ ] Logica de combinacao 3x3x2
- [ ] Testes
