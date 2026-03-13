import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { springConfig, smoothConfig } from '../lib/animations';

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
  style?: ViewStyle;
  staggerMs?: number;
  type?: 'fadeUp' | 'fadeIn' | 'scaleIn';
}

/**
 * Wrap each list item with this component for staggered entrance animations.
 * Inspired by FlowPilot's staggerContainer pattern (60ms delay between items).
 *
 * Usage:
 * ```
 * {items.map((item, i) => (
 *   <AnimatedListItem key={item.id} index={i}>
 *     <YourCard item={item} />
 *   </AnimatedListItem>
 * ))}
 * ```
 */
export default function AnimatedListItem({
  index,
  children,
  style,
  staggerMs = 60,
  type = 'fadeUp',
}: AnimatedListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(type === 'fadeUp' ? 20 : 0);
  const scale = useSharedValue(type === 'scaleIn' ? 0.95 : 1);

  useEffect(() => {
    const delay = index * staggerMs;

    opacity.value = withDelay(delay, withTiming(1, smoothConfig));

    if (type === 'fadeUp') {
      translateY.value = withDelay(delay, withSpring(0, springConfig));
    } else if (type === 'scaleIn') {
      scale.value = withDelay(delay, withSpring(1, springConfig));
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Page-level fade in (for entire screens) ───

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, delay = 0, style }: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
