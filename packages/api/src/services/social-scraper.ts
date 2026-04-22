/**
 * Scraping público de perfis Instagram / TikTok.
 * Reutilizado pela rota /api/social/connect-manual e pelo serviço de match de marca.
 */

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export interface SocialProfileData {
  platform: 'instagram' | 'tiktok';
  username: string;
  url: string;
  followers: number;
  following: number;
  avgLikes: number;
  isVerified: boolean;
  bio?: string;
  found: boolean;
}

export async function fetchInstagramProfile(username: string): Promise<SocialProfileData> {
  const clean = username.replace(/^@/, '').trim();
  const url = `https://www.instagram.com/${clean}/`;
  const result: SocialProfileData = {
    platform: 'instagram',
    username: clean,
    url,
    followers: 0,
    following: 0,
    avgLikes: 0,
    isVerified: false,
    found: false,
  };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return result;
    const html = await res.text();

    const metaMatch = html.match(
      /content="([\d,\.]+)\s+Followers,\s*([\d,\.]+)\s+Following,\s*([\d,\.]+)\s+Posts/i,
    );
    if (metaMatch) {
      result.followers = parseInt(metaMatch[1].replace(/[,\.]/g, ''), 10) || 0;
      result.following = parseInt(metaMatch[2].replace(/[,\.]/g, ''), 10) || 0;
      result.found = true;
    }
    if (html.includes('"is_verified":true')) result.isVerified = true;

    const bioMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (bioMatch) result.bio = bioMatch[1].slice(0, 500);
  } catch {
    // network/timeout — devolve vazio
  }

  return result;
}

export async function fetchTiktokProfile(username: string): Promise<SocialProfileData> {
  const clean = username.replace(/^@/, '').trim();
  const url = `https://www.tiktok.com/@${clean}`;
  const result: SocialProfileData = {
    platform: 'tiktok',
    username: clean,
    url,
    followers: 0,
    following: 0,
    avgLikes: 0,
    isVerified: false,
    found: false,
  };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return result;
    const html = await res.text();

    const followerMatch = html.match(/"followerCount":(\d+)/);
    const followingMatch = html.match(/"followingCount":(\d+)/);
    const heartMatch = html.match(/"heartCount":(\d+)/);
    const videoMatch = html.match(/"videoCount":(\d+)/);
    const bioMatch = html.match(/"signature":"([^"]+)"/);

    if (followerMatch) result.followers = parseInt(followerMatch[1], 10);
    if (followingMatch) result.following = parseInt(followingMatch[1], 10);

    const hearts = heartMatch ? parseInt(heartMatch[1], 10) : 0;
    const videos = videoMatch ? parseInt(videoMatch[1], 10) : 1;
    if (hearts > 0 && videos > 0) result.avgLikes = Math.round(hearts / videos);
    if (bioMatch) result.bio = bioMatch[1].slice(0, 500);

    if (html.includes('"verified":true')) result.isVerified = true;
    if (result.followers > 0 || bioMatch) result.found = true;
  } catch {
    // ignore
  }

  return result;
}
