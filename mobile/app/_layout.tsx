// mobile/app/_layout.tsx
// Root layout configuring SafeAreaProvider, AuthProvider, and route protection

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '../src/theme/useColorScheme';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { colors } from '../src/theme/tokens';
import { ToastProvider } from '../src/components/ui/Toast';
import { I18nProvider } from '../src/i18n';
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
      // The showcase and telemetry consoles are public; sign-in is only required for tickets/audit data.
      // Nothing to redirect: login and onboarding are reached on demand.
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

// Web only: make sure the Ionicons @font-face exists in <head> even if the runtime loader
// is slow or blocked, so icons never render as the missing-glyph box.
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
html,body,#root{height:100%;margin:0;background:#E2E8F0;}`;
      document.head.appendChild(style);
    } catch {
      // Falls back to expo-font's own loader below.
    }
  }, []);
}

/** On desktop browsers the app renders as a centred phone-width column instead of stretching. */
const WebFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webBackdrop}>
      <View style={styles.webFrame}>{children}</View>
    </View>
  );
};

export default function RootLayout() {
  useWebIconFontFace();
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded && Platform.OS !== 'web') return null;
  return (
    <WebFrame>
    <SafeAreaProvider>
      <AuthProvider>
        <I18nProvider>
        <ToastProvider>
        <NavigationGuard>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
          </Stack>
        </NavigationGuard>
        </ToastProvider>
        </I18nProvider>
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
    backgroundColor: '#E2E8F0',
    // @ts-ignore web-only
    minHeight: '100vh'
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    marginHorizontal: 'auto' as any,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    // @ts-ignore web-only
    boxShadow: '0 0 40px rgba(15,23,42,0.12)'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  }
});
