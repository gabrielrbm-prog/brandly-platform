import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, fontSize, spacing } from '../lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: number; // e.g. 5 for +5%, -3 for -3%
  style?: ViewStyle;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  style,
}: StatCardProps) {
  const { colors } = useTheme();

  const trendColor =
    trend !== undefined && trend >= 0 ? colors.success : colors.danger;
  const trendText =
    trend !== undefined
      ? `${trend >= 0 ? '+' : ''}${trend}%`
      : undefined;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>

      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>

      {trendText !== undefined && (
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
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
  },
  icon: {
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  trend: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
