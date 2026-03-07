import { describe, it, expect } from 'vitest';
import { validateVideoSubmission } from '../../packages/core/src/services/video-validator.js';

describe('validateVideoSubmission', () => {
  const validSubmission = {
    creatorId: 'creator-1',
    brandId: 'brand-1',
    briefingId: 'briefing-1',
    externalUrl: 'https://tiktok.com/@creator/video/123',
    platform: 'tiktok',
  };

  it('aceita submissao valida completa', () => {
    const result = validateVideoSubmission(validSubmission);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('aceita submissao sem platform (opcional)', () => {
    const { platform, ...withoutPlatform } = validSubmission;
    const result = validateVideoSubmission(withoutPlatform);
    expect(result.isValid).toBe(true);
  });

  it('rejeita sem creatorId', () => {
    const result = validateVideoSubmission({ ...validSubmission, creatorId: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('creatorId e obrigatorio');
  });

  it('rejeita sem brandId', () => {
    const result = validateVideoSubmission({ ...validSubmission, brandId: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('brandId e obrigatorio');
  });

  it('rejeita sem briefingId', () => {
    const result = validateVideoSubmission({ ...validSubmission, briefingId: '' });
    expect(result.isValid).toBe(false);
  });

  it('rejeita URL invalida', () => {
    const result = validateVideoSubmission({ ...validSubmission, externalUrl: 'nao-e-url' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('externalUrl deve ser uma URL valida (http/https)');
  });

  it('rejeita sem URL', () => {
    const result = validateVideoSubmission({ ...validSubmission, externalUrl: '' });
    expect(result.isValid).toBe(false);
  });

  it('rejeita platform invalida', () => {
    const result = validateVideoSubmission({ ...validSubmission, platform: 'twitter' });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('platform deve ser');
  });

  it('acumula multiplos erros', () => {
    const result = validateVideoSubmission({
      creatorId: '',
      brandId: '',
      briefingId: '',
      externalUrl: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
