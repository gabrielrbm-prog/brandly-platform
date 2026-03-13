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
  /** Variant: 'default' | 'glass' | 'elevated' */
  variant?: 'default' | 'glass' | 'elevated';
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
}: GlowCardProps) {
  const { colors, colorAlpha, isDark } = useTheme();

  const scale = useSharedValue(1);
  const pulseProgress = useSharedValue(0);

  // Pulse animation
  React.useEffect(() => {
    if (pulse) {
      pulseProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [pulse]);

  const tap = Gesture.Tap()
    .enabled(!disabled && !!onPress)
    .onBegin(() => {
      scale.value = withSpring(0.975, { damping: 15, stiffness: 400, mass: 0.5 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, springConfig);
    })
    .onEnd(() => {
      onPress?.();
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => {
    if (!pulse) return {};
    const glowRadius = interpolate(pulseProgress.value, [0, 1], [8, 16]);
    const glowOpacity = interpolate(pulseProgress.value, [0, 1], [0.15, 0.35]);
    return {
      shadowRadius: glowRadius,
      shadowOpacity: glowOpacity,
    };
  });

  const glowShadow = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 } as const,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
      }
    : {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 } as const,
        shadowOpacity: isDark ? 0.2 : 0.1,
        shadowRadius: 8,
        elevation: 4,
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
          { borderColor: colors.border },
          glowShadow,
          animatedStyle,
          pulseStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
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
    padding: 1.5, // gradient border thickness
  },
  cardInner: {
    padding: spacing.md,
    overflow: 'hidden',
  },
});
