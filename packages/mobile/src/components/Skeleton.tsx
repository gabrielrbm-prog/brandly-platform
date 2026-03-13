import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors, borderRadius as br } from '../lib/theme';

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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceLight,
        },
        animatedStyle,
        style,
      ]}
    />
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
          height={14}
          borderRadius={br.xs}
          style={i > 0 ? { marginTop: 8 } : undefined}
        />
      ))}
    </>
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonCard() {
  return (
    <Animated.View
      style={{
        backgroundColor: colors.surface,
        borderRadius: br.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}
    >
      <Skeleton width="40%" height={16} borderRadius={br.xs} />
      <Skeleton width="100%" height={14} borderRadius={br.xs} />
      <Skeleton width="70%" height={14} borderRadius={br.xs} />
    </Animated.View>
  );
}
