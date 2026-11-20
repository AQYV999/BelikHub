// mobile/src/components/ui/Input.tsx
// Styled text input with label, helper, error, and focus state

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, typography, spacing } from '../../theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  leftAccessory,
  rightAccessory,
  style,
  ...textInputProps
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.ink }]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isFocused ? (isDark ? theme.surfaceHighlight : '#ffffff') : isDark ? theme.surface : theme.bg,
            borderColor: error
              ? theme.error
              : isFocused
              ? theme.accent
              : theme.border
          }
        ]}
      >
        {leftAccessory}
        <TextInput
          placeholderTextColor={theme.muted}
          style={[
            styles.input,
            { color: theme.ink },
            style
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          {...textInputProps}
        />
        {rightAccessory}
      </View>

      {error ? (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: theme.muted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%'
  },
  label: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.1
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.md,
    paddingVertical: 10
  },
  error: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs
  },
  helper: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs
  }
});
