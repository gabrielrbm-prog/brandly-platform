import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_QUESTIONS,
} from '../../packages/core/src/services/behavioral-profile.js';
import type {
  OnboardingQuestion,
  OnboardingAnswers,
  BehavioralProfileResult,
} from '../../packages/core/src/services/behavioral-profile.js';

describe('ONBOARDING_QUESTIONS', () => {
  it('tem exatamente 20 perguntas', () => {
    expect(ONBOARDING_QUESTIONS).toHaveLength(20);
  });

  it('IDs sao sequenciais de 1 a 20', () => {
    const ids = ONBOARDING_QUESTIONS.map(q => q.id);
    expect(ids).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('cada pergunta tem id, category, type e question', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      expect(q.id).toBeGreaterThan(0);
      expect(q.category).toBeTruthy();
      expect(q.type).toBeTruthy();
      expect(q.question).toBeTruthy();
    }
  });

  it('tipos validos: single, multiple, swipe, slider, grid', () => {
    const validTypes = ['single', 'multiple', 'swipe', 'slider', 'grid'];
    for (const q of ONBOARDING_QUESTIONS) {
      expect(validTypes).toContain(q.type);
    }
  });

  it('categorias validas', () => {
    const validCats = ['behavioral', 'content', 'segments', 'experience', 'social', 'personality'];
    for (const q of ONBOARDING_QUESTIONS) {
      expect(validCats).toContain(q.category);
    }
  });

  it('perguntas single/multiple/swipe/grid tem options', () => {
    const needsOptions = ['single', 'multiple', 'swipe', 'grid'];
    for (const q of ONBOARDING_QUESTIONS) {
      if (needsOptions.includes(q.type)) {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThan(0);
      }
    }
  });

  it('perguntas slider tem sliderConfig', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      if (q.type === 'slider') {
        expect(q.sliderConfig).toBeDefined();
        expect(q.sliderConfig!.min).toBeDefined();
        expect(q.sliderConfig!.max).toBeDefined();
        expect(q.sliderConfig!.minLabel).toBeTruthy();
        expect(q.sliderConfig!.maxLabel).toBeTruthy();
      }
    }
  });

  it('perguntas grid tem maxSelections', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      if (q.type === 'grid') {
        expect(q.maxSelections).toBeDefined();
        expect(q.maxSelections).toBeGreaterThan(0);
      }
    }
  });

  it('options tem value e label', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      if (q.options) {
        for (const opt of q.options) {
          expect(opt.value).toBeTruthy();
          expect(opt.label).toBeTruthy();
        }
      }
    }
  });

  it('cobre os 5 blocos tematicos', () => {
    const categories = new Set(ONBOARDING_QUESTIONS.map(q => q.category));
    expect(categories.has('behavioral')).toBe(true);
    expect(categories.has('content')).toBe(true);
    expect(categories.has('segments')).toBe(true);
    expect(categories.has('social')).toBe(true);
    expect(categories.has('personality')).toBe(true);
  });

  it('tem pelo menos 1 pergunta por categoria', () => {
    const countByCategory: Record<string, number> = {};
    for (const q of ONBOARDING_QUESTIONS) {
      countByCategory[q.category] = (countByCategory[q.category] ?? 0) + 1;
    }
    for (const cat of Object.keys(countByCategory)) {
      expect(countByCategory[cat]).toBeGreaterThanOrEqual(1);
    }
  });

  it('swipe tem exatamente 2 opcoes', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      if (q.type === 'swipe') {
        expect(q.options).toHaveLength(2);
      }
    }
  });

  it('valores de options sao unicos dentro de cada pergunta', () => {
    for (const q of ONBOARDING_QUESTIONS) {
      if (q.options) {
        const values = q.options.map(o => o.value);
        expect(new Set(values).size).toBe(values.length);
      }
    }
  });
});

describe('BehavioralProfileResult type shape', () => {
  it('tipo creatorDiagnostic tem campos esperados', () => {
    const mock: BehavioralProfileResult = {
      creatorDiagnostic: {
        archetype: 'Educador',
        archetypeEmoji: '📚',
        title: 'O Educador Nato',
        shortDescription: 'Perfil focado em ensinar.',
        strengths: ['Clareza', 'Didatica', 'Paciencia'],
        superpower: 'Transformar complexo em simples',
        contentStyle: 'Tutorial',
        idealFormats: ['Video curto', 'Carrossel'],
        productMatch: ['Educacao', 'Tech'],
        motivationPhrase: 'Voce nasceu pra ensinar!',
        level: 'intermediario',
        readinessScore: 75,
      },
      adminDiagnostic: {
        disc: { D: 30, I: 70, S: 50, C: 40 },
        primaryDisc: 'I',
        riskTolerance: 'medium',
        cameraComfort: 'high',
        experienceLevel: 'intermediate',
        dedicationHours: 4,
        socialPresence: { platforms: ['instagram'], followers: '5k-10k', frequency: 'daily', contentType: 'professional' },
        segmentAffinity: [{ segment: 'Educacao', fitScore: 90, reason: 'Perfil educador' }],
        productTypePreference: 'digital',
        networkExperience: 'informal',
        learningStyle: 'doing',
        resilienceScore: 65,
        motivationDrivers: ['impact', 'growth'],
        onboardingPath: 'standard',
        predictedOutput: 'medium',
        retentionRisk: 'low',
        recommendedActions: ['Atribuir marcas educacionais'],
        tags: ['creator-intermediario', 'educador'],
      },
    };

    expect(mock.creatorDiagnostic.archetype).toBe('Educador');
    expect(mock.adminDiagnostic.disc.D).toBe(30);
    expect(mock.adminDiagnostic.tags).toContain('educador');
    expect(mock.creatorDiagnostic.readinessScore).toBeGreaterThanOrEqual(0);
    expect(mock.creatorDiagnostic.readinessScore).toBeLessThanOrEqual(100);
  });
});

describe('OnboardingAnswers type', () => {
  it('aceita string, string[] e number como valores', () => {
    const answers: OnboardingAnswers = {
      1: 'extra_income',
      9: ['health', 'tech', 'beauty'],
      4: 65,
      13: ['instagram', 'tiktok'],
    };
    expect(typeof answers[1]).toBe('string');
    expect(Array.isArray(answers[9])).toBe(true);
    expect(typeof answers[4]).toBe('number');
  });
});
