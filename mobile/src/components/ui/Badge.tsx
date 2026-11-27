// mobile/src/components/ui/Badge.tsx
// Status tag / chip with distinct semantic colors

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';
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
  const isDark = false;
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
      bg: '#E2ECE9',
      text: theme.accent,
      border: 'transparent'
    },
    info: {
      bg: theme.infoBg,
      text: theme.infoInk,
      border: isDark ? 'transparent' : '#bae6fd'
    },
    neutral: {
      bg: 'rgba(15, 23, 42, 0.07)',
      text: theme.muted,
      border: 'transparent'
    }
  };

  const currentColors = colorMap[variant];

  const sizeStyle: ViewStyle = size === 'sm'
    ? { paddingHorizontal: 8, minHeight: 20 }
    : { paddingHorizontal: 9, minHeight: 22 };

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
    borderRadius: radius.full,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontFamily: typography.fontFamilies.text,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: 0.2
  }
});
