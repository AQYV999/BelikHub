// mobile/tests/warga-relawan-logic.test.ts
// Unit tests for pure Warga and Relawan logic utilities (ZERO React Native runtime dependencies)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  getRetributionStatusMeta,
  formatPeriod,
  validateLinkCode
} from '../src/features/warga/wargaUtils';
import {
  REPORT_TYPES,
  validateFieldReportInput,
  getReportStatusMeta
} from '../src/features/relawan/relawanUtils';

describe('Warga Logic Utilities', () => {
  test('formatRupiah formats integer and zero amounts into Indonesian Rupiah currency format', () => {
    assert.equal(formatRupiah(25000), 'Rp 25.000');
    assert.equal(formatRupiah(0), 'Rp 0');
    assert.equal(formatRupiah(1500000), 'Rp 1.500.000');
    assert.equal(formatRupiah(100), 'Rp 100');
  });

  test('getRetributionStatusMeta returns correct Indonesian label and semantic badge tone', () => {
    const pending = getRetributionStatusMeta('pending_verification');
    assert.equal(pending.label, 'Menunggu Verifikasi');
    assert.equal(pending.tone, 'warning');

    const paid = getRetributionStatusMeta('paid');
    assert.equal(paid.label, 'Lunas');
    assert.equal(paid.tone, 'success');

    const unpaid = getRetributionStatusMeta('unpaid');
    assert.equal(unpaid.label, 'Belum Bayar');
    assert.equal(unpaid.tone, 'error');

    const rejected = getRetributionStatusMeta('rejected');
    assert.equal(rejected.label, 'Ditolak');
    assert.equal(rejected.tone, 'error');
  });

  test('formatPeriod converts YYYY-MM into readable Indonesian month year format', () => {
    assert.equal(formatPeriod('2026-11'), 'November 2026');
    assert.equal(formatPeriod('2026-01'), 'Januari 2026');
    assert.equal(formatPeriod('invalid'), 'invalid');
  });

  test('validateLinkCode validates 6-character alphanumeric uppercase code', () => {
    assert.equal(validateLinkCode('TUK001'), true);
    assert.equal(validateLinkCode('ABCDEF'), true);
    assert.equal(validateLinkCode('123456'), true);
    assert.equal(validateLinkCode('tuk001'), false); // must be uppercase
    assert.equal(validateLinkCode('TUK1'), false); // too short
    assert.equal(validateLinkCode('TUK0001'), false); // too long
    assert.equal(validateLinkCode('TUK-01'), false); // non-alphanumeric
    assert.equal(validateLinkCode(''), false);
  });
});

