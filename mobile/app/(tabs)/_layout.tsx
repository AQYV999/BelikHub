// mobile/app/(tabs)/_layout.tsx
// Adaptive multirole tab shell setting tab titles and icons dynamically from getTabsForRole(activeRole)

import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { colors, typography, shadows } from '../../src/theme/tokens';
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

export default function TabsLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { activeRole } = useAuth();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);

  const roleTabs = getTabsForRole(activeRole);
  const tab0 = roleTabs[0] || { title: 'Beranda', icon: 'home-outline' };
  const tab1 = roleTabs[1] || { title: 'Kedua', icon: 'layers-outline' };
  const tab2 = roleTabs[2] || { title: 'Ketiga', icon: 'grid-outline' };
  const tab3 = roleTabs[3] || { title: 'Profil', icon: 'person-outline' };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        animation: 'fade',
        tabBarButton: (props) => <HapticTabButton {...props} />,
        tabBarStyle: {
          backgroundColor: isDark ? theme.surface : '#ffffff',
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          ...(isDark ? {} : { ...shadows.md, shadowOffset: { width: 0, height: -4 } })
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontFamily: typography.fontFamilies.text,
          fontWeight: typography.fontWeights.semibold,
          letterSpacing: 0.2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tab0.title,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={tabIcon(tab0.icon, focused)} size={size || 24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="secondary"
        options={{
          title: tab1.title,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={tabIcon(tab1.icon, focused)} size={size || 24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="tertiary"
        options={{
          title: tab2.title,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={tabIcon(tab2.icon, focused)} size={size || 24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tab3.title,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={tabIcon(tab3.icon, focused)} size={size || 24} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
