/**
 * Cliente Phyllo — integra Instagram e TikTok via API unificada
 * Docs: https://docs.getphyllo.com
 */

const ENV = process.env.PHYLLO_ENVIRONMENT ?? 'staging';
const PHYLLO_BASE_URL = ENV === 'production'
  ? 'https://api.getphyllo.com'
  : `https://api.${ENV}.getphyllo.com`;

function getAuthHeader(): string {
  const clientId = process.env.PHYLLO_CLIENT_ID;
  const clientSecret = process.env.PHYLLO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PHYLLO_CLIENT_ID e PHYLLO_CLIENT_SECRET sao obrigatorios');
  }
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

async function phylloFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${PHYLLO_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Phyllo API ${res.status}: ${body}`);
  }

  return res.json();
}

// ============================================
// USERS
// ============================================

export interface PhylloUser {
  id: string;
  name: string;
  external_id: string;
}

export async function createPhylloUser(name: string, externalId: string): Promise<PhylloUser> {
  return phylloFetch('/v1/users', {
    method: 'POST',
    body: JSON.stringify({ name, external_id: externalId }),
  });
}

export async function getPhylloUser(phylloUserId: string): Promise<PhylloUser> {
  return phylloFetch(`/v1/users/${phylloUserId}`);
}

// ============================================
// SDK TOKENS
// ============================================

export interface PhylloSdkToken {
  sdk_token: string;
  expires_at: string;
}

export async function createSdkToken(
  phylloUserId: string,
  products: string[] = ['IDENTITY', 'ENGAGEMENT'],
): Promise<PhylloSdkToken> {
  return phylloFetch('/v1/sdk-tokens', {
    method: 'POST',
    body: JSON.stringify({ user_id: phylloUserId, products }),
  });
}

// ============================================
// PROFILES (Identity)
// ============================================

export interface PhylloProfile {
  id: string;
  account_id: string;
  platform_username: string;
  full_name: string;
  url: string;
  image_url: string;
  follower_count: number;
  following_count: number;
  is_verified: boolean;
  work_platform: {
    id: string;
    name: string;
  };
}

export async function getProfiles(accountId: string): Promise<{ data: PhylloProfile[] }> {
  return phylloFetch(`/v1/profiles?account_id=${accountId}`);
}

export async function getProfile(profileId: string): Promise<PhylloProfile> {
  return phylloFetch(`/v1/profiles/${profileId}`);
}

// ============================================
// ACCOUNTS
// ============================================

export interface PhylloAccount {
  id: string;
  user_id: string;
  work_platform: {
    id: string;
    name: string;
  };
  status: string;
  platform_username: string;
}

export async function getAccounts(phylloUserId: string): Promise<{ data: PhylloAccount[] }> {
  return phylloFetch(`/v1/accounts?user_id=${phylloUserId}`);
}

// ============================================
// ENGAGEMENT (Content)
// ============================================

export interface PhylloContent {
  id: string;
  title: string;
  type: string;
  url: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  impression_count: number;
  published_at: string;
}

export async function getContents(
  accountId: string,
  limit = 30,
): Promise<{ data: PhylloContent[] }> {
  return phylloFetch(`/v1/social/contents?account_id=${accountId}&limit=${limit}`);
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula metricas de engajamento medio a partir dos ultimos posts
 */
export function calculateEngagementMetrics(contents: PhylloContent[]): {
  avgLikes: number;
  avgViews: number;
  avgComments: number;
  engagementRate: number;
} {
  if (!contents.length) {
    return { avgLikes: 0, avgViews: 0, avgComments: 0, engagementRate: 0 };
  }

  const totalLikes = contents.reduce((sum, c) => sum + (c.like_count ?? 0), 0);
  const totalViews = contents.reduce((sum, c) => sum + (c.view_count ?? 0), 0);
  const totalComments = contents.reduce((sum, c) => sum + (c.comment_count ?? 0), 0);

  const n = contents.length;
  const avgLikes = Math.round(totalLikes / n);
  const avgViews = Math.round(totalViews / n);
  const avgComments = Math.round(totalComments / n);

  // Engagement rate = (likes + comments) / views * 100
  const engagementRate = totalViews > 0
    ? Number((((totalLikes + totalComments) / totalViews) * 100).toFixed(2))
    : 0;

  return { avgLikes, avgViews, avgComments, engagementRate };
}

/**
 * Mapeia nome da plataforma Phyllo para nosso enum
 */
export function mapPlatformName(phylloName: string): 'instagram' | 'tiktok' | null {
  const lower = phylloName.toLowerCase();
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('tiktok')) return 'tiktok';
  return null;
}