describe('Relawan Logic Utilities', () => {
  test('REPORT_TYPES contains all 4 official BelikHub report categories', () => {
    assert.equal(REPORT_TYPES.length, 4);
    assert.ok(REPORT_TYPES.includes('Survei Mata Air'));
    assert.ok(REPORT_TYPES.includes('Restorasi Mata Air'));
    assert.ok(REPORT_TYPES.includes('Penanaman Pohon'));
    assert.ok(REPORT_TYPES.includes('Pembangunan Rorak'));
  });

  test('validateFieldReportInput accepts valid input for all 4 report types and valid Indonesian coordinates', () => {
    for (const reportType of REPORT_TYPES) {
      const result = validateFieldReportInput({
        reportType,
        location: 'Kawasan Mata Air Tuk Bismo, Wonosobo',
        notes: 'Pembersihan endapan dan perbaikan pipa transmisi air.',
        lat: -7.362,
        lng: 109.905
      });
      assert.equal(result.valid, true);
      assert.equal(result.error, undefined);
    }
  });

  test('validateFieldReportInput rejects invalid report type', () => {
    const result = validateFieldReportInput({
      reportType: 'Laporan Umum' as any,
      location: 'Wonosobo',
      notes: 'Catatan laporan'
    });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('Tipe laporan'));
  });

  test('validateFieldReportInput enforces location between 1 and 200 characters', () => {
    const emptyLoc = validateFieldReportInput({
      reportType: 'Survei Mata Air',
      location: '   ',
      notes: 'Catatan lapangan'
    });
    assert.equal(emptyLoc.valid, false);
    assert.ok(emptyLoc.error?.includes('Lokasi'));

    const longLoc = validateFieldReportInput({
      reportType: 'Survei Mata Air',
      location: 'A'.repeat(201),
      notes: 'Catatan lapangan'
    });
    assert.equal(longLoc.valid, false);
    assert.ok(longLoc.error?.includes('200'));
  });

  test('validateFieldReportInput enforces notes between 1 and 2000 characters', () => {
    const emptyNotes = validateFieldReportInput({
      reportType: 'Survei Mata Air',
      location: 'Tuk Bismo',
      notes: ''
    });
    assert.equal(emptyNotes.valid, false);
    assert.ok(emptyNotes.error?.includes('Catatan'));

    const longNotes = validateFieldReportInput({
      reportType: 'Survei Mata Air',
      location: 'Tuk Bismo',
      notes: 'B'.repeat(2001)
    });
    assert.equal(longNotes.valid, false);
    assert.ok(longNotes.error?.includes('2000'));
  });

  test('validateFieldReportInput validates Indonesian GPS bounds (-11.5..6.5, 94.0..141.5)', () => {
    // Valid coordinates inside Indonesia
    const validGps = validateFieldReportInput({
      reportType: 'Restorasi Mata Air',
      location: 'Lereng Gunung Sindoro',
      notes: 'Penanaman bibit beringin',
      lat: -7.2,
      lng: 110.0
    });
    assert.equal(validGps.valid, true);

    // Invalid latitude (> 6.5)
    const badLatNorth = validateFieldReportInput({
      reportType: 'Restorasi Mata Air',
      location: 'Lereng Gunung Sindoro',
      notes: 'Penanaman bibit beringin',
      lat: 7.5,
      lng: 110.0
    });
    assert.equal(badLatNorth.valid, false);
    assert.ok(badLatNorth.error?.includes('Latitude'));

    // Invalid latitude (< -11.5)
    const badLatSouth = validateFieldReportInput({
      reportType: 'Restorasi Mata Air',
      location: 'Lereng Gunung Sindoro',
      notes: 'Penanaman bibit beringin',
      lat: -12.0,
      lng: 110.0
    });
    assert.equal(badLatSouth.valid, false);
    assert.ok(badLatSouth.error?.includes('Latitude'));

    // Invalid longitude (< 94.0)
    const badLngWest = validateFieldReportInput({
      reportType: 'Restorasi Mata Air',
      location: 'Lereng Gunung Sindoro',
      notes: 'Penanaman bibit beringin',
      lat: -7.0,
      lng: 90.0
    });
    assert.equal(badLngWest.valid, false);
    assert.ok(badLngWest.error?.includes('Longitude'));

    // Invalid longitude (> 141.5)
    const badLngEast = validateFieldReportInput({
      reportType: 'Restorasi Mata Air',
      location: 'Lereng Gunung Sindoro',
      notes: 'Penanaman bibit beringin',
      lat: -7.0,
      lng: 145.0
    });
    assert.equal(badLngEast.valid, false);
    assert.ok(badLngEast.error?.includes('Longitude'));
  });

  test('getReportStatusMeta returns label and badge tone', () => {
    assert.deepEqual(getReportStatusMeta('pending'), {
      label: 'Menunggu Verifikasi',
      tone: 'warning'
    });
    assert.deepEqual(getReportStatusMeta('approved'), {
      label: 'Disetujui',
      tone: 'success'
    });
    assert.deepEqual(getReportStatusMeta('rejected'), {
      label: 'Ditolak',
      tone: 'error'
    });
  });
});
