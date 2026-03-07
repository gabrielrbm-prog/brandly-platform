export interface VideoSubmission {
  creatorId: string;
  brandId: string;
  briefingId: string;
  externalUrl: string;
  platform?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const SUPPORTED_PLATFORMS = ['tiktok', 'instagram', 'youtube'];
const URL_PATTERN = /^https?:\/\/.+/;

/**
 * Valida uma submissao de video antes de salvar.
 * Validacoes de formato e dados obrigatorios.
 */
export function validateVideoSubmission(submission: VideoSubmission): ValidationResult {
  const errors: string[] = [];

  if (!submission.creatorId) {
    errors.push('creatorId e obrigatorio');
  }

  if (!submission.brandId) {
    errors.push('brandId e obrigatorio');
  }

  if (!submission.briefingId) {
    errors.push('briefingId e obrigatorio');
  }

  if (!submission.externalUrl) {
    errors.push('externalUrl e obrigatorio');
  } else if (!URL_PATTERN.test(submission.externalUrl)) {
    errors.push('externalUrl deve ser uma URL valida (http/https)');
  }

  if (submission.platform && !SUPPORTED_PLATFORMS.includes(submission.platform)) {
    errors.push(`platform deve ser: ${SUPPORTED_PLATFORMS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
