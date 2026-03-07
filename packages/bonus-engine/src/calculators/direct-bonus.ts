import { DIRECT_COMMISSION } from '@brandly/shared';
import type { BonusResult, NetworkNode, SaleInput } from '../types.js';

/**
 * Bonus Direto: valor_venda * percent_direto[nivel_seller][tipo_produto]
 */
export function calculateDirectBonus(
  sale: SaleInput,
  seller: NetworkNode,
): BonusResult | null {
  const commission = DIRECT_COMMISSION[seller.levelName];
  const percent = sale.productType === 'digital'
    ? commission.digital
    : commission.physical;

  const amount = (sale.amount * percent) / 100;

  if (amount <= 0) return null;

  return {
    userId: seller.userId,
    saleId: sale.saleId,
    type: 'direct',
    amount,
    details: `Direto ${percent}% sobre R$${sale.amount.toFixed(2)}`,
  };
}
