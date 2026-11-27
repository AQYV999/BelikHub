// mobile/src/features/warga/WargaRetributionScreen.tsx
// Warga retribution screen supporting both unlinked (linkCode redemption) and linked bill management

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, Input, ImageUploadField, EmptyState, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import {
  RetributionBill,
  SpringSettings,
  PaymentMethod
} from '../../api/types';
import {
  formatRupiah,
  formatPeriod,
  getRetributionStatusMeta,
  validateLinkCode
} from './wargaUtils';

export const WargaRetributionScreen: React.FC = () => {
  const toast = useToast();
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;
  const { user, refreshProfile } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [bills, setBills] = useState<RetributionBill[]>([]);
  const [springSettings, setSpringSettings] = useState<SpringSettings | null>(null);

  // Link code redemption form state (for unlinked resident)
  const [linkCodeInput, setLinkCodeInput] = useState<string>('');
  const [redeemLoading, setRedeemLoading] = useState<boolean>(false);
  const [redeemError, setRedeemError] = useState<string>('');
  const [redeemSuccess, setRedeemSuccess] = useState<string>('');

  // Payment modal state
  const [payModalVisible, setPayModalVisible] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<RetributionBill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [uploadedProofPath, setUploadedProofPath] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState<boolean>(false);

  // Receipt modal state
  const [receiptModalVisible, setReceiptModalVisible] = useState<boolean>(false);
  const [receiptBill, setReceiptBill] = useState<RetributionBill | null>(null);

  const isLinked = user?.residentLinkStatus === 'linked';
  const activeSpringId = user?.springId || 'SPR-001';

  const loadRetributions = useCallback(async () => {
    try {
      const [retRes, settingsRes] = await Promise.all([
        api.listRetributions({ springId: activeSpringId }).catch(() => null),
        api.getSpringSettings(activeSpringId).catch(() => null)
      ]);

      if (retRes?.bills) {
        // Filter to this user's resident bills if residentId exists, otherwise show spring bills
        const residentBills = user?.residentId
          ? retRes.bills.filter((b) => b.residentId === user.residentId)
          : retRes.bills;
        setBills(residentBills);
      }

      if (settingsRes) {
        setSpringSettings(settingsRes);
      }
    } catch (e) {
      console.warn('WargaRetributionScreen: Error loading data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, activeSpringId, user?.residentId]);

  useEffect(() => {
    loadRetributions();
  }, [loadRetributions, user?.residentLinkStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadRetributions();
  };

  // Redeem Link Code handler
  const handleRedeemLinkCode = async () => {
    setRedeemError('');
    setRedeemSuccess('');
    const code = linkCodeInput.trim().toUpperCase();

    if (!code) {
      setRedeemError('Masukkan 6 karakter kode tautan dari pengelola warga.');
      return;
    }

    if (!validateLinkCode(code)) {
      setRedeemError('Format kode tidak valid. Harus 6 karakter alfanumerik (contoh: TUK001).');
      return;
    }

    setRedeemLoading(true);
    try {
      const res = await api.updateProfile({ linkCode: code });
      if (res.success && res.user.residentLinkStatus === 'linked') {
        setRedeemSuccess('Selamat! Akun Anda berhasil ditautkan ke data warga mata air.');
        setLinkCodeInput('');
        await refreshProfile();
        await loadRetributions();
      } else {
        setRedeemError('Kode tautan tidak ditemukan atau sudah kadaluarsa. Hubungi pengelola RT/desa.');
      }
    } catch (e: any) {
      setRedeemError(e?.message || 'Gagal menautkan kode. Silakan coba lagi.');
    } finally {
      setRedeemLoading(false);
    }
  };

  // Open Payment Modal
  const openPaymentModal = (bill: RetributionBill) => {
    setSelectedBill(bill);
    setUploadedProofPath(null);
    setPaymentMethod('transfer');
    setPayModalVisible(true);
  };

  // Submit Payment Proof
  const handleSubmitProof = async () => {
    if (!selectedBill) return;
    if (!uploadedProofPath) {
      toast.warning('Mohon unggah foto bukti transfer atau resi QRIS terlebih dahulu.');
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await api.submitRetributionProof(selectedBill.id, {
        proofPath: uploadedProofPath,
        paymentMethod
      });
      if (res.success) {
        setPayModalVisible(false);
        setSelectedBill(null);
        setUploadedProofPath(null);
        toast.success('Bukti pembayaran berhasil dikirim dan menunggu verifikasi pengelola.');
        await loadRetributions();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Terjadi kesalahan saat mengirim bukti pembayaran.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Open Digital Receipt Modal
  const openReceiptModal = (bill: RetributionBill) => {
    setReceiptBill(bill);
    setReceiptModalVisible(true);
  };

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* Screen Title */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.ink }]}>Iuran Retribusi Air</Text>
          <Text style={[styles.screenSubtitle, { color: theme.muted }]}>
            Pemeliharaan mata air & infrastruktur jaringan air warga
          </Text>
        </View>
        <Badge
          label={isLinked ? 'Tertaut' : 'Belum Tertaut'}
          variant={isLinked ? 'success' : 'warning'}
          size="sm"
        />
      </View>

      {/* Case A: Unlinked / Pending State Banner + Code Redemption Form */}
      {!isLinked ? (
        <Card variant="outlined" padding="lg" style={styles.unlinkedCard}>
          <View style={styles.unlinkedIconRow}>
            <View style={[styles.warningIconCircle, { backgroundColor: theme.warningBg }]}>
              <Ionicons name="link-outline" size={28} color={theme.warning} />
            </View>
            <View style={styles.unlinkedHeaderCol}>
              <Text style={[styles.unlinkedHeading, { color: theme.ink }]}>
                Menunggu Tautan Pengelola
              </Text>
              <Text style={[styles.unlinkedSub, { color: theme.muted }]}>
                Akun warga Anda belum terhubung dengan nomor pelanggan atau KK di sistem pengelola mata air.
              </Text>
            </View>
          </View>

          <View style={[styles.redeemFormBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.redeemFormTitle, { color: theme.ink }]}>
              Punya Kode Tautan dari Pengelola?
            </Text>
            <Text style={[styles.redeemFormDesc, { color: theme.muted }]}>
              Masukkan 6 digit kode tautan yang diberikan oleh pengelola RT/mata air (misal: TUK001, RES002).
            </Text>

            <Input
              testID="input-link-code"
              placeholder="Contoh: TUK001"
              value={linkCodeInput}
              onChangeText={(text) => setLinkCodeInput(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              error={redeemError}
              helperText={redeemSuccess ? undefined : 'Kode tautan peka huruf besar (6 karakter)'}
              style={styles.linkCodeInput}
            />

            {redeemSuccess ? (
              <View style={styles.successNotice}>
                <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                <Text style={[styles.successNoticeText, { color: theme.successInk }]}>
                  {redeemSuccess}
                </Text>
              </View>
            ) : null}

            <Button
              testID="btn-redeem-link-code"
              title="Tautkan Akun Sekarang"
              onPress={handleRedeemLinkCode}
              loading={redeemLoading}
              variant="primary"
              size="md"
              style={styles.redeemBtn}
            />
          </View>
        </Card>
      ) : null}

      {/* Case B: Linked State - Retribution Summary & Bills */}
      {isLinked ? (
        <>
          {/* Quick Info Card */}
          <Card variant="flat" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color={theme.accent} />
              <Text style={[styles.infoText, { color: theme.ink }]}>
                Iuran wajib dibayar setiap bulan sebelum tanggal 10. Tarif baku:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {formatRupiah(springSettings?.defaultMonthlyFee || 25000)}/KK
                </Text>
              </Text>
            </View>
          </Card>

          {/* Bills List Header */}
          <View style={styles.listHeaderRow}>
            <Text style={[styles.listSectionTitle, { color: theme.ink }]}>
              Daftar Tagihan Retribusi
            </Text>
            <Text style={[styles.listCount, { color: theme.muted }]}>
              {bills.length} Tagihan
            </Text>
          </View>

          {/* Bills List */}
          {bills.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={48} color={theme.muted} />}
              title="Belum Ada Tagihan"
              description="Tagihan bulanan akan diterbitkan otomatis oleh pengelola mata air."
            />
          ) : (
            bills.map((bill) => {
              const meta = getRetributionStatusMeta(bill.status);
              const isUnpaid = bill.status === 'unpaid';
              const isPaid = bill.status === 'paid';
              const isPending = bill.status === 'pending_verification';
              const isRejected = bill.status === 'rejected';

              return (
                <Card
                  key={bill.id}
                  variant="outlined"
                  padding="md"
                  style={styles.billCard}
                >
                  <View style={styles.billTopRow}>
                    <View>
                      <Text style={[styles.billPeriodTitle, { color: theme.ink }]}>
                        Periode {formatPeriod(bill.period)}
                      </Text>
                      <Text style={[styles.billRefId, { color: theme.muted }]}>
                        No. Ref: {bill.id}
                      </Text>
                    </View>
                    <Badge label={meta.label} variant={meta.tone} size="md" />
                  </View>

                  <View style={styles.billAmountRow}>
                    <Text style={[styles.billAmountText, { color: theme.ink }]}>
                      {formatRupiah(bill.amount)}
                    </Text>
                    {bill.paymentMethod && (
                      <Text style={[styles.methodTag, { color: theme.muted }]}>
                        Metode: {bill.paymentMethod.toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Rejection Note */}
                  {isRejected && bill.rejectionReason && (
                    <View style={[styles.rejectionBox, { backgroundColor: theme.errorBg }]}>
                      <Ionicons name="alert-circle" size={16} color={theme.error} />
                      <Text style={[styles.rejectionText, { color: theme.errorInk }]}>
                        Alasan penolakan: {bill.rejectionReason}
                      </Text>
                    </View>
                  )}

                  {/* Pending Notice */}
                  {isPending && (
                    <Text style={[styles.pendingNoticeText, { color: theme.warningInk }]}>
                      Bukti transfer telah dikirim. Menunggu verifikasi pengelola warga.
                    </Text>
                  )}

                  {/* Actions */}
                  <View style={styles.billActionRow}>
                    {isUnpaid && (
                      <Button
                        testID={`btn-pay-${bill.id}`}
                        title="Bayar Sekarang"
                        variant="primary"
                        size="sm"
                        onPress={() => openPaymentModal(bill)}
                        icon={<Ionicons name="card-outline" size={16} color="#ffffff" />}
                      />
                    )}

                    {isRejected && (
                      <Button
                        testID={`btn-pay-${bill.id}`}
                        title="Unggah Ulang Bukti"
                        variant="danger"
                        size="sm"
                        onPress={() => openPaymentModal(bill)}
                      />
                    )}

                    {isPaid && (
                      <Button
                        testID={`btn-receipt-${bill.id}`}
                        title="Lihat Struk Digital"
                        variant="outline"
                        size="sm"
                        onPress={() => openReceiptModal(bill)}
                        icon={<Ionicons name="document-text-outline" size={16} color={theme.accent} />}
                      />
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </>
      ) : null}

      {/* MODAL 1: Bayar Sekarang Modal */}
      <Modal
        visible={payModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.ink }]}>
                  Pembayaran Retribusi Air
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                  Periode {selectedBill ? formatPeriod(selectedBill.period) : ''}
                </Text>
              </View>
              <PressableScale
                onPress={() => setPayModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Amount Tag */}
              <View style={[styles.totalAmountBox, { backgroundColor: theme.surface }]}>
                <Text style={[styles.totalAmountLabel, { color: theme.muted }]}>
                  Total Tagihan
                </Text>
                <Text style={[styles.totalAmountVal, { color: theme.accent }]}>
                  {selectedBill ? formatRupiah(selectedBill.amount) : 'Rp 0'}
                </Text>
              </View>

              {/* Payment Method Selector */}
              <Text style={[styles.inputSectionLabel, { color: theme.ink }]}>
                Pilih Metode Pembayaran:
              </Text>
              <View style={styles.methodChoiceRow}>
                <PressableScale
                  onPress={() => setPaymentMethod('transfer')}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: paymentMethod === 'transfer' ? theme.accent : theme.surface,
                      borderColor: paymentMethod === 'transfer' ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={paymentMethod === 'transfer' ? '#fff' : theme.ink}
                  />
                  <Text
                    style={[
                      styles.methodChipText,
                      { color: paymentMethod === 'transfer' ? '#fff' : theme.ink }
                    ]}
                  >
                    Transfer Bank
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => setPaymentMethod('qris')}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: paymentMethod === 'qris' ? theme.accent : theme.surface,
                      borderColor: paymentMethod === 'qris' ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={18}
                    color={paymentMethod === 'qris' ? '#fff' : theme.ink}
                  />
                  <Text
                    style={[
                      styles.methodChipText,
                      { color: paymentMethod === 'qris' ? '#fff' : theme.ink }
                    ]}
                  >
                    QRIS
                  </Text>
                </PressableScale>
              </View>

              {/* Payment Instructions from SpringSettings */}
              <View style={[styles.instructionBox, { borderColor: theme.border }]}>
                <Text style={[styles.instructionTitle, { color: theme.ink }]}>
                  Petunjuk Rekening / QRIS Mata Air:
                </Text>
                <Text style={[styles.instructionBody, { color: theme.muted }]}>
                  {springSettings?.paymentInstructions ||
                    'Rekening Kas Desa BelikHub: Bank Jateng 3-021-998811 (a.n. Paguyuban Air Tuk Bismo). Pastikan mencantumkan nama warga.'}
                </Text>

                {/* Show QRIS preview if method is QRIS and URL exists */}
                {paymentMethod === 'qris' && springSettings?.qrisReadUrl ? (
                  <View style={styles.qrisImageWrapper}>
                    <Image
                      source={{ uri: springSettings.qrisReadUrl }}
                      style={styles.qrisImage}
                      resizeMode="contain"
                    />
                    <Text style={[styles.qrisCaption, { color: theme.muted }]}>
                      Scan QRIS resmi di atas menggunakan m-banking atau e-wallet Anda.
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Upload Proof */}
              <ImageUploadField
                key={selectedBill?.id ?? 'none'}
                label="Unggah Bukti Pembayaran"
                helperText="Lampirkan tangkapan layar (screenshot) transfer bank atau resi QRIS."
                valueUri={uploadedProofPath}
                onChange={async (base64) => {
                  if (!base64) return;
                  try {
                    const uploadRes = await api.uploadImage('retribution_proof', base64);
                    setUploadedProofPath(uploadRes.objectPath);
                  } catch (e: any) {
                    toast.error(e?.message || 'Gagal memproses gambar bukti.', 'Gagal Unggah');
                  }
                }}
                onClear={() => setUploadedProofPath(null)}
              />

              <Button
                testID="btn-submit-retribution-proof"
                title="Kirim Bukti Pembayaran"
                variant="primary"
                size="lg"
                loading={submittingProof}
                disabled={!uploadedProofPath}
                onPress={handleSubmitProof}
                style={styles.submitProofBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Struk Digital Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptCard, { backgroundColor: theme.card }]}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptLogoRow}>
                <Ionicons name="water" size={24} color={theme.accent} />
                <Text style={[styles.receiptBrand, { color: theme.accent }]}>
                  BelikHub Resi Digital
                </Text>
              </View>
              <Badge label="Lunas Terverifikasi" variant="success" size="md" />
            </View>

            <View style={styles.receiptDivider} />

            {receiptBill && (
              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: theme.muted }]}>No. Referensi:</Text>
                  <Text style={[styles.receiptVal, { color: theme.ink, fontFamily: typography.fontFamilies.mono }]}>
                    {receiptBill.id}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: theme.muted }]}>Periode Iuran:</Text>
                  <Text style={[styles.receiptVal, { color: theme.ink }]}>
                    {formatPeriod(receiptBill.period)}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: theme.muted }]}>Jumlah Dibayar:</Text>
                  <Text style={[styles.receiptVal, { color: theme.accent, fontWeight: 'bold' }]}>
                    {formatRupiah(receiptBill.amount)}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: theme.muted }]}>Metode Bayar:</Text>
                  <Text style={[styles.receiptVal, { color: theme.ink }]}>
                    {receiptBill.paymentMethod ? receiptBill.paymentMethod.toUpperCase() : 'TUNAI'}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: theme.muted }]}>Waktu Bayar:</Text>
                  <Text style={[styles.receiptVal, { color: theme.ink }]}>
                    {receiptBill.paidAt
                      ? new Date(receiptBill.paidAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Terverifikasi'}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: theme.muted }]}>Pencatat/Verifikator:</Text>
                  <Text style={[styles.receiptVal, { color: theme.ink }]}>
                    {receiptBill.recordedByUid || receiptBill.verifiedByUid || 'Pengelola Mata Air'}
                  </Text>
                </View>

                <View style={[styles.receiptSeal, { backgroundColor: theme.surface }]}>
                  <Ionicons name="checkmark-done-circle" size={24} color={theme.success} />
                  <Text style={[styles.sealText, { color: theme.ink }]}>
                    Resi ini sah diterbitkan secara elektronik oleh Pengelola Mata Air BelikHub.
                  </Text>
                </View>
              </View>
            )}

            <Button
              title="Tutup Resi"
              variant="outline"
              size="md"
              onPress={() => setReceiptModalVisible(false)}
              style={styles.closeReceiptBtn}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  screenTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  screenSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamilies.text
  },
  unlinkedCard: {
    borderColor: '#f59e0b',
    borderRadius: radius.lg
  },
  unlinkedIconRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  warningIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  unlinkedHeaderCol: {
    flex: 1
  },
  unlinkedHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  unlinkedSub: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs,
    lineHeight: 18,
    fontFamily: typography.fontFamilies.text
  },
  redeemFormBox: {
    padding: spacing.md,
    borderRadius: radius.md
  },
  redeemFormTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xxs
  },
  redeemFormDesc: {
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.sm,
    lineHeight: 16
  },
  linkCodeInput: {
    letterSpacing: 3,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs
  },
  successNoticeText: {
    ...textStyles.label,
  },
  redeemBtn: {
    marginTop: spacing.sm
  },
  infoCard: {
    borderRadius: radius.md
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  infoText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    flex: 1
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  listSectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  listCount: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  billCard: {
    borderRadius: radius.md,
    gap: spacing.xs
  },
  billTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  billPeriodTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    fontFamily: typography.fontFamilies.display
  },
  billRefId: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.mono,
    marginTop: 2
  },
  billAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xxs
  },
  billAmountText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  methodTag: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.mono
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.xs,
    marginTop: spacing.xxs
  },
  rejectionText: {
    fontSize: typography.fontSizes.xs,
    flex: 1
  },
  pendingNoticeText: {
    fontSize: typography.fontSizes.xs,
    marginVertical: spacing.xxs
  },
  billActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    ...textStyles.heading,
  },
  modalSubtitle: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  closeBtn: {
    padding: spacing.xs
  },
  modalScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xxl
  },
  totalAmountBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  totalAmountLabel: {
    fontSize: typography.fontSizes.xs
  },
  totalAmountVal: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono,
    marginTop: spacing.xxs
  },
  inputSectionLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold
  },
  methodChoiceRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  methodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5
  },
  methodChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold
  },
  instructionBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1
  },
  instructionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xxs
  },
  instructionBody: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18
  },
  qrisImageWrapper: {
    alignItems: 'center',
    marginTop: spacing.md
  },
  qrisImage: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: radius.sm
  },
  qrisCaption: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  submitProofBtn: {
    marginTop: spacing.sm
  },
  receiptCard: {
    margin: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  receiptLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  receiptBrand: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: spacing.md
  },
  receiptBody: {
    gap: spacing.sm
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  receiptLabel: {
    fontSize: typography.fontSizes.xs
  },
  receiptVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium
  },
  receiptSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm
  },
  sealText: {
    fontSize: typography.fontSizes.xs,
    flex: 1,
    lineHeight: 16
  },
  closeReceiptBtn: {
    marginTop: spacing.lg
  }
});
