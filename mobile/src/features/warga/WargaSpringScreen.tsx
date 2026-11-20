// mobile/src/features/warga/WargaSpringScreen.tsx
// Detailed water spring transparency and metrics screen for Warga

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, ProgressBar } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { SpringPublic, SpringSettings } from '../../api/types';
import { formatRupiah } from './wargaUtils';

export const WargaSpringScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [springs, setSprings] = useState<SpringPublic[]>([]);
  const [selectedSpring, setSelectedSpring] = useState<SpringPublic | null>(null);
  const [springSettings, setSpringSettings] = useState<SpringSettings | null>(null);

  const loadSpringData = useCallback(async () => {
    try {
      const res = await api.listSprings();
      if (res.springs && res.springs.length > 0) {
        setSprings(res.springs);
        const current = user?.springId
          ? res.springs.find((s) => s.id === user.springId) || res.springs[0]
          : res.springs[0];
        setSelectedSpring(current);

        const settingsRes = await api.getSpringSettings(current.id).catch(() => null);
        if (settingsRes) {
          setSpringSettings(settingsRes);
        }
      }
    } catch (e) {
      console.warn('WargaSpringScreen: Error loading spring data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, user?.springId]);

  useEffect(() => {
    loadSpringData();
  }, [loadSpringData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSpringData();
  };

  const handleSelectSpring = async (spring: SpringPublic) => {
    setSelectedSpring(spring);
    try {
      const settingsRes = await api.getSpringSettings(spring.id).catch(() => null);
      if (settingsRes) {
        setSpringSettings(settingsRes);
      }
    } catch (e) {
      console.warn('Failed to load spring settings', e);
    }
  };

  const s = selectedSpring;

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* Title */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.ink }]}>Transparansi Mata Air</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Kondisi debit air, wilayah layanan & keandalan konservasi
          </Text>
        </View>
      </View>

      {/* Spring Selector Horizontal List if > 1 spring */}
      {springs.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.springSelectorRow}
        >
          {springs.map((sp) => {
            const isSelected = sp.id === s?.id;
            return (
              <Button
                key={sp.id}
                title={sp.name}
                size="sm"
                variant={isSelected ? 'primary' : 'secondary'}
                onPress={() => handleSelectSpring(sp)}
                style={styles.springChip}
              />
            );
          })}
        </ScrollView>
      )}

      {s && (
        <>
          {/* Main Spring Overview Card */}
          <Card variant="elevated" padding="md" style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.titleRow}>
                <Ionicons name="water" size={22} color={theme.accent} />
                <View>
                  <Text style={[styles.springName, { color: theme.ink }]}>{s.name}</Text>
                  <Text style={[styles.springIdText, { color: theme.muted }]}>
                    Kode Aset: {s.id}
                  </Text>
                </View>
              </View>
              <Badge
                label={s.status === 'active' ? 'Aktif Normal' : 'Pemulihan'}
                variant={s.status === 'active' ? 'success' : 'warning'}
                size="md"
              />
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={theme.muted} />
              <Text style={[styles.locationText, { color: theme.muted }]}>
                {s.village ? (s.village.startsWith('Desa ') ? s.village : `Desa ${s.village}`) : ''}, Kec. {s.district}, Kab. {s.regency}
              </Text>
            </View>

            {/* Metrics Grid */}
            <View style={[styles.metricGrid, { backgroundColor: theme.surface }]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: theme.accent }]}>
                  {s.baseline_discharge_lps ?? 18.5} L/s
                </Text>
                <Text style={[styles.metricLabel, { color: theme.muted }]}>
                  Debit Baseline
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: theme.ink }]}>
                  {s.beneficiaries_kk ?? 142} KK
                </Text>
                <Text style={[styles.metricLabel, { color: theme.muted }]}>
                  Jumlah KK Terlayani
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: theme.ink }]}>
                  {s.beneficiaries_people ?? 568} Jiwa
                </Text>
                <Text style={[styles.metricLabel, { color: theme.muted }]}>
                  Warga Pemakai
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: theme.success }]}>
                  {s.uptime_percentage ?? 99.2}%
                </Text>
                <Text style={[styles.metricLabel, { color: theme.muted }]}>
                  Uptime Aliran
                </Text>
              </View>
            </View>

            {s.supply_target && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  Target Pasokan:
                </Text>
                <Text style={[styles.detailValue, { color: theme.ink }]}>
                  {s.supply_target}
                </Text>
              </View>
            )}
          </Card>

          {/* Treatment Needed Chips */}
          {s.treatment_needed && s.treatment_needed.length > 0 && (
            <Card variant="outlined" padding="md" style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="construct-outline" size={18} color={theme.accent} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  Agenda Konservasi & Pemeliharaan
                </Text>
              </View>
              <View style={styles.treatmentChipsRow}>
                {s.treatment_needed.map((item, idx) => (
                  <View
                    key={idx}
                    style={[styles.treatmentChip, { backgroundColor: theme.surface }]}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={theme.accent} />
                    <Text style={[styles.treatmentChipText, { color: theme.ink }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Spring Settings & Transparency */}
          {springSettings && (
            <Card variant="outlined" padding="md" style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="wallet-outline" size={18} color={theme.accent} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  Ketentuan Iuran & Kas Mata Air
                </Text>
              </View>

              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.muted }]}>
                  Iuran Pemeliharaan Bulanan:
                </Text>
                <Text style={[styles.feeAmount, { color: theme.accent }]}>
                  {formatRupiah(springSettings.defaultMonthlyFee)} / KK
                </Text>
              </View>

              <Text style={[styles.instructionHead, { color: theme.ink }]}>
                Instruksi Penyetoran:
              </Text>
              <Text style={[styles.instructionBody, { color: theme.muted }]}>
                {springSettings.paymentInstructions}
              </Text>
            </Card>
          )}

          {/* Crisis History & Resilience */}
          {s.crisis_history && (
            <Card variant="flat" padding="md" style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  Rekam Jejak Ketahanan Sumber Air
                </Text>
              </View>
              <Text style={[styles.historyText, { color: theme.muted }]}>
                {s.crisis_history}
              </Text>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md
  },
  header: {
    marginBottom: spacing.xs
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamilies.text
  },
  springSelectorRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs
  },
  springChip: {
    marginRight: spacing.xs
  },
  card: {
    borderRadius: radius.lg
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  springName: {
    ...textStyles.heading,
  },
  springIdText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.mono
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm
  },
  locationText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs
  },
  metricItem: {
    width: '50%',
    paddingVertical: spacing.xs,
    alignItems: 'center'
  },
  metricNumber: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  metricLabel: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamilies.text
  },
  detailRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  detailLabel: {
    fontSize: typography.fontSizes.xs
  },
  detailValue: {
    ...textStyles.label,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  treatmentChipsRow: {
    gap: spacing.xs
  },
  treatmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  treatmentChipText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs
  },
  feeLabel: {
    fontSize: typography.fontSizes.xs
  },
  feeAmount: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  },
  instructionHead: {
    ...textStyles.label,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs
  },
  instructionBody: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18
  },
  historyText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18
  }
});
