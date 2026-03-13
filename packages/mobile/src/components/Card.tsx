import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing } from '../lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Icon shown next to the title */
  icon?: FeatherIconName;
  /** Icon color (defaults to primary) */
  iconColor?: string;
  /** Accent left border color */
  accent?: string;
  /** Visual variant */
  variant?: 'default' | 'glass' | 'elevated';
  /** Right-side header element (badge, action, etc.) */
  headerRight?: React.ReactNode;
  style?: ViewStyle;
  /** Remove default padding */
  noPadding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  icon,
  iconColor,
  accent,
  variant = 'default',
  headerRight,
  style,
  noPadding = false,
}: CardProps) {
  const { colors, colorAlpha, shadows, isDark } = useTheme();

  const variantStyle: ViewStyle = variant === 'glass'
    ? {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }
    : variant === 'elevated'
    ? {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        ...shadows.md,
      }
    : {
        backgroundColor: colors.card,
        borderColor: colors.border,
      };

  const accentStyle: ViewStyle | undefined = accent
    ? { borderLeftWidth: 3, borderLeftColor: accent }
    : undefined;

  const resolvedIconColor = iconColor ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        variantStyle,
        accentStyle,
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && (
              <View style={[styles.iconWrap, { backgroundColor: `${resolvedIconColor}20` }]}>
                <Feather name={icon} size={14} color={resolvedIconColor} />
              </View>
            )}
            <View style={styles.titleGroup}>
              {title && (
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  noPadding: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xxs,
  },
});
