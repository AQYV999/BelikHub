// mobile/src/components/ui/Button.tsx
// Accessible interactive button with variants, loading state, and icons

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme
} from 'react-native';
import { colors, radius, typography, spacing } from '../../theme/tokens';

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
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const sizeStyle: ViewStyle = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 46 },
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
            backgroundColor: theme.surface,
            borderWidth: 0
          },
          text: {
            color: theme.ink
          },
          indicator: theme.ink
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
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        sizeStyle,
        vStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
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
    </TouchableOpacity>
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
  disabled: {
    opacity: 0.5
  },
  text: {
    fontFamily: typography.fontFamilies.text,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center'
  }
});
