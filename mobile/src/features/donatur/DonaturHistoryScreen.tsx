// mobile/src/features/donatur/DonaturHistoryScreen.tsx
// Donatur History: personal donation list with status badges and latest updates from funded springs

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Card,
  Badge,
  EmptyState
} from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { Donation, RevitalizationUpdate } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { getDonationStatusMeta } from './donaturUtils';

export const DonaturHistoryScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [fundedUpdates, setFundedUpdates] = useState<RevitalizationUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDonations = useCallback(async () => {
    try {
      const res = await api.listDonations();
      if (res.donations) {
        setDonations(res.donations);

        // Fetch updates from funded campaigns
        const campaignIds = Array.from(new Set(res.donations.map((d) => d.campaignId)));
        const allUpdates: RevitalizationUpdate[] = [];

        await Promise.all(
          campaignIds.map(async (cid) => {
            try {
              const campRes = await api.getCampaign(cid);
              if (campRes.campaign?.updates) {
                allUpdates.push(...campRes.campaign.updates);
              }
            } catch (err) {
              // ignore individual campaign error
            }
          })
        );

        // Sort latest first
        allUpdates.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setFundedUpdates(allUpdates.slice(0, 5));
      }
    } catch (err) {
      console.warn('DonaturHistoryScreen: loadDonations error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const totalVerifiedDonations = donations
    .filter((d) => d.status === 'verified')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadDonations();
      }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerGreeting, { color: theme.muted }]}>
            Riwayat & Transparansi
          </Text>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Donasi Konservasi Saya
          </Text>
        </View>
        <Badge
          label={`${donations.length} Donasi`}
          variant="accent"
          size="md"
        />
      </View>

      {/* Summary Card */}
      <Card variant="elevated" padding="lg" style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>
              Total Donasi Terverifikasi
            </Text>
            <Text style={[styles.summaryValue, { color: theme.accent }]}>
              {formatRupiah(totalVerifiedDonations)}
            </Text>
          </View>
          <View style={[styles.summaryIconCircle, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.accent} />
          </View>
        </View>
        <Text style={[styles.summarySub, { color: theme.muted }]}>
          Donasi Anda disalurkan langsung untuk pembelian bibit pohon resapan, parit rorak, dan pipanisasi warga lereng.
        </Text>
      </Card>

      {/* Donation List Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeading, { color: theme.ink }]}>
          Daftar Kontribusi Donasi
        </Text>
      </View>

      {donations.length === 0 ? (
        <EmptyState
          title="Belum Ada Riwayat Donasi"
          description="Anda belum menyalurkan donasi. Buka tab Program untuk memilih mata air yang ingin Anda bantu."
          icon="gift-outline"
        />
      ) : (
        donations.map((don) => {
          const meta = getDonationStatusMeta(don.status);
          return (
            <Card key={don.id} variant="outlined" padding="md" style={styles.donationCard}>
              <View style={styles.donationTopRow}>
                <View style={styles.donationTitleCol}>
                  <Text style={[styles.campaignName, { color: theme.ink }]}>
                    {don.campaignTitle || 'Program Revitalisasi'}
                  </Text>
                  <Text style={[styles.springMeta, { color: theme.muted }]}>
                    Mata Air {don.springName || 'Batang'} • {new Date(don.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <Badge label={meta.label} variant={meta.tone} size="sm" />
              </View>

              <View style={styles.donationBottomRow}>
                <View>
                  <Text style={[styles.donationAmount, { color: theme.ink }]}>
                    {formatRupiah(don.amount)}
                  </Text>
                  <Text style={[styles.donorTypeLabel, { color: theme.muted }]}>
                    {don.donorType === 'organization'
                      ? `CSR: ${don.organizationName || 'Perusahaan'}`
                      : don.isAnonymous
                      ? 'Hamba Allah (Anonim)'
                      : don.donorName}
                  </Text>
                </View>

                {don.proofUrl && (
                  <View style={styles.proofBadge}>
                    <Ionicons name="document-attach-outline" size={14} color={theme.accent} />
                    <Text style={[styles.proofBadgeText, { color: theme.accent }]}>
                      Bukti Terlampir
                    </Text>
                  </View>
                )}
              </View>

              {/* Rejection Reason if any */}
              {don.status === 'rejected' && don.rejectionReason && (
                <View style={[styles.rejectedNotice, { backgroundColor: theme.errorBg }]}>
                  <Ionicons name="alert-circle" size={14} color={theme.error} />
                  <Text style={[styles.rejectedText, { color: theme.errorInk }]}>
                    Alasan: {don.rejectionReason}
                  </Text>
                </View>
              )}
            </Card>
          );
        })
      )}

      {/* Latest Updates from Funded Springs */}
      {fundedUpdates.length > 0 && (
        <View style={styles.fundedUpdatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: theme.ink }]}>
              Kabar Terbaru dari Mata Air yang Anda Bantu
            </Text>
          </View>

          {fundedUpdates.map((upd, idx) => (
            <Card key={upd.id || idx} variant="elevated" padding="md" style={styles.updateCard}>
              <View style={styles.updateHeaderRow}>
                <Badge label={`${upd.progressPercent}% Selesai`} variant="accent" size="sm" />
                <Text style={[styles.updateDate, { color: theme.muted }]}>
                  {new Date(upd.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <Text style={[styles.updateTitle, { color: theme.ink }]}>
                {upd.title}
              </Text>

              {upd.notes ? (
                <Text style={[styles.updateNotes, { color: theme.muted }]}>
                  {upd.notes}
                </Text>
              ) : null}

              {upd.photoUrl ? (
                <Image
                  source={{ uri: upd.photoUrl }}
                  style={styles.updatePhoto}
                  resizeMode="cover"
                />
              ) : null}
            </Card>
          ))}
        </View>
      )}
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
  summaryCard: {
    marginBottom: spacing.lg
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  summaryLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  summaryValue: {
    ...textStyles.title,
    marginTop: 2
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summarySub: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginTop: 4
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  sectionHeading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  donationCard: {
    marginBottom: spacing.sm
  },
  donationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs
  },
  donationTitleCol: {
    flex: 1,
    marginRight: spacing.sm
  },
  campaignName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  springMeta: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  donationBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  donationAmount: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  donorTypeLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  proofBadgeText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.xs
  },
  rejectedText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11
  },
  fundedUpdatesSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl
  },
  updateCard: {
    marginBottom: spacing.md
  },
  updateHeaderRow: {
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
    height: 160,
    borderRadius: radius.md,
    marginTop: spacing.sm
  }
});
