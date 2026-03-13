import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface GlowOrbProps {
  color: string;
  size?: number;
  opacity?: number;
  style?: ViewStyle;
  /** Enable floating animation */
  animate?: boolean;
}

/**
 * Decorative glow orb — blurred colored circle for ambient effects.
 * Inspired by FlowPilot's GlowOrb + mesh background.
 */
export default function GlowOrb({
  color,
  size = 120,
  opacity = 0.15,
  style,
  animate = true,
}: GlowOrbProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!animate) return {};
    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [0, -6]) },
        { scale: interpolate(progress.value, [0, 1], [1, 1.05]) },
      ],
    };
  });

  const blurRadius = Math.min(size / 3, 100);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          // Simulate blur via large shadow spread
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: blurRadius,
          elevation: 0,
        },
        animatedStyle,
        style,
      ]}
      pointerEvents="none"
    />
  );
}
