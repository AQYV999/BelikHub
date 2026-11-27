// mobile/app/login.tsx
// Login screen ported from belikhub-design-board.html (1.1 Splash & Pilih Peran, 1.2 Login).
// Step 1: pick a role on the forest-green splash. Step 2: email + password in an inset group.
// Auth stays Firebase email/password + Demo Mode (the board's WhatsApp OTP / PIN need a backend that does not exist yet).
// No icon font and no SVG: logo, contours and role badges are drawn with Views so nothing depends on font loading.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../src/components/ui';
import { useAuth } from '../src/auth/AuthProvider';
import type { Role } from '../src/api/types';
import { loadWebFonts } from '../src/theme/webFonts';

// Tokens straight from the design board's :root
const C = {
  canvas: '#F8FAFC',
  forest: '#124734',
  sage: '#E2ECE9',
  amber: '#D97706',
  slate: '#0F172A',
  mute: 'rgba(15,23,42,0.60)',
  line: 'rgba(15,23,42,0.10)',
  red: '#B42318',
  redBg: '#FDE7E4'
};

const serif = Platform.select({
  web: '"Newsreader", Georgia, "Times New Roman", serif',
  ios: 'Georgia',
  default: 'serif'
});
const sans = Platform.select({
  web: '"Figtree", -apple-system, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
  default: undefined
});

interface RoleOption {
  id: Role;
  title: string;
  sub: string;
  mark: string;
  bg: string;
}

const ROLES: RoleOption[] = [
  { id: 'warga', title: 'Warga Batang', sub: 'Pelanggan Belik · bayar iuran & lapor', mark: 'W', bg: '#124734' },
  { id: 'pengelola', title: 'Pengelola BUMDes', sub: 'Petugas lapangan · meteran & kas', mark: 'P', bg: '#D97706' },
  { id: 'relawan', title: 'Relawan Konservasi', sub: 'Patroli hutan & reboisasi', mark: 'R', bg: '#2F8F5B' },
  { id: 'donatur', title: 'Donatur Hijau', sub: 'Danai bibit penahan air', mark: 'D', bg: '#0F172A' },
  { id: 'admin', title: 'Admin PDAM Batang', sub: 'Pantau belik & validasi laporan', mark: 'A', bg: '#475569' }
];

/** White water drop with a leaf, the board's Logo mark. */
function Logo({ size = 58 }: { size?: number }) {
  const leaf = size * 0.3;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          backgroundColor: '#fff',
          borderTopLeftRadius: 0,
          borderTopRightRadius: size * 0.31,
          borderBottomLeftRadius: size * 0.31,
          borderBottomRightRadius: size * 0.31,
          transform: [{ rotate: '45deg' }],
          marginTop: size * 0.1
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.46,
          width: leaf,
          height: leaf,
          backgroundColor: C.forest,
          borderTopLeftRadius: 0,
          borderTopRightRadius: leaf / 2,
          borderBottomLeftRadius: leaf / 2,
          borderBottomRightRadius: 0,
          transform: [{ translateX: leaf * 0.35 }]
        }}
      />
    </View>
  );
}

