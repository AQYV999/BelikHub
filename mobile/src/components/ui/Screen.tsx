// mobile/src/components/ui/Screen.tsx
// Safe area layout container with optional scroll and pull-to-refresh

import React, { ReactNode, useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  RefreshControl,
  StatusBar,
  useColorScheme,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { DemoBanner } from './DemoBanner';
import { ScreenSkeleton } from './Skeleton';
import { useAuth } from '../../auth/AuthProvider';

export interface ScreenProps {
  children?: ReactNode;
  scrollable?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showDemoBanner?: boolean;
  /** Show a shimmering skeleton instead of children (first load). */
  loading?: boolean;
  /** Pad the bottom safe-area inset. Leave off inside tabs (the tab bar already handles it). */
  safeBottom?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
  showDemoBanner = true,
  loading = false,
  safeBottom = false
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { isDemoMode } = useAuth();

  // Gentle fade/slide-in whenever content swaps from skeleton to real data.
  const enter = useRef(new Animated.Value(loading ? 1 : 0)).current;
  useEffect(() => {
    if (loading) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [loading, enter]);
  const enterStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }]
  };
  const AnimatedScroll = Animated.ScrollView;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: insets.top,
    paddingBottom: safeBottom ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right
  };

  return (
    <View style={[containerStyle, style]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      {showDemoBanner && isDemoMode && <DemoBanner />}
      {scrollable ? (
        <AnimatedScroll
          style={[styles.scroll, enterStyle]}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent}
                colors={[theme.accent]}
              />
            ) : undefined
          }
        >
          {loading ? <ScreenSkeleton /> : children}
        </AnimatedScroll>
      ) : (
        <Animated.View style={[styles.staticContent, contentContainerStyle, enterStyle]}>
          {loading ? <ScreenSkeleton /> : children}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16
  }
});
