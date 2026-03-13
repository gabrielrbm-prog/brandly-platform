// ============================================
// BRANDLY DESIGN SYSTEM — Tokens
// ============================================

// ─── Colors ───

export const colors = {
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
  highlight: 'rgba(124, 58, 237, 0.15)', // primary/15
} as const;

// ─── Semantic Color Maps (para usar em componentes especificos) ───

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

// ─── Shadows (para usar com RN shadow props) ───

export const shadows = {
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
} as const;

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
  inputHeight: 48,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 80,
  maxContentWidth: 600,
} as const;
