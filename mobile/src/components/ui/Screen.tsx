// mobile/src/components/ui/Screen.tsx
// Safe area layout container with optional scroll and pull-to-refresh

import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
  useColorScheme,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { DemoBanner } from './DemoBanner';
import { useAuth } from '../../auth/AuthProvider';

export interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showDemoBanner?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
  showDemoBanner = true
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { isDemoMode } = useAuth();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
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
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16
  }
});
