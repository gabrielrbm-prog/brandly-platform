export interface Sale {
  id: string;
  sellerId: string;
  productId: string;
  buyerId: string | null;
  amount: number;
  qualifiedVolume: number;
  status: SaleStatus;
  createdAt: Date;
}

export type SaleStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
