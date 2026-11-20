// mobile/src/features/field/TicketsScreen.tsx
// Field tickets with a 72 h PDAM SLA countdown, GPS-verified photo and dual sign-off.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppHeader, Button, useToast } from '../../components/ui';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, typography, monoText } from '../../theme/tokens';
import { useI18n } from '../../i18n';
import { useApi, useAuth } from '../../auth/AuthProvider';
import { FieldReport } from '../../api/types';
import { AuthGate } from './AuthGate';
import { Signoff, WorkOrder, applySignoff, buildWorkOrders, ticketPhase } from './fieldData';

// Session-level sign-off store (survives tab switches).
const signoffStore = new Map<string, Signoff>();

const TicketCard: React.FC<{ wo: WorkOrder; onChange: () => void }> = ({ wo, onChange }) => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const { t } = useI18n();
  const toast = useToast();
  const { activeRole } = useAuth();
  const [busy, setBusy] = useState(false);
  const so = signoffStore.get(wo.id);
  const phase = ticketPhase(so);
  const closed = phase === 'closed';

  const left = wo.hoursLeft;
  const slaColor = closed ? theme.success : wo.overdue ? theme.error : left !== null && left < 12 ? theme.warning : theme.success;
  const pct = closed || left === null ? 1 : Math.min(1, Math.max(0, 1 - left / wo.slaHours));
  const countdown =
    closed ? '—' : left === null ? '—' : `${left < 0 ? '-' : ''}${String(Math.floor(Math.abs(left))).padStart(2, '0')}:${String(Math.round((Math.abs(left) % 1) * 60)).padStart(2, '0')}`;

  const captureGps = async () => {
    setBusy(true);
    let gps: Signoff['gps'] = { lat: null, lng: null, at: Date.now() };
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        gps = { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now() };
      } else {
        toast.warning(t('tk.gpsFail'));
      }
    } catch {
      toast.warning(t('tk.gpsFail'));
    }
    const next = applySignoff(so, 'gps', Date.now(), gps);
    if (next) signoffStore.set(wo.id, next);
    setBusy(false);
    onChange();
  };

  const sign = (step: 'technician' | 'pdam') => {
    if (step === 'pdam' && activeRole !== 'admin' && activeRole !== 'pengelola') {
      toast.warning('PDAM supervisor role required (Admin / Pengelola).');
      return;
    }
    const next = applySignoff(so, step, Date.now());
    if (!next) {
      toast.warning(t('tk.need'));
      return;
    }
    signoffStore.set(wo.id, next);
    onChange();
  };

  const Step = ({ done, label }: { done: boolean; label: string }) => (
    <View style={styles.step}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={done ? theme.success : theme.borderStrong} />
      <Text style={[styles.stepText, { color: done ? theme.ink : theme.muted }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.flex1}>
          <Text style={[styles.id, monoText, { color: theme.muted }]}>{wo.id} · {wo.priority}</Text>
          <Text style={[styles.title, { color: theme.ink }]}>{wo.title}</Text>
          <Text style={[styles.loc, { color: theme.muted }]} numberOfLines={1}>{wo.location}</Text>
        </View>
        <View style={styles.clock}>
          <Text style={[styles.clockValue, monoText, { color: slaColor }]}>{closed ? t('tk.closed').split(' ')[0] : countdown}</Text>
          <Text style={[styles.clockLabel, monoText, { color: theme.muted }]}>{closed ? '' : `HH:MM · ${wo.slaHours}h SLA`}</Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: theme.surface }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: slaColor }]} />
      </View>

      <View style={styles.steps}>
        <Step done={!!so?.gps} label={so?.gps ? `${t('tk.verified')}${so.gps.lat != null ? ` · ${so.gps.lat.toFixed(5)}, ${so.gps.lng!.toFixed(5)}` : ''}` : t('tk.verify')} />
        <Step done={!!so?.technicianAt} label={t('tk.signTech')} />
        <Step done={!!so?.pdamAt} label={t('tk.signPdam')} />
      </View>

      {closed ? (
        <Text style={[styles.closed, monoText, { color: theme.success }]}>{t('tk.closed')}</Text>
      ) : phase === 'needs-photo' ? (
        <Button title={t('tk.verify')} size="md" fullWidth loading={busy} onPress={captureGps} icon={<Ionicons name="camera" size={16} color={theme.accentInk} />} />
      ) : phase === 'needs-technician' ? (
        <Button title={t('tk.signTech')} size="md" fullWidth onPress={() => sign('technician')} />
      ) : (
        <Button title={t('tk.signPdam')} size="md" fullWidth onPress={() => sign('pdam')} />
      )}
    </View>
  );
};

const TicketsBody: React.FC = () => {
  const { t } = useI18n();
  const api = useApi();
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [, bump] = useState(0);

  const load = useCallback(async () => {
    try {
      let reports: FieldReport[] = [];
      try {
        reports = (await api.listAllReports({ limit: 50 })).reports;
      } catch {
        reports = (await api.listMyReports()).reports;
      }
      setOrders(buildWorkOrders(reports));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen loading={loading} contentContainerStyle={styles.container} onRefresh={load}>
      <AppHeader title={t('tk.title')} />
      {orders.length === 0 ? (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.loc, { color: theme.muted }]}>{t('wo.none')}</Text>
        </View>
      ) : (
        orders.map((wo) => <TicketCard key={wo.id} wo={wo} onChange={() => bump((n) => n + 1)} />)
      )}
    </Screen>
  );
};

export const TicketsScreen: React.FC = () => {
  const { t } = useI18n();
  return (
    <AuthGate title={t('tk.title')}>
      <TicketsBody />
    </AuthGate>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  flex1: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  id: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.md, fontWeight: '700', marginTop: 2 },
  loc: { fontFamily: typography.fontFamilies.text, fontSize: typography.fontSizes.sm, marginTop: 2 },
  clock: { alignItems: 'flex-end' },
  clockValue: { fontSize: typography.fontSizes.xl, fontWeight: '800' },
  clockLabel: { fontSize: 9.5, marginTop: 2 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  steps: { gap: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepText: { fontFamily: typography.fontFamilies.text, fontSize: 12.5, fontWeight: '500', flexShrink: 1 },
  closed: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 }
});
