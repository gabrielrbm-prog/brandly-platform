export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  brandId: string;
  commissionPercent: number;
  status: ProductStatus;
  createdAt: Date;
}

export type ProductType = 'physical' | 'digital';

export type ProductStatus = 'active' | 'inactive' | 'draft';
