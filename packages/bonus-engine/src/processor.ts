import type { BonusResult, NetworkNode, SaleInput } from './types.js';
import { calculateDirectBonus } from './calculators/direct-bonus.js';
import { calculateInfiniteBonus } from './calculators/infinite-bonus.js';
import { calculateMatchingBonus } from './calculators/matching-bonus.js';

/**
 * Processa todos os bonus para uma venda individual.
 * O pool global e processado separadamente (mensal).
 */
export function processAllBonuses(
  sale: SaleInput,
  seller: NetworkNode,
  sponsor: NetworkNode | null,
  getUpline: (userId: string) => NetworkNode | null,
): BonusResult[] {
  const results: BonusResult[] = [];

  // 1. Bonus Direto
  const direct = calculateDirectBonus(sale, seller);
  if (direct) results.push(direct);

  // 2. Bonus Infinito (unilevel com compressao)
  const infinite = calculateInfiniteBonus(sale, seller, getUpline);
  results.push(...infinite);

  // 3. Bonus Equiparacao
  const matching = calculateMatchingBonus(sale, seller, sponsor);
  if (matching) results.push(matching);

  return results;
}
