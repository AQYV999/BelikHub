// mobile/src/features/field/TelemetryScreen.tsx
// Telemetry & diagnostics: Q, Δh, turbidity, 24 h discharge chart, offline-first link status.

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppHeader, PressableScale } from '../../components/ui';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, typography, monoText } from '../../theme/tokens';
import { useI18n } from '../../i18n';
import { TelemetryPanel } from './FieldPanels';
import { getFlowSeries, getLinkStatus, getTelemetry } from './fieldData';
import { useSprings } from './useSprings';

const FlowChart: React.FC<{ series: number[]; baseline: number }> = ({ series, baseline }) => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const min = Math.min(...series, baseline) * 0.97;
  const max = Math.max(...series, baseline) * 1.01;
  const H = 96;
  const y = (v: number) => ((v - min) / (max - min)) * H;
  return (
    <View>
      <View style={[styles.chart, { height: H, borderColor: theme.border, backgroundColor: theme.surface }]}>
        <View style={[styles.baseLine, { bottom: y(baseline), borderColor: theme.borderStrong }]} />
        <View style={styles.bars}>
          {series.map((v, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, { height: Math.max(2, y(v)), backgroundColor: i === series.length - 1 ? theme.accent : theme.borderStrong }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.axis}>
        <Text style={[styles.axisText, monoText, { color: theme.muted }]}>-24h</Text>
        <Text style={[styles.axisText, monoText, { color: theme.muted }]}>-12h</Text>
        <Text style={[styles.axisText, monoText, { color: theme.muted }]}>now</Text>
      </View>
    </View>
  );
};

export const TelemetryScreen: React.FC = () => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const { t } = useI18n();
  const { springs, loading } = useSprings();
  const [selected, setSelected] = useState(0);
  const spring = springs[Math.min(selected, springs.length - 1)];
  const tel = getTelemetry(spring);
  const link = getLinkStatus(tel.assetId);
  const series = getFlowSeries(tel.assetId, tel.baselineLps);

  const Row = ({ icon, label, value, ok }: { icon: any; label: string; value: string; ok: boolean }) => (
    <View style={[styles.linkRow, { borderTopColor: theme.border }]}>
      <Ionicons name={icon} size={18} color={ok ? theme.success : theme.warning} />
      <Text style={[styles.linkLabel, { color: theme.ink }]}>{label}</Text>
      <Text style={[styles.linkValue, monoText, { color: ok ? theme.success : theme.warning }]}>{value}</Text>
    </View>
  );

  return (
    <Screen loading={loading} contentContainerStyle={styles.container}>
      <AppHeader title={t('tm.title')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {springs.slice(0, 6).map((s, i) => {
          const active = i === selected;
          return (
            <PressableScale
              key={s.id}
              haptic="selection"
              onPress={() => setSelected(i)}
              style={[styles.chip, { borderColor: active ? theme.accent : theme.borderStrong, backgroundColor: active ? theme.accent : theme.card }]}
            >
              <Text style={[styles.chipText, monoText, { color: active ? theme.accentInk : theme.ink }]}>{s.id}</Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      <TelemetryPanel spring={spring} />

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: theme.ink }]}>{t('tm.ntu')}</Text>
          <Text style={[styles.ntu, monoText, { color: tel.turbidityNtu > 4 ? theme.warning : theme.success }]}>
            {tel.turbidityNtu.toFixed(1)} <Text style={{ color: theme.muted, fontSize: 12 }}>NTU</Text>
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.ink, marginBottom: spacing.md }]}>{t('tm.chart')}</Text>
        <FlowChart series={series} baseline={tel.baselineLps} />
      </View>

      <View style={[styles.card, styles.noPad, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, styles.linkTitle, { color: theme.ink }]}>{t('tm.link')}</Text>
        <Row icon="radio-outline" label={t('tm.lora')} value={link.loraOnline ? `${t('tm.online')} · ${link.loraRssiDbm} dBm` : 'OFFLINE'} ok={link.loraOnline} />
        <Row icon="document-text-outline" label={t('tm.mule')} value={`${link.muleLastImportHoursAgo} h · ${link.muleRecords} ${t('tm.records')}`} ok />
        <Row icon="cloud-offline-outline" label={t('tm.queue')} value={`${link.queuedRecords} ${t('tm.records')}`} ok={link.queuedRecords < 20} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  chipsScroll: { marginHorizontal: -20 },
  chips: { paddingHorizontal: 20, gap: spacing.sm },
  chip: { paddingHorizontal: 12, height: 34, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  noPad: { padding: 0, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.sm, fontWeight: '700', letterSpacing: 0.3 },
  ntu: { fontSize: typography.fontSizes.xl, fontWeight: '700' },
  chart: { borderWidth: 1, borderRadius: radius.sm, overflow: 'hidden', justifyContent: 'flex-end' },
  baseLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingHorizontal: 4, gap: 2 },
  barCol: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisText: { fontSize: 10.5 },
  linkTitle: { padding: spacing.lg, paddingBottom: spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1 },
  linkLabel: { flex: 1, fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.sm, fontWeight: '600' },
  linkValue: { fontSize: 12, fontWeight: '700' }
});
