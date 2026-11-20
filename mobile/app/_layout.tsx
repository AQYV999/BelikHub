// mobile/app/_layout.tsx
// Root layout configuring SafeAreaProvider, AuthProvider, and route protection

import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { colors } from '../src/theme/tokens';
import { ToastProvider } from '../src/components/ui/Toast';
import { ScreenSkeleton } from '../src/components/ui/Skeleton';

// Web only: inject Ionicons @font-face so missing-glyph boxes (▯) never appear
function useWebIconFontFace() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('belikhub-icon-fonts')) return;
    try {
      const ttf: any = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
      const uri = typeof ttf === 'string' ? ttf : ttf?.uri || ttf?.default;
      if (!uri) return;
      const style = document.createElement('style');
      style.id = 'belikhub-icon-fonts';
      style.textContent = `@font-face{font-family:"ionicons";src:url("${uri}") format("truetype");font-display:block;}
html,body,#root{height:100%;margin:0;background:#0b131e;}`;
      document.head.appendChild(style);
    } catch {
      // fallback
    }
  }, []);
}

/** Center smartphone frame on desktop/laptop web browsers */
const WebFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webBackdrop}>
      <View style={styles.webFrame}>{children}</View>
    </View>
  );
};

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
  useWebIconFontFace();
  return (
    <WebFrame>
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
    </WebFrame>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    // @ts-ignore web-only
    minHeight: '100vh'
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    marginHorizontal: 'auto' as any,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    // @ts-ignore web-only
    boxShadow: '0 0 50px rgba(0,0,0,0.4)'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  }
});
