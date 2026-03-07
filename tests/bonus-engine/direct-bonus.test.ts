import { describe, it, expect } from 'vitest';
import { calculateDirectBonus } from '../../packages/bonus-engine/src/calculators/direct-bonus.js';
import type { NetworkNode, SaleInput } from '../../packages/bonus-engine/src/types.js';

describe('calculateDirectBonus', () => {
  const makeSale = (overrides?: Partial<SaleInput>): SaleInput => ({
    saleId: 'sale-1',
    sellerId: 'user-1',
    amount: 1000,
    productType: 'digital',
    qualifiedVolume: 1000,
    ...overrides,
  });

  const makeSeller = (overrides?: Partial<NetworkNode>): NetworkNode => ({
    userId: 'user-1',
    levelName: 'Seed',
    sponsorId: null,
    isQualified: true,
    qualifiedVolume: 1000,
    ...overrides,
  });

  it('calcula bonus direto para Seed digital (20%)', () => {
    const result = calculateDirectBonus(makeSale(), makeSeller());
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(200); // 1000 * 20%
    expect(result!.type).toBe('direct');
  });

  it('calcula bonus direto para Infinity digital (50%)', () => {
    const result = calculateDirectBonus(
      makeSale(),
      makeSeller({ levelName: 'Infinity' }),
    );
    expect(result!.amount).toBe(500); // 1000 * 50%
  });

  it('calcula bonus direto para produto fisico', () => {
    const result = calculateDirectBonus(
      makeSale({ productType: 'physical' }),
      makeSeller({ levelName: 'Flow' }),
    );
    expect(result!.amount).toBe(100); // 1000 * 10%
  });

  it('calcula bonus para Infinity fisico (20%)', () => {
    const result = calculateDirectBonus(
      makeSale({ productType: 'physical' }),
      makeSeller({ levelName: 'Infinity' }),
    );
    expect(result!.amount).toBe(200); // 1000 * 20%
  });
});
