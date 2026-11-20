// mobile/src/components/ui/ProgressBar.tsx
// Visual progress bar with BelikHub accent color and percentage display

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
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
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [clamped, anim]);

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
            backgroundColor: isDark ? theme.surfaceHighlight : theme.surface,
            borderRadius: radius.sm
          }
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              backgroundColor: theme.accent,
              borderRadius: radius.sm
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
