// mobile/app/onboarding.tsx
// Public role selection (Warga, Donatur, Relawan) and initial profile setup

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, Input } from '../src/components/ui';
import { colors, typography, spacing, radius } from '../src/theme/tokens';
import { useAuth, useApi } from '../src/auth/AuthProvider';
import { Role, DonorType, SpringPublic } from '../src/api/types';

type PublicRole = 'warga' | 'donatur' | 'relawan';

const ROLE_OPTIONS: { role: PublicRole; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    role: 'warga',
    title: 'Warga Mata Air',
    subtitle: 'Bayar iuran retribusi, pantau kas desa & transparansi aliran air',
    icon: 'water-outline'
  },
  {
    role: 'relawan',
    title: 'Relawan Konservasi',
    subtitle: 'Dokumentasikan survei mata air, restorasi, pohon & rorak di lapangan',
    icon: 'camera-outline'
  },
  {
    role: 'donatur',
    title: 'Donatur & Mitra CSR',
    subtitle: 'Dukung program revitalisasi sumber air secara transparan dan terukur',
    icon: 'heart-outline'
  }
];

export default function OnboardingScreen() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const api = useApi();

  const [selectedRole, setSelectedRole] = useState<PublicRole>('warga');
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');

  // Warga specifics
  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [selectedSpringId, setSelectedSpringId] = useState<string>('SPR-001');
  const [linkCode, setLinkCode] = useState<string>('');

  // Donatur specifics
  const [donorType, setDonorType] = useState<DonorType>('individual');
  const [orgName, setOrgName] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    api.listSprings()
      .then((res) => {
        if (res.springs && res.springs.length > 0) {
          setSprings(res.springs);
          setSelectedSpringId(res.springs[0].id);
        }
      })
      .catch((e) => console.warn('Onboarding: Failed to list springs', e));
  }, [api]);

  const handleComplete = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        role: selectedRole,
        name: name.trim(),
        phone: phone.trim()
      };

      if (selectedRole === 'warga') {
        payload.springId = selectedSpringId;
        if (linkCode.trim()) {
          payload.linkCode = linkCode.trim().toUpperCase();
        }
      }

      if (selectedRole === 'donatur') {
        payload.donorType = donorType;
        if (donorType === 'organization') {
          payload.organizationName = orgName.trim();
        }
      }

      await completeOnboarding(payload);
      router.replace('/(tabs)');
    } catch (e: any) {
      setErrorMessage(e?.message || 'Gagal menyelesaikan onboarding. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scrollable showDemoBanner={false} contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.stepText, { color: theme.accent }]}>Langkah Awal</Text>
          <Text style={[styles.title, { color: theme.ink }]}>Pilih Peran Utama Anda</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            BelikHub menyajikan pengalaman antarmuka yang disesuaikan dengan kontribusi Anda.
          </Text>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
            <Ionicons name="alert-circle" size={16} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.errorInk }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. Role Selection Cards */}
        <View style={styles.roleList}>
          {ROLE_OPTIONS.map((opt) => {
            const isSelected = opt.role === selectedRole;
            return (
              <TouchableOpacity
                key={opt.role}
                testID={`role-select-${opt.role}`}
                onPress={() => setSelectedRole(opt.role)}
                activeOpacity={0.7}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isSelected ? theme.surfaceHighlight : theme.card,
                    borderColor: isSelected ? theme.accent : theme.border,
                    borderWidth: isSelected ? 2 : 1
                  }
                ]}
              >
                <View
                  style={[
                    styles.roleIconWrap,
                    { backgroundColor: isSelected ? theme.accent : theme.surface }
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={isSelected ? theme.accentInk : theme.ink}
                  />
                </View>

                <View style={styles.roleTextCol}>
                  <Text
                    style={[
                      styles.roleTitle,
                      { color: isSelected ? theme.accent : theme.ink }
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={[styles.roleDesc, { color: theme.muted }]}>
                    {opt.subtitle}
                  </Text>
                </View>

                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isSelected ? theme.accent : theme.muted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Form Details Card */}
        <Card variant="outlined" padding="lg" style={styles.formCard}>
          <Text style={[styles.formHeading, { color: theme.ink }]}>
            Informasi Profil Anda
          </Text>

          <Input
            testID="onboarding-input-name"
            label="Nama Lengkap"
            placeholder="Nama Anda atau penanggung jawab"
            value={name}
            onChangeText={setName}
          />

          <Input
            testID="onboarding-input-phone"
            label="Nomor Telepon / WhatsApp"
            placeholder="081234567890"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Warga Specifics */}
          {selectedRole === 'warga' && (
            <View style={styles.specificBox}>
              <Text style={[styles.fieldLabel, { color: theme.ink }]}>
                Pilih Sumber Mata Air Anda:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.springList}>
                {springs.map((sp) => {
                  const isCur = sp.id === selectedSpringId;
                  return (
                    <TouchableOpacity
                      key={sp.id}
                      onPress={() => setSelectedSpringId(sp.id)}
                      style={[
                        styles.springSelectChip,
                        {
                          backgroundColor: isCur ? theme.accent : theme.surface,
                          borderColor: isCur ? theme.accent : theme.border
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.springSelectText,
                          { color: isCur ? theme.accentInk : theme.ink }
                        ]}
                      >
                        {sp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Input
                testID="onboarding-input-link-code"
                label="Kode Tautan KK (Opsional)"
                placeholder="Contoh: TUK001 (dari pengelola)"
                value={linkCode}
                onChangeText={(t) => setLinkCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                helperText="Dapat diisi nanti di tab Retribusi."
              />
            </View>
          )}

          {/* Donatur Specifics */}
          {selectedRole === 'donatur' && (
            <View style={styles.specificBox}>
              <Text style={[styles.fieldLabel, { color: theme.ink }]}>Kategori Donatur:</Text>
              <View style={styles.donorTypeRow}>
                <TouchableOpacity
                  onPress={() => setDonorType('individual')}
                  style={[
                    styles.donorChip,
                    {
                      backgroundColor: donorType === 'individual' ? theme.accent : theme.surface,
                      borderColor: donorType === 'individual' ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.donorChipText,
                      { color: donorType === 'individual' ? '#fff' : theme.ink }
                    ]}
                  >
                    Individu
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDonorType('organization')}
                  style={[
                    styles.donorChip,
                    {
                      backgroundColor: donorType === 'organization' ? theme.accent : theme.surface,
                      borderColor: donorType === 'organization' ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.donorChipText,
                      { color: donorType === 'organization' ? '#fff' : theme.ink }
                    ]}
                  >
                    Organisasi / CSR
                  </Text>
                </TouchableOpacity>
              </View>

              {donorType === 'organization' && (
                <Input
                  testID="onboarding-input-org"
                  label="Nama Perusahaan / Yayasan"
                  placeholder="Contoh: PT Tirta Lestari Nusantara"
                  value={orgName}
                  onChangeText={setOrgName}
                />
              )}
            </View>
          )}

          <Button
            testID="btn-complete-onboarding"
            title="Mulai Gunakan BelikHub"
            variant="primary"
            size="lg"
            loading={submitting}
            onPress={handleComplete}
            style={styles.completeBtn}
          />
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md
  },
  header: {
    marginBottom: spacing.xs
  },
  stepText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display,
    marginTop: spacing.xxs
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs,
    lineHeight: 18,
    fontFamily: typography.fontFamilies.text
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
  roleList: {
    gap: spacing.sm
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleTextCol: {
    flex: 1
  },
  roleTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  roleDesc: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 16
  },
  formCard: {
    borderRadius: radius.xl,
    gap: spacing.md
  },
  formHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  specificBox: {
    gap: spacing.xs
  },
  fieldLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold
  },
  springList: {
    flexDirection: 'row',
    marginVertical: spacing.xs
  },
  springSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginRight: spacing.xs
  },
  springSelectText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium
  },
  donorTypeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs
  },
  donorChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center'
  },
  donorChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold
  },
  completeBtn: {
    marginTop: spacing.sm
  }
});
