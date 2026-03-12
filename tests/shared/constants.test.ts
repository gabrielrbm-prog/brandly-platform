import { describe, it, expect } from 'vitest';
import {
  LEVEL_ORDER,
  DIRECT_COMMISSION,
  INFINITE_BONUS,
  MATCHING_BONUS_PERCENT,
  GLOBAL_BONUS_PERCENT,
  GLOBAL_POOL_ELIGIBLE,
} from '../../packages/shared/src/constants.js';

describe('Constantes de negocios', () => {
  it('tem 7 niveis de carreira na ordem correta', () => {
    expect(LEVEL_ORDER).toEqual([
      'Seed', 'Spark', 'Flow', 'Iconic', 'Vision', 'Empire', 'Infinity',
    ]);
  });

  it('comissao direta cresce com o nivel (digital)', () => {
    const digitalRates = LEVEL_ORDER.map(l => DIRECT_COMMISSION[l].digital);
    for (let i = 1; i < digitalRates.length; i++) {
      expect(digitalRates[i]).toBeGreaterThan(digitalRates[i - 1]);
    }
  });

  it('comissao direta cresce com o nivel (fisico)', () => {
    const physicalRates = LEVEL_ORDER.map(l => DIRECT_COMMISSION[l].physical);
    for (let i = 1; i < physicalRates.length; i++) {
      expect(physicalRates[i]).toBeGreaterThan(physicalRates[i - 1]);
    }
  });

  it('comissao digital sempre maior que fisica para cada nivel', () => {
    for (const level of LEVEL_ORDER) {
      expect(DIRECT_COMMISSION[level].digital).toBeGreaterThan(
        DIRECT_COMMISSION[level].physical,
      );
    }
  });

  it('Seed digital = 20%, Infinity digital = 50%', () => {
    expect(DIRECT_COMMISSION['Seed'].digital).toBe(20);
    expect(DIRECT_COMMISSION['Infinity'].digital).toBe(50);
  });

  it('Seed fisico = 5%, Infinity fisico = 20%', () => {
    expect(DIRECT_COMMISSION['Seed'].physical).toBe(5);
    expect(DIRECT_COMMISSION['Infinity'].physical).toBe(20);
  });

  it('bonus infinito cresce com o nivel (digital)', () => {
    const rates = LEVEL_ORDER.map(l => INFINITE_BONUS[l].digital);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
    }
  });

  it('Seed nao tem bonus infinito', () => {
    expect(INFINITE_BONUS['Seed'].digital).toBe(0);
    expect(INFINITE_BONUS['Seed'].physical).toBe(0);
  });

  it('Infinity tem max bonus infinito: 8% digital, 5% fisico', () => {
    expect(INFINITE_BONUS['Infinity'].digital).toBe(8);
    expect(INFINITE_BONUS['Infinity'].physical).toBe(5);
  });

  it('matching bonus e 1%', () => {
    expect(MATCHING_BONUS_PERCENT).toBe(1);
  });

  it('global bonus e 1%', () => {
    expect(GLOBAL_BONUS_PERCENT).toBe(1);
  });

  it('apenas Empire e Infinity sao elegiveis ao pool global', () => {
    expect(GLOBAL_POOL_ELIGIBLE).toEqual(['Empire', 'Infinity']);
  });
});
