// mobile/src/features/field/fieldData.ts
// Pure helpers that turn app data into field-engineering views:
// telemetry reading, work orders with SLA, and the maintenance cash audit log.
// Telemetry values are SIMULATED (no sensor feed yet) and the UI labels them as such.

import { FieldReport, RetributionBill, SpringPublic } from '../../api/types';

export interface TelemetryReading {
  assetId: string;
  flowLps: number;
  baselineLps: number;
  /** Deviation from baseline in percent (negative = below baseline). */
  deviationPct: number;
  /** Weir head difference Δh between the two level probes, metres. */
  deltaHm: number;
  pressureBar: number;
  uptimePct: number;
  turbidityNtu: number;
  simulated: true;
}

function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function getTelemetry(spring: Pick<SpringPublic, 'id' | 'baseline_discharge_lps' | 'uptime_percentage'> | null | undefined): TelemetryReading {
  const id = spring?.id || 'SPR-001';
  const baseline = spring?.baseline_discharge_lps ?? 18.5;
  const r = hash01(id);
  // Demo reading pinned for the flagship asset so the console matches the team's prototype figures.
  const pinned = id === 'SPR-001' ? { flow: 260.4, dh: 1.42 } : null;
  const flow = pinned ? pinned.flow : Math.round(baseline * (0.94 + r * 0.08) * 10) / 10;
  // Weir head difference between the two level probes (metres).
  const deltaH = pinned ? pinned.dh : Math.round((0.8 + r * 1.1) * 100) / 100;
  return {
    assetId: id,
    flowLps: flow,
    baselineLps: baseline,
    deviationPct: baseline ? Math.round(((flow - baseline) / baseline) * 1000) / 10 : 0,
    deltaHm: deltaH,
    pressureBar: Math.round((deltaH / 10.197) * 1000) / 1000,
    uptimePct: spring?.uptime_percentage ?? 99.2,
    turbidityNtu: Math.round((1.2 + r * 3.1) * 10) / 10,
    simulated: true
  };
}

export type WorkOrderPriority = 'P1' | 'P2' | 'P3';
export type WorkOrderState = 'open' | 'done' | 'closed';

export interface WorkOrder {
  id: string;
  title: string;
  location: string;
  priority: WorkOrderPriority;
  state: WorkOrderState;
  slaHours: number;
  dueAt: number;
  /** Hours left until SLA breach (negative = overdue). Null once the ticket is finished. */
  hoursLeft: number | null;
  overdue: boolean;
}

// PDAM Batang service level: every field ticket must be resolved within 72 h.
export const SLA_HOURS_DEFAULT = 72;
const SLA_HOURS: Record<WorkOrderPriority, number> = { P1: SLA_HOURS_DEFAULT, P2: SLA_HOURS_DEFAULT, P3: SLA_HOURS_DEFAULT };

function priorityOf(reportType: string): WorkOrderPriority {
  if (/restorasi|kebocoran|perbaikan/i.test(reportType)) return 'P1';
  if (/survei|inspeksi/i.test(reportType)) return 'P2';
  return 'P3';
}

export function buildWorkOrders(reports: FieldReport[], now: number = Date.now()): WorkOrder[] {
  return reports
    .map((r) => {
      const priority = priorityOf(r.reportType);
      const slaHours = SLA_HOURS[priority];
      const created = new Date(r.createdAt).getTime() || now;
      const dueAt = created + slaHours * 3600_000;
      const state: WorkOrderState = r.status === 'approved' ? 'done' : r.status === 'rejected' ? 'closed' : 'open';
      const hoursLeft = state === 'open' ? Math.round(((dueAt - now) / 3600_000) * 10) / 10 : null;
      return {
        id: r.id,
        title: r.reportType,
        location: r.location,
        priority,
        state,
        slaHours,
        dueAt,
        hoursLeft,
        overdue: hoursLeft !== null && hoursLeft < 0
      };
    })
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === 'open' ? -1 : b.state === 'open' ? 1 : 0;
      return a.dueAt - b.dueAt;
    });
}

export function formatSla(hoursLeft: number | null): string {
  if (hoursLeft === null) return '—';
  const abs = Math.abs(hoursLeft);
  const text = abs >= 48 ? `${Math.round(abs / 24)} hari` : `${Math.round(abs)} jam`;
  return hoursLeft < 0 ? `Lewat ${text}` : `Sisa ${text}`;
}

export interface AuditEntry {
  id: string;
  ts: number;
  action: string;
  /** i18n key of the action text (UI translates; `action` stays as the Indonesian fallback). */
  actionKey?: 'au.act.cash' | 'au.act.digital' | 'au.act.pending';
  ref: string;
  actor: string;
  amount: number;
  direction: 'in' | 'pending';
}

/** Cash-ledger view of retribution bills: every entry keeps its source document reference. */
export function buildAuditLog(bills: RetributionBill[]): AuditEntry[] {
  return bills
    .filter((b) => b.status === 'paid' || b.status === 'pending_verification')
    .map((b) => ({
      id: b.id,
      ts: new Date(b.paidAt || b.updatedAt || b.createdAt).getTime() || 0,
      action:
        b.status === 'paid'
          ? b.paymentMethod === 'cash'
            ? 'Penerimaan tunai terverifikasi'
            : 'Penerimaan non-tunai terverifikasi'
          : 'Menunggu verifikasi bukti',
      ref: b.id,
      actor: b.residentName || 'Warga',
      amount: b.amount,
      actionKey: (b.status === 'paid' ? (b.paymentMethod === 'cash' ? 'au.act.cash' : 'au.act.digital') : 'au.act.pending') as AuditEntry['actionKey'],
      direction: (b.status === 'paid' ? 'in' : 'pending') as 'in' | 'pending'
    }))
    .sort((a, b) => b.ts - a.ts);
}

