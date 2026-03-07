import type { LevelName, ProductType } from '@brandly/shared';

export interface NetworkNode {
  userId: string;
  levelName: LevelName;
  sponsorId: string | null;
  isQualified: boolean;
  qualifiedVolume: number;
}

export interface SaleInput {
  saleId: string;
  sellerId: string;
  amount: number;
  productType: ProductType;
  qualifiedVolume: number;
}

export interface BonusResult {
  userId: string;
  saleId: string;
  type: 'direct' | 'infinite' | 'matching' | 'global';
  amount: number;
  details: string;
}
