// mobile/src/features/pengelola/PengelolaHomeScreen.tsx
// Pengelola Home: spring selector, collection breakdown (Tunai vs Non-Tunai), unpaid count, pending proof count

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, ProgressBar, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { SpringPublic, RetributionBill, RetributionSummary } from '../../api/types';
import { formatRupiah, formatPeriod } from '../warga/wargaUtils';
import { calculateRetributionBreakdown } from './pengelolaUtils';

export const PengelolaHomeScreen: React.FC = () => {
  const toast = useToast();
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [selectedSpringId, setSelectedSpringId] = useState<string>('SPR-001');
  const [bills, setBills] = useState<RetributionBill[]>([]);
  const [summary, setSummary] = useState<RetributionSummary>({
    totalBilled: 0,
    totalPaid: 0,
    totalCash: 0,
    totalNonCash: 0,
    unpaidCount: 0,
    pendingCount: 0,
    paidCount: 0
  });

  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  const loadData = useCallback(async () => {
    try {
      const [springsRes, retRes] = await Promise.all([
        api.listSprings().catch(() => ({ springs: [] })),
        api.listRetributions({ springId: selectedSpringId, period: currentPeriod }).catch(() => ({
          bills: [],
          summary: {
            totalBilled: 0,
            totalPaid: 0,
            totalCash: 0,
            totalNonCash: 0,
            unpaidCount: 0,
            pendingCount: 0,
            paidCount: 0
          }
        }))
      ]);

      const managedIds = user?.managedSpringIds && user.managedSpringIds.length > 0
        ? user.managedSpringIds
        : ['SPR-001'];

      const filteredSprings = (springsRes.springs || []).filter((s) =>
        managedIds.includes(s.id)
      );

      setSprings(filteredSprings.length > 0 ? filteredSprings : springsRes.springs || []);

      if (retRes?.bills) {
        setBills(retRes.bills);
        const computed = calculateRetributionBreakdown(retRes.bills);
        setSummary(computed);
      }
    } catch (err) {
      console.warn('PengelolaHomeScreen: Error loading data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, selectedSpringId, user?.managedSpringIds, currentPeriod]);

  useEffect(() => {
    if (user?.managedSpringIds && user.managedSpringIds.length > 0) {
      setSelectedSpringId(user.managedSpringIds[0]);
    }
  }, [user?.managedSpringIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const activeSpring = springs.find((s) => s.id === selectedSpringId) || springs[0];
  const collectionRate = summary.totalBilled > 0
    ? Math.round((summary.totalPaid / summary.totalBilled) * 100)
    : 0;

  const unpaidBills = bills.filter((b) => b.status === 'unpaid');
  const pendingBills = bills.filter((b) => b.status === 'pending_verification');

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
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerCol}>
          <Text style={[styles.headerGreeting, { color: theme.muted }]}>
            Panel Pengelola Mata Air
          </Text>
          <Text style={[styles.headerName, { color: theme.ink }]}>
            {user?.name || 'Pengelola'}
          </Text>
        </View>
        <Badge label="Pengelola" variant="accent" size="md" />
      </View>

      {/* Spring Selector (when managing > 1 spring) */}
      {springs.length > 1 && (
        <Card variant="outlined" padding="md" style={styles.springSelectorCard}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            Pilih Mata Air Dikelola
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.springScroll}>
            {springs.map((spring) => {
              const isSelected = spring.id === selectedSpringId;
              return (
                <PressableScale
                  key={spring.id}
                  testID={`spring-chip-${spring.id}`}
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

      {/* Selected Spring Info Banner */}
      {activeSpring && (
        <Card variant="elevated" padding="md" style={styles.activeSpringBanner}>
          <View style={styles.springBannerRow}>
            <View style={[styles.springIconWrap, { backgroundColor: theme.accentMuted }]}>
              <Ionicons name="water" size={24} color={theme.accent} />
            </View>
            <View style={styles.springBannerCol}>
              <Text style={[styles.springBannerName, { color: theme.ink }]}>
                {activeSpring.name}
              </Text>
              <Text style={[styles.springBannerLoc, { color: theme.muted }]}>
                {activeSpring.village}, {activeSpring.district} • {formatPeriod(currentPeriod)}
              </Text>
            </View>
            <Badge
              label={activeSpring.status === 'active' ? 'Aktif' : 'Rehabilitasi'}
              variant={activeSpring.status === 'active' ? 'success' : 'warning'}
              size="sm"
            />
          </View>
        </Card>
      )}

      {/* Monthly Collection Summary Card */}
      <Card variant="elevated" padding="lg" style={styles.collectionCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={[styles.collectionCardTitle, { color: theme.ink }]}>
              Realisasi Iuran Bulan Ini
            </Text>
            <Text style={[styles.collectionCardPeriod, { color: theme.muted }]}>
              Periode {formatPeriod(currentPeriod)}
            </Text>
          </View>
          <Badge
            label={`${collectionRate}% Terkumpul`}
            variant={collectionRate >= 80 ? 'success' : 'warning'}
            size="md"
          />
        </View>

        <View style={styles.progressBarWrap}>
          <ProgressBar progress={collectionRate} height={10} />
        </View>

        <View style={styles.amountOverviewRow}>
          <View style={styles.amountOverviewItem}>
            <Text style={[styles.overviewLabel, { color: theme.muted }]}>Total Tertagih</Text>
            <Text style={[styles.overviewValue, { color: theme.ink }]}>
              {formatRupiah(summary.totalBilled)}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountOverviewItem}>
            <Text style={[styles.overviewLabel, { color: theme.muted }]}>Sudah Terbayar</Text>
            <Text style={[styles.overviewValue, { color: theme.success }]}>
              {formatRupiah(summary.totalPaid)}
            </Text>
          </View>
        </View>

        {/* Breakdown Tunai vs Non-Tunai */}
        <View style={[styles.breakdownBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.breakdownTitle, { color: theme.ink }]}>
            Rincian Metode Pembayaran:
          </Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCol}>
              <View style={styles.breakdownIndicatorRow}>
                <View style={[styles.bullet, { backgroundColor: theme.accent }]} />
                <Text style={[styles.breakdownColLabel, { color: theme.muted }]}>Tunai (Cash)</Text>
              </View>
              <Text style={[styles.breakdownColValue, { color: theme.ink }]}>
                {formatRupiah(summary.totalCash)}
              </Text>
            </View>
            <View style={styles.breakdownCol}>
              <View style={styles.breakdownIndicatorRow}>
                <View style={[styles.bullet, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.breakdownColLabel, { color: theme.muted }]}>Non-Tunai (Bank/QRIS)</Text>
              </View>
              <Text style={[styles.breakdownColValue, { color: theme.ink }]}>
                {formatRupiah(summary.totalNonCash)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* KPI Counters (Unpaid & Pending Proof) */}
      <View style={styles.kpiRow}>
        <Card variant="outlined" padding="md" style={styles.kpiCard}>
          <View style={styles.kpiIconRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: theme.errorBg }]}>
              <Ionicons name="time-outline" size={20} color={theme.error} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.error }]}>
              {summary.unpaidCount}
            </Text>
          </View>
          <Text style={[styles.kpiLabel, { color: theme.muted }]}>Warga Belum Bayar</Text>
        </Card>

        <Card variant="outlined" padding="md" style={styles.kpiCard}>
          <View style={styles.kpiIconRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: theme.warningBg }]}>
              <Ionicons name="receipt-outline" size={20} color={theme.warning} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.warning }]}>
              {summary.pendingCount}
            </Text>
          </View>
          <Text style={[styles.kpiLabel, { color: theme.muted }]}>Menunggu Verifikasi</Text>
        </Card>
      </View>

      {/* Bills Section with 1-Tap "Catat Tunai" and Status Badges */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: theme.ink }]}>
          Daftar Tagihan Iuran Warga ({bills.length})
        </Text>
      </View>

      {bills.length === 0 ? (
        <Card variant="outlined" padding="md" style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.success} />
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>
            Belum Ada Tagihan Periode Ini
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
            Buka menu Retribusi untuk menerbitkan tagihan bulanan serentak.
          </Text>
        </Card>
      ) : (
        bills.map((bill) => {
          const meta = bill.status === 'paid'
            ? { label: 'Lunas', tone: 'success' as const }
            : bill.status === 'pending_verification'
            ? { label: 'Menunggu Verifikasi', tone: 'warning' as const }
            : { label: 'Belum Bayar', tone: 'error' as const };

          return (
            <Card key={bill.id} variant="elevated" padding="md" style={styles.billCard}>
              <View style={styles.billTopRow}>
                <View style={styles.billResidentCol}>
                  <Text style={[styles.billResidentName, { color: theme.ink }]}>
                    {bill.residentName || 'Warga Desa'}
                  </Text>
                  <Text style={[styles.billPeriod, { color: theme.muted }]}>
                    Periode {formatPeriod(bill.period)} {bill.paymentMethod ? `• ${bill.paymentMethod}` : ''}
                  </Text>
                </View>
                <Badge label={meta.label} variant={meta.tone} size="sm" />
              </View>

              <View style={styles.billBottomRow}>
                <Text style={[styles.billAmount, { color: theme.ink }]}>
                  {formatRupiah(bill.amount)}
                </Text>

                {bill.status === 'unpaid' ? (
                  <Button
                    testID={`btn-record-cash-${bill.id}`}
                    title="Catat Tunai"
                    variant="primary"
                    size="sm"
                    icon={<Ionicons name="cash-outline" size={16} color={theme.accentInk} />}
                    onPress={() => handleRecordCash(bill.id)}
                  />
                ) : (
                  <Badge
                    label={bill.paymentMethod === 'cash' ? 'Lunas (Tunai)' : 'Lunas'}
                    variant="success"
                    size="sm"
                  />
                )}
              </View>
            </Card>
          );
        })
      )}

      {/* Pending Proofs Preview if any */}
      {pendingBills.length > 0 && (
        <View style={styles.pendingSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.ink }]}>
              Bukti Transfer Menunggu Verifikasi ({pendingBills.length})
            </Text>
          </View>
          {pendingBills.map((pb) => (
            <Card key={pb.id} variant="outlined" padding="md" style={styles.pendingCard}>
              <View style={styles.pendingRow}>
                <View style={styles.pendingCol}>
                  <Text style={[styles.pendingName, { color: theme.ink }]}>
                    {pb.residentName || 'Warga'}
                  </Text>
                  <Text style={[styles.pendingAmount, { color: theme.muted }]}>
                    {formatRupiah(pb.amount)} • {pb.paymentMethod || 'transfer'}
                  </Text>
                </View>
                <Badge label="Perlu Cek" variant="warning" size="sm" />
              </View>
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
  headerCol: {
    flex: 1
  },
  headerGreeting: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium
  },
  headerName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold
  },
  springSelectorCard: {
    marginBottom: spacing.md
  },
  sectionTitle: {
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
  },
  activeSpringBanner: {
    marginBottom: spacing.md
  },
  springBannerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  springIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  springBannerCol: {
    flex: 1
  },
  springBannerName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  springBannerLoc: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  collectionCard: {
    marginBottom: spacing.md
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  collectionCardTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  collectionCardPeriod: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  progressBarWrap: {
    marginVertical: spacing.sm
  },
  amountOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm
  },
  amountOverviewItem: {
    flex: 1
  },
  amountDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e5e7eb',
    marginHorizontal: spacing.sm
  },
  overviewLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  overviewValue: {
    ...textStyles.heading,
  },
  breakdownBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1
  },
  breakdownTitle: {
    ...textStyles.label,
    marginBottom: 6
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  breakdownCol: {
    flex: 1
  },
  breakdownIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  breakdownColLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11
  },
  breakdownColValue: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  kpiCard: {
    flex: 1
  },
  kpiIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiValue: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold
  },
  kpiLabel: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  sectionHeaderRow: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  sectionHeading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md
  },
  emptyTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginTop: spacing.sm
  },
  emptySubtitle: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    marginTop: 4
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
  billResidentCol: {
    flex: 1
  },
  billResidentName: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  billPeriod: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  billBottomRow: {
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
  pendingSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg
  },
  pendingCard: {
    marginBottom: spacing.xs
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pendingCol: {
    flex: 1
  },
  pendingName: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold
  },
  pendingAmount: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  }
});
