import type { LevelName } from './types/level.js';

export const LEVEL_ORDER: LevelName[] = [
  'Seed',
  'Spark',
  'Flow',
  'Iconic',
  'Vision',
  'Empire',
  'Infinity',
];

// Comissao direta por nivel e tipo de produto (%)
export const DIRECT_COMMISSION: Record<LevelName, { digital: number; physical: number }> = {
  Seed:     { digital: 20, physical: 5 },
  Spark:    { digital: 25, physical: 8 },
  Flow:     { digital: 30, physical: 10 },
  Iconic:   { digital: 35, physical: 13 },
  Vision:   { digital: 40, physical: 15 },
  Empire:   { digital: 45, physical: 18 },
  Infinity: { digital: 50, physical: 20 },
};

// Bonus Infinito por nivel e tipo de produto (%)
export const INFINITE_BONUS: Record<LevelName, { digital: number; physical: number }> = {
  Seed:     { digital: 0, physical: 0 },
  Spark:    { digital: 1, physical: 0.5 },
  Flow:     { digital: 2, physical: 1 },
  Iconic:   { digital: 3, physical: 1.5 },
  Vision:   { digital: 5, physical: 2.5 },
  Empire:   { digital: 7, physical: 4 },
  Infinity: { digital: 8, physical: 5 },
};

// Bonus Equiparacao (%)
export const MATCHING_BONUS_PERCENT = 1;

// Bonus Global (%)
export const GLOBAL_BONUS_PERCENT = 1;

// Niveis elegíveis ao pool global
export const GLOBAL_POOL_ELIGIBLE: LevelName[] = ['Empire', 'Infinity'];

// Pagamento por video
export const VIDEO_PAYMENT_PER_DAY = 100; // R$100/dia
export const VIDEOS_REQUIRED_PER_DAY = 10;
