import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing, layout } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantMap: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.text },
  secondary: { bg: colors.surfaceLight, text: colors.text },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.textSecondary },
  danger: { bg: colors.danger, text: colors.text },
};

const sizeMap: Record<Size, { height: number; px: number; fs: number }> = {
  sm: { height: layout.buttonHeightSm, px: spacing.md, fs: fontSize.sm },
  md: { height: layout.buttonHeight, px: spacing.lg, fs: fontSize.md },
  lg: { height: layout.buttonHeightLg, px: spacing.xl, fs: fontSize.lg },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const v = variantMap[variant];
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: borderRadius.md,
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={{ color: v.text, fontSize: s.fs, fontWeight: fontWeight.semibold }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
});
