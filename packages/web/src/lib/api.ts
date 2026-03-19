const API_URL = import.meta.env.VITE_API_URL ?? '';

let _token: string | null = localStorage.getItem('brandly_auth_token');

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const config: RequestInit = { method, headers };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, config);

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: response.statusText };
    }
    const error: any = new Error(
      (errorBody as any)?.message ?? `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = unknown>(path: string) => request<T>('DELETE', path),
  setToken: (token: string) => {
    _token = token;
    localStorage.setItem('brandly_auth_token', token);
  },
  clearToken: () => {
    _token = null;
    localStorage.removeItem('brandly_auth_token');
  },
};

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; referralCode?: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// Brands
export const brandsApi = {
  list: (category?: string) =>
    api.get(`/api/brands${category ? `?category=${category}` : ''}`),
  detail: (id: string) => api.get(`/api/brands/${id}`),
  connect: (id: string) => api.post(`/api/brands/${id}/connect`),
  disconnect: (id: string) => api.delete(`/api/brands/${id}/disconnect`),
  my: () => api.get('/api/brands/my'),
};

// Videos
export const videosApi = {
  submit: (data: unknown) => api.post('/api/videos', data),
  list: () => api.get('/api/videos'),
  dailySummary: () => api.get('/api/videos/daily'),
};

// Financial
export const financialApi = {
  balance: () => api.get('/api/financial/balance'),
  earnings: () => api.get('/api/financial/earnings'),
  history: (params?: string) =>
    api.get(`/api/financial/history${params ? `?${params}` : ''}`),
  withdraw: (data: unknown) => api.post('/api/financial/withdraw', data),
};

// Scripts
export const scriptsApi = {
  generate: (data: unknown) => api.post('/api/scripts/generate', data),
  list: (briefingId?: string) =>
    api.get(`/api/scripts${briefingId ? `?briefingId=${briefingId}` : ''}`),
  detail: (id: string) => api.get(`/api/scripts/${id}`),
  markUsed: (id: string) => api.patch(`/api/scripts/${id}/use`),
};

// Dashboard
export const dashboardApi = {
  overview: () => api.get('/api/dashboard'),
  metrics: (period?: string) =>
    api.get(`/api/dashboard/metrics${period ? `?period=${period}` : ''}`),
  ranking: () => api.get('/api/dashboard/ranking'),
};

// Network
export const networkApi = {
  referralLink: () => api.get('/api/network/referral-link'),
  tree: () => api.get('/api/network/tree'),
  stats: () => api.get('/api/network/stats'),
  bonuses: () => api.get('/api/network/bonuses'),
};

// Courses
export const coursesApi = {
  list: () => api.get('/api/courses'),
  lessons: (id: string) => api.get(`/api/courses/${id}/lessons`),
  completeLesson: (id: string) => api.post(`/api/courses/lessons/${id}/complete`),
  progress: () => api.get('/api/courses/progress'),
};

// Community
export const communityApi = {
  ranking: (period?: string, type?: string) =>
    api.get(
      `/api/community/ranking?period=${period ?? 'month'}&type=${type ?? 'production'}`,
    ),
  lives: () => api.get('/api/community/lives'),
  cases: () => api.get('/api/community/cases'),
};

// Onboarding
export interface OnboardingQuestion {
  id: number;
  category: string;
  type: 'single' | 'multiple' | 'swipe' | 'slider' | 'grid';
  question: string;
  subtitle?: string;
  options?: { value: string; label: string; emoji?: string }[];
  sliderConfig?: { min: string; max: string; minLabel: string; maxLabel: string };
  maxSelections?: number;
}

export interface CreatorDiagnostic {
  archetype: string;
  archetypeEmoji: string;
  title: string;
  shortDescription: string;
  strengths: string[];
  superpower: string;
  contentStyle: string;
  idealFormats: string[];
  productMatch: string[];
  motivationPhrase: string;
  level: string;
  readinessScore: number;
}

export const onboardingApi = {
  profile: (data: unknown) => api.post('/api/onboarding/profile', data),
  social: (data: unknown) => api.post('/api/onboarding/social', data),
  complete: () => api.post('/api/onboarding/complete'),
  behavioralQuestions: () =>
    api.get<{ questions: OnboardingQuestion[]; total: number }>('/api/onboarding/behavioral/questions'),
  submitBehavioral: (answers: Record<number, string | string[] | number>) =>
    api.post<{ message: string; creatorDiagnostic: CreatorDiagnostic }>('/api/onboarding/behavioral', { answers }),
  behavioralResult: () =>
    api.get<{ creatorDiagnostic: CreatorDiagnostic }>('/api/onboarding/behavioral/result'),
};

// Admin
export const adminApi = {
  users: (page = 1, limit = 20, search?: string) =>
    api.get<{ users: AdminUser[]; total: number }>(
      `/api/users?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),
  userDetail: (id: string) =>
    api.get<{ user: AdminUser; profile: AdminUserProfile }>(`/api/users/${id}`),
  reviewQueue: () =>
    api.get<{ videos: AdminVideo[]; total: number }>('/api/videos/review-queue'),
  reviewVideo: (id: string, data: { status: 'approved' | 'rejected'; rejectionReason?: string }) =>
    api.patch(`/api/videos/${id}/review`, data),
  behavioralProfile: (userId: string) =>
    api.get<{ creatorDiagnostic: AdminCreatorDiagnostic; adminDiagnostic: AdminDiagnostic }>(
      `/api/onboarding/behavioral/admin/${userId}`,
    ),
  triggerGlobalPool: () => api.post('/api/cron/global-pool'),
  triggerSyncSocial: () => api.post('/api/cron/sync-social'),

  // Financial
  financialOverview: () =>
    api.get<FinancialOverview>('/api/admin/financial/overview'),
  withdrawals: (status?: string, page?: number) =>
    api.get<WithdrawalsResponse>(
      `/api/admin/withdrawals?status=${status ?? 'requested'}&page=${page ?? 1}&limit=20`,
    ),
  approveWithdrawal: (id: string) =>
    api.patch(`/api/admin/withdrawals/${id}`, { status: 'completed' }),
  rejectWithdrawal: (id: string, reason: string) =>
    api.patch(`/api/admin/withdrawals/${id}`, { status: 'failed', reason }),
  batchApproveWithdrawals: (ids: string[]) =>
    api.post('/api/admin/withdrawals/batch', { ids, status: 'completed' }),
  salesList: (status?: string, page?: number) =>
    api.get<SalesResponse>(
      `/api/admin/sales?status=${status ?? 'pending'}&page=${page ?? 1}&limit=20`,
    ),
  confirmSale: (id: string) =>
    api.post(`/api/sales/${id}/confirm`),
  paymentsLedger: (page?: number, type?: string) =>
    api.get<PaymentsResponse>(
      `/api/admin/payments?page=${page ?? 1}&limit=20${type ? `&type=${type}` : ''}`,
    ),

  // Brands
  brandsList: (page = 1, search?: string, status?: string) =>
    api.get<{ brands: AdminBrand[]; total: number }>(
      `/api/admin/brands?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`,
    ),
  brandDetail: (id: string) =>
    api.get<AdminBrandDetailResponse>(`/api/admin/brands/${id}`),
  createBrand: (data: Partial<AdminBrand>) =>
    api.post<{ brand: AdminBrand }>('/api/admin/brands', data),
  updateBrand: (id: string, data: Partial<AdminBrand>) =>
    api.patch<{ brand: AdminBrand }>(`/api/admin/brands/${id}`, data),
  toggleBrandStatus: (id: string) =>
    api.patch<{ brand: AdminBrand }>(`/api/admin/brands/${id}/toggle-status`),
  brandBriefings: (brandId: string) =>
    api.get<{ briefings: AdminBriefing[] }>(`/api/admin/brands/${brandId}/briefings`),
  createBriefing: (brandId: string, data: Partial<AdminBriefing>) =>
    api.post<{ briefing: AdminBriefing }>(`/api/admin/brands/${brandId}/briefings`, data),
  updateBriefing: (id: string, data: Partial<AdminBriefing>) =>
    api.patch<{ briefing: AdminBriefing }>(`/api/admin/briefings/${id}`, data),
  brandProducts: (brandId: string) =>
    api.get<{ products: AdminProduct[] }>(`/api/admin/brands/${brandId}/products`),
  createProduct: (brandId: string, data: Partial<AdminProduct>) =>
    api.post<{ product: AdminProduct }>(`/api/admin/brands/${brandId}/products`, data),
  updateProduct: (id: string, data: Partial<AdminProduct>) =>
    api.patch<{ product: AdminProduct }>(`/api/admin/products/${id}`, data),

  // Creator detail sub-endpoints
  creatorVideos: (id: string, status?: string, page = 1) =>
    api.get<AdminCreatorVideosResponse>(
      `/api/admin/creators/${id}/videos?page=${page}&limit=20${status ? `&status=${status}` : ''}`,
    ),
  creatorFinancial: (id: string) =>
    api.get<AdminCreatorFinancial>(`/api/admin/creators/${id}/financial`),
  creatorNetwork: (id: string) =>
    api.get<AdminCreatorNetwork>(`/api/admin/creators/${id}/network`),
  creatorBrands: (id: string) =>
    api.get<{ brands: AdminCreatorBrandItem[] }>(`/api/admin/creators/${id}/brands`),
  creatorSocial: (id: string) =>
    api.get<{ accounts: AdminCreatorSocialAccount[] }>(`/api/admin/creators/${id}/social`),
  changeCreatorStatus: (id: string, status: 'active' | 'inactive' | 'suspended') =>
    api.patch<{ user: AdminUser }>(`/api/admin/creators/${id}/status`, { status }),
  changeCreatorLevel: (id: string, levelId: string) =>
    api.patch<{ user: AdminUser }>(`/api/admin/creators/${id}/level`, { levelId }),

  // Network analytics
  networkLevelDistribution: () =>
    api.get<AdminNetworkLevelDistribution>('/api/admin/network/level-distribution'),
  networkTopRecruiters: (limit = 10) =>
    api.get<{ recruiters: AdminNetworkRecruiter[] }>(`/api/admin/network/top-recruiters?limit=${limit}`),
  networkBonusSummary: (period?: string) =>
    api.get<AdminNetworkBonusSummary>(
      `/api/admin/network/bonus-summary${period ? `?period=${period}` : ''}`,
    ),
  networkAtRisk: () =>
    api.get<{ creators: AdminAtRiskCreator[] }>('/api/admin/network/at-risk'),
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  level?: string;
  referralCode?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
}

