// ============================================
// BRANDLY DESIGN SYSTEM — Tokens
// Alinhado com Brand Guidelines (Wheeler/Kapferer)
// Suporta Light + Dark mode
// ============================================

// ─── Types ───

export interface Colors {
  background: string; surface: string; surfaceLight: string; card: string;
  primary: string; primaryLight: string; primaryDark: string; accent: string; accentLight: string;
  success: string; successLight: string; danger: string; dangerLight: string;
  warning: string; warningLight: string; info: string; infoLight: string; cyan: string;
  text: string; textSecondary: string; textMuted: string; textDisabled: string;
  border: string; borderLight: string;
  overlay: string; overlayHeavy: string; highlight: string;
}

export interface ColorAlpha {
  primary10: string; primary15: string; primary20: string; primary25: string; primary30: string;
  accent10: string; accent20: string;
  success10: string; success20: string;
  danger10: string; danger20: string;
  warning10: string; warning20: string;
  info10: string; info20: string;
  cyan10: string; cyan20: string;
  muted20: string; muted30: string; muted40: string;
  white10: string; white20: string;
}

interface ShadowValue {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Shadows {
  sm: ShadowValue; md: ShadowValue; lg: ShadowValue;
  glowPrimary: ShadowValue; glowPrimarySubtle: ShadowValue;
  glowSuccess: ShadowValue; glowDanger: ShadowValue;
}

// ─── Dark Colors (default) ───

export const colors: Colors = {
  // Backgrounds
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  card: '#111111',

  // Brand
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  accent: '#F59E0B',
  accentLight: '#FBBF24',

  // Semantic
  success: '#10B981',
  successLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  cyan: '#06B6D4',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDisabled: '#4B5563',

  // Border
  border: '#374151',
  borderLight: '#4B5563',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayHeavy: 'rgba(0, 0, 0, 0.7)',
  highlight: 'rgba(124, 58, 237, 0.15)',
};

// ─── Light Colors ───

export const lightColors: Colors = {
  // Backgrounds
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceLight: '#F1F3F5',
  card: '#FFFFFF',

  // Brand — mantidas iguais
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  accent: '#F59E0B',
  accentLight: '#FBBF24',

  // Semantic — mantidas iguais
  success: '#10B981',
  successLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  cyan: '#06B6D4',

  // Text — invertidos
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textDisabled: '#D1D5DB',

  // Border
  border: '#E5E7EB',
  borderLight: '#D1D5DB',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.3)',
  overlayHeavy: 'rgba(0, 0, 0, 0.5)',
  highlight: 'rgba(124, 58, 237, 0.08)',
};

// ─── Dark Color Opacity Tokens ───

export const colorAlpha: ColorAlpha = {
  primary10: 'rgba(124, 58, 237, 0.10)',
  primary15: 'rgba(124, 58, 237, 0.15)',
  primary20: 'rgba(124, 58, 237, 0.20)',
  primary25: 'rgba(124, 58, 237, 0.25)',
  primary30: 'rgba(124, 58, 237, 0.30)',
  accent10: 'rgba(245, 158, 11, 0.10)',
  accent20: 'rgba(245, 158, 11, 0.20)',
  success10: 'rgba(16, 185, 129, 0.10)',
  success20: 'rgba(16, 185, 129, 0.20)',
  danger10: 'rgba(239, 68, 68, 0.10)',
  danger20: 'rgba(239, 68, 68, 0.20)',
  warning10: 'rgba(245, 158, 11, 0.10)',
  warning20: 'rgba(245, 158, 11, 0.20)',
  info10: 'rgba(59, 130, 246, 0.10)',
  info20: 'rgba(59, 130, 246, 0.20)',
  cyan10: 'rgba(6, 182, 212, 0.10)',
  cyan20: 'rgba(6, 182, 212, 0.20)',
  muted20: 'rgba(107, 114, 128, 0.20)',
  muted30: 'rgba(107, 114, 128, 0.30)',
  muted40: 'rgba(107, 114, 128, 0.40)',
  white10: 'rgba(255, 255, 255, 0.10)',
  white20: 'rgba(255, 255, 255, 0.20)',
};

// ─── Light Color Opacity Tokens ───

