export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  levelId: string;
  sponsorId: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'creator' | 'brand' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'pending';
