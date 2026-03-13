import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius as br, spacing, fontSize, glass } from '../lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width,
  height,
  borderRadius = br.sm,
  style,
}: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-200, 200]) },
    ],
  }));

  const baseOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.6, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? colors.surfaceLight : colors.border,
          overflow: 'hidden',
        },
        baseOpacity,
        style,
      ]}
    >
      {/* Shimmer sweep */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          shimmerStyle,
          { width: 200 },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            isDark ? glass.dark.shimmer : glass.light.shimmer,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

// Presets para uso rapido
export function SkeletonText({ width = 120, lines = 1 }: { width?: number | `${number}%`; lines?: number }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? '60%' : width}
          height={fontSize.sm}
          borderRadius={br.xs}
          style={i > 0 ? { marginTop: spacing.sm } : undefined}
        />
      ))}
    </>
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonCard() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: br.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm + spacing.xs,
      }}
    >
      <Skeleton width="40%" height={16} borderRadius={br.xs} />
      <Skeleton width="100%" height={14} borderRadius={br.xs} />
      <Skeleton width="70%" height={14} borderRadius={br.xs} />
    </View>
  );
}
