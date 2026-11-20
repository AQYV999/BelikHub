// mobile/src/features/field/FieldPanels.tsx
// Field-engineering instrument panels: telemetry, work orders (SLA), cash audit log.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, typography, textStyles, monoText } from '../../theme/tokens';
import { SpringPublic } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { useI18n } from '../../i18n';
import { AuditEntry, WorkOrder, getTelemetry } from './fieldData';

const useTheme = () => (useColorScheme() === 'dark' ? colors.dark : colors.light);

export const SectionHead: React.FC<{ title: string; meta?: string }> = ({ title, meta }) => {
  const theme = useTheme();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text>
      {meta ? <Text style={[styles.sectionMeta, monoText, { color: theme.muted }]}>{meta}</Text> : null}
    </View>
  );
};

const Metric: React.FC<{ label: string; value: string; unit?: string; tone?: string; big?: boolean }> = ({
  label,
  value,
  unit,
  tone,
  big
}) => {
  const theme = useTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
      <View style={styles.metricRow}>
        <Text style={[big ? styles.metricBig : styles.metricValue, monoText, { color: tone || theme.ink }]}>{value}</Text>
        {unit ? <Text style={[styles.metricUnit, monoText, { color: theme.muted }]}>{unit}</Text> : null}
      </View>
    </View>
  );
};

