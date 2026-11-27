// mobile/src/features/warga/WargaHomeScreen.tsx
// Beranda warga, laid out like board screen 2.1: greeting, customer card, live telemetry,
// this month's bill, transparency, active campaign and shortcuts. Data and navigation are unchanged.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Badge, ProgressBar, PressableScale, Group, Row, Metrics, Logo, Contours, LiveDot } from '../../components/ui';
import { colors, typography } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { RoleSummary, SpringPublic, RevitalizationCampaign } from '../../api/types';
import { formatRupiah, formatPeriod, getRetributionStatusMeta } from './wargaUtils';

const T = colors.light;

function greetingNow(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi,';
  if (h < 15) return 'Selamat siang,';
  if (h < 19) return 'Selamat sore,';
  return 'Selamat malam,';
}

export const WargaHomeScreen: React.FC = () => {
  const router = useRouter();
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

      if (sumRes?.summary) setSummary(sumRes.summary);

      if (springsRes?.springs && springsRes.springs.length > 0) {
        const userSpring = user?.springId ? springsRes.springs.find((s) => s.id === user.springId) : null;
        setSpring(userSpring || springsRes.springs[0]);
      }

      if (campRes?.campaigns && campRes.campaigns.length > 0) setCampaign(campRes.campaigns[0]);
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
  const billMeta = bill ? getRetributionStatusMeta(bill.status) : null;
  const transparency = summary?.villageTransparency;
  const isPaid = bill?.status === 'paid';
  const isPending = bill?.status === 'pending_verification';

  const goIuran = () => router.navigate('/(tabs)/secondary');
  const goMataAir = () => router.navigate('/(tabs)/tertiary');

  const springActive = spring?.status === 'active';
  const discharge = spring?.baseline_discharge_lps ?? 18.5;
  const initial = (user?.name || 'W').trim().charAt(0).toUpperCase();
  const customerNo = user?.residentId || '—';

  return (
    <Screen loading={loading} scrollable refreshing={refreshing} onRefresh={handleRefresh} contentContainerStyle={styles.container}>
      {/* Greeting */}
      <View style={styles.greetRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.greet}>{greetingNow()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name || 'Warga'}
          </Text>
        </View>
        <View style={styles.avatar} accessibilityLabel={`Akun ${user?.name || 'warga'}`}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      {/* Customer card */}
      <LinearGradient colors={['#1B6048', '#124734', '#0B2F23']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.idcard}>
        <Contours n={9} gap={24} rightOffset={68} top={40} opacity={0.14} height={176} />
        <View style={styles.idTop}>
          <Logo size={22} />
          <Text style={styles.idKicker}>KARTU PELANGGAN BELIK</Text>
        </View>
        <View>
          <Text style={styles.idName} numberOfLines={1}>
            {user?.name || 'Warga'}
          </Text>
          <Text style={styles.idPlace} numberOfLines={1}>
            {spring?.village ? `Desa ${spring.village}` : 'Belik'}
            {spring?.district ? ` · Kec. ${spring.district}` : ''}
          </Text>
        </View>
        <View>
          <Text style={styles.idLabel}>NO. PELANGGAN</Text>
          <Text style={styles.idNo} numberOfLines={1}>
            {customerNo}
          </Text>
        </View>
      </LinearGradient>

      {/* Telemetry */}
      <Group head={`${spring?.name || 'Mata air'} · telemetri`}>
        <Row
          title={springActive ? 'Jernih & Normal' : 'Dalam Pemulihan'}
          sub={springActive ? 'Sensor terhubung' : 'Aliran sedang dipulihkan'}
          right={<Badge label={springActive ? 'Normal' : 'Pemulihan'} variant={springActive ? 'success' : 'warning'} size="sm" />}
          mark={undefined}
        >
          <View style={styles.liveInline}>
            <LiveDot color={springActive ? '#16A34A' : T.warning} />
            <Text style={styles.liveText}>{springActive ? 'LIVE' : 'PEMULIHAN'}</Text>
          </View>
        </Row>
        <Metrics
          items={[
            { label: 'Debit', value: String(discharge).replace('.', ','), unit: 'L/dtk' },
            { label: 'KK terlayani', value: String(spring?.beneficiaries_kk ?? 142) },
            { label: 'Keandalan', value: String(spring?.uptime_percentage ?? 99.2).replace('.', ','), unit: '%' }
          ]}
        />
      </Group>

      {/* This month's bill */}
      {isLinked ? (
        <>
          <Group head="Tagihan bulan ini">
            <Row
              title={`Iuran Air ${formatPeriod(bill?.period || '2026-11')}`}
              sub={
                isPaid
                  ? 'Iuran Anda sudah lunas'
                  : isPending
                  ? 'Bukti sedang diverifikasi pengelola'
                  : 'Bayar sebelum tanggal 10'
              }
              right={
                <>
                  <Text style={styles.amount}>{formatRupiah(bill?.amount ?? 25000)}</Text>
                  {billMeta ? <Badge label={billMeta.label} variant={billMeta.tone} size="sm" /> : null}
                </>
              }
            />
          </Group>
          <PressableScale
            testID="home-bill-button"
            onPress={goIuran}
            style={[styles.btn, isPaid || isPending ? styles.btnSage : styles.btnForest]}
            accessibilityLabel={isPaid ? 'Lihat Struk' : isPending ? 'Cek Status' : 'Bayar Sekarang'}
          >
            <Text style={[styles.btnText, { color: isPaid || isPending ? T.accent : '#fff' }]}>
              {isPaid ? 'Lihat Struk' : isPending ? 'Cek Status' : `Bayar ${formatRupiah(bill?.amount ?? 25000)}`}
            </Text>
          </PressableScale>
        </>
      ) : (
        <>
          <Group head="Tagihan bulan ini" foot="Masukkan kode tautan dari pengelola di tab Iuran untuk melihat tagihan Anda.">
            <Row title="Akun belum tertaut ke KK" sub="Tagihan muncul setelah akun ditautkan" right={<Badge label="Belum Tertaut" variant="warning" size="sm" />} />
          </Group>
          <PressableScale testID="home-link-button" onPress={goIuran} style={[styles.btn, styles.btnForest]} accessibilityLabel="Tautkan Akun">
            <Text style={[styles.btnText, { color: '#fff' }]}>Tautkan Akun</Text>
          </PressableScale>
        </>
      )}

      {/* Village transparency */}
      {transparency ? (
        <Group head="Transparansi desa" headRight={formatPeriod(transparency.period)}>
          <Row
            title="Warga lunas"
            right={`${transparency.totalPaidResidents} / ${transparency.totalActiveResidents} KK`}
            strong
          />
          <Row title="Kas terkumpul" right={formatRupiah(transparency.totalCollectedThisMonth)} strong />
        </Group>
      ) : null}

      {/* Active campaign */}
      {campaign ? (
        <Group head="Gotong royong">
          <View style={styles.campaign}>
            <Text style={styles.campTitle} numberOfLines={2}>
              {campaign.title}
            </Text>
            {campaign.description ? (
              <Text style={styles.campDesc} numberOfLines={2}>
                {campaign.description}
              </Text>
            ) : null}
            <ProgressBar progress={campaign.progressPercent} showLabel labelPrefix="Target terkumpul" style={{ marginTop: 10 }} />
            <View style={styles.campAmounts}>
              <Text style={styles.campCollected}>{formatRupiah(campaign.collectedAmount)}</Text>
              <Text style={styles.campTarget}>dari {formatRupiah(campaign.targetAmount)}</Text>
            </View>
          </View>
        </Group>
      ) : null}

      {/* Shortcuts */}
      <Group head="Pintasan">
        <Row mark={{ text: 'I', bg: '#124734' }} title="Iuran & struk" sub="Tagihan, bukti bayar, dan struk digital" chevron onPress={goIuran} />
        <Row mark={{ text: 'M', bg: '#475569' }} title="Transparansi mata air" sub="Debit, wilayah layanan, dan keandalan" chevron onPress={goMataAir} />
      </Group>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { gap: 4, paddingTop: 6, paddingHorizontal: 16, paddingBottom: 32 },
  greetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 12 },
  greet: { fontFamily: typography.fontFamilies.text, fontSize: 14, color: T.muted },
  name: { fontFamily: typography.fontFamilies.display, fontSize: 30, fontWeight: '500', lineHeight: 33, color: T.ink },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontFamilies.text, fontSize: 16, fontWeight: '700', color: T.accent },

  idcard: { height: 176, borderRadius: 20, overflow: 'hidden', padding: 18, justifyContent: 'space-between' },
  idTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idKicker: { fontFamily: typography.fontFamilies.text, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)' },
  idName: { fontFamily: typography.fontFamilies.display, fontSize: 27, fontWeight: '500', lineHeight: 30, color: '#fff' },
  idPlace: { fontFamily: typography.fontFamilies.text, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  idLabel: { fontFamily: typography.fontFamilies.text, fontSize: 10.5, letterSpacing: 1, color: 'rgba(255,255,255,0.6)' },
  idNo: { fontFamily: typography.fontFamilies.mono, fontSize: 18, letterSpacing: 1.4, color: '#fff', marginTop: 1 },

  liveInline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  liveText: { fontFamily: typography.fontFamilies.mono, fontSize: 10.5, fontWeight: '500', letterSpacing: 1, color: T.muted },

  amount: { fontFamily: typography.fontFamilies.text, fontSize: 20, fontWeight: '700', color: T.ink },

  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnForest: { backgroundColor: T.accent },
  btnSage: { backgroundColor: T.accentMuted },
  btnText: { fontFamily: typography.fontFamilies.text, fontSize: 16, fontWeight: '600' },

  campaign: { padding: 14 },
  campTitle: { fontFamily: typography.fontFamilies.text, fontSize: 16, fontWeight: '600', color: T.ink, lineHeight: 21 },
  campDesc: { fontFamily: typography.fontFamilies.text, fontSize: 13, color: T.muted, lineHeight: 18, marginTop: 3 },
  campAmounts: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  campCollected: { fontFamily: typography.fontFamilies.text, fontSize: 16, fontWeight: '700', color: T.accent },
  campTarget: { fontFamily: typography.fontFamilies.text, fontSize: 13, color: T.muted }
});
