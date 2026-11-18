// mobile/src/features/warga/WargaHomeScreen.tsx
// Warga community & water monitoring dashboard

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, ProgressBar } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { RoleSummary, SpringPublic, RevitalizationCampaign } from '../../api/types';
import { formatRupiah, formatPeriod, getRetributionStatusMeta } from './wargaUtils';

export const WargaHomeScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<RoleSummary | null>(null);
  const [spring, setSpring] = useState<SpringPublic | null>(null);
  const [campaign, setCampaign] = useState<RevitalizationCampaign | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, springsRes, campRes] = await Promise.all([
        api.getSummary('warga').catch(() => null),
        api.listSprings().catch(() => null),
        api.listCampaigns({ status: 'active' }).catch(() => null)
      ]);

      if (sumRes?.summary) {
        setSummary(sumRes.summary);
      }

      if (springsRes?.springs && springsRes.springs.length > 0) {
        const userSpring = user?.springId
          ? springsRes.springs.find((s) => s.id === user.springId)
          : null;
        setSpring(userSpring || springsRes.springs[0]);
      }

      if (campRes?.campaigns && campRes.campaigns.length > 0) {
        setCampaign(campRes.campaigns[0]);
      }
    } catch (e) {
      console.warn('WargaHomeScreen: Error loading data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, user?.springId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const isLinked = user?.residentLinkStatus === 'linked';
  const bill = summary?.bill;
  const billStatusMeta = bill ? getRetributionStatusMeta(bill.status) : null;
  const villageTransparency = summary?.villageTransparency;

  return (
    <Screen
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* Header Welcome */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.greeting, { color: theme.muted }]}>Sugeng rawuh,</Text>
          <Text style={[styles.userName, { color: theme.ink }]}>
            {user?.name || 'Warga Komunitas'}
          </Text>
        </View>
        <Badge
          label="Warga Mata Air"
          variant="accent"
          size="md"
        />
      </View>

      {/* Spring Status Hero Card */}
      <Card variant="elevated" padding="md" style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleRow}>
            <Ionicons name="water" size={20} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.ink }]}>
              {spring?.name || 'Mata Air BelikHub'}
            </Text>
          </View>
          <Badge
            label={spring?.status === 'active' ? 'Aktif Normal' : 'Pemulihan'}
            variant={spring?.status === 'active' ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        <Text style={[styles.locationSubtitle, { color: theme.muted }]}>
          {spring?.village ? `Desa ${spring.village}, Kec. ${spring.district}` : 'Kabupaten Wonosobo'}
        </Text>

        <View style={[styles.statsGrid, { backgroundColor: theme.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.ink }]}>
              {spring?.baseline_discharge_lps ?? 18.5} L/s
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Debit Rata-rata</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.ink }]}>
              {spring?.beneficiaries_kk ?? 142} KK
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Penerima Manfaat</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {spring?.uptime_percentage ?? 99.2}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Keandalan Aliran</Text>
          </View>
        </View>
      </Card>

      {/* Monthly Retribution Status Summary */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleRow}>
            <Ionicons name="receipt-outline" size={18} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.ink }]}>
              Retribusi Bulan Ini
            </Text>
          </View>
          {billStatusMeta && (
            <Badge label={billStatusMeta.label} variant={billStatusMeta.tone} size="sm" />
          )}
        </View>

        {isLinked ? (
          <View style={styles.billContent}>
            <Text style={[styles.billPeriod, { color: theme.muted }]}>
              Periode: {formatPeriod(bill?.period || '2026-11')}
            </Text>
            <Text style={[styles.billAmount, { color: theme.ink }]}>
              {formatRupiah(bill?.amount ?? 25000)}
            </Text>
            <Text style={[styles.billNotice, { color: theme.muted }]}>
              {bill?.status === 'paid'
                ? 'Terima kasih, iuran retribusi pemeliharaan air Anda telah lunas.'
                : bill?.status === 'pending_verification'
                ? 'Bukti pembayaran sedang diverifikasi oleh pengelola mata air.'
                : 'Iuran bulanan digunakan untuk pemeliharaan pipa, tandon, dan kebersihan mata air.'}
            </Text>
          </View>
        ) : (
          <View style={styles.unlinkedAlert}>
            <Text style={[styles.unlinkedTitle, { color: theme.warningInk }]}>
              Akun Belum Tertaut ke KK
            </Text>
            <Text style={[styles.unlinkedText, { color: theme.muted }]}>
              Buka tab Retribusi untuk memasukkan kode tautan (link code) dari pengelola warga.
            </Text>
          </View>
        )}
      </Card>

      {/* Village Transparency Section */}
      {villageTransparency && (
        <Card variant="outlined" padding="md" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleRow}>
              <Ionicons name="pie-chart-outline" size={18} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.ink }]}>
                Transparansi Iuran Desa
              </Text>
            </View>
            <Badge label={formatPeriod(villageTransparency.period)} variant="neutral" size="sm" />
          </View>

          <View style={styles.transparencyGrid}>
            <View style={styles.transparencyCol}>
              <Text style={[styles.transparencyNum, { color: theme.accent }]}>
                {villageTransparency.totalPaidResidents} / {villageTransparency.totalActiveResidents} KK
              </Text>
              <Text style={[styles.transparencyLabel, { color: theme.muted }]}>
                Warga Lunas
              </Text>
            </View>
            <View style={styles.transparencyCol}>
              <Text style={[styles.transparencyNum, { color: theme.success }]}>
                {formatRupiah(villageTransparency.totalCollectedThisMonth)}
              </Text>
              <Text style={[styles.transparencyLabel, { color: theme.muted }]}>
                Total Kas Terkumpul
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Active Revitalization Campaign Card */}
      {campaign && (
        <Card variant="outlined" padding="md" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleRow}>
              <Ionicons name="leaf-outline" size={18} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.ink }]}>
                Program Revitalisasi
              </Text>
            </View>
            <Badge label="Gotong Royong" variant="info" size="sm" />
          </View>

          <Text style={[styles.campaignTitle, { color: theme.ink }]}>
            {campaign.title}
          </Text>
          {campaign.description && (
            <Text
              style={[styles.campaignDesc, { color: theme.muted }]}
              numberOfLines={2}
            >
              {campaign.description}
            </Text>
          )}

          <ProgressBar
            progress={campaign.progressPercent}
            showLabel
            labelPrefix="Target Terkumpul:"
            style={styles.progressBar}
          />

          <View style={styles.campaignAmounts}>
            <Text style={[styles.amountCollected, { color: theme.accent }]}>
              {formatRupiah(campaign.collectedAmount)}
            </Text>
            <Text style={[styles.amountTarget, { color: theme.muted }]}>
              dari {formatRupiah(campaign.targetAmount)}
            </Text>
          </View>
        </Card>
      )}

      {/* Community Water Notes */}
      <Card variant="flat" padding="md" style={styles.card}>
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={22} color={theme.accent} />
          <View style={styles.noteTextCol}>
            <Text style={[styles.noteTitle, { color: theme.ink }]}>
              Informasi Pemeliharaan Air
            </Text>
            <Text style={[styles.noteBody, { color: theme.muted }]}>
              Pembersihan tandon dan pipa induk transmisi dilakukan tiap hari Minggu pertama setiap bulan.
              Laporkan jika terjadi kebocoran pipa atau penurunan debit air kepada pengelola.
            </Text>
          </View>
        </View>
      </Card>
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
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  headerTextGroup: {
    flex: 1
  },
  greeting: {
    fontSize: typography.fontSizes.sm,
    fontFamily: typography.fontFamilies.text
  },
  userName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  card: {
    borderRadius: radius.lg
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  cardTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  locationSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamilies.text
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)'
  },
  statValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamilies.text
  },
  billContent: {
    marginTop: spacing.xs
  },
  billPeriod: {
    fontSize: typography.fontSizes.sm,
    fontFamily: typography.fontFamilies.text
  },
  billAmount: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    marginVertical: spacing.xs,
    fontFamily: typography.fontFamilies.mono
  },
  billNotice: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    fontFamily: typography.fontFamilies.text
  },
  unlinkedAlert: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm
  },
  unlinkedTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xxs
  },
  unlinkedText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18
  },
  transparencyGrid: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md
  },
  transparencyCol: {
    flex: 1
  },
  transparencyNum: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  transparencyLabel: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  campaignTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamilies.text
  },
  campaignDesc: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs,
    lineHeight: 16
  },
  progressBar: {
    marginTop: spacing.sm
  },
  campaignAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  amountCollected: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  amountTarget: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  noteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start'
  },
  noteTextCol: {
    flex: 1
  },
  noteTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xxs
  },
  noteBody: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18
  }
});