export const lightColorAlpha: ColorAlpha = {
  primary10: 'rgba(124, 58, 237, 0.06)',
  primary15: 'rgba(124, 58, 237, 0.08)',
  primary20: 'rgba(124, 58, 237, 0.10)',
  primary25: 'rgba(124, 58, 237, 0.14)',
  primary30: 'rgba(124, 58, 237, 0.18)',
  accent10: 'rgba(245, 158, 11, 0.06)',
  accent20: 'rgba(245, 158, 11, 0.12)',
  success10: 'rgba(16, 185, 129, 0.06)',
  success20: 'rgba(16, 185, 129, 0.12)',
  danger10: 'rgba(239, 68, 68, 0.06)',
  danger20: 'rgba(239, 68, 68, 0.12)',
  warning10: 'rgba(245, 158, 11, 0.06)',
  warning20: 'rgba(245, 158, 11, 0.12)',
  info10: 'rgba(59, 130, 246, 0.06)',
  info20: 'rgba(59, 130, 246, 0.12)',
  cyan10: 'rgba(6, 182, 212, 0.06)',
  cyan20: 'rgba(6, 182, 212, 0.12)',
  muted20: 'rgba(107, 114, 128, 0.10)',
  muted30: 'rgba(107, 114, 128, 0.15)',
  muted40: 'rgba(107, 114, 128, 0.20)',
  white10: 'rgba(0, 0, 0, 0.04)',
  white20: 'rgba(0, 0, 0, 0.08)',
};

// ─── Gradient Presets ───

export const gradients = {
  dark: {
    heroCard: ['#1E1040', '#121212'] as [string, string],
    accentWarm: [colors.accent, '#D97706'] as [string, string],
  },
  light: {
    heroCard: ['#F3EEFC', '#FFFFFF'] as [string, string],
    accentWarm: [colors.accent, '#D97706'] as [string, string],
  },
} as const;

// ─── Glass / Surface Opacity Tokens ───

export const glass = {
  dark: {
    surface: 'rgba(255,255,255,0.04)',
    surfaceHover: 'rgba(255,255,255,0.08)',
    shimmer: 'rgba(255,255,255,0.06)',
  },
  light: {
    surface: 'rgba(0,0,0,0.02)',
    surfaceHover: 'rgba(0,0,0,0.06)',
    shimmer: 'rgba(255,255,255,0.4)',
  },
} as const;

// ─── Semantic Color Maps ───

export const statusColors = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
  active: colors.success,
  inactive: colors.textMuted,
} as const;

export const categoryColors: Record<string, string> = {
  beauty: '#EC4899',
  supplements: '#10B981',
  home: '#F59E0B',
  tech: '#3B82F6',
  fashion: '#A78BFA',
  food: '#EF4444',
};

export const levelColors: Record<string, string> = {
  Seed: '#9CA3AF',
  Spark: '#FBBF24',
  Flow: '#34D399',
  Iconic: '#60A5FA',
  Vision: '#A78BFA',
  Empire: '#F472B6',
  Infinity: '#FBBF24',
};

export const platformColors = {
  instagram: '#E1306C',
  tiktok: '#00F2EA',
} as const;

export const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
export const medalGradients: [string, string][] = [
  ['#FFD700', '#F59E0B'],
  ['#C0C0C0', '#9CA3AF'],
  ['#CD7F32', '#92400E'],
];

/** Pure white — for text on gradient/brand-colored backgrounds */
export const WHITE = '#FFFFFF';

// ─── Spacing (base 4px) ───

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '3xl': 64,
} as const;

// ─── Typography ───

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  xxl: 28,
  // Aliases semanticos
  body: 16,
  caption: 12,
  title: 24,
  hero: 40,
  emoji: 48,
} as const;

export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// ─── Border Radius ───

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Dark Shadows ───

export const shadows: Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  // Glow effects (inspired by FlowPilot)
  glowPrimary: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glowPrimarySubtle: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  glowSuccess: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  glowDanger: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};

// ─── Light Shadows ───

export const lightShadows: Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  glowPrimary: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glowPrimarySubtle: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  glowSuccess: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  glowDanger: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
};

// ─── Animation Durations ───

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// ─── Layout Constants ───

export const layout = {
  headerHeight: 56,
  tabBarHeight: 49,
  buttonHeight: 48,
  buttonHeightSm: 36,
  buttonHeightLg: 56,
  inputHeight: 48,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 80,
  iconSm: 16,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,
  dividerHeight: 1,
  progressBarSm: 4,
  progressBarMd: 6,
  progressBarLg: 8,
  dotSm: 8,
  dotMd: 10,
  maxContentWidth: 600,
} as const;
