import { describe, it, expect } from 'vitest';
import { calculateEngagementMetrics, mapPlatformName } from '../../packages/core/src/services/phyllo-client.js';
import type { PhylloContent } from '../../packages/core/src/services/phyllo-client.js';

describe('calculateEngagementMetrics', () => {
  const makeContent = (overrides?: Partial<PhylloContent>): PhylloContent => ({
    id: 'c1',
    title: 'Post',
    type: 'video',
    url: 'https://tiktok.com/video/1',
    like_count: 100,
    comment_count: 10,
    share_count: 5,
    view_count: 1000,
    impression_count: 1200,
    published_at: '2026-03-01',
    ...overrides,
  });

  it('calcula medias corretamente para um unico post', () => {
    const result = calculateEngagementMetrics([makeContent()]);
    expect(result.avgLikes).toBe(100);
    expect(result.avgViews).toBe(1000);
    expect(result.avgComments).toBe(10);
    // Engagement: (100 + 10) / 1000 * 100 = 11%
    expect(result.engagementRate).toBe(11);
  });

  it('calcula medias para multiplos posts', () => {
    const contents = [
      makeContent({ like_count: 200, comment_count: 20, view_count: 2000 }),
      makeContent({ like_count: 100, comment_count: 10, view_count: 1000 }),
    ];
    const result = calculateEngagementMetrics(contents);
    expect(result.avgLikes).toBe(150); // (200+100)/2
    expect(result.avgViews).toBe(1500); // (2000+1000)/2
    expect(result.avgComments).toBe(15); // (20+10)/2
    // Engagement: (300 + 30) / 3000 * 100 = 11%
    expect(result.engagementRate).toBe(11);
  });

  it('retorna zeros para array vazio', () => {
    const result = calculateEngagementMetrics([]);
    expect(result.avgLikes).toBe(0);
    expect(result.avgViews).toBe(0);
    expect(result.avgComments).toBe(0);
    expect(result.engagementRate).toBe(0);
  });

  it('lida com views zero (sem dividir por zero)', () => {
    const result = calculateEngagementMetrics([
      makeContent({ view_count: 0, like_count: 50, comment_count: 5 }),
    ]);
    expect(result.engagementRate).toBe(0);
    expect(result.avgLikes).toBe(50);
  });

  it('arredonda valores corretamente', () => {
    const contents = [
      makeContent({ like_count: 33, comment_count: 7, view_count: 999 }),
      makeContent({ like_count: 44, comment_count: 3, view_count: 501 }),
    ];
    const result = calculateEngagementMetrics(contents);
    expect(result.avgLikes).toBe(39); // Math.round((33+44)/2) = 38.5 → 39
    expect(result.avgViews).toBe(750); // Math.round((999+501)/2) = 750
  });

  it('lida com null/undefined counts (coerce para 0)', () => {
    const result = calculateEngagementMetrics([
      makeContent({
        like_count: null as any,
        comment_count: undefined as any,
        view_count: 1000,
      }),
    ]);
    expect(result.avgLikes).toBe(0);
    expect(result.avgComments).toBe(0);
    expect(result.engagementRate).toBe(0);
  });
});

describe('mapPlatformName', () => {
  it('mapeia Instagram', () => {
    expect(mapPlatformName('Instagram')).toBe('instagram');
    expect(mapPlatformName('INSTAGRAM')).toBe('instagram');
    expect(mapPlatformName('instagram')).toBe('instagram');
  });

  it('mapeia TikTok', () => {
    expect(mapPlatformName('TikTok')).toBe('tiktok');
    expect(mapPlatformName('TIKTOK')).toBe('tiktok');
    expect(mapPlatformName('tiktok')).toBe('tiktok');
  });

  it('retorna null para plataformas nao suportadas', () => {
    expect(mapPlatformName('YouTube')).toBeNull();
    expect(mapPlatformName('Twitter')).toBeNull();
    expect(mapPlatformName('')).toBeNull();
  });
});
