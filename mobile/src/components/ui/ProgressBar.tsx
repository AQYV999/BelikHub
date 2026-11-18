// mobile/src/components/ui/ProgressBar.tsx
// Visual progress bar with BelikHub accent color and percentage display

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { colors, radius, typography, spacing } from '../../theme/tokens';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  labelPrefix?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  labelPrefix = 'Progres:',
  height = 8,
  style
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, style]}>
      {showLabel ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.muted }]}>{labelPrefix}</Text>
          <Text style={[styles.percent, { color: theme.accent }]}>{Math.round(clamped)}%</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: isDark ? theme.surfaceHighlight : '#e2e8f0',
            borderRadius: radius.full
          }
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: theme.accent,
              borderRadius: radius.full
            }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%'
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  label: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  percent: {
    fontFamily: typography.fontFamilies.mono,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold
  },
  track: {
    width: '100%',
    overflow: 'hidden'
  },
  fill: {
    height: '100%'
  }
});
