// mobile/src/features/warga/WargaHomeScreen.tsx
// Warga community & water monitoring dashboard:
// hero telemetry -> quick actions -> digital-pass retribution -> light-weight sections.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet
} from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, ProgressBar, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles, getShadow, monoText } from '../../theme/tokens';
import { villageLabel } from '../../utils/format';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { RoleSummary, SpringPublic, RevitalizationCampaign } from '../../api/types';
import { formatRupiah, formatPeriod, getRetributionStatusMeta } from './wargaUtils';
import { TelemetryPanel } from '../field/FieldPanels';

export const WargaHomeScreen: React.FC = () => {
  const toast = useToast();
  const router = useRouter();
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

  const goRetribusi = () => router.navigate('/(tabs)');
  const goMataAir = () => router.navigate('/(tabs)/secondary');

  const springActive = spring?.status === 'active';
  const discharge = spring?.baseline_discharge_lps ?? 18.5;
  const initial = (user?.name || 'W').trim().charAt(0).toUpperCase();

  // Digital-pass accent follows the bill state.
  const tone = billStatusMeta?.tone ?? 'error';
  const toneColor = { success: theme.success, warning: theme.warning, error: theme.error }[
    tone as 'success' | 'warning' | 'error'
  ] ?? theme.accent;
  const toneBg = { success: theme.successBg, warning: theme.warningBg, error: theme.errorBg }[
    tone as 'success' | 'warning' | 'error'
  ] ?? theme.tint;
  const toneInk = { success: theme.successInk, warning: theme.warningInk, error: theme.errorInk }[
    tone as 'success' | 'warning' | 'error'
  ] ?? theme.ink;

  const isPaid = bill?.status === 'paid';
  const isPending = bill?.status === 'pending_verification';

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* Greeting */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.greeting, { color: theme.muted }]}>Sugeng rawuh,</Text>
          <Text style={[styles.userName, { color: theme.ink }]} numberOfLines={1}>
            {user?.name || 'Warga Komunitas'}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.accentMuted }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>{initial}</Text>
        </View>
      </View>

      {/* Telemetry & pressure dashboard */}
      <TelemetryPanel spring={spring} />

      {/* Quick actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.actionsScroll}
        contentContainerStyle={styles.actionsRow}
      >
        <PressableScale
          onPress={goRetribusi}
          accessibilityLabel="Bayar Retribusi"
          style={[styles.pill, { backgroundColor: theme.accent, borderColor: theme.accent }]}
        >
          <Ionicons name="card" size={16} color={theme.accentInk} />
          <Text style={[styles.pillText, { color: theme.accentInk }]}>Bayar Retribusi</Text>
        </PressableScale>
        <PressableScale
          onPress={goMataAir}
          accessibilityLabel="Lihat Mata Air"
          style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="water" size={16} color={theme.accent} />
          <Text style={[styles.pillText, { color: theme.ink }]}>Lihat Mata Air</Text>
        </PressableScale>
        <PressableScale
          onPress={() =>
            toast.info(
              'Sampaikan kebocoran pipa atau penurunan debit kepada pengelola mata air Anda.',
              'Lapor Kerusakan'
            )
          }
          accessibilityLabel="Lapor Kerusakan"
          style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="construct" size={16} color={theme.warning} />
          <Text style={[styles.pillText, { color: theme.ink }]}>Lapor Kerusakan</Text>
        </PressableScale>
      </ScrollView>

      {/* Retribution digital pass */}
      <View>
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>RETRIBUSI BULAN INI</Text>
        <View
          style={[
            styles.pass,
            { backgroundColor: theme.card, borderColor: theme.border },
            getShadow('md', isDark)
          ]}
        >
          <View style={[styles.passStripe, { backgroundColor: isLinked ? toneColor : theme.warning }]} />

          {isLinked ? (
            <>
              <View style={styles.passTop}>
                <View>
                  <Text style={[styles.passPeriod, { color: theme.muted }]}>
                    {formatPeriod(bill?.period || '2026-11')}
                  </Text>
                  <Text style={[styles.passAmount, { color: theme.ink }, monoText]}>
                    {formatRupiah(bill?.amount ?? 25000)}
                  </Text>
                </View>
                {billStatusMeta && (
                  <View style={[styles.statusChip, { backgroundColor: toneBg }]}>
                    <Ionicons
                      name={isPaid ? 'checkmark-circle' : isPending ? 'time' : 'alert-circle'}
                      size={14}
                      color={toneColor}
                    />
                    <Text style={[styles.statusChipText, { color: toneInk }]}>{billStatusMeta.label}</Text>
                  </View>
                )}
              </View>

              {/* Perforation */}
              <View style={styles.perforation}>
                <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.bg }]} />
                <View style={[styles.dashes, { borderColor: theme.borderStrong }]} />
                <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.bg }]} />
              </View>

              <View style={styles.passBottom}>
                <Text style={[styles.passNotice, { color: theme.muted }]}>
                  {isPaid
                    ? 'Terima kasih, iuran pemeliharaan air Anda telah lunas.'
                    : isPending
                    ? 'Bukti pembayaran sedang diverifikasi oleh pengelola.'
                    : 'Iuran bulanan untuk pemeliharaan pipa, tandon, dan kebersihan mata air.'}
                </Text>
                <Button
                  title={isPaid ? 'Lihat Bukti' : isPending ? 'Cek Status' : 'Bayar Sekarang'}
                  variant={isPaid || isPending ? 'outline' : 'primary'}
                  size="md"
                  fullWidth
                  onPress={goRetribusi}
                  icon={
                    <Ionicons
                      name={isPaid ? 'receipt-outline' : isPending ? 'time-outline' : 'arrow-forward'}
                      size={16}
                      color={isPaid || isPending ? theme.accent : theme.accentInk}
                    />
                  }
                  style={styles.passButton}
                />
              </View>
            </>
          ) : (
            <View style={styles.passBottom}>
              <Text style={[styles.unlinkedTitle, { color: theme.warningInk }]}>Akun Belum Tertaut ke KK</Text>
              <Text style={[styles.passNotice, { color: theme.muted }]}>
                Masukkan kode tautan (link code) dari pengelola warga di tab Retribusi untuk melihat tagihan Anda.
              </Text>
              <Button
                title="Tautkan Akun"
                variant="primary"
                size="md"
                fullWidth
                onPress={goRetribusi}
                style={styles.passButton}
              />
            </View>
          )}
        </View>
      </View>

      {/* Village transparency: flat stats, no card */}
      {villageTransparency && (
        <View>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionLabel, styles.noMargin, { color: theme.muted }]}>TRANSPARANSI DESA</Text>
            <Text style={[styles.sectionMeta, { color: theme.muted }]}>
              {formatPeriod(villageTransparency.period)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statBig, { color: theme.ink }]}>
                {villageTransparency.totalPaidResidents}
                <Text style={[styles.statBigSub, { color: theme.muted }]}>
                  {' '}/ {villageTransparency.totalActiveResidents} KK
                </Text>
              </Text>
              <Text style={[styles.statCaption, { color: theme.muted }]}>Warga lunas</Text>
            </View>
            <View style={[styles.statVLine, { backgroundColor: theme.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statBig, { color: theme.success }, monoText]} numberOfLines={1} adjustsFontSizeToFit>
                {formatRupiah(villageTransparency.totalCollectedThisMonth)}
              </Text>
              <Text style={[styles.statCaption, { color: theme.muted }]}>Kas terkumpul</Text>
            </View>
          </View>
        </View>
      )}

      {/* Active campaign: one tinted feature card */}
      {campaign && (
        <View>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>GOTONG ROYONG</Text>
          <View style={[styles.campaign, { backgroundColor: theme.tint, borderColor: theme.border }]}>
            <View style={styles.campaignHead}>
              <View style={[styles.campaignIcon, { backgroundColor: theme.accentMuted }]}>
                <Ionicons name="leaf" size={18} color={theme.accent} />
              </View>
              <Text style={[styles.campaignTitle, { color: theme.ink }]} numberOfLines={2}>
                {campaign.title}
              </Text>
            </View>
            {campaign.description ? (
              <Text style={[styles.campaignDesc, { color: theme.muted }]} numberOfLines={2}>
                {campaign.description}
              </Text>
            ) : null}
            <ProgressBar
              progress={campaign.progressPercent}
              showLabel
              labelPrefix="Target terkumpul"
              style={styles.progressBar}
            />
            <View style={styles.campaignAmounts}>
              <Text style={[styles.amountCollected, { color: theme.accent }, monoText]}>
                {formatRupiah(campaign.collectedAmount)}
              </Text>
              <Text style={[styles.amountTarget, { color: theme.muted }, monoText]}>
                dari {formatRupiah(campaign.targetAmount)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Maintenance note: quiet, no card */}
      <View style={styles.note}>
        <View style={[styles.noteBar, { backgroundColor: theme.accent }]} />
        <View style={styles.noteTextCol}>
          <Text style={[styles.noteTitle, { color: theme.ink }]}>Pemeliharaan Air</Text>
          <Text style={[styles.noteBody, { color: theme.muted }]}>
            Pembersihan tandon dan pipa induk dilakukan setiap Minggu pertama tiap bulan. Laporkan kebocoran atau
            penurunan debit kepada pengelola.
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxxl,
    paddingTop: spacing.sm
  },

  // Greeting
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTextGroup: { flex: 1 },
  greeting: { ...textStyles.subtitle },
  userName: { ...textStyles.title, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamilies.display, fontSize: typography.fontSizes.lg, fontWeight: '700' },

  // Quick actions (bleed to the screen edges, keep 20px start/end)
  actionsScroll: { marginHorizontal: -20, marginTop: -spacing.sm },
  actionsRow: { paddingHorizontal: 20, gap: spacing.sm, paddingVertical: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1
  },
  pillText: { fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.sm, fontWeight: '600' },

  // Sections
  sectionLabel: { ...textStyles.label, letterSpacing: 1.2, marginBottom: spacing.md },
  noMargin: { marginBottom: 0 },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionMeta: { ...textStyles.label },

  // Digital pass
  pass: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth },
  passStripe: { position: 'absolute', left: 24, top: 0, width: 36, height: 4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  passTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    paddingTop: spacing.xxl
  },
  passPeriod: { ...textStyles.label, letterSpacing: 0.8 },
  passAmount: {
    fontFamily: typography.fontFamilies.mono,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
    fontVariant: ['tabular-nums']
  },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm },
  statusChipText: { ...textStyles.label },
  perforation: { height: 20, justifyContent: 'center' },
  dashes: { marginHorizontal: spacing.xl + 8, borderTopWidth: 1.5, borderStyle: 'dashed' },
  notch: { position: 'absolute', top: 0, width: 20, height: 20, borderRadius: 10 },
  notchLeft: { left: -10 },
  notchRight: { right: -10 },
  passBottom: { padding: spacing.xl, paddingTop: spacing.lg },
  passNotice: { ...textStyles.subtitle },
  passButton: { marginTop: spacing.lg },
  unlinkedTitle: { ...textStyles.heading, marginBottom: spacing.xs },

  // Transparency
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1 },
  statVLine: { width: StyleSheet.hairlineWidth, height: 40, marginHorizontal: spacing.lg },
  statBig: { fontFamily: typography.fontFamilies.mono, fontSize: typography.fontSizes.xl, fontWeight: '700', letterSpacing: -0.3 },
  statBigSub: { fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.sm, fontWeight: '500' },
  statCaption: { ...textStyles.subtitle, marginTop: 2 },

  // Campaign
  campaign: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl },
  campaignHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  campaignIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  campaignTitle: { ...textStyles.heading, flex: 1 },
  campaignDesc: { ...textStyles.subtitle, marginTop: spacing.md },
  progressBar: { marginTop: spacing.lg },
  campaignAmounts: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  amountCollected: { fontFamily: typography.fontFamilies.mono, fontSize: typography.fontSizes.lg, fontWeight: '700' },
  amountTarget: { ...textStyles.subtitle },

  // Note
  note: { flexDirection: 'row', gap: spacing.md },
  noteBar: { width: 3, borderRadius: 2, opacity: 0.7 },
  noteTextCol: { flex: 1 },
  noteTitle: { ...textStyles.heading, fontSize: typography.fontSizes.md },
  noteBody: { ...textStyles.subtitle, marginTop: 4 }
});
