import { describe, it, expect } from 'vitest';
import { calculateGlobalPool } from '../../packages/bonus-engine/src/calculators/global-pool.js';
import type { NetworkNode } from '../../packages/bonus-engine/src/types.js';

// Testa a logica de distribuicao do global pool (sem banco)
describe('Global Pool Distribution Logic', () => {
  const makeNode = (
    userId: string,
    levelName: string,
    qv: number,
    qualified = true,
  ): NetworkNode => ({
    userId,
    sponsorId: null,
    levelName: levelName as any,
    qualifiedVolume: qv,
    isQualified: qualified,
  });

  it('distribui 1% do volume total entre elegiveis', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 100000,
      period: '2026-03',
      eligibleMembers: [
        makeNode('u1', 'Empire', 5000),
        makeNode('u2', 'Infinity', 5000),
      ],
    });

    expect(result).toHaveLength(2);
    // 1% de 100000 = 1000, dividido igualmente (50/50 pontos)
    expect(result[0].amount).toBeCloseTo(500);
    expect(result[1].amount).toBeCloseTo(500);
    expect(result[0].type).toBe('global');
  });

  it('distribui proporcionalmente ao volume qualificado', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 100000,
      period: '2026-03',
      eligibleMembers: [
        makeNode('u1', 'Empire', 3000),  // 30%
        makeNode('u2', 'Infinity', 7000), // 70%
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBeCloseTo(300); // 30% de 1000
    expect(result[1].amount).toBeCloseTo(700); // 70% de 1000
  });

  it('ignora membros nao qualificados', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 100000,
      period: '2026-03',
      eligibleMembers: [
        makeNode('u1', 'Empire', 5000, true),
        makeNode('u2', 'Empire', 5000, false), // nao qualificado
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u1');
    expect(result[0].amount).toBeCloseTo(1000); // todo o pool
  });

  it('ignora niveis abaixo de Empire', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 100000,
      period: '2026-03',
      eligibleMembers: [
        makeNode('u1', 'Vision', 5000), // nao elegivel
        makeNode('u2', 'Empire', 5000),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u2');
  });

  it('retorna vazio se nenhum membro elegivel', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 100000,
      period: '2026-03',
      eligibleMembers: [
        makeNode('u1', 'Seed', 1000),
        makeNode('u2', 'Flow', 2000),
      ],
    });

    expect(result).toHaveLength(0);
  });

  it('retorna vazio se volume total e zero', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 0,
      period: '2026-03',
      eligibleMembers: [makeNode('u1', 'Empire', 5000)],
    });

    expect(result).toHaveLength(0);
  });

  it('retorna vazio sem membros', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 100000,
      period: '2026-03',
      eligibleMembers: [],
    });

    expect(result).toHaveLength(0);
  });

  it('inclui detalhes corretos no bonus', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 50000,
      period: '2026-02',
      eligibleMembers: [makeNode('u1', 'Infinity', 10000)],
    });

    expect(result[0].details).toContain('2026-02');
    expect(result[0].saleId).toBe('pool-2026-02');
  });

  it('distribui com 3 membros de volumes diferentes', () => {
    const result = calculateGlobalPool({
      totalSalesVolume: 200000,
      period: '2026-03',
      eligibleMembers: [
        makeNode('u1', 'Empire', 2000),   // 20%
        makeNode('u2', 'Empire', 3000),   // 30%
        makeNode('u3', 'Infinity', 5000), // 50%
      ],
    });

    // 1% de 200000 = 2000
    expect(result).toHaveLength(3);
    expect(result[0].amount).toBeCloseTo(400);  // 20%
    expect(result[1].amount).toBeCloseTo(600);  // 30%
    expect(result[2].amount).toBeCloseTo(1000); // 50%

    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(2000);
  });
});
