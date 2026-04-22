/**
 * Scraping público de perfis Instagram / TikTok.
 * Reutilizado pela rota /api/social/connect-manual e pelo serviço de match de marca.
 */

// Instagram bloqueia User-Agents de browser comum, mas serve meta tags completas pra crawlers conhecidos
// como facebookexternalhit (o próprio bot do Meta). TikTok funciona com UA de browser normal.
const UA_CRAWLER = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function decodeJsonString(s: string): string {
  // Decodifica escapes Unicode (\uXXXX) e emojis em textos extraídos do HTML
  try {
    return JSON.parse(`"${s.replace(/"/g, '\\"')}"`);
  } catch {
    return s;
  }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

export interface SocialProfileData {
  platform: 'instagram' | 'tiktok';
  username: string;
  url: string;
  followers: number;
  following: number;
  avgLikes: number;
  isVerified: boolean;
  bio?: string;
  displayName?: string;
  totalVideos?: number;
  totalHearts?: number;
  engagementRate?: number; // % (avgLikes / followers)
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
      headers: { 'User-Agent': UA_CRAWLER, Accept: 'text/html' },
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

    // og:description no Instagram contém: "X Followers ... See photos and videos of NOME (@user) on Instagram"
    // às vezes inclui a bio real (og:title). Extraímos os dois.
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const parts: string[] = [];
    if (ogTitleMatch) parts.push(decodeHtmlEntities(ogTitleMatch[1]));
    if (ogDescMatch) parts.push(decodeHtmlEntities(ogDescMatch[1]));
    if (parts.length) result.bio = parts.join(' — ').slice(0, 500);

    const nameMatch = html.match(/"full_name":"([^"]+)"/);
    if (nameMatch) result.displayName = nameMatch[1];
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
      headers: { 'User-Agent': UA_BROWSER, Accept: 'text/html' },
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
    const nickMatch = html.match(/"nickname":"([^"]+)"/);

    if (followerMatch) result.followers = parseInt(followerMatch[1], 10);
    if (followingMatch) result.following = parseInt(followingMatch[1], 10);

    const hearts = heartMatch ? parseInt(heartMatch[1], 10) : 0;
    const videos = videoMatch ? parseInt(videoMatch[1], 10) : 1;
    if (hearts > 0 && videos > 0) result.avgLikes = Math.round(hearts / videos);
    if (bioMatch) result.bio = decodeJsonString(bioMatch[1]).slice(0, 500);
    if (nickMatch) result.displayName = decodeJsonString(nickMatch[1]);
    if (videos > 0) result.totalVideos = videos;
    if (hearts > 0) result.totalHearts = hearts;
    if (result.followers > 0 && result.avgLikes > 0) {
      result.engagementRate = Number(
        ((result.avgLikes / result.followers) * 100).toFixed(2),
      );
    }

    if (html.includes('"verified":true')) result.isVerified = true;
    if (result.followers > 0 || bioMatch) result.found = true;
  } catch {
    // ignore
  }

  return result;
}
