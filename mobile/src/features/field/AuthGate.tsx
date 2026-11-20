// mobile/src/features/field/AuthGate.tsx
// Wraps screens that need data access: shows a sign-in / demo prompt instead of a hard redirect.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Button, AppHeader } from '../../components/ui';
import { useAuth } from '../../auth/AuthProvider';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, textStyles } from '../../theme/tokens';
import { useI18n } from '../../i18n';

export const AuthGate: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const { user, isDemoMode, enterDemoMode } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  if (user || isDemoMode) return <>{children}</>;

  const demoEnabled = process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true' || process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === undefined;
  return (
    <Screen contentContainerStyle={styles.container}>
      <AppHeader title={title} />
      <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="lock-closed-outline" size={22} color={theme.muted} />
        <Text style={[textStyles.body, { color: theme.muted }]}>{t('common.signInGate')}</Text>
        <Button title={t('common.signIn')} fullWidth onPress={() => router.push('/login')} />
        {demoEnabled && (
          <Button title={t('common.demo')} variant="outline" fullWidth onPress={() => enterDemoMode('pengelola')} />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  box: { borderWidth: 1, borderRadius: radius.md, padding: spacing.xl, gap: spacing.md }
});
