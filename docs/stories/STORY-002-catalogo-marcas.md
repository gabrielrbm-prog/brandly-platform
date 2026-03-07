# STORY-002: Catalogo de Marcas e Briefings

## Status: TODO
## Prioridade: CRITICA (core do MVP)
## Squad: @dev + @architect + @analyst

## Descricao
Implementar o catalogo de marcas parceiras com briefings completos. O creator acessa
a lista de marcas disponiveis, filtra por categoria, ve o briefing detalhado e se conecta
para comecar a produzir conteudo.

## Contexto de Negocio (Briefing)
- 50+ marcas oficialmente parceiras (meta: 100+)
- Briefings prontos e completos (marca diz exatamente o que quer)
- Categorias: Beleza/Skincare, Suplementos/Fitness, Casa/Decoracao, Tech/Gadgets, Moda/Acessorios, Alimentos/Bebidas
- Pagamento garantido via Brandly (creator nao depende da marca pagar diretamente)
- Fluxo: Creator acessa plataforma -> ve lista de marcas -> escolhe marca -> recebe briefing -> grava

## Criterios de Aceitacao
- [ ] Lista de marcas com nome, logo, categoria, descricao, estimativa de comissao
- [ ] Filtro por categoria (6 categorias)
- [ ] Status de disponibilidade da marca (vagas abertas/fechadas)
- [ ] Briefing completo ao clicar na marca (o que gravar, tom, exemplos, padrao tecnico)
- [ ] Botao "Conectar com Marca" para o creator se vincular
- [ ] Admin: CRUD completo de marcas e briefings
- [ ] Contrato minimo de X videos/mes por marca visivel

## File List
- `packages/api/src/routes/brands.ts`
- `packages/core/src/db/schema.ts` (tabelas brands, briefings, creator_brands)
- `packages/shared/src/types/brand.ts`

## Checklist
- [ ] Schema de brands, briefings, creator_brands
- [ ] GET /brands (lista com filtros)
- [ ] GET /brands/:id (detalhes + briefing)
- [ ] POST /brands/:id/connect (creator se vincula)
- [ ] Admin: CRUD de marcas
- [ ] Admin: CRUD de briefings
- [ ] Testes
