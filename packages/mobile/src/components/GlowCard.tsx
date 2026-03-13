import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, spacing } from '../lib/theme';
import { springConfig } from '../lib/animations';
import { useTheme } from '@/contexts/ThemeContext';

interface GlowCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  disabled?: boolean;
  /** Gradient border colors — creates a gradient border effect */
  gradientBorder?: [string, string];
  /** Enable pulsing glow animation */
  pulse?: boolean;
  /** Variant: 'default' | 'glass' | 'elevated' | 'spotlight' */
  variant?: 'default' | 'glass' | 'elevated' | 'spotlight';
  /** Spotlight accent color (used with variant='spotlight') */
  spotlightColor?: string;
}

export default function GlowCard({
  children,
  onPress,
  style,
  glowColor,
  disabled = false,
  gradientBorder,
  pulse = false,
  variant = 'default',
  spotlightColor,
}: GlowCardProps) {
  const { colors, colorAlpha, isDark } = useTheme();

  const scale = useSharedValue(1);
  const pulseProgress = useSharedValue(0);
  const pressed = useSharedValue(0);

  const isSpotlight = variant === 'spotlight';
  const activeGlow = glowColor ?? (isSpotlight ? (spotlightColor ?? colors.primary) : colors.primary);

  // Breathing glow animation for spotlight variant
  React.useEffect(() => {
    if (isSpotlight || pulse) {
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [isSpotlight, pulse]);

  const tap = Gesture.Tap()
    .enabled(!disabled && (!!onPress || isSpotlight))
    .onBegin(() => {
      scale.value = withSpring(0.975, { damping: 15, stiffness: 400, mass: 0.5 });
      pressed.value = withTiming(1, { duration: 150 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, springConfig);
      pressed.value = withTiming(0, { duration: 300 });
    })
    .onEnd(() => {
      onPress?.();
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => {
    if (!pulse && !isSpotlight) return {};
    const baseRadius = isSpotlight ? 12 : 8;
    const maxRadius = isSpotlight ? 22 : 16;
    const baseOpacity = isSpotlight ? 0.25 : 0.15;
    const maxOpacity = isSpotlight ? 0.5 : 0.35;

    const glowRadius = interpolate(pulseProgress.value, [0, 1], [baseRadius, maxRadius]);
    const glowOpacityVal = interpolate(pulseProgress.value, [0, 1], [baseOpacity, maxOpacity]);

    // Intensify on press
    const pressBoost = pressed.value;
    return {
      shadowRadius: glowRadius + pressBoost * 10,
      shadowOpacity: glowOpacityVal + pressBoost * 0.3,
    };
  });

  // Animated spotlight border glow
  const spotlightBorderStyle = useAnimatedStyle(() => {
    if (!isSpotlight) return {};
    const borderOpacity = interpolate(pulseProgress.value, [0, 1], [0.15, 0.4]);
    const pressBoost = pressed.value;
    return {
      borderColor: `${activeGlow}${Math.round((borderOpacity + pressBoost * 0.3) * 255).toString(16).padStart(2, '0')}`,
    };
  });

  const glowShadow = {
    shadowColor: activeGlow,
    shadowOffset: { width: 0, height: 0 } as const,
    shadowOpacity: isSpotlight ? 0.3 : (glowColor ? 0.25 : (isDark ? 0.2 : 0.1)),
    shadowRadius: isSpotlight ? 14 : (glowColor ? 10 : 8),
    elevation: isSpotlight ? 8 : (glowColor ? 6 : 4),
  };

  // Variant styles
  const variantStyle: ViewStyle = variant === 'glass'
    ? { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }
    : variant === 'elevated'
    ? {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 12,
        elevation: 8,
      }
    : variant === 'spotlight'
    ? {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: `${activeGlow}25`,
      }
    : { backgroundColor: colors.surface };

  // Gradient border: wrap with LinearGradient as border
  if (gradientBorder) {
    return (
      <GestureDetector gesture={tap}>
        <Animated.View style={[animatedStyle, pulseStyle, glowShadow]}>
          <LinearGradient
            colors={gradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBorder, style]}
          >
            <View style={[
              styles.cardInner,
              variantStyle,
              { borderRadius: borderRadius.lg - 1 },
            ]}>
              {children}
            </View>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.card,
          variantStyle,
          !isSpotlight && { borderColor: colors.border },
          glowShadow,
          animatedStyle,
          pulseStyle,
          isSpotlight && spotlightBorderStyle,
          style,
        ]}
      >
        {/* Spotlight inner glow overlay */}
        {isSpotlight && (
          <SpotlightOverlay color={activeGlow} pulseProgress={pulseProgress} pressed={pressed} />
        )}
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

/** Animated inner glow gradient that breathes and reacts to press */
function SpotlightOverlay({
  color,
  pulseProgress,
  pressed,
}: {
  color: string;
  pulseProgress: SharedValue<number>;
  pressed: SharedValue<number>;
}) {
  const overlayStyle = useAnimatedStyle(() => {
    const baseOpacity = interpolate(pulseProgress.value, [0, 1], [0.03, 0.1]);
    const pressBoost = pressed.value * 0.12;
    return {
      opacity: baseOpacity + pressBoost,
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayStyle]}>
      <LinearGradient
        colors={[`${color}40`, `${color}10`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  gradientBorder: {
    borderRadius: borderRadius.lg,
    padding: 1.5,
  },
  cardInner: {
    padding: spacing.md,
    overflow: 'hidden',
  },
});
