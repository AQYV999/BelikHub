// mobile/src/features/donatur/DonaturCampaignDetailScreen.tsx
// Donatur Campaign Detail: overview, revitalization photo timeline, and "Donasi Sekarang" modal

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, Input, ProgressBar, ImageUploadField, EmptyState, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import {
  RevitalizationCampaign,
  RevitalizationUpdate,
  DonorType
} from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { calculateFundingProgress, validateDonationInput } from './donaturUtils';

export interface DonaturCampaignDetailProps {
  campaignId?: string;
  onClose?: () => void;
  onDonationSuccess?: () => void;
}

export const DonaturCampaignDetailScreen: React.FC<DonaturCampaignDetailProps> = ({
  campaignId,
  onClose,
  onDonationSuccess
}) => {
  const toast = useToast();
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;
  const { user, activeRole } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [campaign, setCampaign] = useState<RevitalizationCampaign | null>(null);

  // Donation Modal State
  const [donationModalVisible, setDonationModalVisible] = useState<boolean>(false);
  const [donationAmount, setDonationAmount] = useState<string>('100000');
  const [donorType, setDonorType] = useState<DonorType>(user?.donorType || 'individual');
  const [organizationName, setOrganizationName] = useState<string>(user?.organizationName || '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'qris'>('transfer');
  const [proofPath, setPhotoProofPath] = useState<string | null>(null);
  const [proofReadUrl, setProofReadUrl] = useState<string | null>(null);
  const [submittingDonation, setSubmittingDonation] = useState<boolean>(false);
  const [donationError, setDonationError] = useState<string>('');
  const [donationSuccessMsg, setDonationSuccessMsg] = useState<string>('');

  const loadCampaign = useCallback(async () => {
    try {
      let targetId = campaignId;
      if (!targetId) {
        // Fallback to first active campaign
        const listRes = await api.listCampaigns({ status: 'active' });
        if (listRes.campaigns && listRes.campaigns.length > 0) {
          targetId = listRes.campaigns[0].id;
        }
      }

      if (targetId) {
        const res = await api.getCampaign(targetId);
        if (res.campaign) {
          setCampaign(res.campaign);
        }
      }
    } catch (err) {
      console.warn('DonaturCampaignDetailScreen: loadCampaign error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, campaignId]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign, activeRole]);

  const handleOpenDonationModal = () => {
    setDonationError('');
    setDonationSuccessMsg('');
    setProofPhotoEmpty();
    setDonationModalVisible(true);
  };

  const setProofPhotoEmpty = () => {
    setPhotoProofPath(null);
    setProofReadUrl(null);
  };

  const handleSubmitDonation = async () => {
    if (!campaign) return;
    const amountNum = parseInt(donationAmount.replace(/\D/g, ''), 10) || 0;

    const validation = validateDonationInput({
      amount: amountNum,
      donorType,
      organizationName
    });

    if (!validation.valid) {
      setDonationError(validation.error || 'Input donasi tidak valid.');
      return;
    }

    setSubmittingDonation(true);
    setDonationError('');
    try {
      const res = await api.createDonation({
        campaignId: campaign.id,
        amount: amountNum,
        donorType,
        organizationName: donorType === 'organization' ? organizationName.trim() : undefined,
        isAnonymous,
        paymentMethod,
        proofPath: proofPath || undefined
      });

      if (res.success) {
        setDonationSuccessMsg(
          'Donasi berhasil disubmit dengan status Menunggu Verifikasi. Terima kasih atas kepedulian Anda!'
        );
        toast.success(
          'Donasi Anda tercatat dengan status Menunggu Verifikasi. Admin akan memverifikasi bukti transfer dalam 1x24 jam.',
          'Donasi Terkirim'
        );
        setDonationModalVisible(false);
        loadCampaign();
        if (onDonationSuccess) onDonationSuccess();
      }
    } catch (e: any) {
      setDonationError(e?.message || 'Gagal mengirim donasi.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  if (loading && !campaign) {
    return <Screen scrollable loading />;
  }

  if (!campaign) {
    return (
      <Screen scrollable={false}>
        <EmptyState
          title="Program Tidak Ditemukan"
          description="Program revitalisasi tidak tersedia atau telah diarsipkan."
          icon="alert-circle-outline"
        />
        {onClose && (
          <Button title="Kembali" variant="outline" size="md" onPress={onClose} style={{ marginTop: 16 }} />
        )}
      </Screen>
    );
  }

  const funding = calculateFundingProgress(campaign.targetAmount, campaign.collectedAmount);

  return (
    <Screen
      scrollable
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadCampaign();
      }}
    >
      {/* Top Bar / Close Button if modal */}
      {onClose && (
        <View style={styles.topBar}>
          <PressableScale
            testID="btn-close-campaign-detail"
            onPress={onClose}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={theme.ink} />
            <Text style={[styles.backText, { color: theme.ink }]}>Kembali</Text>
          </PressableScale>
        </View>
      )}

      {/* Campaign Header Card */}
      <Card variant="elevated" padding="lg" style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <Badge
            label={campaign.status === 'active' ? 'Program Aktif' : 'Selesai'}
            variant={campaign.status === 'active' ? 'success' : 'neutral'}
            size="sm"
          />
          <Text style={[styles.springLocLabel, { color: theme.muted }]}>
            Mata Air {campaign.springName || 'Batang'} • ~5 km radius
          </Text>
        </View>

        <Text style={[styles.campaignTitle, { color: theme.ink }]}>
          {campaign.title}
        </Text>

        {campaign.description ? (
          <Text style={[styles.campaignDesc, { color: theme.muted }]}>
            {campaign.description}
          </Text>
        ) : null}

        {/* Impact stats badges */}
        <View style={styles.impactBadgesRow}>
          <View style={[styles.impactBadge, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="people" size={16} color={theme.accent} />
            <Text style={[styles.impactBadgeText, { color: theme.accent }]}>
              ~2.500 KK Penerima Manfaat
            </Text>
          </View>
          <View style={[styles.impactBadge, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="water" size={16} color="#3b82f6" />
            <Text style={[styles.impactBadgeText, { color: '#1d4ed8' }]}>
              Kontinuitas Debit Hulu
            </Text>
          </View>
        </View>

        {/* Funding Progress Box */}
        <View style={[styles.fundingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.fundingTop}>
            <Text style={[styles.collectedAmount, { color: theme.accent }]}>
              {formatRupiah(campaign.collectedAmount)}
            </Text>
            <Text style={[styles.fundingPercent, { color: theme.ink }]}>
              {funding.percent}%
            </Text>
          </View>

          <ProgressBar progress={funding.percent} height={10} />

          <View style={styles.fundingBottom}>
            <Text style={[styles.targetLabel, { color: theme.muted }]}>
              dari target {formatRupiah(campaign.targetAmount)}
            </Text>
            {funding.remaining > 0 && (
              <Text style={[styles.remainingLabel, { color: theme.muted }]}>
                sisa {formatRupiah(funding.remaining)}
              </Text>
            )}
          </View>
        </View>

        {/* Revitalization Progress */}
        <View style={styles.revitalProgressRow}>
          <Text style={[styles.revitalLabel, { color: theme.muted }]}>
            Progres Fisik di Lapangan:
          </Text>
          <Text style={[styles.revitalVal, { color: theme.ink }]}>
            {campaign.progressPercent || 0}% Selesai
          </Text>
        </View>

        {/* Primary Action: Donasi Sekarang */}
        <Button
          testID="btn-open-donation-modal"
          title="Donasi Sekarang"
          variant="primary"
          size="lg"
          icon={<Ionicons name="heart" size={18} color={theme.accentInk} />}
          onPress={handleOpenDonationModal}
          style={styles.donateBtn}
        />
      </Card>

      {/* Revitalization Photo Timeline */}
      <View style={styles.timelineSection}>
        <View style={styles.timelineHeaderRow}>
          <Ionicons name="camera-outline" size={20} color={theme.accent} />
          <Text style={[styles.sectionHeading, { color: theme.ink }]}>
            Laporan Dokumentasi Fisik & Transparansi
          </Text>
        </View>

        {campaign.updates && campaign.updates.length > 0 ? (
          campaign.updates.map((update, idx) => (
            <Card key={update.id || idx} variant="outlined" padding="md" style={styles.timelineCard}>
              <View style={styles.updateTopRow}>
                <Badge
                  label={`${update.progressPercent}% Progres`}
                  variant="accent"
                  size="sm"
                />
                <Text style={[styles.updateDate, { color: theme.muted }]}>
                  {new Date(update.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <Text style={[styles.updateTitle, { color: theme.ink }]}>
                {update.title}
              </Text>

              {update.notes ? (
                <Text style={[styles.updateNotes, { color: theme.muted }]}>
                  {update.notes}
                </Text>
              ) : null}

              {update.photoUrl ? (
                <Image
                  source={{ uri: update.photoUrl }}
                  style={styles.updatePhoto}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.updateFooter}>
                <Text style={[styles.updateAuthor, { color: theme.muted }]}>
                  Dilaporkan oleh {update.authorName || 'Pengelola'} ({update.authorRole || 'pengelola'})
                </Text>
                {update.spentAmount ? (
                  <Text style={[styles.updateSpent, { color: theme.accent }]}>
                    Alokasi: {formatRupiah(update.spentAmount)}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))
        ) : (
          <Card variant="outlined" padding="md" style={styles.emptyTimelineCard}>
            <Ionicons name="images-outline" size={32} color={theme.muted} />
            <Text style={[styles.emptyTimelineText, { color: theme.muted }]}>
              Belum ada foto dokumentasi lapangan. Pengelola akan memperbarui progres berkala.
            </Text>
          </Card>
        )}
      </View>

      {/* DONATION MODAL */}
      <Modal
        visible={donationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDonationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.ink }]}>
                  Salurkan Donasi Konservasi
                </Text>
                <Text style={[styles.modalSub, { color: theme.muted }]} numberOfLines={1}>
                  {campaign.title}
                </Text>
              </View>
              <PressableScale onPress={() => setDonationModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            {donationError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.errorInk }]}>
                  {donationError}
                </Text>
              </View>
            ) : null}

            {/* Nominal Presets */}
            <Text style={[styles.formLabel, { color: theme.ink }]}>
              Pilih Nominal Donasi:
            </Text>
            <View style={styles.presetChipsRow}>
              {['50000', '100000', '250000', '500000', '1000000'].map((amt) => {
                const isSelected = donationAmount === amt;
                return (
                  <PressableScale
                    key={amt}
                    onPress={() => setDonationAmount(amt)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.border
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? theme.accentInk : theme.ink }
                      ]}
                    >
                      {formatRupiah(parseInt(amt, 10))}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <Input
              testID="input-donation-amount"
              label="Nominal Donasi Kustom (Rp)"
              placeholder="Contoh: 100000"
              value={donationAmount}
              onChangeText={setDonationAmount}
              keyboardType="numeric"
            />

            {/* Donor Type Selector */}
            <Text style={[styles.formLabel, { color: theme.ink, marginTop: spacing.sm }]}>
              Tipe Donatur:
            </Text>
            <View style={styles.typeSelectorRow}>
              <PressableScale
                testID="donor-type-individual"
                onPress={() => setDonorType('individual')}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: donorType === 'individual' ? theme.accent : theme.surface,
                    borderColor: donorType === 'individual' ? theme.accent : theme.border
                  }
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={donorType === 'individual' ? theme.accentInk : theme.ink}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: donorType === 'individual' ? theme.accentInk : theme.ink }
                  ]}
                >
                  Individu
                </Text>
              </PressableScale>

              <PressableScale
                testID="donor-type-organization"
                onPress={() => setDonorType('organization')}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: donorType === 'organization' ? theme.accent : theme.surface,
                    borderColor: donorType === 'organization' ? theme.accent : theme.border
                  }
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={donorType === 'organization' ? theme.accentInk : theme.ink}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: donorType === 'organization' ? theme.accentInk : theme.ink }
                  ]}
                >
                  Organisasi / CSR
                </Text>
              </PressableScale>
            </View>

            {/* If Organization: Org Name Input */}
            {donorType === 'organization' && (
              <Input
                testID="input-org-name"
                label="Nama Perusahaan / Organisasi CSR"
                placeholder="Contoh: PT Tirta Lestari Nusantara"
                value={organizationName}
                onChangeText={setOrganizationName}
              />
            )}

            {/* Anonymous Toggle */}
            <PressableScale
              testID="toggle-anonymous"
              onPress={() => setIsAnonymous(!isAnonymous)}
              style={styles.anonToggleRow}
            >
              <Ionicons
                name={isAnonymous ? 'checkbox' : 'square-outline'}
                size={22}
                color={isAnonymous ? theme.accent : theme.muted}
              />
              <Text style={[styles.anonToggleText, { color: theme.ink }]}>
                Sembunyikan nama saya dari publik (Hamba Allah)
              </Text>
            </PressableScale>

            {/* Payment Method Selector */}
            <Text style={[styles.formLabel, { color: theme.ink, marginTop: spacing.md }]}>
              Metode Pembayaran:
            </Text>
            <View style={styles.methodRow}>
              <PressableScale
                onPress={() => setPaymentMethod('transfer')}
                style={[
                  styles.methodBtn,
                  {
                    backgroundColor: paymentMethod === 'transfer' ? theme.accent : theme.surface,
                    borderColor: paymentMethod === 'transfer' ? theme.accent : theme.border
                  }
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={16}
                  color={paymentMethod === 'transfer' ? theme.accentInk : theme.ink}
                />
                <Text
                  style={[
                    styles.methodBtnText,
                    { color: paymentMethod === 'transfer' ? theme.accentInk : theme.ink }
                  ]}
                >
                  Transfer Bank
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => setPaymentMethod('qris')}
                style={[
                  styles.methodBtn,
                  {
                    backgroundColor: paymentMethod === 'qris' ? theme.accent : theme.surface,
                    borderColor: paymentMethod === 'qris' ? theme.accent : theme.border
                  }
                ]}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={16}
                  color={paymentMethod === 'qris' ? theme.accentInk : theme.ink}
                />
                <Text
                  style={[
                    styles.methodBtnText,
                    { color: paymentMethod === 'qris' ? theme.accentInk : theme.ink }
                  ]}
                >
                  QRIS Resmi
                </Text>
              </PressableScale>
            </View>

            {/* Payment Instructions & QRIS */}
            <View style={[styles.paymentInstructionCard, { borderColor: theme.border }]}>
              <Text style={[styles.instructionTitle, { color: theme.ink }]}>
                Petunjuk Transfer:
              </Text>
              <Text style={[styles.instructionBody, { color: theme.muted }]}>
                {campaign.paymentInstructions ||
                  'Transfer donasi ke Bank Mandiri 137-00-1928374-1 a/n Yayasan BelikHub Konservasi.'}
              </Text>

              {paymentMethod === 'qris' && campaign.qrisReadUrl && (
                <View style={styles.qrisImageWrapper}>
                  <Image
                    source={{ uri: campaign.qrisReadUrl }}
                    style={styles.qrisImage}
                    resizeMode="contain"
                  />
                  <Text style={[styles.qrisCaption, { color: theme.muted }]}>
                    Scan QRIS donasi di atas menggunakan aplikasi mobile banking atau e-wallet Anda.
                  </Text>
                </View>
              )}
            </View>

            {/* Upload Proof */}
            <ImageUploadField
              key={donationModalVisible ? 'open' : 'closed'}
              label="Unggah Bukti Transfer Donasi"
              helperText="Lampirkan tangkapan layar (screenshot) transfer bank atau resi QRIS."
              valueUri={proofReadUrl}
              onChange={async (base64) => {
                if (!base64) return;
                try {
                  const uploadRes = await api.uploadImage('donation_proof', base64);
                  setPhotoProofPath(uploadRes.objectPath);
                  setProofReadUrl(uploadRes.readUrl);
                } catch (e: any) {
                  toast.error(e?.message || 'Gagal memproses bukti donasi.', 'Gagal Unggah');
                }
              }}
              onClear={setProofPhotoEmpty}
            />

            {/* Modal Submit Button */}
            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setDonationModalVisible(false)}
              />
              <Button
                testID="btn-submit-donation"
                title="Kirim Donasi"
                variant="primary"
                size="md"
                loading={submittingDonation}
                onPress={handleSubmitDonation}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topBar: {
    marginBottom: spacing.sm
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6
  },
  backText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium
  },
  headerCard: {
    marginBottom: spacing.lg
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  springLocLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  campaignTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    marginTop: 4
  },
  campaignDesc: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    marginTop: 8
  },
  impactBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full
  },
  impactBadgeText: {
    ...textStyles.label,
  },
  fundingBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1
  },
  fundingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  collectedAmount: {
    ...textStyles.heading,
  },
  fundingPercent: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  fundingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  targetLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  remainingLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  revitalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingVertical: 4
  },
  revitalLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  revitalVal: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold
  },
  donateBtn: {
    marginTop: spacing.md
  },
  timelineSection: {
    marginBottom: spacing.xxl
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm
  },
  sectionHeading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  timelineCard: {
    marginBottom: spacing.md
  },
  updateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  updateDate: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  updateTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2
  },
  updateNotes: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginTop: 4
  },
  updatePhoto: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  updateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  updateAuthor: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11
  },
  updateSpent: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold
  },
  emptyTimelineCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg
  },
  emptyTimelineText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md
  },
  modalScroll: {
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  modalSub: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    maxWidth: 240
  },
  formLabel: {
    ...textStyles.label,
    marginBottom: 6
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1
  },
  presetChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1
  },
  typeBtnText: {
    ...textStyles.label,
  },
  anonToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: spacing.sm
  },
  anonToggleText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1
  },
  methodBtnText: {
    ...textStyles.label,
  },
  paymentInstructionCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  instructionTitle: {
    ...textStyles.label,
    marginBottom: 4
  },
  instructionBody: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18
  },
  qrisImageWrapper: {
    alignItems: 'center',
    marginTop: spacing.sm
  },
  qrisImage: {
    width: 200,
    height: 200,
    borderRadius: radius.md
  },
  qrisCaption: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
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
  }
});
