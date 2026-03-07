import { GLOBAL_BONUS_PERCENT, GLOBAL_POOL_ELIGIBLE } from '@brandly/shared';
import type { BonusResult, NetworkNode } from '../types.js';

interface PoolInput {
  totalSalesVolume: number;
  period: string;
  eligibleMembers: NetworkNode[];
}

/**
 * Bonus Global (1%):
 * Pool mensal distribuido entre Empire + Infinity
 * proporcionalmente por pontos (qualifiedVolume).
 */
export function calculateGlobalPool(input: PoolInput): BonusResult[] {
  const poolAmount = (input.totalSalesVolume * GLOBAL_BONUS_PERCENT) / 100;

  const eligible = input.eligibleMembers.filter(
    (m) => m.isQualified && GLOBAL_POOL_ELIGIBLE.includes(m.levelName),
  );

  if (eligible.length === 0 || poolAmount <= 0) return [];

  const totalPoints = eligible.reduce((sum, m) => sum + m.qualifiedVolume, 0);

  if (totalPoints <= 0) return [];

  return eligible.map((member) => ({
    userId: member.userId,
    saleId: `pool-${input.period}`,
    type: 'global' as const,
    amount: (member.qualifiedVolume / totalPoints) * poolAmount,
    details: `Global pool ${input.period}: ${member.qualifiedVolume}/${totalPoints} pontos`,
  }));
}
