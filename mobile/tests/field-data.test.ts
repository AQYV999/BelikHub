import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTelemetry, buildWorkOrders, buildAuditLog, formatSla, getFlowSeries, applySignoff, ticketPhase, buildDossierHtml, summarizeLedger } from '../src/features/field/fieldData';
import { villageLabel } from '../src/utils/format';
import { i18nKeys, i18nEntry } from '../src/i18n';

test('villageLabel never doubles the Desa prefix', () => {
  assert.equal(villageLabel('Desa Bismo'), 'Desa Bismo');
  assert.equal(villageLabel('Bismo'), 'Desa Bismo');
  assert.equal(villageLabel(''), '');
});

test('telemetry is deterministic and derives pressure from head', () => {
  const a = getTelemetry({ id: 'SPR-001', baseline_discharge_lps: 20 });
  const b = getTelemetry({ id: 'SPR-001', baseline_discharge_lps: 20 });
  assert.deepEqual(a, b);
  assert.ok(Math.abs(a.pressureBar - a.deltaHm / 10.197) < 0.01);
  assert.equal(a.simulated, true);
});

test('work orders carry SLA and overdue detection', () => {
  const now = Date.parse('2026-11-20T00:00:00Z');
  const wos = buildWorkOrders(
    [
      { id: 'R1', reportType: 'Restorasi Mata Air', location: 'x', notes: '', status: 'pending', createdAt: '2026-11-16T00:00:00Z' },
      { id: 'R2', reportType: 'Survei Mata Air', location: 'y', notes: '', status: 'approved', createdAt: '2026-11-19T00:00:00Z' }
    ] as any,
    now
  );
  assert.equal(wos[0].id, 'R1');
  assert.equal(wos[0].priority, 'P1');
  assert.equal(wos[0].slaHours, 72);
  assert.equal(wos[0].overdue, true);
  assert.equal(wos[1].hoursLeft, null);
  assert.equal(formatSla(-5), 'Lewat 5 jam');
  assert.equal(formatSla(100), 'Sisa 4 hari');
});

test('audit log lists only settled or pending bills, newest first', () => {
  const log = buildAuditLog([
    { id: 'B1', status: 'paid', amount: 25000, paidAt: '2026-11-02T00:00:00Z', residentName: 'A', paymentMethod: 'cash', createdAt: '', updatedAt: '' },
    { id: 'B2', status: 'unpaid', amount: 25000, createdAt: '', updatedAt: '' },
    { id: 'B3', status: 'pending_verification', amount: 25000, updatedAt: '2026-11-05T00:00:00Z', createdAt: '' }
  ] as any);
  assert.deepEqual(log.map((e) => e.id), ['B3', 'B1']);
});

test('flow series has 24 samples near baseline', () => {
  const s = getFlowSeries('SPR-001', 260);
  assert.equal(s.length, 24);
  assert.ok(s.every((v) => v > 240 && v < 270));
});

test('dual sign-off is gated: photo -> technician -> PDAM', () => {
  let s = undefined as any;
  assert.equal(ticketPhase(s), 'needs-photo');
  assert.equal(applySignoff(s, 'technician', 1), null);
  s = applySignoff(s, 'gps', 1, { lat: -7.08, lng: 109.71, at: 1 });
  assert.equal(ticketPhase(s), 'needs-technician');
  assert.equal(applySignoff(s, 'pdam', 2), null);
  s = applySignoff(s, 'technician', 2);
  assert.equal(ticketPhase(s), 'needs-pdam');
  s = applySignoff(s, 'pdam', 3);
  assert.equal(ticketPhase(s), 'closed');
});

test('dossier html escapes content and totals the ledger', () => {
  const entries = [
    { id: 'B1', ts: 1, action: '<b>x</b>', ref: 'B1', actor: 'A', amount: 25000, direction: 'in' as const },
    { id: 'B2', ts: 2, action: 'p', ref: 'B2', actor: 'A', amount: 5000, direction: 'pending' as const }
  ];
  assert.deepEqual(summarizeLedger(entries), { verifiedTotal: 25000, pendingTotal: 5000, verifiedCount: 1, pendingCount: 1 });
  const html = buildDossierHtml({ springName: 'Tuk Bismo', assetId: 'SPR-001', generatedAt: new Date(0), entries, orders: [], telemetry: getTelemetry({ id: 'SPR-001', baseline_discharge_lps: 260 }) });
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(!html.includes('<b>x</b>'));
});

test('every i18n key has both EN and ID text', () => {
  for (const k of i18nKeys) {
    assert.ok(i18nEntry(k).en.length > 0 && i18nEntry(k).id.length > 0, k);
  }
});
