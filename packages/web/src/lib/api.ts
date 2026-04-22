const API_URL = import.meta.env.VITE_API_URL ?? '';

let _token: string | null = localStorage.getItem('brandly_auth_token');

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const config: RequestInit = { method, headers };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
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
      (errorBody as any)?.message ?? (errorBody as any)?.error ?? `Request failed with status ${response.status}`,
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
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/api/auth/change-password', data),
};

// Brands
export const brandsApi = {
  list: (category?: string) =>
    api.get(`/api/brands${category ? `?category=${category}` : ''}`),
  detail: (id: string) => api.get(`/api/brands/${id}`),
  connect: (id: string) => api.post(`/api/brands/${id}/connect`),
  disconnect: (id: string) => api.delete(`/api/brands/${id}/disconnect`),
  my: () => api.get('/api/brands/my'),
  apply: (
    id: string,
    data: {
      fullName: string;
      age: number;
      email: string;
      gender: 'female' | 'male' | 'other';
      instagramHandle?: string;
      tiktokHandle?: string;
    },
  ) => api.post(`/api/brands/${id}/apply`, data),
  myApplications: () => api.get('/api/creator/applications'),
};

// Brand-side: approval queue for the brand user
export const brandApplicationsApi = {
  list: (status?: 'pending' | 'approved' | 'rejected') =>
    api.get(`/api/brand/applications${status ? `?status=${status}` : ''}`),
  approve: (id: string) => api.post(`/api/brand/applications/${id}/approve`),
  reject: (id: string, reason?: string) =>
    api.post(`/api/brand/applications/${id}/reject`, { reason }),
};

// Admin-side: match criteria editor
export const adminBrandCriteriaApi = {
  update: (
    id: string,
    data: {
      targetAgeMin?: number | null;
      targetAgeMax?: number | null;
      targetGender?: string | null;
      minInstagramFollowers?: number | null;
      minTiktokFollowers?: number | null;
      aiCriteria?: string | null;
    },
  ) => api.patch(`/api/admin/brands/${id}/match-criteria`, data),
};

// Videos
export const videosApi = {
  submit: (data: unknown) => api.post('/api/videos', data),
  list: () => api.get('/api/videos'),
  dailySummary: () => api.get('/api/videos/daily'),
  update: (id: string, data: { externalUrl?: string; platform?: string; brandId?: string }) =>
    api.patch(`/api/videos/${id}`, data),
  remove: (id: string) => api.delete(`/api/videos/${id}`),
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
  update: (id: string, data: { hook?: string; body?: string; cta?: string }) =>
    api.patch(`/api/scripts/${id}`, data),
  remove: (id: string) => api.delete(`/api/scripts/${id}`),
  removeAll: () => api.delete('/api/scripts'),
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
  reviewQueue: (params?: { status?: string; brandId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.brandId) qs.set('brandId', params.brandId);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return api.get<{ videos: AdminVideo[]; total: number }>(`/api/videos/review-queue${suffix}`);
  },
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

  // Analytics
  analyticsOverview: () =>
    api.get<AdminAnalyticsOverview>('/api/admin/analytics/overview'),
  analyticsGrowth: (period: '30d' | '90d' | '12m' = '30d') =>
    api.get<AdminAnalyticsGrowth>(`/api/admin/analytics/growth?period=${period}`),
  onboardingFunnel: () =>
    api.get<AdminOnboardingFunnel>('/api/admin/analytics/onboarding-funnel'),
  rejectionReasons: () =>
    api.get<AdminRejectionReasons>('/api/admin/analytics/rejection-reasons'),
  videoSla: () =>
    api.get<AdminVideoSla>('/api/admin/analytics/video-sla'),
  aiUsage: (period: '30d' | '90d' = '30d') =>
    api.get<AdminAiUsage>(`/api/admin/analytics/ai-usage?period=${period}`),

  // Courses (LMS)
  coursesList: () =>
    api.get<{ courses: AdminCourse[]; total: number }>('/api/admin/courses'),
  createCourse: (data: Partial<AdminCourse>) =>
    api.post<{ course: AdminCourse }>('/api/admin/courses', data),
  updateCourse: (id: string, data: Partial<AdminCourse>) =>
    api.patch<{ course: AdminCourse }>(`/api/admin/courses/${id}`, data),
  toggleCoursePublish: (id: string) =>
    api.patch<{ course: AdminCourse }>(`/api/admin/courses/${id}/toggle-publish`),
  courseLessons: (courseId: string) =>
    api.get<{ lessons: AdminLesson[] }>(`/api/admin/courses/${courseId}/lessons`),
  createLesson: (courseId: string, data: Partial<AdminLesson>) =>
    api.post<{ lesson: AdminLesson }>(`/api/admin/courses/${courseId}/lessons`, data),
  updateLesson: (id: string, data: Partial<AdminLesson>) =>
    api.patch<{ lesson: AdminLesson }>(`/api/admin/lessons/${id}`, data),
  toggleLessonPublish: (id: string) =>
    api.patch<{ lesson: AdminLesson }>(`/api/admin/lessons/${id}/toggle-publish`),
  courseProgress: (courseId: string) =>
    api.get<{ progress: AdminCourseProgress[] }>(`/api/admin/courses/${courseId}/progress`),

  // Community
  livesList: () =>
    api.get<{ lives: AdminLive[] }>('/api/admin/lives'),
  createLive: (data: Partial<AdminLive>) =>
    api.post<{ live: AdminLive }>('/api/admin/lives', data),
  updateLive: (id: string, data: Partial<AdminLive>) =>
    api.patch<{ live: AdminLive }>(`/api/admin/lives/${id}`, data),
  deleteLive: (id: string) =>
    api.delete(`/api/admin/lives/${id}`),
  casesList: () =>
    api.get<{ cases: AdminCase[] }>('/api/admin/cases'),
  createCase: (data: Partial<AdminCase>) =>
    api.post<{ case: AdminCase }>('/api/admin/cases', data),
  updateCase: (id: string, data: Partial<AdminCase>) =>
    api.patch<{ case: AdminCase }>(`/api/admin/cases/${id}`, data),
  toggleCasePublish: (id: string) =>
    api.patch<{ case: AdminCase }>(`/api/admin/cases/${id}/toggle-publish`),

  // Notifications
  sendNotification: (data: { title: string; message: string; userIds?: string[] }) =>
    api.post<{ sent: number; message: string }>('/api/admin/notifications/send', data),

  // Export
  exportCreators: async () => downloadCsv(`${API_URL}/api/admin/export/creators?format=csv`, 'creators'),
  exportPayments: async (month?: string, year?: string) => {
    const params = new URLSearchParams({ format: 'csv' });
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    return downloadCsv(`${API_URL}/api/admin/export/payments?${params}`, 'payments');
  },
  exportVideos: async () => downloadCsv(`${API_URL}/api/admin/export/videos?format=csv`, 'videos'),
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  levelName?: string | null;
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
  url?: string;
  externalUrl?: string;
  platform: string;
  status: string;
  createdAt: string;
  rejectionReason?: string | null;
  creatorName?: string;
  creatorId?: string;
  brandId?: string;
  brandName?: string;
  brandLogoUrl?: string | null;
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
  totalRevenue: string;
  brandlyMargin: string;
  totalPaidToCreators: string;
  pendingWithdrawals: string;
  pendingWithdrawalsCount: number;
  pendingSalesCount: number;
}

