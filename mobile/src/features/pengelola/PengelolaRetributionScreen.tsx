// mobile/src/features/pengelola/PengelolaRetributionScreen.tsx
// Pengelola Retribution: Tagihan Bulan Ini (generate, record cash, verify proof), Data Warga (add, generate linkCode, approve link), Info Rekening/QRIS

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Image
} from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, Input, EmptyState, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles, monoText } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import {
  RetributionBill,
  Resident,
  PendingUser,
  SpringSettings,
  SpringPublic
} from '../../api/types';
import { formatRupiah, formatPeriod, getRetributionStatusMeta } from '../warga/wargaUtils';
import { filterBillsByStatus, validateResidentInput } from './pengelolaUtils';

type SubTab = 'bills' | 'residents' | 'settings';
type BillFilter = 'all' | 'unpaid' | 'pending_verification' | 'paid';

export const PengelolaRetributionScreen: React.FC = () => {
  const toast = useToast();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [activeTab, setActiveTab] = useState<SubTab>('bills');
  const [billFilter, setBillFilter] = useState<BillFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Managed springs & selected spring ID
  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [selectedSpringId, setSelectedSpringId] = useState<string>(
    (user?.managedSpringIds && user.managedSpringIds[0]) || 'SPR-001'
  );
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Data states
  const [bills, setBills] = useState<RetributionBill[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [springSettings, setSpringSettings] = useState<SpringSettings | null>(null);

  // Modals & Action States
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);

  // Proof Inspection Modal
  const [proofModalVisible, setProofModalVisible] = useState<boolean>(false);
  const [selectedProofBill, setSelectedProofBill] = useState<RetributionBill | null>(null);

  // Reject Bill Modal
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [rejectBillId, setRejectBillId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);

  // Add Resident Modal
  const [addResidentVisible, setAddResidentVisible] = useState<boolean>(false);
  const [residentName, setResidentName] = useState<string>('');
  const [residentPhone, setResidentPhone] = useState<string>('');
  const [residentFee, setResidentFee] = useState<string>('15000');
  const [addResidentError, setAddResidentError] = useState<string>('');
  const [addResidentLoading, setAddResidentLoading] = useState<boolean>(false);

  // Edit Resident Modal
  const [editResidentVisible, setEditResidentVisible] = useState<boolean>(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [editResidentName, setEditResidentName] = useState<string>('');
  const [editResidentPhone, setEditResidentPhone] = useState<string>('');
  const [editResidentFee, setEditResidentFee] = useState<string>('15000');
  const [editResidentActive, setEditResidentActive] = useState<boolean>(true);
  const [editResidentError, setEditResidentError] = useState<string>('');
  const [editResidentLoading, setEditResidentLoading] = useState<boolean>(false);

  // Generated Link Code Alert / State
  const [generatedCodeInfo, setGeneratedCodeInfo] = useState<{
    code: string;
    residentName: string;
    expiresAt: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [springsRes, retRes, resRes, setRes] = await Promise.all([
        api.listSprings().catch(() => ({ springs: [] })),
        api.listRetributions({ springId: selectedSpringId, period: currentPeriod }).catch(() => ({ bills: [] })),
        api.listResidents(selectedSpringId).catch(() => ({ residents: [], pendingUsers: [] })),
        api.getSpringSettings(selectedSpringId).catch(() => null)
      ]);

      const managedIds = user?.managedSpringIds && user.managedSpringIds.length > 0
        ? user.managedSpringIds
        : ['SPR-001'];

      const filteredSprings = (springsRes.springs || []).filter((s) =>
        managedIds.includes(s.id)
      );

      setSprings(filteredSprings.length > 0 ? filteredSprings : springsRes.springs || []);
      if (retRes?.bills) setBills(retRes.bills);
      if (resRes?.residents) setResidents(resRes.residents);
      if (resRes?.pendingUsers) setPendingUsers(resRes.pendingUsers);
      if (setRes) setSpringSettings(setRes);
    } catch (err) {
      console.warn('PengelolaRetributionScreen: loadData error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, selectedSpringId, user?.managedSpringIds, currentPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Generate Monthly Bills
  const handleGenerateBills = async () => {
    setGenerateLoading(true);
    try {
      const res = await api.generateBills({ springId: selectedSpringId, period: currentPeriod });
      if (res.success) {
        toast.success(
          `Berhasil menerbitkan ${res.createdCount} tagihan baru. (${res.skippedCount} warga sudah memiliki tagihan periode ini).`,
          'Tagihan Diterbitkan'
        );
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menerbitkan tagihan.', 'Gagal Menerbitkan');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Handle 1-Tap Record Cash
  const handleRecordCash = async (billId: string) => {
    try {
      const res = await api.recordCash(billId);
      if (res.success) {
        toast.success('Pembayaran tunai berhasil dicatat!');
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal mencatat pembayaran tunai.');
    }
  };

  // Handle Approve Retribution Proof
  const handleApproveBill = async (billId: string) => {
    try {
      const res = await api.verifyRetribution(billId, 'approve');
      if (res.success) {
        toast.success('Bukti transfer disetujui, tagihan dinyatakan lunas!');
        setProofModalVisible(false);
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menyetujui bukti transfer.');
    }
  };

  // Handle Reject Retribution Proof
  const handleRejectBill = async () => {
    if (!rejectionReason.trim()) {
      toast.warning('Mohon tuliskan alasan penolakan.');
      return;
    }
    setRejectLoading(true);
    try {
      const res = await api.verifyRetribution(rejectBillId, 'reject', rejectionReason.trim());
      if (res.success) {
        toast.success('Bukti transfer ditolak.');
        setRejectModalVisible(false);
        setRejectionReason('');
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menolak bukti transfer.');
    } finally {
      setRejectLoading(false);
    }
  };

  // Handle Create Resident
  const handleCreateResident = async () => {
    const feeNum = parseInt(residentFee, 10) || 0;
    const validation = validateResidentInput({
      name: residentName,
      phone: residentPhone,
      monthlyFee: feeNum
    });

    if (!validation.valid) {
      setAddResidentError(validation.error || 'Input tidak valid.');
      return;
    }

    setAddResidentLoading(true);
    setAddResidentError('');
    try {
      const res = await api.createResident({
        springId: selectedSpringId,
        name: residentName.trim(),
        phone: residentPhone.trim(),
        monthlyFee: feeNum
      });

      if (res.success) {
        toast.success(`Data warga ${res.resident.name} berhasil ditambahkan!`);
        setAddResidentVisible(false);
        setResidentName('');
        setResidentPhone('');
        loadData();
      }
    } catch (e: any) {
      setAddResidentError(e?.message || 'Gagal menambahkan data warga.');
    } finally {
      setAddResidentLoading(false);
    }
  };

  // Handle Open & Save Edit Resident
  const handleOpenEditResident = (resident: Resident) => {
    setEditingResident(resident);
    setEditResidentName(resident.name);
    setEditResidentPhone(resident.phone || '');
    setEditResidentFee(String(resident.monthlyFee || 15000));
    setEditResidentActive(resident.active !== false);
    setEditResidentError('');
    setEditResidentVisible(true);
  };

  const handleSaveEditResident = async () => {
    if (!editingResident) return;
    const feeNum = parseInt(editResidentFee.replace(/\D/g, ''), 10) || 0;
    const validation = validateResidentInput({
      name: editResidentName,
      phone: editResidentPhone,
      monthlyFee: feeNum
    });

    if (!validation.valid) {
      setEditResidentError(validation.error || 'Data warga tidak valid.');
      return;
    }

    setEditResidentLoading(true);
    setEditResidentError('');
    try {
      const res = await api.updateResident(editingResident.id, {
        name: editResidentName.trim(),
        phone: editResidentPhone.trim(),
        monthlyFee: feeNum,
        active: editResidentActive
      });

      if (res.success) {
        toast.success(`Data warga ${editResidentName} berhasil diperbarui.`);
        setEditResidentVisible(false);
        loadData();
      }
    } catch (e: any) {
      setEditResidentError(e?.message || 'Gagal memperbarui data warga.');
    } finally {
      setEditResidentLoading(false);
    }
  };

  // Handle Generate Link Code
  const handleGenerateLinkCode = async (resident: Resident) => {
    try {
      const res = await api.generateLinkCode(resident.id);
      if (res.success) {
        setGeneratedCodeInfo({
          code: res.linkCode,
          residentName: resident.name,
          expiresAt: res.linkCodeExpiresAt
        });
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal membuat kode tautan.');
    }
  };

  // Handle Approve Link Request
  const handleApproveLink = async (pendingUser: PendingUser) => {
    try {
      // Find matching resident by phone or name, or link directly
      const matchingResident = residents.find(
        (r) => !r.userId && (r.phone === pendingUser.phone || r.name.toLowerCase() === pendingUser.name?.toLowerCase())
      );

      const res = await api.approveLink({
        userUid: pendingUser.uid,
        residentId: matchingResident ? matchingResident.id : undefined,
        createResident: !matchingResident
          ? {
              name: pendingUser.name || 'Warga BelikHub',
              phone: pendingUser.phone || '081234567800',
              monthlyFee: springSettings?.defaultMonthlyFee || 15000
            }
          : undefined
      });

      if (res.success) {
        toast.success(`Akun ${pendingUser.name} kini terhubung dengan data warga.`, 'Tautan Disetujui');
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menyetujui permohonan tautan.');
    }
  };

  const filteredBills = filterBillsByStatus(bills, billFilter);

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadData();
      }}
    >
      {/* Title */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Kelola Retribusi & Warga
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            Mata Air {selectedSpringId} • Periode {formatPeriod(currentPeriod)}
          </Text>
        </View>
      </View>

      {/* Multi-Spring Selector Chip Bar */}
      {springs.length > 1 && (
        <Card variant="outlined" padding="sm" style={styles.springSelectorCard}>
          <Text style={[styles.springSelectorLabel, { color: theme.muted }]}>
            Pilih Mata Air Dikelola:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.springScroll}>
            {springs.map((spring) => {
              const isSelected = spring.id === selectedSpringId;
              return (
                <PressableScale
                  key={spring.id}
                  testID={`retribution-spring-chip-${spring.id}`}
                  onPress={() => setSelectedSpringId(spring.id)}
                  style={[
                    styles.springChip,
                    {
                      backgroundColor: isSelected ? theme.accent : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Ionicons
                    name="water-outline"
                    size={16}
                    color={isSelected ? theme.accentInk : theme.ink}
                  />
                  <Text
                    style={[
                      styles.springChipText,
                      {
                        color: isSelected ? theme.accentInk : theme.ink,
                        fontWeight: isSelected ? typography.fontWeights.bold : typography.fontWeights.medium
                      }
                    ]}
                  >
                    {spring.name}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Card>
      )}

      {/* Sub-Tab Switcher */}
      <View style={[styles.subtabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <PressableScale
          testID="subtab-tagihan"
          onPress={() => setActiveTab('bills')}
          style={[
            styles.subtabBtn,
            activeTab === 'bills' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === 'bills' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'bills' ? theme.accentInk : theme.ink }
            ]}
          >
            Tagihan Bulan Ini
          </Text>
        </PressableScale>

        <PressableScale
          testID="subtab-warga"
          onPress={() => setActiveTab('residents')}
          style={[
            styles.subtabBtn,
            activeTab === 'residents' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTab === 'residents' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'residents' ? theme.accentInk : theme.ink }
            ]}
          >
            Data Warga
          </Text>
        </PressableScale>

        <PressableScale
          testID="subtab-settings"
          onPress={() => setActiveTab('settings')}
          style={[
            styles.subtabBtn,
            activeTab === 'settings' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="card-outline"
            size={16}
            color={activeTab === 'settings' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'settings' ? theme.accentInk : theme.ink }
            ]}
          >
            Info Rekening/QRIS
          </Text>
        </PressableScale>
      </View>

      {/* SUB-TAB 1: TAGIHAN BULAN INI */}
      {activeTab === 'bills' && (
        <View style={styles.tabContent}>
          {/* Action Row: Generate Bills Button */}
          <Card variant="outlined" padding="md" style={styles.generateCard}>
            <View style={styles.generateRow}>
              <View style={styles.generateCol}>
                <Text style={[styles.generateTitle, { color: theme.ink }]}>
                  Terbitkan Tagihan {formatPeriod(currentPeriod)}
                </Text>
                <Text style={[styles.generateSubtitle, { color: theme.muted }]}>
                  Buat lembar tagihan serentak untuk seluruh warga aktif mata air ini.
                </Text>
              </View>
              <Button
                testID="btn-generate-bills"
                title="Terbitkan"
                variant="primary"
                size="sm"
                loading={generateLoading}
                icon={<Ionicons name="flash" size={16} color={theme.accentInk} />}
                onPress={handleGenerateBills}
              />
            </View>
          </Card>

          {/* Filter Status Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'unpaid', label: 'Belum Bayar' },
              { id: 'pending_verification', label: 'Perlu Cek' },
              { id: 'paid', label: 'Lunas' }
            ].map((f) => {
              const isSelected = billFilter === f.id;
              return (
                <PressableScale
                  key={f.id}
                  testID={`filter-bill-${f.id}`}
                  onPress={() => setBillFilter(f.id as BillFilter)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? theme.accent : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? theme.accentInk : theme.ink }
                    ]}
                  >
                    {f.label}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          {/* Bills List */}
          {filteredBills.length === 0 ? (
            <EmptyState
              title="Tidak Ada Tagihan"
              description="Tidak ditemukan tagihan dengan filter yang dipilih."
              icon="receipt-outline"
            />
          ) : (
            filteredBills.map((bill) => {
              const meta = getRetributionStatusMeta(bill.status);
              return (
                <Card key={bill.id} variant="elevated" padding="md" style={styles.billCard}>
                  <View style={styles.billTopRow}>
                    <View style={styles.billInfoCol}>
                      <Text style={[styles.billResidentName, { color: theme.ink }]}>
                        {bill.residentName || 'Warga'}
                      </Text>
                      <Text style={[styles.billMeta, { color: theme.muted }]}>
                        Periode {formatPeriod(bill.period)} • Met: {bill.paymentMethod || 'Belum'}
                      </Text>
                    </View>
                    <Badge label={meta.label} variant={meta.tone} size="sm" />
                  </View>

                  <View style={styles.billActionRow}>
                    <Text style={[styles.billAmount, { color: theme.ink }, monoText]}>
                      {formatRupiah(bill.amount)}
                    </Text>

                    <View style={styles.billButtonCluster}>
                      {/* 1-Tap Record Cash Button for Unpaid */}
                      {bill.status === 'unpaid' && (
                        <Button
                          testID={`btn-record-cash-${bill.id}`}
                          title="Catat Tunai"
                          variant="primary"
                          size="sm"
                          icon={<Ionicons name="cash-outline" size={15} color={theme.accentInk} />}
                          onPress={() => handleRecordCash(bill.id)}
                        />
                      )}

                      {/* Pending Verification Actions: View Proof, Approve, Reject */}
                      {bill.status === 'pending_verification' && (
                        <>
                          {bill.proofUrl && (
                            <Button
                              testID={`btn-view-proof-${bill.id}`}
                              title="Lihat Bukti"
                              variant="outline"
                              size="sm"
                              onPress={() => {
                                setSelectedProofBill(bill);
                                setProofModalVisible(true);
                              }}
                            />
                          )}
                          <Button
                            testID={`btn-approve-bill-${bill.id}`}
                            title="Setujui"
                            variant="primary"
                            size="sm"
                            onPress={() => handleApproveBill(bill.id)}
                          />
                          <Button
                            testID={`btn-reject-bill-${bill.id}`}
                            title="Tolak"
                            variant="danger"
                            size="sm"
                            onPress={() => {
                              setRejectBillId(bill.id);
                              setRejectModalVisible(true);
                            }}
                          />
                        </>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* SUB-TAB 2: DATA WARGA */}
      {activeTab === 'residents' && (
        <View style={styles.tabContent}>
          {/* Add Resident Button */}
          <View style={styles.addResidentActionRow}>
            <Text style={[styles.sectionHeading, { color: theme.ink }]}>
              Daftar Pelanggan Air ({residents.length})
            </Text>
            <Button
              testID="btn-open-add-resident"
              title="Tambah Warga"
              variant="primary"
              size="sm"
              icon={<Ionicons name="person-add-outline" size={16} color={theme.accentInk} />}
              onPress={() => setAddResidentVisible(true)}
            />
          </View>

          {/* Pending Link Requests Section if any */}
          {pendingUsers.length > 0 && (
            <Card variant="outlined" padding="md" style={styles.pendingLinkCard}>
              <View style={styles.pendingLinkHeader}>
                <Ionicons name="link-outline" size={18} color={theme.warning} />
                <Text style={[styles.pendingLinkTitle, { color: theme.ink }]}>
                  Permohonan Tautan Akun Warga ({pendingUsers.length})
                </Text>
              </View>
              {pendingUsers.map((pu) => (
                <View key={pu.uid} style={styles.pendingUserRow}>
                  <View style={styles.pendingUserCol}>
                    <Text style={[styles.pendingUserName, { color: theme.ink }]}>
                      {pu.name || 'Warga Tanpa Nama'}
                    </Text>
                    <Text style={[styles.pendingUserPhone, { color: theme.muted }]}>
                      {pu.phone || pu.email}
                    </Text>
                  </View>
                  <Button
                    testID={`btn-approve-link-${pu.uid}`}
                    title="Setujui Tautan"
                    variant="primary"
                    size="sm"
                    onPress={() => handleApproveLink(pu)}
                  />
                </View>
              ))}
            </Card>
          )}

          {/* Generated Code Notice Banner */}
          {generatedCodeInfo && (
            <Card variant="elevated" padding="md" style={styles.generatedCodeCard}>
              <View style={styles.codeHeaderRow}>
                <Ionicons name="key" size={20} color={theme.accent} />
                <Text style={[styles.codeNoticeTitle, { color: theme.ink }]}>
                  Kode Tautan Berhasil Dibuat
                </Text>
                <PressableScale onPress={() => setGeneratedCodeInfo(null)}>
                  <Ionicons name="close-circle" size={20} color={theme.muted} />
                </PressableScale>
              </View>
              <Text style={[styles.codeNoticeDesc, { color: theme.muted }]}>
                Berikan kode ini kepada {generatedCodeInfo.residentName} untuk ditautkan di aplikasi:
              </Text>
              <View style={[styles.codeDisplayBox, { backgroundColor: theme.surface }]}>
                <Text style={[styles.codeText, { color: theme.accent }]}>
                  {generatedCodeInfo.code}
                </Text>
              </View>
            </Card>
          )}

          {/* Residents List */}
          {residents.length === 0 ? (
            <EmptyState
              title="Belum Ada Data Warga"
              description="Tambahkan data warga non-aplikasi agar tagihan bulanan dapat diterbitkan."
              icon="people-outline"
            />
          ) : (
            residents.map((r) => {
              const isLinked = Boolean(r.userId);
              return (
                <Card key={r.id} variant="outlined" padding="md" style={styles.residentCard}>
                  <View style={styles.residentTopRow}>
                    <View style={styles.residentInfoCol}>
                      <Text style={[styles.residentName, { color: theme.ink }]}>
                        {r.name}
                      </Text>
                      <Text style={[styles.residentMeta, { color: theme.muted }, monoText]}>
                        {r.phone} {r.kkLabel ? `• ${r.kkLabel}` : ''} • Iuran: {formatRupiah(r.monthlyFee)}/bln
                      </Text>
                    </View>
                    <Badge
                      label={isLinked ? 'Tertaut' : 'Non-App'}
                      variant={isLinked ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>

                  <View style={styles.residentActionRow}>
                    <View style={styles.residentBtnGroup}>
                      <Button
                        testID={`btn-edit-resident-${r.id}`}
                        title="Edit Warga"
                        variant="outline"
                        size="sm"
                        icon={<Ionicons name="create-outline" size={14} color={theme.accent} />}
                        onPress={() => handleOpenEditResident(r)}
                      />
                      {!isLinked && (
                        <Button
                          testID={`btn-generate-code-${r.id}`}
                          title="Kode Tautan"
                          variant="outline"
                          size="sm"
                          icon={<Ionicons name="key-outline" size={14} color={theme.ink} />}
                          onPress={() => handleGenerateLinkCode(r)}
                        />
                      )}
                    </View>

                    {r.linkCode ? (
                      <View style={styles.existingCodeRow}>
                        <Text style={[styles.existingCodeLabel, { color: theme.muted }]}>
                          Kode Aktif:{' '}
                        </Text>
                        <Text style={[styles.existingCodeVal, { color: theme.accent }]}>
                          {r.linkCode}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* SUB-TAB 3: INFO REKENING & QRIS (Read-Only) */}
      {activeTab === 'settings' && (
        <View style={styles.tabContent}>
          <Card variant="elevated" padding="lg" style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View style={[styles.settingsIconCircle, { backgroundColor: theme.accentMuted }]}>
                <Ionicons name="card" size={24} color={theme.accent} />
              </View>
              <View style={styles.settingsHeaderCol}>
                <Text style={[styles.settingsTitle, { color: theme.ink }]}>
                  Instruksi Pembayaran Retribusi
                </Text>
                <Text style={[styles.settingsSubtitle, { color: theme.muted }]}>
                  Dikonfigurasi oleh Administrator BelikHub
                </Text>
              </View>
            </View>

            <View style={[styles.settingItemBox, { borderColor: theme.border }]}>
              <Text style={[styles.settingItemLabel, { color: theme.muted }]}>
                Iuran Bulanan Standar:
              </Text>
              <Text style={[styles.settingItemValue, { color: theme.ink }, monoText]}>
                {formatRupiah(springSettings?.defaultMonthlyFee || 15000)} / KK / bulan
              </Text>
            </View>

            <View style={[styles.settingItemBox, { borderColor: theme.border }]}>
              <Text style={[styles.settingItemLabel, { color: theme.muted }]}>
                Petunjuk Rekening Bank / Pembayaran:
              </Text>
              <Text style={[styles.settingItemValue, { color: theme.ink }]}>
                {springSettings?.paymentInstructions ||
                  'Hubungi kantor pengelola mata air desa untuk petunjuk pembayaran retribusi.'}
              </Text>
            </View>

            {springSettings?.qrisReadUrl ? (
              <View style={styles.qrisWrap}>
                <Text style={[styles.settingItemLabel, { color: theme.muted, marginBottom: 8 }]}>
                  QRIS Pembayaran Resmi:
                </Text>
                <Image
                  source={{ uri: springSettings.qrisReadUrl }}
                  style={styles.qrisImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            <View style={[styles.readonlyNotice, { backgroundColor: theme.surface }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
              <Text style={[styles.readonlyNoticeText, { color: theme.muted }]}>
                Jika ada pembaruan nomor rekening paguyuban atau QRIS desa, hubungi Admin melalui menu BelikHub Admin Console.
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* MODAL 1: PROOF INSPECTION */}
      <Modal
        visible={proofModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Bukti Transfer Warga
              </Text>
              <PressableScale onPress={() => setProofModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            {selectedProofBill?.proofUrl && (
              <Image
                source={{ uri: selectedProofBill.proofUrl }}
                style={styles.proofFullImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.modalFooterRow}>
              <Button
                title="Tutup"
                variant="outline"
                size="md"
                onPress={() => setProofModalVisible(false)}
              />
              {selectedProofBill && (
                <Button
                  testID={`btn-approve-bill-${selectedProofBill.id}`}
                  title="Setujui Bukti"
                  variant="primary"
                  size="md"
                  onPress={() => handleApproveBill(selectedProofBill.id)}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: REJECT REASON MODAL */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Alasan Penolakan Bukti
              </Text>
              <PressableScale onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            <Input
              testID="input-reject-reason"
              label="Alasan Penolakan"
              placeholder="Contoh: Foto buram, nominal transfer tidak sesuai"
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setRejectModalVisible(false)}
              />
              <Button
                testID="btn-confirm-reject-bill"
                title="Tolak Bukti"
                variant="danger"
                size="md"
                loading={rejectLoading}
                onPress={handleRejectBill}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ADD RESIDENT MODAL */}
      <Modal
        visible={addResidentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddResidentVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Tambah Warga Non-Aplikasi
              </Text>
              <PressableScale onPress={() => setAddResidentVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            {addResidentError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.errorInk }]}>
                  {addResidentError}
                </Text>
              </View>
            ) : null}

            <Input
              testID="input-resident-name"
              label="Nama Lengkap Warga / KK"
              placeholder="Contoh: Pak Slamet Riyadi"
              value={residentName}
              onChangeText={setResidentName}
            />

            <Input
              testID="input-resident-phone"
              label="Nomor Telepon / WhatsApp"
              placeholder="Contoh: 081234567890"
              value={residentPhone}
              onChangeText={setResidentPhone}
              keyboardType="phone-pad"
            />

            <Input
              testID="input-resident-fee"
              label="Iuran Bulanan (Rp)"
              placeholder="15000"
              value={residentFee}
              onChangeText={setResidentFee}
              keyboardType="numeric"
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setAddResidentVisible(false)}
              />
              <Button
                testID="btn-submit-resident"
                title="Simpan Warga"
                variant="primary"
                size="md"
                loading={addResidentLoading}
                onPress={handleCreateResident}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: EDIT RESIDENT MODAL */}
      <Modal
        visible={editResidentVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditResidentVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Edit Data Warga
              </Text>
              <PressableScale onPress={() => setEditResidentVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            {editResidentError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.errorInk }]}>
                  {editResidentError}
                </Text>
              </View>
            ) : null}

            <Input
              testID="input-edit-resident-name"
              label="Nama Lengkap Warga / KK"
              placeholder="Contoh: Pak Slamet Riyadi"
              value={editResidentName}
              onChangeText={setEditResidentName}
            />

            <Input
              testID="input-edit-resident-phone"
              label="Nomor Telepon / WhatsApp"
              placeholder="Contoh: 081234567890"
              value={editResidentPhone}
              onChangeText={setEditResidentPhone}
              keyboardType="phone-pad"
            />

            <Input
              testID="input-edit-resident-fee"
              label="Iuran Bulanan (Rp)"
              placeholder="15000"
              value={editResidentFee}
              onChangeText={setEditResidentFee}
              keyboardType="numeric"
            />

            <View style={styles.activeStatusToggleRow}>
              <Text style={[styles.activeStatusLabel, { color: theme.ink }]}>
                Status Warga:
              </Text>
              <View style={styles.statusChipsRow}>
                <PressableScale
                  testID="btn-resident-status-active"
                  onPress={() => setEditResidentActive(true)}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: editResidentActive ? theme.accent : theme.surface,
                      borderColor: editResidentActive ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: editResidentActive ? theme.accentInk : theme.ink }
                    ]}
                  >
                    Aktif
                  </Text>
                </PressableScale>
                <PressableScale
                  testID="btn-resident-status-inactive"
                  onPress={() => setEditResidentActive(false)}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: !editResidentActive ? theme.error : theme.surface,
                      borderColor: !editResidentActive ? theme.error : theme.border
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: !editResidentActive ? '#ffffff' : theme.ink }
                    ]}
                  >
                    Non-Aktif
                  </Text>
                </PressableScale>
              </View>
            </View>

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setEditResidentVisible(false)}
              />
              <Button
                testID="btn-save-edit-resident"
                title="Simpan Perubahan"
                variant="primary"
                size="md"
                loading={editResidentLoading}
                onPress={handleSaveEditResident}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    marginBottom: spacing.md
  },
  headerTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold
  },
  headerSubtitle: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
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
    shadowColor: '#1f3038',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1
  },
  subtabText: {
    ...textStyles.label,
  },
  tabContent: {
    marginBottom: spacing.xl
  },
  generateCard: {
    marginBottom: spacing.md
  },
  generateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  generateCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  generateTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  generateSubtitle: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginRight: 8
  },
  filterChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  billCard: {
    marginBottom: spacing.sm
  },
  billTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  billInfoCol: {
    flex: 1
  },
  billResidentName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  billMeta: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  billActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  billAmount: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  billButtonCluster: {
    flexDirection: 'row',
    gap: 6
  },
  addResidentActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  sectionHeading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  pendingLinkCard: {
    marginBottom: spacing.md
  },
  pendingLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm
  },
  pendingLinkTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  pendingUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  pendingUserCol: {
    flex: 1
  },
  pendingUserName: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold
  },
  pendingUserPhone: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  generatedCodeCard: {
    marginBottom: spacing.md
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  codeNoticeTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    flex: 1,
    marginLeft: 8
  },
  codeNoticeDesc: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 4
  },
  codeDisplayBox: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm
  },
  codeText: {
    fontFamily: typography.fontFamilies.mono,
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 4
  },
  residentCard: {
    marginBottom: spacing.sm
  },
  residentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  residentInfoCol: {
    flex: 1
  },
  residentName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  residentMeta: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  residentActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  existingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  existingCodeLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  existingCodeVal: {
    fontFamily: typography.fontFamilies.mono,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  settingsCard: {
    marginBottom: spacing.md
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  settingsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  settingsHeaderCol: {
    flex: 1
  },
  settingsTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  settingsSubtitle: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  settingItemBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  settingItemLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginBottom: 4
  },
  settingItemValue: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium
  },
  qrisWrap: {
    alignItems: 'center',
    marginVertical: spacing.sm
  },
  qrisImage: {
    width: 220,
    height: 220,
    borderRadius: radius.md
  },
  readonlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: 8
  },
  readonlyNoticeText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    flex: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md
  },
  modalContent: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%'
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
  proofFullImage: {
    width: '100%',
    height: 280,
    borderRadius: radius.md,
    marginBottom: spacing.md
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md
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
  },
  springSelectorCard: {
    marginBottom: spacing.md
  },
  springSelectorLabel: {
    ...textStyles.label,
    marginBottom: spacing.xs
  },
  springScroll: {
    flexDirection: 'row'
  },
  springChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginRight: 8
  },
  springChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm
  },
  residentBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  activeStatusToggleRow: {
    marginVertical: spacing.sm
  },
  activeStatusLabel: {
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
    borderRadius: radius.sm,
    borderWidth: 1
  },
  statusChipText: {
    ...textStyles.label,
  }
});
