// mobile/src/features/shared/ProfileScreen.tsx
// Profile, role switching, user details editing, demo mode controls, and logout

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Card, Badge, Button, Input, RoleSwitcher, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { Role, DonorType } from '../../api/types';
import { demoStore } from '../../demo/demoStore';

const ALL_ROLES: Role[] = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];

export const ProfileScreen: React.FC = () => {
  const toast = useToast();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const {
    user,
    roles,
    activeRole,
    setActiveRole,
    isDemoMode,
    exitDemoMode,
    signOut,
    refreshProfile
  } = useAuth();
  const api = useApi();
  const router = useRouter();

  // Profile edit state
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [donorType, setDonorType] = useState<DonorType>(user?.donorType || 'individual');
  const [orgName, setOrgName] = useState<string>(user?.organizationName || '');
  const [linkCode, setLinkCode] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDonorType(user.donorType || 'individual');
      setOrgName(user.organizationName || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim()
      };
      if (activeRole === 'donatur') {
        payload.donorType = donorType;
        if (donorType === 'organization') {
          payload.organizationName = orgName.trim();
        }
      }
      if (activeRole === 'warga' && linkCode.trim()) {
        payload.linkCode = linkCode.trim().toUpperCase();
      }

      const res = await api.updateProfile(payload);
      if (res.success) {
        setSaveSuccess('Profil Anda berhasil diperbarui!');
        setLinkCode('');
        await refreshProfile();
      }
    } catch (e: any) {
      setSaveError(e?.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Data Demo',
      'Kembalikan seluruh data demo (mata air, tagihan, donasi, laporan) ke kondisi awal?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            demoStore.reset();
            await refreshProfile();
            toast.success('Data demo telah direset ke baseline.');
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun BelikHub?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => signOut()
      }
    ]);
  };

  const availableRoles = isDemoMode ? ALL_ROLES : roles;
  const initials = (user?.name || 'Pengguna')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <Card variant="elevated" padding="md" style={styles.card}>
        <View style={styles.profileHeaderRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.accent }]}>
            <Text style={[styles.avatarText, { color: theme.accentInk }]}>{initials}</Text>
          </View>

          <View style={styles.profileHeaderInfo}>
            <Text style={[styles.profileName, { color: theme.ink }]}>
              {user?.name || 'Pengguna BelikHub'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.muted }]}>
              {user?.email || 'Akun BelikHub'}
            </Text>
            <View style={styles.badgeRow}>
              <Badge label={`Peran Aktif: ${activeRole.toUpperCase()}`} variant="accent" size="sm" />
            </View>
          </View>
        </View>
      </Card>

      {/* Role Switcher Section (shown when user has >1 roles or Demo Mode active) */}
      {(availableRoles.length > 1 || isDemoMode) && (
        <Card variant="outlined" padding="md" style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-horizontal-outline" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.ink }]}>
              Ganti Sudut Pandang Peran
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
            {isDemoMode
              ? 'Mode Demo aktif: Anda dapat berpindah bebas di antara 5 peran BelikHub.'
              : 'Akun Anda memiliki lebih dari 1 peran. Pilih peran aktif untuk navigasi.'}
          </Text>

          <RoleSwitcher
            roles={availableRoles}
            activeRole={activeRole}
            onSelectRole={(r) => {
              setActiveRole(r);
            }}
            testID="role-switcher"
            style={styles.switcher}
          />
        </Card>
      )}

      {/* Profile Edit Section */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Informasi Profil</Text>
        </View>

        {saveSuccess ? (
          <View style={[styles.alertBox, { backgroundColor: theme.successBg }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.alertText, { color: theme.successInk }]}>{saveSuccess}</Text>
          </View>
        ) : null}

        {saveError ? (
          <View style={[styles.alertBox, { backgroundColor: theme.errorBg }]}>
            <Ionicons name="alert-circle" size={16} color={theme.error} />
            <Text style={[styles.alertText, { color: theme.errorInk }]}>{saveError}</Text>
          </View>
        ) : null}

        <Input
          testID="profile-input-name"
          label="Nama Lengkap"
          placeholder="Nama Anda"
          value={name}
          onChangeText={setName}
        />

        <Input
          testID="profile-input-phone"
          label="Nomor WhatsApp / HP"
          placeholder="Contoh: 081234567890"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Role-specific fields */}
        {activeRole === 'donatur' && (
          <View style={styles.donaturFields}>
            <Text style={[styles.fieldLabel, { color: theme.ink }]}>Tipe Donatur:</Text>
            <View style={styles.donorTypeRow}>
              <PressableScale
                onPress={() => setDonorType('individual')}
                style={[
                  styles.donorTypeChip,
                  {
                    backgroundColor: donorType === 'individual' ? theme.accent : theme.surface,
                    borderColor: donorType === 'individual' ? theme.accent : theme.border
                  }
                ]}
              >
                <Text
                  style={[
                    styles.donorTypeChipText,
                    { color: donorType === 'individual' ? '#fff' : theme.ink }
                  ]}
                >
                  Individu
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => setDonorType('organization')}
                style={[
                  styles.donorTypeChip,
                  {
                    backgroundColor: donorType === 'organization' ? theme.accent : theme.surface,
                    borderColor: donorType === 'organization' ? theme.accent : theme.border
                  }
                ]}
              >
                <Text
                  style={[
                    styles.donorTypeChipText,
                    { color: donorType === 'organization' ? '#fff' : theme.ink }
                  ]}
                >
                  Organisasi (CSR)
                </Text>
              </PressableScale>
            </View>

            {donorType === 'organization' && (
              <Input
                label="Nama Perusahaan / Organisasi"
                placeholder="Contoh: PT Tirta Lestari Nusantara"
                value={orgName}
                onChangeText={setOrgName}
              />
            )}
          </View>
        )}

        {activeRole === 'warga' && user?.residentLinkStatus !== 'linked' && (
          <Input
            label="Tautkan Kode KK (Opsional)"
            placeholder="6 karakter kode tautan dari pengelola"
            value={linkCode}
            onChangeText={(t) => setLinkCode(t.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
          />
        )}

        <Button
          testID="btn-save-profile"
          title="Simpan Perubahan"
          variant="primary"
          size="md"
          loading={saving}
          onPress={handleSaveProfile}
          style={styles.saveBtn}
        />
      </Card>

      {/* Demo Mode Controls */}
      {isDemoMode && (
        <Card variant="flat" padding="md" style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flask-outline" size={18} color="#d97706" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#fef3c7' : '#92400e' }]}>
              Kontrol Mode Demo
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
            Seluruh data berjalan secara lokal terisolasi di memori aplikasi tanpa mengubah server live.
          </Text>

          <View style={styles.demoActions}>
            <Button
              testID="btn-reset-demo"
              title="Reset Data Demo ke Awal"
              variant="outline"
              size="sm"
              onPress={handleResetDemo}
              icon={<Ionicons name="refresh-outline" size={16} color={theme.accent} />}
            />
            <Button
              testID="btn-exit-demo"
              title="Keluar dari Mode Demo"
              variant="secondary"
              size="sm"
              onPress={exitDemoMode}
              icon={<Ionicons name="log-out-outline" size={16} color={theme.ink} />}
            />
          </View>
        </Card>
      )}

      {/* Navigation: back to the field console, or open the legacy role workspace */}
      <Button
        title="Role workspace"
        variant="outline"
        size="md"
        fullWidth
        onPress={() => router.navigate('/(tabs)')}
        icon={<Ionicons name="apps-outline" size={16} color={theme.accent} />}
      />
      <Button
        title="Back to field console"
        variant="secondary"
        size="md"
        fullWidth
        onPress={() => router.navigate('/(tabs)/showcase')}
        icon={<Ionicons name="arrow-back" size={16} color={theme.ink} />}
      />

      {/* Logout Action */}
      <Button
        testID="btn-sign-out"
        title="Keluar Akun (Sign Out)"
        variant="danger"
        size="md"
        onPress={handleSignOut}
        icon={<Ionicons name="power-outline" size={18} color="#ffffff" />}
        style={styles.signOutBtn}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md
  },
  card: {
    borderRadius: radius.lg
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  profileHeaderInfo: {
    flex: 1,
    gap: 4
  },
  profileName: {
    ...textStyles.heading,
  },
  profileEmail: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 16,
    marginBottom: spacing.xs
  },
  switcher: {
    marginTop: spacing.xs
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginVertical: spacing.xs
  },
  alertText: {
    fontSize: typography.fontSizes.xs,
    flex: 1
  },
  fieldLabel: {
    ...textStyles.label,
    marginBottom: spacing.xxs
  },
  donaturFields: {
    gap: spacing.xs,
    marginVertical: spacing.xs
  },
  donorTypeRow: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  donorTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center'
  },
  donorTypeChipText: {
    ...textStyles.label,
  },
  saveBtn: {
    marginTop: spacing.sm
  },
  demoActions: {
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  signOutBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxl
  }
});