export interface AdminWithdrawal {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: string;
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
  amount: string;
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
  amount: string;
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
  website?: string | null;
  contactEmail?: string;
  logoUrl?: string | null;
  status?: string;
  isActive?: boolean;
  minVideosPerMonth?: number;
  maxCreators?: number;
  activeCreators?: number;
  activeCreatorsCount?: number;
  videosThisMonth?: number;
  createdAt: string;
  // Critérios de match (IA)
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
  targetGender?: string | null;
  minInstagramFollowers?: number | null;
  minTiktokFollowers?: number | null;
  aiCriteria?: string | null;
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
  balance: string;
  totalEarnings: string;
  videoEarnings: string;
  commissionEarnings: string;
  bonusEarnings: string;
  pendingWithdrawals: string;
  completedWithdrawals: string;
  recentPayments: Array<{
    id: string;
    type: string;
    amount: string;
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
  period?: string;
  directBonuses: string;
  infiniteBonuses: string;
  matchingBonuses: string;
  globalPool: string;
  totalDistributed: string;
  creatorsReceived?: number;
  creatorsWithBonuses?: number;
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

// Admin Analytics interfaces

export interface AdminAnalyticsCreators {
  total: number;
  active: number;
  newThisMonth: number;
  newThisWeek: number;
}

export interface AdminAnalyticsVideos {
  total: number;
  approvedToday: number;
  pendingNow: number;
  rejectedToday: number;
  approvalRate: string;
}

export interface AdminAnalyticsFinancial {
  totalRevenue: string;
  revenueThisMonth: string;
  paidToCreatorsThisMonth: string;
}

export interface AdminAnalyticsEngagement {
  avgFollowers: number;
  avgEngagementRate: string;
  connectedSocialAccounts: number;
}

export interface AdminAnalyticsOverview {
  creators: AdminAnalyticsCreators;
  videos: AdminAnalyticsVideos;
  financial: AdminAnalyticsFinancial;
  engagement: AdminAnalyticsEngagement;
}

export interface AdminGrowthDataPoint {
  label: string;
  registrations: number;
  videosSubmitted: number;
  revenue: number;
}

export interface AdminAnalyticsGrowth {
  period: string;
  data: AdminGrowthDataPoint[];
}

export interface AdminOnboardingFunnel {
  registered: number;
  startedOnboarding: number;
  completedBehavioral: number;
  submittedFirstVideo: number;
  hitDailyTarget: number;
  conversionRate: number;
}

export interface AdminRejectionReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface AdminRejectionReasons {
  reasons: AdminRejectionReason[];
  totalRejected: number;
  topCreatorsRejected: number;
}

export interface AdminVideoSla {
  avgReviewTimeHours: number;
  pendingOver24h: number;
  reviewedToday: number;
  pendingNow: number;
}

export interface AdminAiGenerationByType {
  type: string;
  count: number;
  avgTokens: number;
}

export interface AdminAiRecentGeneration {
  id: string;
  type: string;
  tokensUsed: number;
  createdAt: string;
}

export interface AdminAiUsage {
  period: string;
  totalGenerations: number;
  byType: AdminAiGenerationByType[];
  totalTokensUsed: number;
  estimatedCost: string;
  recentGenerations: AdminAiRecentGeneration[];
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

export interface ConnectManualData {
  platform: 'instagram' | 'tiktok';
  username: string;
}

export interface UpdateManualData {
  platform: 'instagram' | 'tiktok';
  followers?: number;
  avgLikes?: number;
  avgViews?: number;
}

export const socialApi = {
  connect: () => api.post<ConnectResponse>('/api/social/connect'),
  accountConnected: (data: { accountId: string; workPlatformId: string; phylloUserId: string }) =>
    api.post('/api/social/account-connected', data),
  accounts: () => api.get<{ accounts: SocialAccount[] }>('/api/social/accounts'),
  sync: (platform: 'instagram' | 'tiktok') =>
    api.post('/api/social/sync', { platform }),
  disconnect: (platform: string) => api.delete(`/api/social/disconnect/${platform}`),
  connectManual: (data: ConnectManualData) => api.post('/api/social/connect-manual', data),
  updateManual: (data: UpdateManualData) => api.patch('/api/social/update-manual', data),
};

// ─── Tracking (Correios) ──────────────────────────────────────────────────────

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

export interface Shipment {
  id: string;
  saleId: string | null;
  trackingCode: string;
  carrier: string;
  status: string;
  recipientName: string | null;
  recipientCpf: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  lastEvent: string | null;
  lastEventDate: string | null;
  events: TrackingEvent[] | null;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface ShipmentSummary {
  pending: number;
  posted: number;
  in_transit: number;
  out_for_delivery: number;
  delivered: number;
  returned: number;
  failed: number;
}

export interface ShipmentsListResponse {
  shipments: Shipment[];
  total: number;
  page: number;
  limit: number;
}

export const trackingApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    return api.get<ShipmentsListResponse>(`/api/shipments${query ? `?${query}` : ''}`);
  },
  summary: () =>
    api.get<{ summary: ShipmentSummary }>('/api/shipments/summary'),
  buyers: () =>
    api.get<{ buyers: Array<{ id: string; name: string; email: string }> }>('/api/shipments/buyers'),
  detail: (id: string) =>
    api.get<{ shipment: Shipment }>(`/api/shipments/${id}`),
  tracking: (id: string) =>
    api.get(`/api/shipments/${id}/tracking`),
  create: (data: {
    trackingCode: string;
    saleId?: string;
    userId?: string;
    recipientName?: string;
    recipientCpf?: string;
    destinationCity?: string;
    destinationState?: string;
    carrier?: string;
  }) => api.post<{ shipment: Shipment; message: string; warning?: string }>('/api/shipments', data),
  update: (id: string, data: Partial<{
    trackingCode: string;
    recipientName: string;
    recipientCpf: string;
    destinationCity: string;
    destinationState: string;
    carrier: string;
    status: string;
  }>) => api.patch<{ shipment: Shipment; message: string }>(`/api/shipments/${id}`, data),
  remove: (id: string) =>
    api.delete(`/api/shipments/${id}`),
  refresh: (id: string) =>
    api.post<{ shipment: Shipment; message: string; warning?: string }>(`/api/shipments/${id}/refresh`),
  refreshAll: () =>
    api.post('/api/shipments/refresh-all'),
};

// ─── CSV Download Helper ───────────────────────────────────────────────────────

async function downloadCsv(url: string, filename: string): Promise<void> {
  const token = localStorage.getItem('brandly_auth_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Falha ao exportar: ${response.statusText}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

// ─── Admin LMS / Community / Export Interfaces ────────────────────────────────

export interface AdminCourse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  lessonsCount?: number;
  enrolledCreators?: number;
  enrolledCount?: number;
  completionRate?: number;
  createdAt: string;
}

export interface AdminLesson {
  id: string;
  courseId: string;
  title: string;
  contentUrl?: string;
  contentType: 'video' | 'text' | 'quiz';
  duration?: number;
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminCourseProgress {
  userId: string;
  creatorName: string;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  lastActivityAt: string | null;
}

export interface AdminLive {
  id: string;
  title: string;
  scheduledAt: string;
  instructorName: string;
  meetingUrl?: string | null;
  status: 'agendada' | 'ao-vivo' | 'encerrada';
  createdAt: string;
}

export interface AdminCase {
  id: string;
  creatorId?: string | null;
  creatorName?: string | null;
  title: string;
  story: string;
  earnings?: string;
  isPublished: boolean;
  createdAt: string;
}

// ============================================
// BRAND PORTAL — Portal das marcas
// ============================================

export interface BrandMe {
  brand: {
    id: string;
    name: string;
    logoUrl: string | null;
    category: string;
    videoPriceBrand: string;
    videoPriceCreator: string;
  };
}

export interface BrandCreator {
  id: string;
  name: string;
  email: string;
  instagramHandle: string | null;
  connectedAt: string;
}

export interface BrandVideo {
  id: string;
  externalUrl: string | null;
  platform: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  creatorId: string;
  creatorName: string | null;
  creatorEmail: string | null;
  briefingId: string | null;
  briefingTitle: string | null;
}

export interface BrandPayoutPreviewRow {
  creatorId: string;
  creatorName: string;
  videoCount: number;
  amountTotal: number;
  amountCreator: number;
  amountFee: number;
}

export interface BrandPayout {
  id: string;
  period: string;
  videoCount: number;
  amountTotal: string;
  amountCreator: string;
  amountFee: string;
  status: 'pending' | 'received' | 'paid' | 'cancelled';
  createdAt: string;
  creatorId: string;
  creatorName: string | null;
}

export const brandPortalApi = {
  acceptInviteInfo: (token: string) =>
    api.get<{ email: string; brandName: string }>(`/api/brand-auth/invite/${token}`),
  acceptInvite: (data: { token: string; name: string; password: string }) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/api/brand-auth/accept-invite',
      data,
    ),
  me: () => api.get<BrandMe>('/api/brand/me'),
  creators: () => api.get<{ creators: BrandCreator[] }>('/api/brand/creators'),
  videos: (status?: string) =>
    api.get<{ videos: BrandVideo[] }>(`/api/brand/videos${status ? `?status=${status}` : ''}`),
  approveVideo: (id: string) => api.post(`/api/brand/videos/${id}/approve`),
  rejectVideo: (id: string, reason: string) =>
    api.post(`/api/brand/videos/${id}/reject`, { reason }),
  payouts: () => api.get<{ payouts: BrandPayout[] }>('/api/brand/payouts'),
  payoutsPreview: (period?: string) =>
    api.get<{
      period: string;
      preview: BrandPayoutPreviewRow[];
      totals: { videoCount: number; amountTotal: number; amountCreator: number; amountFee: number };
    }>(`/api/brand/payouts/preview${period ? `?period=${period}` : ''}`),
  generatePayouts: (period?: string) =>
    api.post<{ message: string; payouts: BrandPayout[] }>('/api/brand/payouts/generate', { period }),
};

export const adminBrandInvitesApi = {
  create: (data: { email: string; brandId: string }) =>
    api.post<{ invite: { id: string; email: string; brandName: string }; inviteUrl: string; emailSent: boolean }>(
      '/api/admin/brand-invites',
      data,
    ),
  list: () =>
    api.get<{
      invites: Array<{
        id: string;
        email: string;
        brandName: string | null;
        brandId: string;
        expiresAt: string;
        acceptedAt: string | null;
        createdAt: string;
      }>;
    }>('/api/admin/brand-invites'),
  remove: (id: string) => api.delete(`/api/admin/brand-invites/${id}`),
};

export const adminBrandPayoutsApi = {
  list: () =>
    api.get<{
      payouts: Array<{
        id: string;
        brandId: string;
        brandName: string | null;
        creatorId: string;
        period: string;
        videoCount: number;
        amountTotal: string;
        amountCreator: string;
        amountFee: string;
        status: 'pending' | 'received' | 'paid' | 'cancelled';
        paidToBrandlyAt: string | null;
        paidToCreatorAt: string | null;
        notes: string | null;
        createdAt: string;
      }>;
    }>('/api/admin/brand-payouts'),
  markReceived: (id: string, notes?: string) =>
    api.post(`/api/admin/brand-payouts/${id}/mark-received`, { notes }),
  markPaid: (id: string, notes?: string) =>
    api.post(`/api/admin/brand-payouts/${id}/mark-paid`, { notes }),
};
