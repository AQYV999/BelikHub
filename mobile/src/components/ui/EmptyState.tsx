// mobile/src/components/ui/EmptyState.tsx
// Component rendered when lists or data sets are empty

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={[styles.iconWrapper, { backgroundColor: theme.tint }]}>
          {typeof icon === 'string' ? <Ionicons name={icon as any} size={28} color={theme.accent} /> : icon}
        </View>
      ) : null}
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.muted }]}>
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  title: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  description: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 21
  },
  actionBtn: {
    marginTop: spacing.lg
  }
});
