// mobile/src/components/ui/Badge.tsx
// Status tag / chip with distinct semantic colors

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, typography } from '../../theme/tokens';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'accent'
  | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const colorMap: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
    success: {
      bg: theme.successBg,
      text: theme.successInk,
      border: isDark ? 'transparent' : '#bbf7d0'
    },
    warning: {
      bg: theme.warningBg,
      text: theme.warningInk,
      border: isDark ? 'transparent' : '#fde68a'
    },
    error: {
      bg: theme.errorBg,
      text: theme.errorInk,
      border: isDark ? 'transparent' : '#fecaca'
    },
    accent: {
      bg: isDark ? 'rgba(45, 212, 191, 0.15)' : '#e0f2f1',
      text: theme.accent,
      border: isDark ? 'rgba(45, 212, 191, 0.3)' : '#b2dfdb'
    },
    info: {
      bg: theme.infoBg,
      text: theme.infoInk,
      border: isDark ? 'transparent' : '#bae6fd'
    },
    neutral: {
      bg: theme.surface,
      text: theme.muted,
      border: theme.border
    }
  };

  const currentColors = colorMap[variant];

  const sizeStyle: ViewStyle = size === 'sm'
    ? { paddingHorizontal: 8, paddingVertical: 2 }
    : { paddingHorizontal: 10, paddingVertical: 4 };

  const fontSizeStyle: TextStyle = size === 'sm'
    ? { fontSize: typography.fontSizes.xs }
    : { fontSize: typography.fontSizes.sm };

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.badge,
        sizeStyle,
        {
          backgroundColor: currentColors.bg,
          borderColor: currentColors.border || 'transparent'
        },
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          fontSizeStyle,
          { color: currentColors.text },
          textStyle
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontFamily: typography.fontFamilies.text,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: 0.2
  }
});
