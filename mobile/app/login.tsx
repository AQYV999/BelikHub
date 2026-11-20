// mobile/app/login.tsx
// Email/password authentication, registration toggle, and prominent Demo Mode button

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, Input, PressableScale } from '../src/components/ui';
import { colors, typography, spacing, radius } from '../src/theme/tokens';
import { useAuth } from '../src/auth/AuthProvider';

export default function LoginScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const { signIn, signUp, enterDemoMode } = useAuth();

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('warga.bismo@belikhub.id');
  const [password, setPassword] = useState<string>('belikhub123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const enableDemoMode =
    process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true' ||
    process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === undefined;

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email.trim(), password.trim());
        router.push('/onboarding');
      } else {
        await signIn(email.trim(), password.trim());
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Gagal masuk. Periksa kembali email dan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    enterDemoMode('warga');
    router.replace('/(tabs)');
  };

  return (
    <Screen safeBottom scrollable showDemoBanner={false} contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoIconCircle, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="water" size={36} color={theme.accent} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.ink }]}>BelikHub</Text>
          <Text style={[styles.brandTagline, { color: theme.muted }]}>
            Platform Konservasi & Retribusi Mata Air Komunitas
          </Text>
        </View>

        {/* Auth Form Card */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.ink }]}>
              {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Akun'}
            </Text>
            <Badge
              label={isRegister ? 'Registrasi' : 'Login'}
              variant="accent"
              size="sm"
            />
          </View>

          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
              <Ionicons name="alert-circle" size={16} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.errorInk }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Input
            testID="input-email"
            label="Alamat Email"
            placeholder="nama@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            testID="input-password"
            label="Kata Sandi"
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            testID="submit-auth-button"
            title={isRegister ? 'Daftar Akun' : 'Masuk Sekarang'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleText, { color: theme.muted }]}>
              {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}
            </Text>
            <PressableScale
              onPress={() => {
                setIsRegister(!isRegister);
                setErrorMessage('');
              }}
              style={styles.toggleBtn}
            >
              <Text style={[styles.toggleAction, { color: theme.accent }]}>
                {isRegister ? 'Masuk di sini' : 'Daftar sekarang'}
              </Text>
            </PressableScale>
          </View>
        </Card>

        {/* Prominent Demo Mode Access Card */}
        {enableDemoMode && (
          <Card variant="outlined" padding="md" style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="flask-outline" size={20} color="#d97706" />
              <Text style={[styles.demoTitle, { color: isDark ? '#fef3c7' : '#92400e' }]}>
                Eksplorasi Tanpa Akun Live
              </Text>
            </View>
            <Text style={[styles.demoDesc, { color: theme.muted }]}>
              Coba langsung seluruh alur 5 peran (Warga, Pengelola, Relawan, Donatur, Admin) dengan data simulasi lokal terisolasi.
            </Text>

            <Button
              testID="demo-mode-button"
              title="Coba Mode Demo (5 Role)"
              variant="outline"
              size="md"
              onPress={handleEnterDemo}
              icon={<Ionicons name="sparkles" size={16} color={theme.accent} />}
              style={styles.demoBtn}
            />
          </Card>
        )}

        {/* Quick link to Onboarding */}
        <PressableScale
          onPress={() => router.push('/onboarding')}
          style={styles.onboardingLink}
        >
          <Text style={[styles.onboardingLinkText, { color: theme.muted }]}>
            Pilih Peran Baru di Layar Onboarding →
          </Text>
        </PressableScale>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%'
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: spacing.md
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  logoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  brandTitle: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  brandTagline: {
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xxs,
    lineHeight: 18,
    fontFamily: typography.fontFamilies.text
  },
  card: {
    borderRadius: radius.xl,
    gap: spacing.md
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.sm
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    flex: 1
  },
  submitBtn: {
    marginTop: spacing.xs
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs
  },
  toggleText: {
    fontSize: typography.fontSizes.xs
  },
  toggleBtn: {
    padding: 2
  },
  toggleAction: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold
  },
  demoCard: {
    borderRadius: radius.lg,
    borderColor: '#f59e0b',
    gap: spacing.xs
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  demoTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  demoDesc: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 16
  },
  demoBtn: {
    marginTop: spacing.xs
  },
  onboardingLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  onboardingLinkText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium
  }
});
