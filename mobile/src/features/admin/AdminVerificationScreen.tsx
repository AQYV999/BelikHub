// mobile/src/features/admin/AdminVerificationScreen.tsx
// Admin Verification: sub-tabs for Verifikasi Donasi and Verifikasi Laporan Lapangan

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
  EmptyState
} from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { Donation, FieldReport } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { getDonationStatusMeta } from '../donatur/donaturUtils';

type VerificationTab = 'donations' | 'reports';

export const AdminVerificationScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [activeTab, setActiveTab] = useState<VerificationTab>('donations');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Reject Donation Modal
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [rejectDonationId, setRejectDonationId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);

  // Proof Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [donRes, repRes] = await Promise.all([
        api.listDonations().catch(() => ({ donations: [] })),
        api.listAllReports({ status: 'pending' }).catch(() => ({ reports: [] }))
      ]);

      if (donRes?.donations) setDonations(donRes.donations);
      if (repRes?.reports) setReports(repRes.reports);
    } catch (err) {
      console.warn('AdminVerificationScreen: loadData error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Approve Donation
  const handleApproveDonation = async (donationId: string) => {
    try {
      const res = await api.verifyDonation(donationId, 'approve');
      if (res.success) {
        Alert.alert('Sukses', 'Donasi berhasil disetujui dan ditambahkan ke saldo kampanye!');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal Menyetujui', e?.message || 'Gagal menyetujui donasi.');
    }
  };

  // Handle Reject Donation
  const handleRejectDonation = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Perhatian', 'Mohon tuliskan alasan penolakan.');
      return;
    }

    setRejectLoading(true);
    try {
      const res = await api.verifyDonation(rejectDonationId, 'reject', rejectionReason.trim());
      if (res.success) {
        Alert.alert('Selesai', 'Donasi ditolak.');
        setRejectModalVisible(false);
        setRejectionReason('');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal menolak donasi.');
    } finally {
      setRejectLoading(false);
    }
  };

  // Handle Approve Report
  const handleApproveReport = async (reportId: string) => {
    try {
      const res = await api.updateReportStatus(reportId, 'approved');
      if (res.success) {
        Alert.alert('Sukses', 'Laporan lapangan disetujui dan poin telah ditambahkan ke relawan!');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal menyetujui laporan.');
    }
  };

  // Handle Reject Report
  const handleRejectReport = async (reportId: string) => {
    try {
      const res = await api.updateReportStatus(reportId, 'rejected');
      if (res.success) {
        Alert.alert('Selesai', 'Laporan lapangan ditolak.');
        loadData();
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message || 'Gagal menolak laporan.');
    }
  };

  const pendingDonations = donations.filter((d) => d.status === 'pending_verification');

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
            Pusat Pengawasan Transparansi
          </Text>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Verifikasi & Validasi
          </Text>
        </View>
        <Badge label="Admin" variant="accent" size="md" />
      </View>

      {/* Subtab Buttons */}
      <View style={[styles.subtabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          testID="subtab-verify-donations"
          onPress={() => setActiveTab('donations')}
          style={[
            styles.subtabBtn,
            activeTab === 'donations' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="heart-outline"
            size={16}
            color={activeTab === 'donations' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'donations' ? theme.accentInk : theme.ink }
            ]}
          >
            Verifikasi Donasi ({pendingDonations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="subtab-verify-reports"
          onPress={() => setActiveTab('reports')}
          style={[
            styles.subtabBtn,
            activeTab === 'reports' && [styles.subtabBtnActive, { backgroundColor: theme.accent }]
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeTab === 'reports' ? theme.accentInk : theme.muted}
          />
          <Text
            style={[
              styles.subtabText,
              { color: activeTab === 'reports' ? theme.accentInk : theme.ink }
            ]}
          >
            Laporan Relawan ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUB-TAB 1: VERIFIKASI DONASI */}
      {activeTab === 'donations' && (
        <View style={styles.tabContent}>
          {pendingDonations.length === 0 ? (
            <EmptyState
              title="Antrean Donasi Bersih!"
              description="Tidak ada donasi baru yang menunggu verifikasi saat ini."
              icon="checkmark-done-circle-outline"
            />
          ) : (
            pendingDonations.map((don) => {
              const meta = getDonationStatusMeta(don.status);
              return (
                <Card key={don.id} variant="elevated" padding="md" style={styles.itemCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardInfoCol}>
                      <Text style={[styles.donorName, { color: theme.ink }]}>
                        {don.donorType === 'organization'
                          ? don.organizationName || don.donorName
                          : don.isAnonymous
                          ? 'Hamba Allah (Anonim)'
                          : don.donorName}
                      </Text>
                      <Text style={[styles.campaignSub, { color: theme.muted }]} numberOfLines={1}>
                        Untuk: {don.campaignTitle || 'Program Revitalisasi'}
                      </Text>
                    </View>
                    <Badge label={meta.label} variant={meta.tone} size="sm" />
                  </View>

                  <View style={styles.amountProofRow}>
                    <View>
                      <Text style={[styles.amountText, { color: theme.ink }]}>
                        {formatRupiah(don.amount)}
                      </Text>
                      <Text style={[styles.paymentMethodText, { color: theme.muted }]}>
                        Via {don.paymentMethod} • {new Date(don.createdAt).toLocaleDateString('id-ID')}
                      </Text>
                    </View>

                    {don.proofUrl && (
                      <TouchableOpacity
                        onPress={() => setPreviewImage(don.proofUrl || null)}
                        style={styles.thumbnailBtn}
                      >
                        <Image source={{ uri: don.proofUrl }} style={styles.proofThumb} />
                        <Text style={[styles.viewProofText, { color: theme.accent }]}>
                          Lihat Bukti
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Actions: Approve & Reject */}
                  <View style={styles.actionButtonRow}>
                    <Button
                      testID={`btn-approve-donation-${don.id}`}
                      title="Setujui Donasi"
                      variant="primary"
                      size="sm"
                      icon={<Ionicons name="checkmark" size={16} color={theme.accentInk} />}
                      onPress={() => handleApproveDonation(don.id)}
                    />
                    <Button
                      testID={`btn-reject-donation-${don.id}`}
                      title="Tolak"
                      variant="danger"
                      size="sm"
                      icon={<Ionicons name="close" size={16} color="#ffffff" />}
                      onPress={() => {
                        setRejectDonationId(don.id);
                        setRejectModalVisible(true);
                      }}
                    />
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* SUB-TAB 2: VERIFIKASI LAPORAN LAPANGAN */}
      {activeTab === 'reports' && (
        <View style={styles.tabContent}>
          {reports.length === 0 ? (
            <EmptyState
              title="Antrean Laporan Bersih!"
              description="Seluruh laporan relawan telah diverifikasi dan disetujui."
              icon="checkmark-done-circle-outline"
            />
          ) : (
            reports.map((rep) => (
              <Card key={rep.id} variant="outlined" padding="md" style={styles.itemCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardInfoCol}>
                    <Text style={[styles.donorName, { color: theme.ink }]}>
                      {rep.reportType}
                    </Text>
                    <Text style={[styles.campaignSub, { color: theme.muted }]}>
                      {rep.location} • Oleh {rep.authorName || 'Relawan'}
                    </Text>
                  </View>
                  <Badge label="Menunggu" variant="warning" size="sm" />
                </View>

                {rep.notes ? (
                  <Text style={[styles.reportNotes, { color: theme.ink }]}>
                    {rep.notes}
                  </Text>
                ) : null}

                {rep.photoUrl ? (
                  <Image
                    source={{ uri: rep.photoUrl }}
                    style={styles.reportPhoto}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.reportMetaRow}>
                  <Text style={[styles.reportCoords, { color: theme.muted }]}>
                    Koordinat: {rep.lat?.toFixed(4)}, {rep.lng?.toFixed(4)}
                  </Text>
                  <Text style={[styles.reportDate, { color: theme.muted }]}>
                    {new Date(rep.createdAt).toLocaleDateString('id-ID')}
                  </Text>
                </View>

                <View style={styles.actionButtonRow}>
                  <Button
                    testID={`btn-approve-report-${rep.id}`}
                    title="Setujui Laporan (+Poin)"
                    variant="primary"
                    size="sm"
                    icon={<Ionicons name="checkmark" size={16} color={theme.accentInk} />}
                    onPress={() => handleApproveReport(rep.id)}
                  />
                  <Button
                    testID={`btn-reject-report-${rep.id}`}
                    title="Tolak"
                    variant="danger"
                    size="sm"
                    onPress={() => handleRejectReport(rep.id)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* MODAL 1: REJECT DONATION MODAL */}
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
                Alasan Penolakan Donasi
              </Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            <Input
              testID="input-reject-donation-reason"
              label="Alasan Penolakan"
              placeholder="Contoh: Bukti transfer tidak valid atau dana belum masuk rekening yayasan"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setRejectModalVisible(false)}
              />
              <Button
                testID="btn-confirm-reject-donation"
                title="Tolak Donasi"
                variant="danger"
                size="md"
                loading={rejectLoading}
                onPress={handleRejectDonation}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: FULL PROOF PREVIEW */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Bukti Transfer Donasi
              </Text>
              <TouchableOpacity onPress={() => setPreviewImage(null)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.fullProofImage}
                resizeMode="contain"
              />
            )}

            <Button
              title="Tutup Preview"
              variant="outline"
              size="md"
              onPress={() => setPreviewImage(null)}
              style={{ marginTop: 12 }}
            />
          </View>
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
  itemCard: {
    marginBottom: spacing.md
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  cardInfoCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  donorName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  campaignSub: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  amountProofRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs
  },
  amountText: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  paymentMethodText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    marginTop: 2
  },
  thumbnailBtn: {
    alignItems: 'center'
  },
  proofThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm
  },
  viewProofText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 10,
    marginTop: 2
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  reportNotes: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginVertical: 4
  },
  reportPhoto: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginVertical: spacing.xs
  },
  reportMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  reportCoords: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 10
  },
  reportDate: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 10
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
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  fullProofImage: {
    width: '100%',
    height: 300,
    borderRadius: radius.md
  }
});