/** Dasbor Telemetri & Tekanan for one spring asset. */
export const TelemetryPanel: React.FC<{ spring: SpringPublic | null | undefined }> = ({ spring }) => {
  const theme = useTheme();
  const { t: tr } = useI18n();
  const t = getTelemetry(spring);
  const ok = spring ? spring.status === 'active' : true;
  const dev = t.deviationPct;
  const devColor = Math.abs(dev) > 5 ? theme.warning : theme.success;

  return (
    <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.panelHead, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <View style={styles.rowCenter}>
          <View style={[styles.statusDot, { backgroundColor: ok ? theme.success : theme.warning }]} />
          <Text style={[styles.assetId, monoText, { color: theme.ink }]}>{t.assetId}</Text>
        </View>
        <Text style={[styles.simTag, monoText, { color: theme.muted, borderColor: theme.borderStrong }]}>{tr('tm.tag')}</Text>
      </View>

      <View style={styles.panelBody}>
        <Text style={[styles.assetName, { color: theme.ink }]} numberOfLines={1}>
          {spring?.name || 'Mata Air BelikHub'}
        </Text>
        <View style={styles.bigRow}>
          <Metric label={tr('tm.q')} value={t.flowLps.toFixed(1)} unit="L/s" big />
          <View style={[styles.devChip, { borderColor: devColor }]}>
            <Ionicons name={dev >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={devColor} />
            <Text style={[styles.devText, monoText, { color: devColor }]}>{Math.abs(dev).toFixed(1)}%</Text>
          </View>
        </View>
        <Text style={[styles.baseline, monoText, { color: theme.muted }]}>
          {tr('tm.baseline')} {t.baselineLps} L/s
        </Text>

        <View style={[styles.grid, { borderTopColor: theme.border }]}>
          <Metric label={tr('tm.dh')} value={t.deltaHm.toFixed(2)} unit="m" />
          <View style={[styles.vline, { backgroundColor: theme.border }]} />
          <Metric label={tr('tm.pressure')} value={t.pressureBar.toFixed(3)} unit="bar" />
          <View style={[styles.vline, { backgroundColor: theme.border }]} />
          <Metric label={tr('tm.uptime')} value={t.uptimePct.toFixed(1)} unit="%" tone={theme.success} />
        </View>
      </View>
    </View>
  );
};

/** Tiket Perbaikan Lapangan (work orders) with SLA countdown. */
export const WorkOrderList: React.FC<{ orders: WorkOrder[]; limit?: number }> = ({ orders, limit = 5 }) => {
  const theme = useTheme();
  const { t: tr } = useI18n();
  const sla = (h: number | null) => {
    if (h === null) return '—';
    const a = Math.abs(h);
    const v = a >= 48 ? `${Math.round(a / 24)}${tr('wo.days')}` : `${Math.round(a)}${tr('wo.hours')}`;
    return `${h < 0 ? tr('wo.overdue') : tr('wo.left')} ${v}`;
  };
  const shown = orders.slice(0, limit);
  if (shown.length === 0) {
    return (
      <View style={[styles.panel, styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[textStyles.subtitle, { color: theme.muted }]}>{tr('wo.none')}</Text>
      </View>
    );
  }
  const prio = { P1: theme.error, P2: theme.warning, P3: theme.info } as const;
  return (
    <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {shown.map((w, i) => {
        const stateLabel = w.state === 'open' ? tr('wo.open') : w.state === 'done' ? tr('wo.done') : tr('wo.closed');
        const slaColor = w.state !== 'open' ? theme.muted : w.overdue ? theme.error : w.hoursLeft! < 12 ? theme.warning : theme.success;
        return (
          <View key={w.id} style={[styles.woRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <View style={[styles.prio, { borderColor: prio[w.priority] }]}>
              <Text style={[styles.prioText, monoText, { color: prio[w.priority] }]}>{w.priority}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.woTitle, { color: theme.ink }]} numberOfLines={1}>{w.title}</Text>
              <Text style={[styles.woSub, { color: theme.muted }]} numberOfLines={1}>
                <Text style={monoText}>{w.id}</Text> · {w.location}
              </Text>
            </View>
            <View style={styles.woRight}>
              <Text style={[styles.woSla, monoText, { color: slaColor }]}>{sla(w.hoursLeft)}</Text>
              <Text style={[styles.woState, monoText, { color: theme.muted }]}>{stateLabel} · SLA {w.slaHours}h</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

/** Log Kas Audit Pemeliharaan: every cash movement keeps its document reference. */
export const AuditLogList: React.FC<{ entries: AuditEntry[]; limit?: number }> = ({ entries, limit = 6 }) => {
  const theme = useTheme();
  const { t: tr } = useI18n();
  const shown = entries.slice(0, limit);
  if (shown.length === 0) {
    return (
      <View style={[styles.panel, styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[textStyles.subtitle, { color: theme.muted }]}>{tr('au.none')}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {shown.map((e, i) => {
        const d = e.ts ? new Date(e.ts) : null;
        const date = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : '--/--';
        return (
          <View key={e.id} style={[styles.woRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <Text style={[styles.auditDate, monoText, { color: theme.muted }]}>{date}</Text>
            <View style={styles.flex1}>
              <Text style={[styles.woTitle, { color: theme.ink }]} numberOfLines={1}>{e.actionKey ? tr(e.actionKey) : e.action}</Text>
              <Text style={[styles.woSub, { color: theme.muted }]} numberOfLines={1}>
                <Text style={monoText}>{e.ref}</Text> · {e.actor}
              </Text>
            </View>
            <Text style={[styles.auditAmount, monoText, { color: e.direction === 'in' ? theme.success : theme.warning }]}>
              {e.direction === 'in' ? '+' : '~'}{formatRupiah(e.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  sectionTitle: { ...textStyles.heading, fontSize: typography.fontSizes.md },
  sectionMeta: { fontSize: 11 },

  panel: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  emptyBox: { padding: spacing.lg },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  assetId: { fontSize: typography.fontSizes.sm, fontWeight: '700', letterSpacing: 0.5 },
  simTag: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  panelBody: { padding: spacing.lg },
  assetName: { ...textStyles.heading },
  bigRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.md },
  baseline: { fontSize: 11, marginTop: 2 },
  devChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  devText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, alignItems: 'center' },
  vline: { width: 1, height: 32, marginHorizontal: spacing.md },
  metric: { flex: 1 },
  metricLabel: { fontFamily: typography.fontFamilies.text, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6 },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  metricBig: { fontSize: 44, lineHeight: 48, fontWeight: '700', letterSpacing: -1 },
  metricValue: { fontSize: typography.fontSizes.lg, fontWeight: '700' },
  metricUnit: { fontSize: 12 },

  woRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  prio: { width: 32, height: 24, borderWidth: 1.5, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  prioText: { fontSize: 11, fontWeight: '800' },
  woTitle: { fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.sm, fontWeight: '600' },
  woSub: { fontFamily: typography.fontFamilies.text, fontSize: 11.5, marginTop: 2 },
  woRight: { alignItems: 'flex-end' },
  woSla: { fontSize: 12, fontWeight: '700' },
  woState: { fontSize: 9.5, marginTop: 2, letterSpacing: 0.3 },
  auditDate: { fontSize: 12, width: 40 },
  auditAmount: { fontSize: 13, fontWeight: '700' }
});
