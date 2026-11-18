// mobile/src/components/ui/Card.tsx
// Surface container card with border, padding, and subtle shadow

import React, { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  useColorScheme
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme/tokens';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'outlined',
  padding = 'md'
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const paddingStyle = {
    none: { padding: 0 },
    sm: { padding: spacing.sm },
    md: { padding: spacing.lg },
    lg: { padding: spacing.xl }
  }[padding];

  const variantStyle: ViewStyle = {
    backgroundColor: variant === 'flat' ? theme.surface : theme.card,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: theme.border,
    ...(variant === 'elevated' ? (isDark ? {} : shadows.sm) : {})
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.base, variantStyle, paddingStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, variantStyle, paddingStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    marginVertical: 6,
    overflow: 'hidden'
  }
});
