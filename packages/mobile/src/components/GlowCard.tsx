import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, borderRadius, spacing } from '../lib/theme';
import { springConfig, glowShadowSubtle } from '../lib/animations';

interface GlowCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  glowColor?: string;
  disabled?: boolean;
}

/**
 * Card with press scale effect and glow shadow.
 * Inspired by FlowPilot's GlowCard (pointer-tracking not possible in RN,
 * but we replicate the feel with spring-based press + glow shadow).
 */
export default function GlowCard({
  children,
  onPress,
  style,
  glowColor,
  disabled = false,
}: GlowCardProps) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .enabled(!disabled && !!onPress)
    .onBegin(() => {
      scale.value = withSpring(0.98, springConfig);
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

  const customGlow = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
      }
    : glowShadowSubtle;

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.card,
          customGlow,
          animatedStyle,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
