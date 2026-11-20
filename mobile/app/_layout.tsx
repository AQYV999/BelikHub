// mobile/app/_layout.tsx
// Root layout configuring SafeAreaProvider, AuthProvider, and route protection

import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { colors } from '../src/theme/tokens';
import { ToastProvider } from '../src/components/ui/Toast';
import { ScreenSkeleton } from '../src/components/ui/Skeleton';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isDemoMode } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;

  useEffect(() => {
    if (loading) return;

    const currentScreen = segments[0] as string | undefined;

    if (!user) {
      if (currentScreen !== 'login' && currentScreen !== 'onboarding') {
        router.replace('/login');
      }
    } else {
      const hasRoles = isDemoMode || (user.roles && user.roles.length > 0);
      if (!hasRoles) {
        if (currentScreen !== 'onboarding') {
          router.replace('/onboarding');
        }
      } else {
        if (currentScreen === 'login') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [user, loading, isDemoMode, segments, router]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <ScreenSkeleton cards={2} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
        <NavigationGuard>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
          </Stack>
        </NavigationGuard>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  }
});
