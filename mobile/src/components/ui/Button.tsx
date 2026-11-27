// mobile/src/components/ui/Button.tsx
// Accessible interactive button with variants, loading state, and icons

import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme
} from 'react-native';
import { colors, radius, typography, spacing, getShadow } from '../../theme/tokens';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  testID
}) => {
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;

  const sizeStyle: ViewStyle = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 40 },
    md: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 48 },
    lg: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52 }
  }[size];

  const fontSize = {
    sm: typography.fontSizes.sm,
    md: typography.fontSizes.md,
    lg: typography.fontSizes.lg
  }[size];

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; indicator: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: theme.accent,
            borderWidth: 0
          },
          text: {
            color: theme.accentInk
          },
          indicator: theme.accentInk
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.accentMuted,
            borderWidth: 0
          },
          text: {
            color: theme.accent
          },
          indicator: theme.accent
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.accent
          },
          text: {
            color: theme.accent
          },
          indicator: theme.accent
        };
      case 'danger':
        return {
          container: {
            backgroundColor: theme.error,
            borderWidth: 0
          },
          text: {
            color: '#ffffff'
          },
          indicator: '#ffffff'
        };
      case 'ghost':
      default:
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0
          },
          text: {
            color: theme.accent
          },
          indicator: theme.accent
        };
    }
  };

  const vStyle = getVariantStyles();
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      testID={testID}
      haptic={variant === 'danger' ? 'medium' : 'light'}
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        sizeStyle,
        vStyle.container,
                fullWidth && styles.fullWidth,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.indicator} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize },
              vStyle.text,
              icon ? { marginLeft: spacing.xs } : {},
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fullWidth: {
    width: '100%'
  },
  text: {
    fontFamily: typography.fontFamilies.text,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    letterSpacing: 0
  }
});
