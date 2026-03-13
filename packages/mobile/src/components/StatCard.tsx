import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing } from '../lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface StatCardProps {
  label: string;
  value: string;
  icon?: FeatherIconName | React.ReactNode;
  trend?: number; // e.g. 5 for +5%, -3 for -3%
  /** Accent color for icon background and value text */
  color?: string;
  /** Card background tint (10% opacity of the accent color) */
  tinted?: boolean;
  /** Compact mode: smaller padding and font */
  compact?: boolean;
  style?: ViewStyle;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  color,
  tinted = false,
  compact = false,
  style,
}: StatCardProps) {
  const { colors } = useTheme();

  const accentColor = color ?? colors.text;

  const trendColor =
    trend !== undefined && trend >= 0 ? colors.success : colors.danger;
  const trendText =
    trend !== undefined
      ? `${trend >= 0 ? '+' : ''}${trend}%`
      : undefined;

  const tintedBg = tinted && color
    ? { backgroundColor: `${color}15`, borderColor: `${color}30` }
    : { backgroundColor: colors.card, borderColor: colors.border };

  const isIconName = typeof icon === 'string';

  return (
    <View
      style={[
        compact ? styles.containerCompact : styles.container,
        tintedBg,
        style,
      ]}
    >
      {icon && (
        <View style={[
          compact ? styles.iconWrapCompact : styles.iconWrap,
          { backgroundColor: color ? `${color}20` : `${colors.primary}20` },
        ]}>
          {isIconName ? (
            <Feather name={icon as FeatherIconName} size={compact ? 14 : 16} color={accentColor} />
          ) : (
            icon
          )}
        </View>
      )}

      <View style={styles.top}>
        {!icon && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
        )}
      </View>

      <Text
        style={[
          compact ? styles.valueCompact : styles.value,
          { color: color ?? colors.text },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {icon && (
        <Text style={[styles.labelBottom, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}

      {!icon && trendText !== undefined && (
        <Text style={[styles.trend, { color: trendColor }]}>{trendText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  containerCompact: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapCompact: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  valueCompact: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  labelBottom: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  trend: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
});
