// mobile/src/features/pengelola/PengelolaRevitalizationScreen.tsx
// Pengelola Revitalization: list managed campaigns + form to post progress updates

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
import { RevitalizationCampaign, RevitalizationUpdate, SpringPublic } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { validateCampaignUpdateInput } from './pengelolaUtils';

export const PengelolaRevitalizationScreen: React.FC = () => {
  const toast = useToast();
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [selectedSpringId, setSelectedSpringId] = useState<string>(
    (user?.managedSpringIds && user.managedSpringIds[0]) || 'SPR-001'
  );
  const [campaigns, setCampaigns] = useState<RevitalizationCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<RevitalizationCampaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Post update modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [updateTitle, setUpdateTitle] = useState<string>('');
  const [updateProgress, setUpdateProgress] = useState<string>('50');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updateSpent, setUpdateSpent] = useState<string>('');
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoReadUrl, setPhotoReadUrl] = useState<string | null>(null);
  const [submittingUpdate, setSubmittingUpdate] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>('');

  const loadCampaigns = useCallback(async () => {
    try {
      const [springsRes, campRes] = await Promise.all([
        api.listSprings().catch(() => ({ springs: [] })),
        api.listCampaigns({ springId: selectedSpringId }).catch(() => ({ campaigns: [] }))
      ]);

      const managedIds = user?.managedSpringIds && user.managedSpringIds.length > 0
        ? user.managedSpringIds
        : ['SPR-001'];

      const filteredSprings = (springsRes.springs || []).filter((s) =>
        managedIds.includes(s.id)
      );

      setSprings(filteredSprings.length > 0 ? filteredSprings : springsRes.springs || []);

      if (campRes.campaigns) {
        setCampaigns(campRes.campaigns);
        if (campRes.campaigns.length > 0) {
          // Fetch full campaign details with updates for the first campaign
          const first = await api.getCampaign(campRes.campaigns[0].id).catch(() => null);
          setSelectedCampaign(first?.campaign || campRes.campaigns[0]);
        } else {
          setSelectedCampaign(null);
        }
      }
    } catch (err) {
      console.warn('PengelolaRevitalizationScreen: loadCampaigns error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, selectedSpringId, user?.managedSpringIds]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const selectCampaignDetail = async (campaign: RevitalizationCampaign) => {
    try {
      const res = await api.getCampaign(campaign.id);
      setSelectedCampaign(res.campaign);
    } catch (err) {
      setSelectedCampaign(campaign);
    }
  };

  const handleOpenUpdateModal = (campaign: RevitalizationCampaign) => {
    setSelectedCampaign(campaign);
    setUpdateTitle('');
    setUpdateProgress(String(campaign.progressPercent || 0));
    setUpdateNotes('');
    setUpdateSpent('');
    setPhotoPath(null);
    setPhotoReadUrl(null);
    setUpdateError('');
    setModalVisible(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedCampaign) return;
    const progressNum = parseInt(updateProgress, 10);
    const spentNum = updateSpent.trim() ? parseInt(updateSpent.trim(), 10) : undefined;

    const validation = validateCampaignUpdateInput({
      title: updateTitle,
      progressPercent: progressNum,
      notes: updateNotes
    });

    if (!validation.valid) {
      setUpdateError(validation.error || 'Input tidak valid.');
      return;
    }

    setSubmittingUpdate(true);
    setUpdateError('');
    try {
      const res = await api.createCampaignUpdate(selectedCampaign.id, {
        title: updateTitle.trim(),
        notes: updateNotes.trim() || undefined,
        progressPercent: progressNum,
        photoPath: photoPath || null,
        spentAmount: spentNum
      });

      if (res.success) {
        toast.success('Pembaruan progres berhasil dipublikasikan!');
        setModalVisible(false);
        // Refresh campaign
        const updated = await api.getCampaign(selectedCampaign.id);
        setSelectedCampaign(updated.campaign);
        loadCampaigns();
      }
    } catch (e: any) {
      setUpdateError(e?.message || 'Gagal menyimpan pembaruan.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadCampaigns();
      }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Program Revitalisasi Mata Air
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            Kelola progres fisik, dana, dan laporan transparansi warga/donatur
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
                  testID={`revital-spring-chip-${spring.id}`}
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

      {/* Campaigns Selector Chips if >1 */}
      {campaigns.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.campaignChipsScroll}>
          {campaigns.map((c) => {
            const isSelected = selectedCampaign?.id === c.id;
            return (
              <PressableScale
                key={c.id}
                onPress={() => selectCampaignDetail(c)}
                style={[
                  styles.campaignChip,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border
                  }
                ]}
              >
                <Text
                  style={[
                    styles.campaignChipText,
                    { color: isSelected ? theme.accentInk : theme.ink }
                  ]}
                  numberOfLines={1}
                >
                  {c.title}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

      {/* Main Campaign Card */}
      {selectedCampaign ? (
        <Card variant="elevated" padding="lg" style={styles.mainCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardTitleCol}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>
                {selectedCampaign.title}
              </Text>
              <Text style={[styles.cardSpring, { color: theme.muted }]}>
                Mata Air {selectedCampaign.springName || selectedSpringId}
              </Text>
            </View>
            <Badge
              label={selectedCampaign.status === 'active' ? 'Aktif' : 'Selesai'}
              variant={selectedCampaign.status === 'active' ? 'success' : 'neutral'}
              size="sm"
            />
          </View>

          {selectedCampaign.description ? (
            <Text style={[styles.cardDesc, { color: theme.muted }]}>
              {selectedCampaign.description}
            </Text>
          ) : null}

          {/* Funding & Revitalization Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: theme.muted }]}>
                Progres Revitalisasi Fisik
              </Text>
              <Text style={[styles.progressVal, { color: theme.accent }]}>
                {selectedCampaign.progressPercent || 0}%
              </Text>
            </View>
            <ProgressBar progress={selectedCampaign.progressPercent || 0} height={10} />

            <View style={styles.fundingSummaryRow}>
              <View>
                <Text style={[styles.fundingLabel, { color: theme.muted }]}>Terkumpul</Text>
                <Text style={[styles.fundingValue, { color: theme.ink }]}>
                  {formatRupiah(selectedCampaign.collectedAmount || 0)}
                </Text>
              </View>
              <View style={styles.fundingRightCol}>
                <Text style={[styles.fundingLabel, { color: theme.muted }]}>Target Dana</Text>
                <Text style={[styles.fundingValue, { color: theme.ink }]}>
                  {formatRupiah(selectedCampaign.targetAmount || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action: Post Update Button */}
          <Button
            testID="btn-post-update"
            title="Kirim Pembaruan Progres"
            variant="primary"
            size="md"
            icon={<Ionicons name="add-circle-outline" size={18} color={theme.accentInk} />}
            onPress={() => handleOpenUpdateModal(selectedCampaign)}
            style={styles.postUpdateBtn}
          />
        </Card>
      ) : (
        <EmptyState
          title="Tidak Ada Program Revitalisasi"
          description="Belum ada program revitalisasi aktif untuk mata air ini."
          icon="leaf-outline"
        />
      )}

      {/* Timeline of Past Updates */}
      {selectedCampaign && selectedCampaign.updates && selectedCampaign.updates.length > 0 && (
        <View style={styles.timelineSection}>
          <Text style={[styles.sectionHeading, { color: theme.ink }]}>
            Riwayat Pembaruan Lapangan ({selectedCampaign.updates.length})
          </Text>

          {selectedCampaign.updates.map((upd, idx) => (
            <Card key={upd.id || idx} variant="outlined" padding="md" style={styles.timelineCard}>
              <View style={styles.timelineTopRow}>
                <View style={styles.timelineBadgeRow}>
                  <Badge label={`${upd.progressPercent}% Selesai`} variant="accent" size="sm" />
                  {upd.spentAmount ? (
                    <Text style={[styles.timelineSpent, { color: theme.muted }]}>
                      Dana Terpakai: {formatRupiah(upd.spentAmount)}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.timelineDate, { color: theme.muted }]}>
                  {new Date(upd.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <Text style={[styles.timelineTitle, { color: theme.ink }]}>
                {upd.title}
              </Text>

              {upd.notes ? (
                <Text style={[styles.timelineNotes, { color: theme.muted }]}>
                  {upd.notes}
                </Text>
              ) : null}

              {upd.photoUrl ? (
                <Image
                  source={{ uri: upd.photoUrl }}
                  style={styles.timelinePhoto}
                  resizeMode="cover"
                />
              ) : null}

              <Text style={[styles.timelineAuthor, { color: theme.muted }]}>
                Oleh {upd.authorName || 'Pengelola'} ({upd.authorRole || 'pengelola'})
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* POST UPDATE MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={[styles.modalScroll, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                Pembaruan Progres Revitalisasi
              </Text>
              <PressableScale onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </PressableScale>
            </View>

            {updateError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.errorInk }]}>
                  {updateError}
                </Text>
              </View>
            ) : null}

            <Input
              testID="input-update-title"
              label="Judul Pembaruan"
              placeholder="Contoh: Pembangunan 30 Rorak Parit Resapan Selesai"
              value={updateTitle}
              onChangeText={setUpdateTitle}
            />

            <Input
              testID="input-update-progress"
              label="Capaian Progres Kumulatif (0 - 100%)"
              placeholder="75"
              value={updateProgress}
              onChangeText={setUpdateProgress}
              keyboardType="numeric"
            />

            <Input
              testID="input-update-spent"
              label="Alokasi Dana Terpakai (Rp - Opsional)"
              placeholder="12000000"
              value={updateSpent}
              onChangeText={setUpdateSpent}
              keyboardType="numeric"
            />

            <Input
              testID="input-update-notes"
              label="Catatan Lapangan & Dokumentasi"
              placeholder="Jelaskan pekerjaan yang telah diselesaikan bersama warga dan relawan..."
              value={updateNotes}
              onChangeText={setUpdateNotes}
              multiline
              numberOfLines={4}
            />

            {/* Photo upload */}
            <ImageUploadField
              key={modalVisible ? 'open' : 'closed'}
              label="Foto Dokumentasi Fisik"
              helperText="Lampirkan foto kegiatan restorasi/pembangunan rorak/pipanisasi."
              valueUri={photoReadUrl}
              onChange={async (base64) => {
                if (!base64) return;
                try {
                  const uploadRes = await api.uploadImage('revitalization_photo', base64);
                  setPhotoPath(uploadRes.objectPath);
                  setPhotoReadUrl(uploadRes.readUrl);
                } catch (e: any) {
                  toast.error(e?.message || 'Gagal memproses foto.', 'Gagal Unggah');
                }
              }}
              onClear={() => {
                setPhotoPath(null);
                setPhotoReadUrl(null);
              }}
            />

            <View style={styles.modalFooterRow}>
              <Button
                title="Batal"
                variant="outline"
                size="md"
                onPress={() => setModalVisible(false)}
              />
              <Button
                testID="btn-submit-update"
                title="Publikasikan"
                variant="primary"
                size="md"
                loading={submittingUpdate}
                onPress={handleSubmitUpdate}
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
  campaignChipsScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  campaignChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 8,
    maxWidth: 240
  },
  campaignChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  mainCard: {
    marginBottom: spacing.lg
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  cardTitleCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  cardTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  cardSpring: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  cardDesc: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md
  },
  progressContainer: {
    marginVertical: spacing.sm
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  progressVal: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  fundingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  fundingRightCol: {
    alignItems: 'flex-end'
  },
  fundingLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  fundingValue: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2
  },
  postUpdateBtn: {
    marginTop: spacing.md
  },
  timelineSection: {
    marginBottom: spacing.xxl
  },
  sectionHeading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.sm
  },
  timelineCard: {
    marginBottom: spacing.md
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  timelineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timelineSpent: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  timelineDate: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  timelineTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginTop: 4
  },
  timelineNotes: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginTop: 4
  },
  timelinePhoto: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  timelineAuthor: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    marginTop: 6
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
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
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
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md
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
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 8
  },
  springChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm
  }
});