export interface AdminUserProfile {
  instagram?: string;
  tiktok?: string;
  niche?: string;
  bio?: string;
  onboardingStep?: string;
}

export interface AdminVideo {
  id: string;
  url: string;
  platform: string;
  status: string;
  createdAt: string;
  creatorName?: string;
  creatorId?: string;
  brandName?: string;
}

export interface AdminCreatorDiagnostic {
  archetype: string;
  archetypeEmoji: string;
  title: string;
  shortDescription: string;
  strengths: string[];
  superpower: string;
  contentStyle?: string;
  idealFormats?: string[];
  productMatch?: string[];
  motivationPhrase?: string;
  level: string;
  readinessScore: number;
}

export interface AdminDiagnostic {
  retentionRisk: string;
  predictedOutput: string;
  discScores?: { D: number; I: number; S: number; C: number };
  tags?: string[];
  recommendedActions?: string[];
}

// Admin Financial interfaces
export interface FinancialOverview {
  totalRevenue: number;
  brandlyMargin: number;
  totalPaidToCreators: number;
  pendingWithdrawals: number;
  pendingWithdrawalsCount: number;
  pendingSalesCount: number;
}

export interface AdminWithdrawal {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  pixKey: string;
  status: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalsResponse {
  withdrawals: AdminWithdrawal[];
  total: number;
}

export interface AdminSale {
  id: string;
  productName: string;
  creatorName: string;
  brandName: string;
  amount: number;
  type: 'digital' | 'physical';
  status: string;
  createdAt: string;
}

export interface SalesResponse {
  sales: AdminSale[];
  total: number;
}

export interface AdminPayment {
  id: string;
  creatorName: string;
  type: 'video' | 'commission' | 'bonus';
  amount: number;
  description: string;
  createdAt: string;
}

export interface PaymentsResponse {
  payments: AdminPayment[];
  total: number;
}

// Admin Brand interfaces
export interface AdminBrand {
  id: string;
  name: string;
  category: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  logoUrl?: string;
  isActive: boolean;
  minVideosPerMonth?: number;
  maxCreators?: number;
  activeCreatorsCount?: number;
  videosThisMonth?: number;
  createdAt: string;
}

export interface AdminBrandCreator {
  id: string;
  name: string;
  email: string;
  videosCount: number;
  approvalRate: number;
}

export interface AdminBriefing {
  id: string;
  brandId: string;
  title: string;
  description: string;
  doList?: string[];
  dontList?: string[];
  technicalRequirements?: string;
  tone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  type: 'digital' | 'physical';
  price: number;
  commissionPercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminBrandStats {
  totalVideos: number;
  approvedVideos: number;
  rejectedVideos: number;
  approvalRate: number;
}

export interface AdminBrandDetailResponse {
  brand: AdminBrand;
  creators: AdminBrandCreator[];
  briefings: AdminBriefing[];
  products: AdminProduct[];
  stats: AdminBrandStats;
}

// Admin Creator detail sub-types
export interface AdminCreatorVideo {
  id: string;
  url: string;
  platform: string;
  brandName?: string;
  status: string;
  payment: number;
  rejectionReason?: string;
  createdAt: string;
}

export interface AdminCreatorVideosStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  approvalRate: number;
}

export interface AdminCreatorVideosResponse {
  videos: AdminCreatorVideo[];
  total: number;
  stats: AdminCreatorVideosStats;
}

export interface AdminCreatorFinancial {
  balance: number;
  totalEarnings: number;
  videoEarnings: number;
  commissionEarnings: number;
  bonusEarnings: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  recentPayments: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export interface AdminCreatorNetworkDirect {
  id: string;
  name: string;
  email: string;
  level: string;
  status: string;
  videosThisMonth: number;
  joinedAt: string;
}

export interface AdminCreatorNetwork {
  sponsor: { id: string; name: string; email: string; level: string } | null;
  directCount: number;
  networkDepth: number;
  totalInNetwork: number;
  directs: AdminCreatorNetworkDirect[];
}

export interface AdminCreatorBrandItem {
  id: string;
  name: string;
  category: string;
  videosCount: number;
  approvalRate: number;
}

export interface AdminCreatorSocialAccount {
  id: string;
  platform: string;
  username: string | null;
  followers: number;
  engagementRate: number;
  status: string;
  lastSyncAt: string | null;
}

// Admin Network analytics types
export interface AdminNetworkLevelItem {
  level: string;
  count: number;
  percentage: number;
}

export interface AdminNetworkLevelDistribution {
  distribution: AdminNetworkLevelItem[];
  total: number;
}

export interface AdminNetworkRecruiter {
  id: string;
  name: string;
  email: string;
  level: string;
  activeDirects: number;
  totalNetwork: number;
}

export interface AdminNetworkBonusSummary {
  directBonuses: number;
  infiniteBonuses: number;
  matchingBonuses: number;
  globalPool: number;
  totalDistributed: number;
  creatorsWithBonuses: number;
}

export interface AdminAtRiskCreator {
  id: string;
  name: string;
  email: string;
  level: string;
  daysSinceLastVideo: number;
  videosThisMonth: number;
  retentionRisk: string;
}

// Social
export interface SocialAccount {
  id: string;
  platform: 'instagram' | 'tiktok';
  username: string | null;
  url: string | null;
  followers: number;
  following: number;
  avgLikes: number;
  avgViews: number;
  avgComments: number;
  engagementRate: number;
  isVerified: boolean;
  status: 'connected' | 'disconnected' | 'expired';
  lastSyncAt: string | null;
}

export interface ConnectResponse {
  sdkToken: string;
  userId: string;
  environment: string;
}

export const socialApi = {
  connect: () => api.post<ConnectResponse>('/api/social/connect'),
  accountConnected: (data: { accountId: string; workPlatformId: string; phylloUserId: string }) =>
    api.post('/api/social/account-connected', data),
  accounts: () => api.get<{ accounts: SocialAccount[] }>('/api/social/accounts'),
  sync: (platform: 'instagram' | 'tiktok') =>
    api.post('/api/social/sync', { platform }),
  disconnect: (platform: string) => api.delete(`/api/social/disconnect/${platform}`),
};
