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
