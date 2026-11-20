// mobile/src/features/field/AuditScreen.tsx
// Audit dossier for PDAM / CSR: transparent maintenance cash ledger + one-click PDF export.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppHeader, Button, useToast } from '../../components/ui';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, typography, monoText } from '../../theme/tokens';
import { useI18n } from '../../i18n';
import { useApi } from '../../auth/AuthProvider';
import { RetributionBill, FieldReport } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { AuthGate } from './AuthGate';
import { AuditLogList, SectionHead } from './FieldPanels';
import { buildAuditLog, buildDossierHtml, buildWorkOrders, getTelemetry, summarizeLedger } from './fieldData';
import { exportDossierPdf } from './exportDossier';
import { useSprings } from './useSprings';

const AuditBody: React.FC = () => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const { t } = useI18n();
  const api = useApi();
  const toast = useToast();
  const { springs } = useSprings();
  const spring = springs[0];
  const [bills, setBills] = useState<RetributionBill[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([
        api.listRetributions({ springId: spring?.id }).catch(() => ({ bills: [] as RetributionBill[] })),
        api.listAllReports({ limit: 50 }).catch(() => ({ reports: [] as FieldReport[] }))
      ]);
      setBills(b.bills || []);
      setReports(r.reports || []);
    } finally {
      setLoading(false);
    }
  }, [api, spring?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const entries = buildAuditLog(bills);
  const sum = summarizeLedger(entries);

  const onExport = async () => {
    setExporting(true);
    try {
      const html = buildDossierHtml({
        springName: spring?.name || 'BelikHub',
        assetId: spring?.id || 'SPR-001',
        generatedAt: new Date(),
        entries,
        orders: buildWorkOrders(reports),
        telemetry: getTelemetry(spring)
      });
      await exportDossierPdf(html);
      toast.success(t('au.exported'));
    } catch {
      toast.error(t('au.exportFail'));
    } finally {
      setExporting(false);
    }
  };

  const Box = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <View style={styles.box}>
      <Text style={[styles.boxLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.boxValue, monoText, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );

  return (
    <Screen loading={loading} contentContainerStyle={styles.container} onRefresh={load}>
      <AppHeader title={t('au.title')} />

      <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Box label={t('au.cashVerified')} value={formatRupiah(sum.verifiedTotal)} tone={theme.success} />
        <View style={[styles.vline, { backgroundColor: theme.border }]} />
        <Box label={t('au.cashPending')} value={formatRupiah(sum.pendingTotal)} tone={theme.warning} />
      </View>

      <View>
        <SectionHead title={t('au.ledger')} meta={`${entries.length} · ${spring?.id || ''}`} />
        <AuditLogList entries={entries} limit={12} />
      </View>

      <Button
        title={t('au.export')}
        size="lg"
        fullWidth
        loading={exporting}
        onPress={onExport}
        icon={<Ionicons name="document-text" size={18} color={theme.accentInk} />}
      />
    </Screen>
  );
};

export const AuditScreen: React.FC = () => {
  const { t } = useI18n();
  return (
    <AuthGate title={t('au.title')}>
      <AuditBody />
    </AuthGate>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  summary: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  box: { flex: 1 },
  boxLabel: { fontFamily: typography.fontFamilies.text, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6 },
  boxValue: { fontSize: typography.fontSizes.lg, fontWeight: '700', marginTop: 4 },
  vline: { width: 1, height: 36, marginHorizontal: spacing.md }
});