/** 24 hourly discharge samples (L/s), deterministic per asset, newest last. SIMULATED. */
export function getFlowSeries(assetId: string, baselineLps: number, hours = 24): number[] {
  const out: number[] = [];
  for (let h = 0; h < hours; h++) {
    const diurnal = Math.sin((h / 24) * Math.PI * 2) * 0.012;
    const noise = (hash01(`${assetId}:${h}`) - 0.5) * 0.02;
    out.push(Math.round(baselineLps * (0.975 + diurnal + noise) * 10) / 10);
  }
  return out;
}

export interface LinkStatus {
  loraOnline: boolean;
  loraRssiDbm: number;
  muleLastImportHoursAgo: number;
  muleRecords: number;
  queuedRecords: number;
  simulated: true;
}

export function getLinkStatus(assetId: string): LinkStatus {
  const r = hash01(`${assetId}:link`);
  return {
    loraOnline: r > 0.12,
    loraRssiDbm: -Math.round(88 + r * 22),
    muleLastImportHoursAgo: Math.round(2 + r * 20),
    muleRecords: Math.round(180 + r * 140),
    queuedRecords: Math.round(r * 24),
    simulated: true
  };
}

// ---- Dual sign-off -------------------------------------------------------
export interface Signoff {
  gps?: { lat: number | null; lng: number | null; at: number };
  technicianAt?: number;
  pdamAt?: number;
}

export type TicketPhase = 'needs-photo' | 'needs-technician' | 'needs-pdam' | 'closed';

export function ticketPhase(s: Signoff | undefined): TicketPhase {
  if (!s?.gps) return 'needs-photo';
  if (!s.technicianAt) return 'needs-technician';
  if (!s.pdamAt) return 'needs-pdam';
  return 'closed';
}

/** Returns the updated sign-off or null when the step is not allowed yet (gating order). */
export function applySignoff(s: Signoff | undefined, step: 'gps' | 'technician' | 'pdam', at: number, gps?: Signoff['gps']): Signoff | null {
  const cur = s || {};
  if (step === 'gps') return { ...cur, gps: gps || { lat: null, lng: null, at } };
  if (step === 'technician') return cur.gps ? { ...cur, technicianAt: at } : null;
  return cur.gps && cur.technicianAt ? { ...cur, pdamAt: at } : null;
}

// ---- Audit dossier -------------------------------------------------------
export function summarizeLedger(entries: AuditEntry[]) {
  const verified = entries.filter((e) => e.direction === 'in');
  const pending = entries.filter((e) => e.direction === 'pending');
  return {
    verifiedTotal: verified.reduce((n, e) => n + e.amount, 0),
    pendingTotal: pending.reduce((n, e) => n + e.amount, 0),
    verifiedCount: verified.length,
    pendingCount: pending.length
  };
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export function buildDossierHtml(opts: {
  springName: string;
  assetId: string;
  generatedAt: Date;
  entries: AuditEntry[];
  orders: WorkOrder[];
  telemetry: TelemetryReading;
}): string {
  const sum = summarizeLedger(opts.entries);
  const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
  const rows = opts.entries
    .map((e) => `<tr><td>${new Date(e.ts).toISOString().slice(0, 10)}</td><td>${esc(e.ref)}</td><td>${esc(e.action)}</td><td>${esc(e.actor)}</td><td class="n">${rp(e.amount)}</td></tr>`)
    .join('');
  const wos = opts.orders
    .map((w) => `<tr><td>${esc(w.id)}</td><td>${esc(w.title)}</td><td>${w.state}</td><td>${w.slaHours} h</td></tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Audit Dossier ${esc(opts.assetId)}</title>
<style>body{font-family:Helvetica,Arial,sans-serif;color:#0F172A;padding:24px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:24px 0 8px;border-bottom:1px solid #E2E8F0;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #E2E8F0;padding:5px;text-align:left}.n{font-family:Menlo,monospace;text-align:right}.m{font-family:Menlo,monospace}</style></head><body>
<h1>BelikHub · Audit Dossier</h1><div class="m">${esc(opts.assetId)} · ${esc(opts.springName)} · ${opts.generatedAt.toISOString()}</div>
<h2>Telemetry snapshot (simulated)</h2><div class="m">Q ${opts.telemetry.flowLps} L/s · Δh ${opts.telemetry.deltaHm} m · ${opts.telemetry.pressureBar} bar · ${opts.telemetry.turbidityNtu} NTU</div>
<h2>Maintenance cash ledger</h2><div class="m">Verified ${rp(sum.verifiedTotal)} (${sum.verifiedCount}) · Pending ${rp(sum.pendingTotal)} (${sum.pendingCount})</div>
<table><tr><th>Date</th><th>Ref</th><th>Action</th><th>Actor</th><th>Amount</th></tr>${rows}</table>
<h2>Field tickets (72 h SLA)</h2><table><tr><th>ID</th><th>Type</th><th>State</th><th>SLA</th></tr>${wos}</table>
</body></html>`;
}
