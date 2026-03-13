// ============================================
// BRANDLY — Animation Presets (Reanimated)
// Inspirado no FlowPilot: stagger, spring, fadeInUp
// ============================================

import {
  withTiming,
  withSpring,
  withDelay,
  Easing,
  type WithTimingConfig,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { duration } from './theme';

// ─── Timing Configs ───

export const smoothConfig: WithTimingConfig = {
  duration: duration.normal,
  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
};

export const fastConfig: WithTimingConfig = {
  duration: duration.fast,
  easing: Easing.out(Easing.cubic),
};

export const slowConfig: WithTimingConfig = {
  duration: duration.slow,
  easing: Easing.inOut(Easing.ease),
};

// ─── Spring Configs ───

export const springConfig: WithSpringConfig = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

export const bouncySpring: WithSpringConfig = {
  damping: 12,
  stiffness: 200,
  mass: 0.6,
};

export const gentleSpring: WithSpringConfig = {
  damping: 30,
  stiffness: 150,
  mass: 1,
};

// ─── Preset Animations ───

/** Press effect: scale down to 0.97 */
export function pressScale(pressed: boolean) {
  'worklet';
  return withSpring(pressed ? 0.97 : 1, springConfig);
}

/** Glow shadow for primary buttons (iOS only) */
export const glowShadow = {
  shadowColor: '#7C3AED',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
};

export const glowShadowSubtle = {
  shadowColor: '#7C3AED',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
};

/** Stagger delay for list items (60ms between each) */
export function staggerDelay(index: number, baseDelay = 0) {
  return baseDelay + index * 60;
}

/** Animated value with stagger: use in entering/layout animations */
export function staggeredTiming(index: number, toValue: number, config?: WithTimingConfig) {
  return withDelay(
    staggerDelay(index),
    withTiming(toValue, config ?? smoothConfig),
  );
}

export function staggeredSpring(index: number, toValue: number, config?: WithSpringConfig) {
  return withDelay(
    staggerDelay(index),
    withSpring(toValue, config ?? springConfig),
  );
}
