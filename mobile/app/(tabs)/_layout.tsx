// mobile/app/(tabs)/_layout.tsx
// Adaptive multirole tab shell setting tab titles and icons dynamically from getTabsForRole(activeRole)

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useColorScheme } from '../../src/theme/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { colors, typography } from '../../src/theme/tokens';
import { PressableScale } from '../../src/components/ui/PressableScale';
import { triggerHaptic } from '../../src/utils/haptics';

// Tab button with soft press feedback and a selection haptic on tab change.
function HapticTabButton({ children, onPress, onLongPress, accessibilityState, accessibilityLabel, testID, style }: BottomTabBarButtonProps) {
  const selected = !!accessibilityState?.selected;
  return (
    <PressableScale
      haptic="none"
      scaleTo={0.92}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onLongPress={onLongPress}
      onPress={(e) => {
        if (!selected) triggerHaptic('selection');
        onPress?.(e as any);
      }}
      style={[style, styles.tabButton]}
    >
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tabButton: { alignItems: 'center', justifyContent: 'center' }
});

const tabIcon = (name: string, focused: boolean) =>
  (focused ? name.replace(/-outline$/, '') : name) as any;

export const unstable_settings = { initialRouteName: 'showcase' };

export default function TabsLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);

  const icon = (name: string) => ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={tabIcon(name, focused)} size={size || 24} color={color} />
  );

  return (
    <Tabs
      initialRouteName="showcase"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarButton: (props) => <HapticTabButton {...props} />,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: typography.fontFamilies.text,
          fontWeight: typography.fontWeights.semibold,
          letterSpacing: 0.2
        }
      }}
    >
      <Tabs.Screen name="showcase" options={{ title: t('tab.science'), tabBarIcon: icon('flask-outline') }} />
      <Tabs.Screen name="telemetry" options={{ title: t('tab.telemetry'), tabBarIcon: icon('pulse-outline') }} />
      <Tabs.Screen name="tickets" options={{ title: t('tab.tickets'), tabBarIcon: icon('construct-outline') }} />
      <Tabs.Screen name="audit" options={{ title: t('tab.audit'), tabBarIcon: icon('document-text-outline') }} />

      {/* Legacy role workspaces: still reachable from Account, but not part of the primary navigation. */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="secondary" options={{ href: null }} />
      <Tabs.Screen name="tertiary" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
