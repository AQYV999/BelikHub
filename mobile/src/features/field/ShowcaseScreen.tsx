// mobile/src/features/field/ShowcaseScreen.tsx
// Public science showcase. No login wall.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Button, AppHeader } from '../../components/ui';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, typography, textStyles, monoText } from '../../theme/tokens';
import { useI18n } from '../../i18n';
import { BASELINE_SPRINGS } from '../../demo/demoStore';
import { SLA_HOURS_DEFAULT } from './fieldData';

export const ShowcaseScreen: React.FC = () => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const { t } = useI18n();
  const hero = BASELINE_SPRINGS[0];

  const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.statValue, monoText, { color: theme.ink }]}>
        {value}
        {unit ? <Text style={[styles.statUnit, { color: theme.muted }]}> {unit}</Text> : null}
      </Text>
    </View>
  );

  return (
    <Screen contentContainerStyle={styles.container}>
      <AppHeader kicker={t('sc.kicker')} title={t('sc.title')} />

      {/* Prototype photo slot: real photo is supplied by the team */}
      <View style={[styles.photo, { backgroundColor: theme.surface, borderColor: theme.borderStrong }]}>
        <Ionicons name="image-outline" size={28} color={theme.muted} />
        <Text style={[styles.photoText, { color: theme.muted }]}>{t('sc.photo')}</Text>
      </View>

      <View style={[styles.statRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Stat label={t('sc.stat.q')} value={String(hero.baseline_discharge_lps)} unit="L/s" />
        <View style={[styles.vline, { backgroundColor: theme.border }]} />
        <Stat label={t('sc.stat.hh')} value={String(hero.beneficiaries_kk)} unit="KK" />
        <View style={[styles.vline, { backgroundColor: theme.border }]} />
        <Stat label={t('sc.stat.sla')} value={String(SLA_HOURS_DEFAULT)} unit="h" />
      </View>

      <View style={styles.block}>
        <Text style={[styles.h, { color: theme.ink }]}>{t('sc.crisis.h')}</Text>
        <Text style={[styles.p, { color: theme.muted }]}>{t('sc.crisis.p')}</Text>
      </View>

      <View style={styles.block}>
        <Text style={[styles.h, { color: theme.ink }]}>{t('sc.science.h')}</Text>
        <Text style={[styles.p, { color: theme.muted }]}>{t('sc.science.p')}</Text>
        <View style={[styles.formula, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.formulaText, monoText, { color: theme.ink }]}>Δh = h₁ − h₂   →   Q = f(Δh)</Text>
        </View>
      </View>

      <Button
        title={t('sc.cta')}
        size="lg"
        fullWidth
        onPress={() => router.navigate('/(tabs)/telemetry')}
        icon={<Ionicons name="pulse" size={18} color={theme.accentInk} />}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  photo: { height: 160, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  photoText: { ...textStyles.subtitle, textAlign: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  stat: { flex: 1 },
  statLabel: { fontFamily: typography.fontFamilies.text, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6 },
  statValue: { fontSize: typography.fontSizes.xl, fontWeight: '700', marginTop: 4 },
  statUnit: { fontSize: 12, fontWeight: '500' },
  vline: { width: 1, height: 36, marginHorizontal: spacing.md },
  block: { gap: spacing.sm },
  h: { ...textStyles.heading },
  p: { ...textStyles.body },
  formula: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.sm },
  formulaText: { fontSize: typography.fontSizes.sm, fontWeight: '600' }
});
