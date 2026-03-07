# STORY-001: Onboarding e Analise de Perfil

## Status: IN_PROGRESS
## Prioridade: CRITICA (primeiro contato do creator)
## Squad: @dev + @ux-design-expert + @analyst

## Descricao
Implementar o fluxo de onboarding do creator: cadastro, questionario de perfil comportamental,
conexao de redes sociais e configuracao inicial. Esse fluxo define o primeiro contato do creator
com a plataforma e coleta dados para matching com marcas.

## Contexto de Negocio (Briefing)
- Jornada Dias 1-2: creator assiste aulas basicas e configura plataforma
- Questionario analisa perfil comportamental e gostos do creator
- Define tipo de marca ideal para o creator divulgar
- Dados ficam no banco para matching inteligente

## Criterios de Aceitacao
- [ ] Cadastro com email/senha ou login social (Google/Apple)
- [ ] Questionario de perfil: gostos, estilo, nicho preferido, experiencia previa
- [ ] Selecao de categorias de marca (Beleza, Suplementos, Casa, Tech, Moda, Alimentos)
- [ ] Conexao de Instagram (handle + metricas basicas)
- [ ] Conexao de TikTok (handle + metricas basicas)
- [ ] Dados salvos para matching com marcas
- [ ] Fluxo mobile-first com maximo 5 telas

## File List
- `packages/api/src/routes/auth.ts`
- `packages/api/src/routes/onboarding.ts`
- `packages/core/src/db/schema.ts` (tabelas users, creator_profiles)
- `packages/shared/src/types/onboarding.ts`

## Checklist
- [x] Schema de creator_profiles definido
- [x] Endpoint de cadastro (POST /auth/register)
- [x] Endpoint de login (POST /auth/login)
- [x] Endpoint de questionario (POST /onboarding/profile)
- [x] Endpoint de conexao de redes sociais (POST /onboarding/social)
- [x] Validacao de dados de entrada
- [ ] Testes unitarios
- [ ] Testes de integracao
- [ ] Conectar ao banco real
