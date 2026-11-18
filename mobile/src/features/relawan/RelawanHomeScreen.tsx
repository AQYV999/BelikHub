// mobile/src/features/relawan/RelawanHomeScreen.tsx
// Volunteer conservation home and monitoring map overview

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, ProgressBar } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { RoleSummary, SpringPublic, RevitalizationCampaign } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';

export const RelawanHomeScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<RoleSummary | null>(null);
  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [campaigns, setCampaigns] = useState<RevitalizationCampaign[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, springsRes, campRes] = await Promise.all([
        api.getSummary('relawan').catch(() => null),
        api.listSprings().catch(() => null),
        api.listCampaigns().catch(() => null)
      ]);

      if (sumRes?.summary) {
        setSummary(sumRes.summary);
      }
      if (springsRes?.springs) {
        setSprings(springsRes.springs);
      }
      if (campRes?.campaigns) {
        setCampaigns(campRes.campaigns);
      }
    } catch (e) {
      console.warn('RelawanHomeScreen: Error loading data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const points = user?.points || summary?.stats?.points || 600;

  return (
    <Screen
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* Volunteer Header */}
      <View style={styles.header}>
        <View style={styles.headerCol}>
          <Text style={[styles.greeting, { color: theme.muted }]}>Semangat Konservasi,</Text>
          <Text style={[styles.userName, { color: theme.ink }]}>
            {user?.name || 'Relawan BelikHub'}
          </Text>
        </View>
        <Badge label="Relawan Lapangan" variant="accent" size="md" />
      </View>

      {/* Points & Impact Hero Card */}
      <Card variant="elevated" padding="md" style={styles.card}>
        <View style={styles.pointsRow}>
          <View>
            <Text style={[styles.pointsLabel, { color: theme.muted }]}>
              Poin Kontribusi Relawan
            </Text>
            <Text style={[styles.pointsValue, { color: theme.accent }]}>
              {points} Poin
            </Text>
          </View>
          <View style={[styles.pointsBadge, { backgroundColor: theme.accentMuted }]}>
            <Ionicons name="ribbon-outline" size={28} color={theme.accent} />
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: theme.surface }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.ink }]}>
              {summary?.stats?.totalReports ?? 4}
            </Text>
            <Text style={[styles.statSub, { color: theme.muted }]}>Total Laporan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.success }]}>
              {summary?.stats?.approvedReports ?? 3}
            </Text>
            <Text style={[styles.statSub, { color: theme.muted }]}>Disetujui</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.ink }]}>
              {springs.length || 4}
            </Text>
            <Text style={[styles.statSub, { color: theme.muted }]}>Mata Air Terdata</Text>
          </View>
        </View>
      </Card>

      {/* 4 Conservation Program Guide */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="compass-outline" size={18} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            Program Lapangan BelikHub
          </Text>
        </View>

        <View style={styles.programList}>
          <View style={styles.programItem}>
            <View style={[styles.programIconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name="search" size={16} color={theme.accent} />
            </View>
            <View style={styles.programTextCol}>
              <Text style={[styles.programName, { color: theme.ink }]}>Survei Mata Air</Text>
              <Text style={[styles.programDesc, { color: theme.muted }]}>
                Ukur debit air, pantau sedimentasi pipa & kebersihan bak penampung.
              </Text>
            </View>
          </View>

          <View style={styles.programItem}>
            <View style={[styles.programIconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name="water" size={16} color={theme.accent} />
            </View>
            <View style={styles.programTextCol}>
              <Text style={[styles.programName, { color: theme.ink }]}>Restorasi Mata Air</Text>
              <Text style={[styles.programDesc, { color: theme.muted }]}>
                Perbaikan bendung bronjong, penataan tangkapan air & pipa transmisi.
              </Text>
            </View>
          </View>

          <View style={styles.programItem}>
            <View style={[styles.programIconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name="leaf" size={16} color={theme.success} />
            </View>
            <View style={styles.programTextCol}>
              <Text style={[styles.programName, { color: theme.ink }]}>Penanaman Pohon</Text>
              <Text style={[styles.programDesc, { color: theme.muted }]}>
                Bibit beringin, aren, dan bambu di radius 200 meter mata air.
              </Text>
            </View>
          </View>

          <View style={styles.programItem}>
            <View style={[styles.programIconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name="construct" size={16} color={theme.warning} />
            </View>
            <View style={styles.programTextCol}>
              <Text style={[styles.programName, { color: theme.ink }]}>Pembangunan Rorak</Text>
              <Text style={[styles.programDesc, { color: theme.muted }]}>
                Lubang resapan air hujan penahan erosi lereng pegunungan.
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Springs Needing Attention */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          Mata Air Prioritas Pengawasan
        </Text>
        <Text style={[styles.sectionCount, { color: theme.muted }]}>
          {springs.length} Titik
        </Text>
      </View>

      {springs.map((s) => (
        <Card key={s.id} variant="outlined" padding="md" style={styles.card}>
          <View style={styles.springCardHeader}>
            <View>
              <Text style={[styles.springTitle, { color: theme.ink }]}>{s.name}</Text>
              <Text style={[styles.springLoc, { color: theme.muted }]}>
                Desa {s.village}, {s.district}
              </Text>
            </View>
            <Badge
              label={s.status === 'active' ? 'Aktif' : 'Perlu Aksi'}
              variant={s.status === 'active' ? 'success' : 'warning'}
              size="sm"
            />
          </View>

          <View style={styles.springMetaRow}>
            <Text style={[styles.springMetaText, { color: theme.muted }]}>
              Debit: <Text style={{ color: theme.ink, fontWeight: 'bold' }}>{s.baseline_discharge_lps ?? 15} L/s</Text>
            </Text>
            <Text style={[styles.springMetaText, { color: theme.muted }]}>
              Warga: <Text style={{ color: theme.ink, fontWeight: 'bold' }}>{s.beneficiaries_kk ?? 100} KK</Text>
            </Text>
          </View>

          {s.treatment_needed && (
            <Text style={[styles.springTreatment, { color: theme.muted }]} numberOfLines={1}>
              Fokus: {s.treatment_needed.join(', ')}
            </Text>
          )}
        </Card>
      ))}
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
  headerCol: {
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
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  pointsLabel: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  pointsValue: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  pointsBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md
  },
  statCol: {
    flex: 1,
    alignItems: 'center'
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.08)'
  },
  statNum: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  statSub: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamilies.text
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  sectionCount: {
    fontSize: typography.fontSizes.xs
  },
  programList: {
    gap: spacing.md,
    marginTop: spacing.sm
  },
  programItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center'
  },
  programIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  programTextCol: {
    flex: 1
  },
  programName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold
  },
  programDesc: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 16
  },
  springCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  springTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  springLoc: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2
  },
  springMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm
  },
  springMetaText: {
    fontSize: typography.fontSizes.xs
  },
  springTreatment: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs,
    fontStyle: 'italic'
  }
});
