// mobile/src/features/admin/AdminManageScreen.tsx
// Admin Manage: sub-tabs for Mata Air & Retribusi, Program Revitalisasi, and Pengguna & Role

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Alert,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Card,
  Badge,
  Button,
  Input,
  ImageUploadField,
  EmptyState
} from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import {
  SpringPublic,
  SpringSettings,
  RevitalizationCampaign,
  AdminUser,
  Role
} from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { validateSpringInput, validateCampaignInput } from './adminUtils';

type ManageTab = 'springs' | 'campaigns' | 'users';

export const AdminManageScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [activeTab, setActiveTab] = useState<ManageTab>('springs');
  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [campaigns, setCampaigns] = useState<RevitalizationCampaign[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal 1: Add Spring
  const [addSpringVisible, setAddSpringVisible] = useState<boolean>(false);
  const [springName, setSpringName] = useState<string>('');
  const [springVillage, setSpringVillage] = useState<string>('');
  const [springDistrict, setSpringDistrict] = useState<string>('Kecamatan Blado');
  const [springDischarge, setSpringDischarge] = useState<string>('25');
  const [springBeneficiaries, setSpringBeneficiaries] = useState<string>('300');
  const [addSpringLoading, setAddSpringLoading] = useState<boolean>(false);

  // Modal 2: Edit Spring Settings (Bank / QRIS)
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [selectedSpringForSettings, setSelectedSpringForSettings] = useState<SpringPublic | null>(null);
  const [settingsMonthlyFee, setSettingsMonthlyFee] = useState<string>('15000');
  const [settingsInstructions, setSettingsInstructions] = useState<string>('');
  const [settingsQrisPath, setSettingsQrisPath] = useState<string | null>(null);
  const [settingsQrisReadUrl, setSettingsQrisReadUrl] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Modal 3: Create Campaign
  const [createCampaignVisible, setCreateCampaignVisible] = useState<boolean>(false);
  const [campaignSpringId, setCampaignSpringId] = useState<string>('SPR-001');
  const [campaignTitle, setCampaignTitle] = useState<string>('');
  const [campaignDesc, setCampaignDesc] = useState<string>('');
  const [campaignTarget, setCampaignTarget] = useState<string>('25000000');
  const [campaignInstructions, setCampaignInstructions] = useState<string>(
    'Donasi via Rekening Kas Yayasan BelikHub: Bank Mandiri 137-00-1928374-1.'
  );
  const [creatingCampaign, setCreatingCampaign] = useState<boolean>(false);

  // Modal 4: Edit User Roles
  const [userModalVisible, setUserModalVisible] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userManagedSprings, setUserManagedSprings] = useState<string[]>([]);
  const [savingUserRoles, setSavingUserRoles] = useState<boolean>(false);

  // Modal 5: Edit Spring
  const [editSpringVisible, setEditSpringVisible] = useState<boolean>(false);
  const [editingSpring, setEditingSpring] = useState<SpringPublic | null>(null);
  const [editSpringName, setEditSpringName] = useState<string>('');
  const [editSpringVillage, setEditSpringVillage] = useState<string>('');
  const [editSpringDistrict, setEditSpringDistrict] = useState<string>('Kecamatan Blado');
  const [editSpringDischarge, setEditSpringDischarge] = useState<string>('25');
  const [editSpringBeneficiaries, setEditSpringBeneficiaries] = useState<string>('300');
  const [editSpringStatus, setEditSpringStatus] = useState<'active' | 'rehabilitation'>('active');
  const [editSpringError, setEditSpringError] = useState<string>('');
  const [savingEditSpring, setSavingEditSpring] = useState<boolean>(false);

  // Modal 6: Edit Campaign
  const [editCampaignVisible, setEditCampaignVisible] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<RevitalizationCampaign | null>(null);
  const [editCampaignTitle, setEditCampaignTitle] = useState<string>('');
  const [editCampaignDesc, setEditCampaignDesc] = useState<string>('');
  const [editCampaignTarget, setEditCampaignTarget] = useState<string>('');
  const [editCampaignStatus, setEditCampaignStatus] = useState<'active' | 'completed'>('active');
  const [editCampaignInstructions, setEditCampaignInstructions] = useState<string>('');
  const [editCampaignError, setEditCampaignError] = useState<string>('');
  const [savingEditCampaign, setSavingEditCampaign] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [sprRes, campRes, usrRes] = await Promise.all([
        api.listSprings().catch(() => ({ springs: [] })),
        api.listCampaigns().catch(() => ({ campaigns: [] })),
        api.listAdminUsers().catch(() => ({ users: [] }))
      ]);

      if (sprRes?.springs) setSprings(sprRes.springs);
      if (campRes?.campaigns) setCampaigns(campRes.campaigns);
      if (usrRes?.users) setUsers(usrRes.users);
    } catch (err) {
      console.warn('AdminManageScreen: loadData error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Seed Baseline Springs
  const handleSeedBaseline = async () => {
    try {
      const res = await api.createSpring({ seedBaseline: true });
      if (res.success) {
        Alert.alert('Sukses', '4 Mata Air Baseline berhasil dimuat!');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal memuat mata air baseline.');
    }
  };

  // Handle Add Spring
  const handleAddSpring = async () => {
    const dischargeNum = parseFloat(springDischarge) || 10;
    const kkNum = parseInt(springBeneficiaries, 10) || 100;

    const validation = validateSpringInput({
      name: springName,
      village: springVillage,
      district: springDistrict
    });

    if (!validation.valid) {
      Alert.alert('Perhatian', validation.error || 'Form belum lengkap.');
      return;
    }

    setAddSpringLoading(true);
    try {
      const res = await api.createSpring({
        name: springName.trim(),
        village: springVillage.trim(),
        district: springDistrict.trim(),
        regency: 'Kabupaten Batang',
        baseline_discharge_lps: dischargeNum,
        beneficiaries_kk: kkNum,
        status: 'active'
      });

      if (res.success) {
        Alert.alert('Sukses', `Mata Air ${springName} berhasil didaftarkan!`);
        setAddSpringVisible(false);
        setSpringName('');
        setSpringVillage('');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal menambahkan mata air.');
    } finally {
      setAddSpringLoading(false);
    }
  };

  // Handle Open Settings Modal
  const handleOpenSettings = async (spring: SpringPublic) => {
    setSelectedSpringForSettings(spring);
    try {
      const current = await api.getSpringSettings(spring.id);
      setSettingsMonthlyFee(String(current.defaultMonthlyFee || 15000));
      setSettingsInstructions(current.paymentInstructions || '');
      setSettingsQrisPath(current.qrisImagePath || null);
      setSettingsQrisReadUrl(current.qrisReadUrl || null);
    } catch (e) {
      setSettingsMonthlyFee('15000');
      setSettingsInstructions('');
      setSettingsQrisPath(null);
      setSettingsQrisReadUrl(null);
    }
    setSettingsModalVisible(true);
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    if (!selectedSpringForSettings) return;
    const feeNum = parseInt(settingsMonthlyFee, 10) || 15000;

    setSavingSettings(true);
    try {
      const res = await api.putSpringSettings(selectedSpringForSettings.id, {
        defaultMonthlyFee: feeNum,
        paymentInstructions: settingsInstructions.trim(),
        qrisImagePath: settingsQrisPath || null
      });

      if (res.success) {
        Alert.alert('Sukses', 'Instruksi pembayaran mata air berhasil disimpan!');
        setSettingsModalVisible(false);
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal menyimpan pengaturan mata air.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Create Campaign
  const handleCreateCampaign = async () => {
    const targetNum = parseInt(campaignTarget.replace(/\D/g, ''), 10) || 0;
    const validation = validateCampaignInput({
      springId: campaignSpringId,
      title: campaignTitle,
      targetAmount: targetNum,
      paymentInstructions: campaignInstructions
    });

    if (!validation.valid) {
      Alert.alert('Perhatian', validation.error || 'Form belum lengkap.');
      return;
    }

    setCreatingCampaign(true);
    try {
      const res = await api.createCampaign({
        springId: campaignSpringId,
        title: campaignTitle.trim(),
        description: campaignDesc.trim(),
        targetAmount: targetNum,
        paymentInstructions: campaignInstructions.trim()
      });

      if (res.success) {
        Alert.alert('Sukses', 'Program revitalisasi berhasil dibuat!');
        setCreateCampaignVisible(false);
        setCampaignTitle('');
        setCampaignDesc('');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal membuat program.');
    } finally {
      setCreatingCampaign(false);
    }
  };

  // Handle Open User Modal
  const handleOpenUserModal = (u: AdminUser) => {
    setSelectedUser(u);
    setUserRoles([...(u.roles || [])]);
    setUserManagedSprings([...(u.managedSpringIds || [])]);
    setUserModalVisible(true);
  };

  // Handle Save User Roles
  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;
    setSavingUserRoles(true);
    try {
      const res = await api.setAdminUserRoles(selectedUser.uid, {
        roles: userRoles,
        managedSpringIds: userRoles.includes('pengelola') ? userManagedSprings : []
      });

      if (res.success) {
        Alert.alert('Sukses', `Hak peran pengguna ${selectedUser.name || ''} berhasil diperbarui!`);
        setUserModalVisible(false);
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal mengubah peran pengguna.');
    } finally {
      setSavingUserRoles(false);
    }
  };

  const toggleRole = (r: Role) => {
    if (userRoles.includes(r)) {
      if (userRoles.length === 1) {
        Alert.alert('Perhatian', 'Pengguna harus memiliki minimal 1 peran.');
        return;
      }
      setUserRoles(userRoles.filter((item) => item !== r));
    } else {
      setUserRoles([...userRoles, r]);
    }
  };

  const toggleManagedSpring = (sId: string) => {
    if (userManagedSprings.includes(sId)) {
      setUserManagedSprings(userManagedSprings.filter((item) => item !== sId));
    } else {
      setUserManagedSprings([...userManagedSprings, sId]);
    }
  };

  // Handle Open & Save Edit Spring
  const handleOpenEditSpring = (spr: SpringPublic) => {
    setEditingSpring(spr);
    setEditSpringName(spr.name);
    setEditSpringVillage(spr.village);
    setEditSpringDistrict(spr.district || 'Kecamatan Blado');
    setEditSpringDischarge(String(spr.baseline_discharge_lps ?? 25));
    setEditSpringBeneficiaries(String(spr.beneficiaries_kk ?? 300));
    setEditSpringStatus(spr.status === 'rehabilitation' ? 'rehabilitation' : 'active');
    setEditSpringError('');
    setEditSpringVisible(true);
  };

  const handleSaveEditSpring = async () => {
    if (!editingSpring) return;
    const dischargeNum = parseFloat(editSpringDischarge) || 0;
    const kkNum = parseInt(editSpringBeneficiaries, 10) || 0;

    const validation = validateSpringInput({
      name: editSpringName,
      village: editSpringVillage,
      baseline_discharge_lps: dischargeNum
    });

    if (!validation.valid) {
      setEditSpringError(validation.error || 'Data mata air tidak valid.');
      return;
    }

    setSavingEditSpring(true);
    setEditSpringError('');
    try {
      const res = await api.updateSpring(editingSpring.id, {
        name: editSpringName.trim(),
        village: editSpringVillage.trim(),
        district: editSpringDistrict.trim(),
        baseline_discharge_lps: dischargeNum,
        beneficiaries_kk: kkNum,
        status: editSpringStatus
      });

      if (res.success) {
        Alert.alert('Sukses', `Mata Air ${editSpringName} berhasil diperbarui.`);
        setEditSpringVisible(false);
        loadData();
      }
    } catch (e: any) {
      setEditSpringError(e?.message || 'Gagal memperbarui mata air.');
    } finally {
      setSavingEditSpring(false);
    }
  };

  // Handle Open & Save Edit Campaign
  const handleOpenEditCampaign = (camp: RevitalizationCampaign) => {
    setEditingCampaign(camp);
    setEditCampaignTitle(camp.title);
    setEditCampaignDesc(camp.description || '');
    setEditCampaignTarget(String(camp.targetAmount || ''));
    setEditCampaignStatus(camp.status === 'completed' ? 'completed' : 'active');
    setEditCampaignInstructions(camp.paymentInstructions || '');
    setEditCampaignError('');
    setEditCampaignVisible(true);
  };

  const handleSaveEditCampaign = async () => {
    if (!editingCampaign) return;
    const targetNum = parseInt(editCampaignTarget.replace(/\D/g, ''), 10) || 0;

    const validation = validateCampaignInput({
      springId: editingCampaign.springId || 'SPR-001',
      title: editCampaignTitle,
      targetAmount: targetNum,
      paymentInstructions: editCampaignInstructions
    });

    if (!validation.valid) {
      setEditCampaignError(validation.error || 'Data program tidak valid.');
      return;
    }

    setSavingEditCampaign(true);
    setEditCampaignError('');
    try {
      const res = await api.updateCampaign(editingCampaign.id, {
        title: editCampaignTitle.trim(),
        description: editCampaignDesc.trim() || undefined,
        targetAmount: targetNum,
        status: editCampaignStatus,
        paymentInstructions: editCampaignInstructions.trim()
      });

      if (res.success) {
        Alert.alert('Sukses', `Program ${editCampaignTitle} berhasil diperbarui.`);
        setEditCampaignVisible(false);
        loadData();
      }
    } catch (e: any) {
      setEditCampaignError(e?.message || 'Gagal memperbarui program.');
    } finally {
      setSavingEditCampaign(false);
    }
  };

  return (
    <Screen
      scrollable
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadData();
      }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerGreeting, { color: theme.muted }]}>
            Konfigurasi & Manajemen
          </Text>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Kelola BelikHub
          </Text>
        </View>
        <Badge label="Pengaturan" variant="accent" size="md" />
      </View>

      {/* Subtab Navigation */}
      <View style={[styles.subtabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          testID="subtab-manage-springs"
          onPress={() => setActiveTab('springs')}
          style={[
            styles.subtabBtn,
            activeTab === 'springs' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="water-outline"
            size={16}
            color={activeTab === 'springs' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'springs' ? theme.accentInk : theme.ink }
            ]}
          >
            Mata Air
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="subtab-manage-campaigns"
          onPress={() => setActiveTab('campaigns')}
          style={[
            styles.subtabBtn,
            activeTab === 'campaigns' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={16}
            color={activeTab === 'campaigns' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'campaigns' ? theme.accentInk : theme.ink }
            ]}
          >
            Revitalisasi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="subtab-manage-users"
          onPress={() => setActiveTab('users')}
          style={[
            styles.subtabBtn,
            activeTab === 'users' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTab === 'users' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'users' ? theme.accentInk : theme.ink }
            ]}
          >
            Pengguna
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUB-TAB 1: MATA AIR & RETRIBUSI */}
      {activeTab === 'springs' && (
        <View style={styles.tabContent}>
          {/* Top Actions: Seed Baseline + Add Spring */}
          <View style={styles.springActionsRow}>
            <Button
              testID="btn-seed-baseline"
              title="Muat 4 Mata Air Baseline"
              variant="outline"
              size="sm"
              icon={<Ionicons name="refresh" size={14} color={theme.accent} />}
              onPress={handleSeedBaseline}
            />
            <Button
              testID="btn-add-spring"
              title="Tambah Mata Air"
              variant="primary"
              size="sm"
              icon={<Ionicons name="add" size={16} color={theme.accentInk} />}
              onPress={() => setAddSpringVisible(true)}
            />
          </View>

          {/* Springs List */}
          {springs.map((spr) => (
            <Card key={spr.id} variant="elevated" padding="md" style={styles.itemCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                  <Text style={[styles.itemTitle, { color: theme.ink }]}>
                    {spr.name}
                  </Text>
                  <Text style={[styles.itemSub, { color: theme.muted }]}>
                    {spr.village}, {spr.district} • ID: {spr.id}
                  </Text>
                </View>
                <Badge
                  label={spr.status === 'active' ? 'Aktif' : 'Rehabilitasi'}
                  variant={spr.status === 'active' ? 'success' : 'warning'}
                  size="sm"
                />
              </View>

              <View style={styles.dischargeInfoRow}>
                <Text style={[styles.dischargeText, { color: theme.ink }]}>
                  Debit: {spr.baseline_discharge_lps ?? 0} L/dtk • Manfaat: ~{spr.beneficiaries_kk ?? 0} KK
                </Text>
              </View>

              {/* Spring Actions: Edit Spring & Edit Settings */}
              <View style={styles.springActionsRow}>
                <Button
                  testID={`btn-edit-spring-${spr.id}`}
                  title="Edit Mata Air"
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="create-outline" size={14} color={theme.accent} />}
                  onPress={() => handleOpenEditSpring(spr)}
                />
                <Button
                  testID={`btn-edit-spring-settings-${spr.id}`}
                  title="Atur Rekening & QRIS"
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="card-outline" size={14} color={theme.ink} />}
                  onPress={() => handleOpenSettings(spr)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* SUB-TAB 2: PROGRAM REVITALISASI */}
      {activeTab === 'campaigns' && (
        <View style={styles.tabContent}>
          <View style={styles.campaignActionRow}>
            <Text style={[styles.sectionHeading, { color: theme.ink }]}>
              Daftar Program Revitalisasi ({campaigns.length})
            </Text>
            <Button
              testID="btn-create-campaign"
              title="Buat Program"
              variant="primary"
              size="sm"
              icon={<Ionicons name="add" size={16} color={theme.accentInk} />}
              onPress={() => setCreateCampaignVisible(true)}
            />
          </View>

          {campaigns.map((c) => (
            <Card key={c.id} variant="outlined" padding="md" style={styles.itemCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                  <Text style={[styles.itemTitle, { color: theme.ink }]}>
                    {c.title}
                  </Text>
                  <Text style={[styles.itemSub, { color: theme.muted }]}>
                    Mata Air {c.springName || c.springId} • Target {formatRupiah(c.targetAmount)}
                  </Text>
                </View>
                <Badge
                  label={c.status === 'active' ? 'Aktif' : 'Selesai'}
                  variant={c.status === 'active' ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>

              <Text style={[styles.campaignProgressLabel, { color: theme.muted }]}>
                Dana Terkumpul: {formatRupiah(c.collectedAmount)} • Progres Fisik: {c.progressPercent || 0}%
              </Text>

              <View style={styles.campaignBtnRow}>
                <Button
                  testID={`btn-edit-campaign-${c.id}`}
                  title="Edit Program"
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="create-outline" size={14} color={theme.accent} />}
                  onPress={() => handleOpenEditCampaign(c)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* SUB-TAB 3: PENGGUNA & ROLE */}
      {activeTab === 'users' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: theme.ink }]}>
              Manajemen Pengguna & Multiperan ({users.length})
            </Text>
          </View>

          {users.map((u) => (
            <Card key={u.uid} variant="outlined" padding="md" style={styles.itemCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardInfoCol}>
                  <Text style={[styles.itemTitle, { color: theme.ink }]}>
                    {u.name || 'Pengguna BelikHub'}
                  </Text>
                  <Text style={[styles.itemSub, { color: theme.muted }]}>
                    {u.email} {u.phone ? `• ${u.phone}` : ''}
                  </Text>
                </View>

                {/* Edit User Roles Button */}
                <Button
                  testID={`btn-edit-user-${u.uid}`}
                  title="Ubah Peran"
                  variant="outline"
                  size="sm"
                  onPress={() => handleOpenUserModal(u)}
                />
              </View>

              {/* Roles Badges */}
              <View style={styles.rolesBadgesRow}>
                {u.roles?.map((r) => (
                  <Badge key={r} label={r} variant="accent" size="sm" />
                ))}
                {u.managedSpringIds && u.managedSpringIds.length > 0 && (
                  <Text style={[styles.managedSpringsText, { color: theme.muted }]}>
                    Mengelola: {u.managedSpringIds.join(', ')}
                  </Text>
                )}
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* MODAL 1: ADD SPRING */}
      <Modal
        visible={addSpringVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddSpringVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Daftarkan Mata Air Baru
              </Text>
              <TouchableOpacity onPress={() => setAddSpringVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            <Input
              testID="input-spring-name"
              label="Nama Mata Air"
              placeholder="Contoh: Tuk Watulumbung"
              value={springName}
              onChangeText={setSpringName}
            />

            <Input
              testID="input-spring-village"
              label="Desa"
              placeholder="Contoh: Desa Tambakboyo"
              value={springVillage}
              onChangeText={setSpringVillage}
            />

            <Input
              testID="input-spring-district"
              label="Kecamatan"
              placeholder="Contoh: Kecamatan Reban"
              value={springDistrict}
              onChangeText={setSpringDistrict}
            />

            <Input
              testID="input-spring-discharge"
              label="Debit Baseline (L/detik)"
              placeholder="25"
              value={springDischarge}
              onChangeText={setSpringDischarge}
              keyboardType="numeric"
            />

            <Input
              testID="input-spring-beneficiaries"
              label="Jumlah KK Penerima Manfaat"
              placeholder="300"
              value={springBeneficiaries}
              onChangeText={setSpringBeneficiaries}
              keyboardType="numeric"
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setAddSpringVisible(false)}
              />
              <Button
                testID="btn-submit-spring"
                title="Simpan Mata Air"
                variant="primary"
                size="md"
                loading={addSpringLoading}
                onPress={handleAddSpring}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: EDIT SPRING SETTINGS (BANK / QRIS) */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Pengaturan Rekening & QRIS
              </Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            <Input
              testID="input-settings-fee"
              label="Iuran Bulanan Standar (Rp)"
              placeholder="15000"
              value={settingsMonthlyFee}
              onChangeText={setSettingsMonthlyFee}
              keyboardType="numeric"
            />

            <Input
              testID="input-settings-instructions"
              label="Petunjuk Rekening Bank / Pembayaran"
              placeholder="Contoh: Transfer Bank Jateng 2-045-12345-6 a/n Paguyuban Bismo Asri"
              value={settingsInstructions}
              onChangeText={setSettingsInstructions}
              multiline
              numberOfLines={3}
            />

            <ImageUploadField
              key={settingsModalVisible ? 'open' : 'closed'}
              label="Unggah QRIS Resmi Mata Air"
              helperText="Format JPG/PNG, dikompresi otomatis."
              valueUri={settingsQrisReadUrl}
              onChange={async (base64) => {
                if (!base64) return;
                try {
                  const uploadRes = await api.uploadImage('qris_image', base64);
                  setSettingsQrisPath(uploadRes.objectPath);
                  setSettingsQrisReadUrl(uploadRes.readUrl);
                } catch (e: any) {
                  Alert.alert('Gagal Unggah', e?.message || 'Gagal memproses QRIS.');
                }
              }}
              onClear={() => {
                setSettingsQrisPath(null);
                setSettingsQrisReadUrl(null);
              }}
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setSettingsModalVisible(false)}
              />
              <Button
                testID="btn-save-spring-settings"
                title="Simpan Pengaturan"
                variant="primary"
                size="md"
                loading={savingSettings}
                onPress={handleSaveSettings}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 3: CREATE CAMPAIGN */}
      <Modal
        visible={createCampaignVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateCampaignVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Buat Program Revitalisasi Baru
              </Text>
              <TouchableOpacity onPress={() => setCreateCampaignVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            {/* Spring selection chips */}
            <Text style={[styles.formLabel, { color: theme.ink }]}>Pilih Mata Air:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalChipsScroll}>
              {springs.map((spr) => {
                const isSelected = spr.id === campaignSpringId;
                return (
                  <TouchableOpacity
                    key={spr.id}
                    onPress={() => setCampaignSpringId(spr.id)}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.border
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        { color: isSelected ? theme.accentInk : theme.ink }
                      ]}
                    >
                      {spr.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input
              testID="input-campaign-title"
              label="Judul Program"
              placeholder="Contoh: Restorasi Hulu Tuk Watulumbung & Penanaman Aren"
              value={campaignTitle}
              onChangeText={setCampaignTitle}
            />

            <Input
              testID="input-campaign-desc"
              label="Deskripsi Program Konservasi"
              placeholder="Jelaskan tujuan revitalisasi, kebutuhan pipa, rorak, atau bibit..."
              value={campaignDesc}
              onChangeText={setCampaignDesc}
              multiline
              numberOfLines={3}
            />

            <Input
              testID="input-campaign-target"
              label="Target Pendanaan (Rp)"
              placeholder="25000000"
              value={campaignTarget}
              onChangeText={setCampaignTarget}
              keyboardType="numeric"
            />

            <Input
              testID="input-campaign-instructions"
              label="Petunjuk Rekening Donasi"
              placeholder="Rekening donasi resmi..."
              value={campaignInstructions}
              onChangeText={setCampaignInstructions}
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setCreateCampaignVisible(false)}
              />
              <Button
                testID="btn-submit-campaign"
                title="Publikasikan Program"
                variant="primary"
                size="md"
                loading={creatingCampaign}
                onPress={handleCreateCampaign}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 4: EDIT USER ROLES */}
      <Modal
        visible={userModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Kelola Peran & Izin Pengguna
              </Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.userModalSubtitle, { color: theme.muted }]}>
              {selectedUser?.name} ({selectedUser?.email})
            </Text>

            {/* Role toggles */}
            <Text style={[styles.formLabel, { color: theme.ink, marginTop: spacing.sm }]}>
              Pilih Peran Aktif:
            </Text>
            <View style={styles.roleTogglesWrap}>
              {(['warga', 'pengelola', 'relawan', 'donatur', 'admin'] as Role[]).map((r) => {
                const isActive = userRoles.includes(r);
                return (
                  <TouchableOpacity
                    key={r}
                    testID={`role-toggle-${r}`}
                    onPress={() => toggleRole(r)}
                    style={[
                      styles.roleToggleChip,
                      {
                        backgroundColor: isActive ? theme.accent : theme.surface,
                        borderColor: isActive ? theme.accent : theme.border
                      }
                    ]}
                  >
                    <Ionicons
                      name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={isActive ? theme.accentInk : theme.muted}
                    />
                    <Text
                      style={[
                        styles.roleToggleText,
                        { color: isActive ? theme.accentInk : theme.ink }
                      ]}
                    >
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* If Pengelola selected: Managed Spring IDs */}
            {userRoles.includes('pengelola') && (
              <View style={styles.managedSpringsSection}>
                <Text style={[styles.formLabel, { color: theme.ink }]}>
                  Pilih Mata Air yang Dikelola Pengelola Ini:
                </Text>
                {springs.map((spr) => {
                  const isManaged = userManagedSprings.includes(spr.id);
                  return (
                    <TouchableOpacity
                      key={spr.id}
                      testID={`toggle-managed-spring-${spr.id}`}
                      onPress={() => toggleManagedSpring(spr.id)}
                      style={[
                        styles.springSelectRow,
                        {
                          backgroundColor: isManaged ? theme.accentMuted : theme.surface,
                          borderColor: isManaged ? theme.accent : theme.border
                        }
                      ]}
                    >
                      <Ionicons
                        name={isManaged ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isManaged ? theme.accent : theme.muted}
                      />
                      <Text style={[styles.springSelectName, { color: theme.ink }]}>
                        {spr.name} ({spr.id})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setUserModalVisible(false)}
              />
              <Button
                testID="btn-save-user-roles"
                title="Simpan Peran"
                variant="primary"
                size="md"
                loading={savingUserRoles}
                onPress={handleSaveUserRoles}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 5: EDIT SPRING */}
      <Modal
        visible={editSpringVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditSpringVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Edit Data Mata Air
              </Text>
              <TouchableOpacity onPress={() => setEditSpringVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            {editSpringError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.errorInk }]}>
                  {editSpringError}
                </Text>
              </View>
            ) : null}

            <Input
              testID="input-edit-spring-name"
              label="Nama Mata Air"
              placeholder="Contoh: Belik Tuk Silumut"
              value={editSpringName}
              onChangeText={setEditSpringName}
            />

            <Input
              testID="input-edit-spring-village"
              label="Desa / Kelurahan"
              placeholder="Contoh: Desa Besani"
              value={editSpringVillage}
              onChangeText={setEditSpringVillage}
            />

            <Input
              testID="input-edit-spring-district"
              label="Kecamatan"
              placeholder="Kecamatan Blado"
              value={editSpringDistrict}
              onChangeText={setEditSpringDistrict}
            />

            <Input
              testID="input-edit-spring-discharge"
              label="Kapasitas Debit Baseline (L/detik)"
              placeholder="Contoh: 25.5"
              value={editSpringDischarge}
              onChangeText={setEditSpringDischarge}
              keyboardType="numeric"
            />

            <Input
              testID="input-edit-spring-beneficiaries"
              label="Jumlah KK Penerima Manfaat"
              placeholder="Contoh: 300"
              value={editSpringBeneficiaries}
              onChangeText={setEditSpringBeneficiaries}
              keyboardType="numeric"
            />

            <View style={styles.statusToggleRow}>
              <Text style={[styles.statusLabel, { color: theme.ink }]}>
                Status Operasional:
              </Text>
              <View style={styles.statusChipsRow}>
                <TouchableOpacity
                  testID="btn-spring-status-active"
                  onPress={() => setEditSpringStatus('active')}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: editSpringStatus === 'active' ? theme.accent : theme.surface,
                      borderColor: editSpringStatus === 'active' ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: editSpringStatus === 'active' ? theme.accentInk : theme.ink }
                    ]}
                  >
                    Aktif
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="btn-spring-status-rehab"
                  onPress={() => setEditSpringStatus('rehabilitation')}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: editSpringStatus === 'rehabilitation' ? '#f59e0b' : theme.surface,
                      borderColor: editSpringStatus === 'rehabilitation' ? '#f59e0b' : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: editSpringStatus === 'rehabilitation' ? '#ffffff' : theme.ink }
                    ]}
                  >
                    Rehabilitasi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setEditSpringVisible(false)}
              />
              <Button
                testID="btn-save-edit-spring"
                title="Simpan Perubahan"
                variant="primary"
                size="md"
                loading={savingEditSpring}
                onPress={handleSaveEditSpring}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 6: EDIT CAMPAIGN */}
      <Modal
        visible={editCampaignVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditCampaignVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Edit Program Revitalisasi
              </Text>
              <TouchableOpacity onPress={() => setEditCampaignVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            {editCampaignError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.errorInk }]}>
                  {editCampaignError}
                </Text>
              </View>
            ) : null}

            <Input
              testID="input-edit-campaign-title"
              label="Judul Program Revitalisasi"
              placeholder="Contoh: Reboisasi Hulu Mata Air"
              value={editCampaignTitle}
              onChangeText={setEditCampaignTitle}
            />

            <Input
              testID="input-edit-campaign-desc"
              label="Deskripsi / Tujuan Program"
              placeholder="Jelaskan tujuan konservasi dan rincian fisik..."
              value={editCampaignDesc}
              onChangeText={setEditCampaignDesc}
              multiline
            />

            <Input
              testID="input-edit-campaign-target"
              label="Target Pendanaan (Rp)"
              placeholder="25000000"
              value={editCampaignTarget}
              onChangeText={setEditCampaignTarget}
              keyboardType="numeric"
            />

            <View style={styles.statusToggleRow}>
              <Text style={[styles.statusLabel, { color: theme.ink }]}>
                Status Program:
              </Text>
              <View style={styles.statusChipsRow}>
                <TouchableOpacity
                  testID="btn-campaign-status-active"
                  onPress={() => setEditCampaignStatus('active')}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: editCampaignStatus === 'active' ? theme.accent : theme.surface,
                      borderColor: editCampaignStatus === 'active' ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: editCampaignStatus === 'active' ? theme.accentInk : theme.ink }
                    ]}
                  >
                    Aktif
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="btn-campaign-status-completed"
                  onPress={() => setEditCampaignStatus('completed')}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: editCampaignStatus === 'completed' ? '#10b981' : theme.surface,
                      borderColor: editCampaignStatus === 'completed' ? '#10b981' : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: editCampaignStatus === 'completed' ? '#ffffff' : theme.ink }
                    ]}
                  >
                    Selesai
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              testID="input-edit-campaign-instructions"
              label="Instruksi Pembayaran Donasi"
              placeholder="Contoh: Transfer ke Rekening Kas Paguyuban..."
              value={editCampaignInstructions}
              onChangeText={setEditCampaignInstructions}
              multiline
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setEditCampaignVisible(false)}
              />
              <Button
                testID="btn-save-edit-campaign"
                title="Simpan Perubahan"
                variant="primary"
                size="md"
                loading={savingEditCampaign}
                onPress={handleSaveEditCampaign}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerGreeting: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium
  },
  headerTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold
  },
  subtabContainer: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.md
  },
  subtabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm
  },
  subtabBtnActive: {
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  subtabText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold
  },
  tabContent: {
    marginBottom: spacing.xxl
  },
  springActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  campaignActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  sectionHeader: {
    marginBottom: spacing.md
  },
  sectionHeading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  itemCard: {
    marginBottom: spacing.md
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardInfoCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  itemTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  itemSub: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  dischargeInfoRow: {
    marginTop: spacing.xs
  },
  dischargeText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  editSettingsBtn: {
    marginTop: spacing.sm
  },
  campaignProgressLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs
  },
  rolesBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: spacing.xs
  },
  managedSpringsText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    marginLeft: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md
  },
  modalContent: {
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  modalScroll: {
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  userModalSubtitle: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.sm
  },
  formLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: 6
  },
  modalChipsScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 8
  },
  modalChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  roleTogglesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md
  },
  roleToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1
  },
  roleToggleText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold
  },
  managedSpringsSection: {
    marginVertical: spacing.sm
  },
  springSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 6
  },
  springSelectName: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  campaignBtnRow: {
    marginTop: spacing.sm,
    alignItems: 'flex-start'
  },
  statusToggleRow: {
    marginVertical: spacing.sm
  },
  statusLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    marginBottom: 6
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1
  },
  statusChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md
  },
  errorText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    flex: 1
  }
});
