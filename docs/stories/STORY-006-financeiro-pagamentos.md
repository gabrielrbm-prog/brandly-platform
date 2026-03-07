# STORY-006: Painel Financeiro e Pagamentos

## Status: IN_PROGRESS
## Prioridade: CRITICA (creator precisa ver quanto ganha)
## Squad: @dev + @architect + @analyst

## Descricao
Painel financeiro completo do creator: ganhos fixos (por video), ganhos variaveis (comissoes),
historico de pagamentos, status de aprovacao e funcao de saque.

## Contexto de Negocio (Briefing)
Tela "Financeiro": ganhos fixos e variaveis detalhados, historico de pagamentos,
status de aprovacao, funcao de saque.

Estrutura de ganhos:
- Fixo: R$10/video aprovado (max 10/dia = R$100/dia = R$3.000/mes)
- Variavel: comissao sobre vendas geradas por video
- Bonus de rede: comissao por indicacao de novos creators (sistema de afiliados)

## Criterios de Aceitacao
- [ ] Painel com saldo disponivel para saque
- [ ] Detalhamento: ganhos fixos (videos) vs ganhos variaveis (comissoes) vs bonus de rede
- [ ] Historico de pagamentos por periodo (dia, semana, mes)
- [ ] Status de cada pagamento (pendente, aprovado, pago, sacado)
- [ ] Extrato diario mostrando cada video aprovado e valor
- [ ] Funcao de saque (solicitar transferencia)
- [ ] Link de rastreio de venda / cupom do creator por produto
- [ ] Comissao por venda com rastreamento por link/cupom

## File List
- `packages/api/src/routes/financial.ts`
- `packages/core/src/services/payment-processor.ts`
- `packages/core/src/db/schema.ts` (tabelas payments, withdrawals, commissions)
- `packages/shared/src/types/financial.ts`

## Checklist
- [ ] Schema de payments, withdrawals, commissions
- [ ] GET /financial/balance (saldo atual)
- [ ] GET /financial/earnings (detalhamento fixo + variavel + rede)
- [ ] GET /financial/history (historico com filtros)
- [ ] POST /financial/withdraw (solicitar saque)
- [ ] GET /financial/tracking-links (links/cupons por produto)
- [ ] Servico de processamento de pagamento por video
- [ ] Servico de rastreamento de comissoes por link/cupom
- [ ] Testes
