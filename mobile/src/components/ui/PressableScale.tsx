// mobile/src/components/ui/PressableScale.tsx
// Drop-in replacement for TouchableOpacity: soft spring scale + opacity dip + optional haptic.

import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { motion } from '../../theme/tokens';
import { HapticKind, triggerHaptic } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed (default 0.97). Use ~0.985 for large cards. */
  scaleTo?: number;
  /** Haptic fired on press (default 'light'). */
  haptic?: HapticKind;
  children?: React.ReactNode;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  style,
  scaleTo = motion.press.scale,
  haptic = 'light',
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.spring(progress, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4
    }).start();

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, motion.press.opacity] });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        animate(1);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        animate(0);
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        triggerHaptic(haptic);
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }], opacity: disabled ? 0.5 : opacity }]}
    >
      {children}
    </AnimatedPressable>
  );
};
