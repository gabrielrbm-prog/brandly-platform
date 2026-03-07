import { INFINITE_BONUS, LEVEL_ORDER } from '@brandly/shared';
import type { BonusResult, NetworkNode, SaleInput } from '../types.js';

/**
 * Bonus Infinito (Unilevel com compressao dinamica):
 * Percorre a upline a partir do vendedor.
 * Paga a diferenca entre o percentual do membro atual e o ultimo membro pago.
 * Pula membros nao qualificados (compressao).
 */
export function calculateInfiniteBonus(
  sale: SaleInput,
  seller: NetworkNode,
  getUpline: (userId: string) => NetworkNode | null,
): BonusResult[] {
  const results: BonusResult[] = [];
  const productKey = sale.productType === 'digital' ? 'digital' : 'physical';

  let lastPaidPercent = 0;
  let current = getUpline(seller.userId);

  while (current !== null) {
    if (!current.isQualified) {
      // Compressao: pula membro nao qualificado
      current = getUpline(current.userId);
      continue;
    }

    const currentPercent = INFINITE_BONUS[current.levelName][productKey];
    const diff = currentPercent - lastPaidPercent;

    if (diff > 0) {
      const amount = (sale.amount * diff) / 100;
      results.push({
        userId: current.userId,
        saleId: sale.saleId,
        type: 'infinite',
        amount,
        details: `Infinito ${diff}% (nivel ${current.levelName}, diff de ${lastPaidPercent}%)`,
      });
      lastPaidPercent = currentPercent;
    }

    // Se ja atingiu o maximo, para
    const maxLevel = LEVEL_ORDER[LEVEL_ORDER.length - 1];
    if (currentPercent >= INFINITE_BONUS[maxLevel][productKey]) {
      break;
    }

    current = getUpline(current.userId);
  }

  return results;
}
