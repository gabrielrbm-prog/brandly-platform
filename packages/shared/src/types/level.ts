export interface Level {
  id: string;
  name: LevelName;
  rank: number;
  requiredQV: number;
  requiredDirects: number;
  requiredPML: number;
  directCommissionDigital: number;
  directCommissionPhysical: number;
  infiniteBonusDigital: number;
  infiniteBonusPhysical: number;
}

export type LevelName =
  | 'Seed'
  | 'Spark'
  | 'Flow'
  | 'Iconic'
  | 'Vision'
  | 'Empire'
  | 'Infinity';
