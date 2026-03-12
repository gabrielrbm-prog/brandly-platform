import { describe, it, expect } from 'vitest';
import { calculateGlobalPool } from '../../packages/bonus-engine/src/calculators/global-pool.js';
import type { NetworkNode } from '../../packages/bonus-engine/src/types.js';

describe('calculateGlobalPool', () => {
  const makeNode = (overrides?: Partial<NetworkNode>): NetworkNode => ({
    userId: 'user-1',
    levelName: 'Empire',
    sponsorId: null,
    isQualified: true,
    qualifiedVolume: 10000,
    ...overrides,
  });

  it('distribui 1% do volume total entre elegiveis', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 1_000_000,
      period: '2026-03',
      eligibleMembers: [makeNode({ userId: 'emp1', qualifiedVolume: 5000 })],
    });

    expect(results).toHaveLength(1);
    expect(results[0].amount).toBe(10000); // 1% de 1M = 10k, 100% para unico membro
    expect(results[0].type).toBe('global');
  });

  it('distribui proporcionalmente por pontos entre multiplos membros', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 100_000,
      period: '2026-03',
      eligibleMembers: [
        makeNode({ userId: 'emp1', qualifiedVolume: 3000 }),
        makeNode({ userId: 'inf1', levelName: 'Infinity', qualifiedVolume: 7000 }),
      ],
    });

    expect(results).toHaveLength(2);
    // Pool = 1% de 100k = 1000
    // emp1: 3000/10000 * 1000 = 300
    expect(results[0].amount).toBe(300);
    // inf1: 7000/10000 * 1000 = 700
    expect(results[1].amount).toBe(700);
  });

  it('exclui niveis abaixo de Empire', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 100_000,
      period: '2026-03',
      eligibleMembers: [
        makeNode({ userId: 'flow', levelName: 'Flow', qualifiedVolume: 5000 }),
        makeNode({ userId: 'vision', levelName: 'Vision', qualifiedVolume: 5000 }),
        makeNode({ userId: 'emp', levelName: 'Empire', qualifiedVolume: 5000 }),
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('emp');
  });

  it('exclui membros nao qualificados', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 100_000,
      period: '2026-03',
      eligibleMembers: [
        makeNode({ userId: 'emp1', isQualified: false }),
        makeNode({ userId: 'emp2', isQualified: true, qualifiedVolume: 5000 }),
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('emp2');
  });

  it('retorna vazio se nao ha elegiveis', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 100_000,
      period: '2026-03',
      eligibleMembers: [],
    });
    expect(results).toHaveLength(0);
  });

  it('retorna vazio se volume total e zero', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 0,
      period: '2026-03',
      eligibleMembers: [makeNode()],
    });
    expect(results).toHaveLength(0);
  });

  it('inclui Infinity como elegivel', () => {
    const results = calculateGlobalPool({
      totalSalesVolume: 100_000,
      period: '2026-03',
      eligibleMembers: [
        makeNode({ userId: 'inf1', levelName: 'Infinity', qualifiedVolume: 10000 }),
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('inf1');
  });
});
