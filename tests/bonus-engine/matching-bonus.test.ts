import { describe, it, expect } from 'vitest';
import { calculateMatchingBonus } from '../../packages/bonus-engine/src/calculators/matching-bonus.js';
import type { NetworkNode, SaleInput } from '../../packages/bonus-engine/src/types.js';

describe('calculateMatchingBonus', () => {
  const sale: SaleInput = {
    saleId: 'sale-1',
    sellerId: 'seller',
    amount: 10000,
    productType: 'digital',
    qualifiedVolume: 10000,
  };

  const makeSeller = (overrides?: Partial<NetworkNode>): NetworkNode => ({
    userId: 'seller',
    levelName: 'Flow',
    sponsorId: 'sponsor',
    isQualified: true,
    qualifiedVolume: 5000,
    ...overrides,
  });

  const makeSponsor = (overrides?: Partial<NetworkNode>): NetworkNode => ({
    userId: 'sponsor',
    levelName: 'Flow',
    sponsorId: null,
    isQualified: true,
    qualifiedVolume: 8000,
    ...overrides,
  });

  it('paga 1% quando direto atinge mesmo nivel do sponsor', () => {
    const result = calculateMatchingBonus(sale, makeSeller(), makeSponsor());
    expect(result).not.toBeNull();
    expect(result!.type).toBe('matching');
    expect(result!.amount).toBe(100); // 10000 * 1%
    expect(result!.userId).toBe('sponsor');
  });

  it('NAO paga quando niveis sao diferentes', () => {
    const result = calculateMatchingBonus(
      sale,
      makeSeller({ levelName: 'Seed' }),
      makeSponsor({ levelName: 'Flow' }),
    );
    expect(result).toBeNull();
  });

  it('NAO paga quando sponsor nao esta qualificado', () => {
    const result = calculateMatchingBonus(
      sale,
      makeSeller(),
      makeSponsor({ isQualified: false }),
    );
    expect(result).toBeNull();
  });

  it('NAO paga quando nao ha sponsor', () => {
    const result = calculateMatchingBonus(sale, makeSeller(), null);
    expect(result).toBeNull();
  });

  it('funciona para produto fisico', () => {
    const physicalSale = { ...sale, productType: 'physical' as const, amount: 5000 };
    const result = calculateMatchingBonus(physicalSale, makeSeller(), makeSponsor());
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(50); // 5000 * 1%
  });

  it('funciona para niveis altos (Empire = Empire)', () => {
    const result = calculateMatchingBonus(
      sale,
      makeSeller({ levelName: 'Empire' }),
      makeSponsor({ levelName: 'Empire' }),
    );
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(100);
  });
});
