// mobile/app/(tabs)/_layout.tsx
// Adaptive multirole tab shell setting tab titles and icons dynamically from getTabsForRole(activeRole)

import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { colors, typography } from '../../src/theme/tokens';

export default function TabsLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { activeRole } = useAuth();

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
        tabBarStyle: {
          backgroundColor: isDark ? theme.surface : '#ffffff',
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 62,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontFamily: typography.fontFamilies.text,
          fontWeight: typography.fontWeights.medium
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tab0.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tab0.icon as any} size={size || 22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="secondary"
        options={{
          title: tab1.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tab1.icon as any} size={size || 22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="tertiary"
        options={{
          title: tab2.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tab2.icon as any} size={size || 22} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tab3.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tab3.icon as any} size={size || 22} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
