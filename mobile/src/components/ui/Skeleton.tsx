// mobile/src/components/ui/Skeleton.tsx
// Shimmering placeholder blocks + a ready-made screen skeleton.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, getShadow, radius, spacing } from '../../theme/tokens';

const STRIPS = 9;

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radiusSize?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 14,
  radiusSize = radius.sm,
  style
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const band = Math.max(90, w * 0.55);

  useEffect(() => {
    if (!w) return;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [w, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-band, w] });
  const base = isDark ? 'rgba(241,246,248,0.07)' : 'rgba(31,48,56,0.07)';
  const glow = isDark ? '#ffffff' : '#ffffff';
  const peak = isDark ? 0.09 : 0.75;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius: radiusSize, backgroundColor: base, overflow: 'hidden' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {w > 0 && (
        <Animated.View style={[styles.band, { width: band, transform: [{ translateX }] }]}>
          {Array.from({ length: STRIPS }).map((_, i) => {
            // Smooth bell curve fakes a soft gradient without a gradient dependency.
            const t = (i + 0.5) / STRIPS;
            const o = Math.sin(Math.PI * t) ** 2 * peak;
            return <View key={i} style={{ flex: 1, backgroundColor: glow, opacity: o }} />;
          })}
        </Animated.View>
      )}
    </View>
  );
};

const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        getShadow('sm', isDark)
      ]}
    >
      <View style={styles.row}>
        <Skeleton width={36} height={36} radiusSize={radius.sm} />
        <View style={styles.flex}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={10} style={{ marginTop: 8 }} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} style={{ marginTop: 12 }} />
      ))}
    </View>
  );
};

export const ScreenSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <View accessibilityLabel="Memuat" accessibilityRole="progressbar">
    <View style={styles.header}>
      <Skeleton width="30%" height={12} />
      <Skeleton width="60%" height={26} radiusSize={radius.sm} style={{ marginTop: 10 }} />
    </View>
    {Array.from({ length: cards }).map((_, i) => (
      <SkeletonCard key={i} lines={i === 0 ? 2 : 3} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },
  header: { marginBottom: spacing.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginVertical: 6
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 }
});
