import { describe, it, expect } from 'vitest';
import { processAllBonuses } from '../../packages/bonus-engine/src/processor.js';
import type { NetworkNode, SaleInput } from '../../packages/bonus-engine/src/types.js';

describe('processAllBonuses', () => {
  const sale: SaleInput = {
    saleId: 'sale-1',
    sellerId: 'seller',
    amount: 10000,
    productType: 'digital',
    qualifiedVolume: 10000,
  };

  it('calcula bonus direto + infinito + matching quando aplicavel', () => {
    const seller: NetworkNode = {
      userId: 'seller', levelName: 'Flow', sponsorId: 'sp1',
      isQualified: true, qualifiedVolume: 10000,
    };

    const sponsor: NetworkNode = {
      userId: 'sp1', levelName: 'Flow', sponsorId: 'sp2',
      isQualified: true, qualifiedVolume: 8000,
    };

    const nodes: Record<string, NetworkNode> = {
      seller,
      sp1: sponsor,
      sp2: {
        userId: 'sp2', levelName: 'Vision', sponsorId: null,
        isQualified: true, qualifiedVolume: 12000,
      },
    };

    const getUpline = (id: string) => {
      const node = nodes[id];
      return node?.sponsorId ? nodes[node.sponsorId] ?? null : null;
    };

    const results = processAllBonuses(sale, seller, sponsor, getUpline);

    // Deve ter: 1 direto + infinito bonuses + 1 matching (mesmo nivel)
    const types = results.map(r => r.type);
    expect(types).toContain('direct');
    expect(types).toContain('matching'); // seller Flow = sponsor Flow

    // Direto: Flow digital = 30% de 10000 = 3000
    const direct = results.find(r => r.type === 'direct');
    expect(direct!.amount).toBe(3000);

    // Matching: 1% de 10000 = 100
    const matching = results.find(r => r.type === 'matching');
    expect(matching!.amount).toBe(100);
  });

  it('nao gera matching quando niveis diferentes', () => {
    const seller: NetworkNode = {
      userId: 'seller', levelName: 'Seed', sponsorId: 'sp1',
      isQualified: true, qualifiedVolume: 5000,
    };

    const sponsor: NetworkNode = {
      userId: 'sp1', levelName: 'Vision', sponsorId: null,
      isQualified: true, qualifiedVolume: 10000,
    };

    const results = processAllBonuses(sale, seller, sponsor, () => null);

    const types = results.map(r => r.type);
    expect(types).toContain('direct');
    expect(types).not.toContain('matching');
  });

  it('funciona sem sponsor', () => {
    const seller: NetworkNode = {
      userId: 'seller', levelName: 'Flow', sponsorId: null,
      isQualified: true, qualifiedVolume: 10000,
    };

    const results = processAllBonuses(sale, seller, null, () => null);

    expect(results).toHaveLength(1); // apenas direto
    expect(results[0].type).toBe('direct');
    expect(results[0].amount).toBe(3000); // Flow digital 30%
  });

  it('processa produto fisico corretamente', () => {
    const physicalSale = { ...sale, productType: 'physical' as const };
    const seller: NetworkNode = {
      userId: 'seller', levelName: 'Infinity', sponsorId: null,
      isQualified: true, qualifiedVolume: 20000,
    };

    const results = processAllBonuses(physicalSale, seller, null, () => null);

    const direct = results.find(r => r.type === 'direct');
    expect(direct!.amount).toBe(2000); // Infinity physical 20%
  });
});
