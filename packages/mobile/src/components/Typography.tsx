import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { fontSize, fontWeight as fw, lineHeight as lh } from '../lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

type TypoVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'overline';

interface TypographyProps extends TextProps {
  variant?: TypoVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export default function Typography({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...props
}: TypographyProps) {
  const { colors } = useTheme();

  const variantStyles: Record<TypoVariant, TextStyle> = {
    hero: {
      fontSize: fontSize.hero,
      fontWeight: fw.bold,
      color: colors.text,
      lineHeight: fontSize.hero * lh.tight,
    },
    h1: {
      fontSize: fontSize['3xl'],
      fontWeight: fw.bold,
      color: colors.text,
      lineHeight: fontSize['3xl'] * lh.tight,
    },
    h2: {
      fontSize: fontSize.xl,
      fontWeight: fw.bold,
      color: colors.text,
      lineHeight: fontSize.xl * lh.tight,
    },
    h3: {
      fontSize: fontSize.lg,
      fontWeight: fw.semibold,
      color: colors.text,
      lineHeight: fontSize.lg * lh.normal,
    },
    h4: {
      fontSize: fontSize.md,
      fontWeight: fw.semibold,
      color: colors.text,
      lineHeight: fontSize.md * lh.normal,
    },
    body: {
      fontSize: fontSize.md,
      fontWeight: fw.normal,
      color: colors.textSecondary,
      lineHeight: fontSize.md * lh.relaxed,
    },
    bodySmall: {
      fontSize: fontSize.sm,
      fontWeight: fw.normal,
      color: colors.textSecondary,
      lineHeight: fontSize.sm * lh.relaxed,
    },
    caption: {
      fontSize: fontSize.xs,
      fontWeight: fw.normal,
      color: colors.textMuted,
      lineHeight: fontSize.xs * lh.normal,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fw.medium,
      color: colors.textSecondary,
    },
    overline: {
      fontSize: fontSize.xs,
      fontWeight: fw.semibold,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  };

  return (
    <Text
      style={[
        variantStyles[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
