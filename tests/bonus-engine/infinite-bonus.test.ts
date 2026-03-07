import { describe, it, expect } from 'vitest';
import { calculateInfiniteBonus } from '../../packages/bonus-engine/src/calculators/infinite-bonus.js';
import type { NetworkNode, SaleInput } from '../../packages/bonus-engine/src/types.js';

describe('calculateInfiniteBonus', () => {
  const sale: SaleInput = {
    saleId: 'sale-1',
    sellerId: 'seller',
    amount: 10000,
    productType: 'digital',
    qualifiedVolume: 10000,
  };

  it('paga diferenca de nivel na upline', () => {
    // Seller (Seed) -> Sponsor1 (Flow, 2%) -> Sponsor2 (Vision, 5%)
    const nodes: Record<string, NetworkNode> = {
      seller: { userId: 'seller', levelName: 'Seed', sponsorId: 'sp1', isQualified: true, qualifiedVolume: 10000 },
      sp1: { userId: 'sp1', levelName: 'Flow', sponsorId: 'sp2', isQualified: true, qualifiedVolume: 5000 },
      sp2: { userId: 'sp2', levelName: 'Vision', sponsorId: null, isQualified: true, qualifiedVolume: 8000 },
    };

    const getUpline = (id: string) => {
      const node = nodes[id];
      return node?.sponsorId ? nodes[node.sponsorId] ?? null : null;
    };

    const results = calculateInfiniteBonus(sale, nodes['seller'], getUpline);

    expect(results).toHaveLength(2);
    // sp1 (Flow): 2% - 0% = 2% de 10000 = 200
    expect(results[0].userId).toBe('sp1');
    expect(results[0].amount).toBe(200);
    // sp2 (Vision): 5% - 2% = 3% de 10000 = 300
    expect(results[1].userId).toBe('sp2');
    expect(results[1].amount).toBe(300);
  });

  it('comprime membros nao qualificados', () => {
    const nodes: Record<string, NetworkNode> = {
      seller: { userId: 'seller', levelName: 'Seed', sponsorId: 'sp1', isQualified: true, qualifiedVolume: 10000 },
      sp1: { userId: 'sp1', levelName: 'Flow', sponsorId: 'sp2', isQualified: false, qualifiedVolume: 0 },
      sp2: { userId: 'sp2', levelName: 'Vision', sponsorId: null, isQualified: true, qualifiedVolume: 8000 },
    };

    const getUpline = (id: string) => {
      const node = nodes[id];
      return node?.sponsorId ? nodes[node.sponsorId] ?? null : null;
    };

    const results = calculateInfiniteBonus(sale, nodes['seller'], getUpline);

    // sp1 e pulado (nao qualificado), sp2 pega os 5% inteiros
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('sp2');
    expect(results[0].amount).toBe(500); // 5% de 10000
  });

  it('retorna vazio se nao ha upline', () => {
    const seller: NetworkNode = {
      userId: 'seller', levelName: 'Seed', sponsorId: null, isQualified: true, qualifiedVolume: 10000,
    };

    const results = calculateInfiniteBonus(sale, seller, () => null);
    expect(results).toHaveLength(0);
  });
});
