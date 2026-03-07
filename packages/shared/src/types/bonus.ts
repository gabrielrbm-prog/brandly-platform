export interface Bonus {
  id: string;
  userId: string;
  saleId: string | null;
  type: BonusType;
  amount: number;
  poolId: string | null;
  period: string;
  status: BonusStatus;
  createdAt: Date;
}

export type BonusType = 'direct' | 'infinite' | 'matching' | 'global';

export type BonusStatus = 'pending' | 'approved' | 'paid';

export interface GlobalPool {
  id: string;
  period: string;
  totalAmount: number;
  distributedAt: Date | null;
  status: 'open' | 'closed' | 'distributed';
}