/** Topographic rings behind the title, top right. */
function Contours() {
  const rings = Array.from({ length: 13 }, (_, i) => (i + 1) * 30);
  return (
    <View pointerEvents="none" style={styles.contours}>
      {rings.map((r) => (
        <View
          key={r}
          style={{
            position: 'absolute',
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.13)',
            right: 100 - r,
            top: 120 - r
          }}
        />
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, enterDemoMode } = useAuth();

  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<Role>('warga');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('warga.bismo@belikhub.id');
  const [password, setPassword] = useState<string>('belikhub123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const enableDemoMode =
    process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true' ||
    process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === undefined;

  const roleTitle = ROLES.find((r) => r.id === role)?.title ?? '';

  useEffect(() => {
    loadWebFonts();
  }, []);

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Isi email dan kata sandi dulu.');
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
      setErrorMessage(e?.message || 'Email atau kata sandi salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    enterDemoMode(role);
    router.replace('/(tabs)');
  };

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  /* ---------------- Step 1: splash + role ---------------- */
  if (step === 'role') {
    return (
      <View style={[styles.root, { backgroundColor: C.forest }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.forest} />
        <View style={styles.column}>
          <Contours />
          <View style={[styles.hero, { paddingTop: Math.max(insets.top, 0) + 64 }]}>
            <Logo size={58} />
            <Text style={styles.heroTitle} accessibilityRole="header">BelikHub</Text>
            <Text style={styles.heroTag}>Mata air terjaga, iuran transparan.</Text>
            <Text style={styles.heroPlace}>Kabupaten Batang · bersama PDAM Batang</Text>
          </View>

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 0) + 16 }]}>
            <Text style={styles.sheetTitle}>Masuk sebagai</Text>
            <View style={styles.group}>
              {ROLES.map((r, i) => {
                const on = r.id === role;
                return (
                  <PressableScale
                    key={r.id}
                    testID={`role-${r.id}`}
                    onPress={() => setRole(r.id)}
                    scaleTo={0.99}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={r.title}
                    style={[styles.row, i > 0 && styles.rowDivider]}
                  >
                    <View style={[styles.badge, { backgroundColor: r.bg }]}>
                      <Text style={styles.badgeText}>{r.mark}</Text>
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{r.title}</Text>
                      <Text style={styles.rowSub}>{r.sub}</Text>
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>
                      {on ? <View style={styles.radioDot} /> : null}
                    </View>
                  </PressableScale>
                );
              })}
            </View>

            <PressableScale
              testID="continue-role-button"
              onPress={() => setStep('form')}
              style={[styles.btn, styles.btnPrimary, { marginTop: 14 }]}
            >
              <Text style={[styles.btnText, { color: '#fff' }]} numberOfLines={1}>
                Lanjutkan sebagai {roleTitle}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    );
  }

  /* ---------------- Step 2: form ---------------- */
  return (
    <View style={[styles.root, { backgroundColor: C.canvas }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.formScroll,
            { paddingTop: Math.max(insets.top, 0) + 8, paddingBottom: Math.max(insets.bottom, 0) + 24 }
          ]}
        >
          <View style={styles.formColumn}>
            <PressableScale
              testID="back-to-role"
              onPress={() => {
                setStep('role');
                setErrorMessage('');
              }}
              hitSlop={10}
              style={styles.back}
              accessibilityLabel="Kembali ke pilihan peran"
            >
              <Text style={styles.backText}>‹  Peran</Text>
            </PressableScale>

            <Text style={styles.h1} accessibilityRole="header">
              {isRegister ? 'Buat akun' : 'Masuk'}
            </Text>
            <Text style={styles.h1Sub}>{roleTitle}</Text>

            {/* Segmented control */}
            <View style={styles.seg} accessibilityRole="tablist">
              {[
                { v: false, l: 'Masuk' },
                { v: true, l: 'Daftar' }
              ].map((it) => {
                const on = isRegister === it.v;
                return (
                  <PressableScale
                    key={it.l}
                    onPress={() => {
                      setIsRegister(it.v);
                      setErrorMessage('');
                    }}
                    scaleTo={0.98}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    style={[styles.segItem, on && styles.segItemOn]}
                  >
                    <Text style={[styles.segText, { opacity: on ? 1 : 0.72 }]}>{it.l}</Text>
                  </PressableScale>
                );
              })}
            </View>

            {errorMessage ? (
              <View accessibilityRole="alert" style={styles.errorPill}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.groupHead}>Akun</Text>
            <View style={styles.group}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  testID="input-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nama@email.com"
                  placeholderTextColor="rgba(15,23,42,0.35)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  accessibilityLabel="Email"
                  style={styles.input}
                />
              </View>
              <View style={[styles.field, styles.rowDivider]}>
                <Text style={styles.fieldLabel}>Kata sandi</Text>
                <TextInput
                  testID="input-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="rgba(15,23,42,0.35)"
                  secureTextEntry
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  accessibilityLabel="Kata sandi"
                  onSubmitEditing={handleSubmit}
                  style={styles.input}
                />
              </View>
            </View>
            <Text style={styles.groupFoot}>
              {isRegister
                ? 'Setelah daftar, Anda akan memilih peran dan melengkapi data.'
                : 'Masuk dengan email dan kata sandi yang Anda daftarkan.'}
            </Text>

            <PressableScale
              testID="submit-auth-button"
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.btn, styles.btnPrimary, { marginTop: 20, opacity: canSubmit ? 1 : 0.4 }]}
              accessibilityLabel={isRegister ? 'Buat akun' : 'Masuk'}
              accessibilityState={{ disabled: !canSubmit, busy: loading }}
            >
              <Text style={[styles.btnText, { color: '#fff' }]}>
                {loading ? 'Memproses…' : isRegister ? 'Buat Akun' : 'Masuk'}
              </Text>
            </PressableScale>

            {enableDemoMode ? (
              <View style={styles.demo}>
                <Text style={styles.demoText}>
                  Belum mau daftar? Lihat aplikasi sebagai {roleTitle} dengan data contoh. Tidak ada yang tersimpan.
                </Text>
                <PressableScale
                  testID="demo-mode-button"
                  onPress={handleEnterDemo}
                  style={[styles.btn, styles.btnSage]}
                >
                  <Text style={[styles.btnText, { color: C.forest }]}>Coba dengan Data Contoh</Text>
                </PressableScale>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    overflow: 'hidden'
  },
  contours: { position: 'absolute', top: 0, left: 0, right: 0, height: 460 },

  /* splash */
  hero: { alignItems: 'center', flex: 1, paddingHorizontal: 24 },
  heroTitle: {
    fontFamily: serif,
    fontSize: 46,
    fontWeight: '500',
    letterSpacing: -0.9,
    lineHeight: 50,
    color: '#fff',
    marginTop: 8
  },
  heroTag: { fontFamily: sans, fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },
  heroPlace: { fontFamily: sans, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 3, textAlign: 'center' },
  sheet: {
    backgroundColor: C.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 16
  },
  sheetTitle: {
    fontFamily: serif,
    fontSize: 25,
    fontWeight: '500',
    color: C.slate,
    marginBottom: 10,
    paddingHorizontal: 4
  },

  /* inset group */
  group: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, minHeight: 56 },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.line },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: sans, fontSize: 16, fontWeight: '500', color: C.slate, lineHeight: 20 },
  rowSub: { fontFamily: sans, fontSize: 13, color: C.mute, lineHeight: 17 },
  badge: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: sans, fontSize: 14, fontWeight: '700', color: '#fff' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(15,23,42,0.22)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioOn: { borderColor: C.forest },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.forest },

  /* buttons */
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnPrimary: { backgroundColor: C.forest },
  btnSage: { backgroundColor: C.sage },
  btnText: { fontFamily: sans, fontSize: 16, fontWeight: '600' },

  /* form step */
  formScroll: { flexGrow: 1, paddingHorizontal: 16 },
  formColumn: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  back: { alignSelf: 'flex-start', height: 40, justifyContent: 'center', paddingRight: 12 },
  backText: { fontFamily: sans, fontSize: 16, fontWeight: '500', color: C.forest },
  h1: {
    fontFamily: serif,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 37,
    color: C.slate,
    paddingHorizontal: 4,
    marginTop: 6
  },
  h1Sub: { fontFamily: sans, fontSize: 14, color: C.mute, paddingHorizontal: 4, marginTop: 2 },
  seg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,23,42,0.07)',
    borderRadius: 10,
    padding: 2,
    marginTop: 16
  },
  segItem: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segItemOn: {
    backgroundColor: '#fff',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 1
  },
  segText: { fontFamily: sans, fontSize: 13.5, fontWeight: '600', color: C.slate },
  errorPill: {
    backgroundColor: C.redBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 16
  },
  errorText: { fontFamily: sans, fontSize: 14, color: C.red, lineHeight: 19, fontWeight: '500' },
  groupHead: {
    fontFamily: sans,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.mute,
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 7
  },
  field: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 60, justifyContent: 'center' },
  fieldLabel: { fontFamily: sans, fontSize: 13, color: C.mute, lineHeight: 17 },
  input: {
    fontFamily: sans,
    fontSize: 16,
    fontWeight: '500',
    color: C.slate,
    paddingVertical: 4,
    minWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null)
  },
  groupFoot: { fontFamily: sans, fontSize: 12.5, color: C.mute, lineHeight: 17, paddingHorizontal: 4, paddingTop: 7 },
  demo: { marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.line, gap: 12 },
  demoText: { fontFamily: sans, fontSize: 13.5, color: C.mute, lineHeight: 19, paddingHorizontal: 4 }
});
