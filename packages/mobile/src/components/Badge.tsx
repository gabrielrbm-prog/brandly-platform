import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../lib/theme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string;
  style?: ViewStyle;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surfaceLight, text: colors.textSecondary },
  primary: { bg: colors.primary + '25', text: colors.primaryLight },
  success: { bg: colors.success + '20', text: colors.success },
  warning: { bg: colors.warning + '20', text: colors.warning },
  danger: { bg: colors.danger + '20', text: colors.danger },
  info: { bg: colors.info + '20', text: colors.info },
};

export default function Badge({
  label,
  variant = 'default',
  size = 'sm',
  color,
  style,
}: BadgeProps) {
  const v = color
    ? { bg: color + '20', text: color }
    : variantMap[variant];

  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingHorizontal: isSm ? spacing.sm : spacing.md,
          paddingVertical: isSm ? spacing.xxs : spacing.xs,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: v.text,
            fontSize: isSm ? fontSize.xs : fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
});
