import { MATCHING_BONUS_PERCENT } from '@brandly/shared';
import type { BonusResult, NetworkNode, SaleInput } from '../types.js';

/**
 * Bonus Equiparacao (1%):
 * Quando um direto alcanca o mesmo nivel do patrocinador,
 * o patrocinador ganha 1% sobre o volume daquela linha.
 */
export function calculateMatchingBonus(
  sale: SaleInput,
  seller: NetworkNode,
  sponsor: NetworkNode | null,
): BonusResult | null {
  if (!sponsor || !sponsor.isQualified) return null;

  // Equiparacao: direto no mesmo nivel ou acima do sponsor
  if (seller.levelName === sponsor.levelName) {
    const amount = (sale.amount * MATCHING_BONUS_PERCENT) / 100;
    if (amount <= 0) return null;

    return {
      userId: sponsor.userId,
      saleId: sale.saleId,
      type: 'matching',
      amount,
      details: `Equiparacao ${MATCHING_BONUS_PERCENT}% — direto ${seller.userId} no mesmo nivel`,
    };
  }

  return null;
}
