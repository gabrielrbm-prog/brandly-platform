import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../lib/theme';

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
  const trendColor =
    trend !== undefined && trend >= 0 ? colors.success : colors.danger;
  const trendText =
    trend !== undefined
      ? `${trend >= 0 ? '+' : ''}${trend}%`
      : undefined;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>

      <Text style={styles.value}>{value}</Text>

      {trendText !== undefined && (
        <Text style={[styles.trend, { color: trendColor }]}>{trendText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  icon: {
    opacity: 0.7,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  trend: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
