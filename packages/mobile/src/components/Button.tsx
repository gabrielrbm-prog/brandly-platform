import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { borderRadius, fontSize, fontWeight, spacing, layout } from '../lib/theme';
import { springConfig, glowShadow } from '../lib/animations';
import { useTheme } from '@/contexts/ThemeContext';

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
  glow?: boolean;
}

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
  glow = false,
}: ButtonProps) {
  const { colors, shadows } = useTheme();

  const variantMap: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.text },
    secondary: { bg: colors.surfaceLight, text: colors.text },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.textSecondary },
    danger: { bg: colors.danger, text: colors.text },
  };

  const v = variantMap[variant];
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const tap = Gesture.Tap()
    .enabled(!isDisabled)
    .onBegin(() => {
      scale.value = withSpring(0.97, springConfig);
      opacity.value = withSpring(0.85, springConfig);
    })
    .onFinalize(() => {
      scale.value = withSpring(1, springConfig);
      opacity.value = withSpring(1, springConfig);
    })
    .onEnd(() => {
      onPress();
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? 0.5 : opacity.value,
  }));

  const showGlow = glow || variant === 'primary';

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            height: s.height,
            paddingHorizontal: s.px,
            borderRadius: borderRadius.md,
            backgroundColor: v.bg,
            borderColor: v.border ?? 'transparent',
            borderWidth: v.border ? 1.5 : 0,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            alignSelf: fullWidth ? ('stretch' as const) : ('flex-start' as const),
          },
          showGlow && !isDisabled ? glowShadow : shadows.sm,
          animatedStyle,
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
      </Animated.View>
    </GestureDetector>
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
