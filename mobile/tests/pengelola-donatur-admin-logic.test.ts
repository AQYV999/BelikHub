// mobile/tests/pengelola-donatur-admin-logic.test.ts
// Unit tests for pure logic utilities for Pengelola, Donatur, and Admin features (ZERO React Native runtime imports)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRetributionBreakdown,
  filterBillsByStatus,
  validateResidentInput,
  validateCampaignUpdateInput
} from '../src/features/pengelola/pengelolaUtils';
import {
  calculateFundingProgress,
  filterCampaignsByStatus,
  validateDonationInput,
  getDonationStatusMeta
} from '../src/features/donatur/donaturUtils';
import {
  calculateAdminQueueCounts,
  validateSpringInput,
  validateCampaignInput
} from '../src/features/admin/adminUtils';
import { RetributionBill, RevitalizationCampaign, Donation, FieldReport } from '../src/api/types';

describe('Pengelola Logic Utilities', () => {
  const mockBills: RetributionBill[] = [
    {
      id: 'B1',
      springId: 'SPR-001',
      residentId: 'R1',
      period: '2026-11',
      amount: 15000,
      status: 'unpaid',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01'
    },
    {
      id: 'B2',
      springId: 'SPR-001',
      residentId: 'R2',
      period: '2026-11',
      amount: 15000,
      status: 'paid',
      paymentMethod: 'cash',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-02'
    },
    {
      id: 'B3',
      springId: 'SPR-001',
      residentId: 'R3',
      period: '2026-11',
      amount: 20000,
      status: 'paid',
      paymentMethod: 'transfer',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-03'
    },
    {
      id: 'B4',
      springId: 'SPR-001',
      residentId: 'R4',
      period: '2026-11',
      amount: 15000,
      status: 'pending_verification',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-04'
    }
  ];

  test('calculateRetributionBreakdown correctly separates cash vs non-cash vs unpaid', () => {
    const stats = calculateRetributionBreakdown(mockBills);
    assert.equal(stats.totalBilled, 65000);
    assert.equal(stats.totalPaid, 35000);
    assert.equal(stats.totalCash, 15000);
    assert.equal(stats.totalNonCash, 20000);
    assert.equal(stats.unpaidCount, 1);
    assert.equal(stats.pendingCount, 1);
    assert.equal(stats.paidCount, 2);
  });

  test('filterBillsByStatus filters bills according to status tab', () => {
    assert.equal(filterBillsByStatus(mockBills, 'all').length, 4);
    assert.equal(filterBillsByStatus(mockBills, 'unpaid').length, 1);
    assert.equal(filterBillsByStatus(mockBills, 'pending_verification').length, 1);
    assert.equal(filterBillsByStatus(mockBills, 'paid').length, 2);
  });

  test('validateResidentInput accepts valid name, phone, fee and rejects invalid', () => {
    const valid = validateResidentInput({
      name: 'Pak Ahmad',
      phone: '081234567890',
      monthlyFee: 15000
    });
    assert.equal(valid.valid, true);

    const emptyName = validateResidentInput({
      name: '  ',
      phone: '081234567890',
      monthlyFee: 15000
    });
    assert.equal(emptyName.valid, false);

    const invalidFee = validateResidentInput({
      name: 'Pak Ahmad',
      phone: '081234567890',
      monthlyFee: 0
    });
    assert.equal(invalidFee.valid, false);
  });

  test('validateCampaignUpdateInput checks title and progressPercent 0..100', () => {
    assert.equal(
      validateCampaignUpdateInput({ title: 'Progres Pipa', progressPercent: 75 }).valid,
      true
    );
    assert.equal(
      validateCampaignUpdateInput({ title: '', progressPercent: 50 }).valid,
      false
    );
    assert.equal(
      validateCampaignUpdateInput({ title: 'Over 100', progressPercent: 120 }).valid,
      false
    );
    assert.equal(
      validateCampaignUpdateInput({ title: 'Negative', progressPercent: -5 }).valid,
      false
    );
  });
});

describe('Donatur Logic Utilities', () => {
  test('calculateFundingProgress calculates percentage and remaining amount', () => {
    const progress = calculateFundingProgress(50000000, 32500000);
    assert.equal(progress.percent, 65);
    assert.equal(progress.remaining, 17500000);

    const overTarget = calculateFundingProgress(10000000, 12000000);
    assert.equal(overTarget.percent, 120);
    assert.equal(overTarget.remaining, 0);

    const zeroTarget = calculateFundingProgress(0, 5000);
    assert.equal(zeroTarget.percent, 0);
  });

  test('filterCampaignsByStatus filters active and completed campaigns', () => {
    const campaigns: RevitalizationCampaign[] = [
      {
        id: 'C1',
        springId: 'S1',
        title: 'C1',
        targetAmount: 1000,
        collectedAmount: 500,
        progressPercent: 50,
        status: 'active',
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'C2',
        springId: 'S2',
        title: 'C2',
        targetAmount: 1000,
        collectedAmount: 1000,
        progressPercent: 100,
        status: 'completed',
        createdAt: '',
        updatedAt: ''
      }
    ];

    assert.equal(filterCampaignsByStatus(campaigns, 'all').length, 2);
    assert.equal(filterCampaignsByStatus(campaigns, 'active').length, 1);
    assert.equal(filterCampaignsByStatus(campaigns, 'completed').length, 1);
  });

  test('validateDonationInput enforces minimum 10.000 and organization name for CSR', () => {
    assert.equal(
      validateDonationInput({ amount: 50000, donorType: 'individual' }).valid,
      true
    );
    assert.equal(
      validateDonationInput({ amount: 5000, donorType: 'individual' }).valid,
      false
    );
    assert.equal(
      validateDonationInput({ amount: 500000, donorType: 'organization', organizationName: 'PT Tirta' }).valid,
      true
    );
    assert.equal(
      validateDonationInput({ amount: 500000, donorType: 'organization', organizationName: '   ' }).valid,
      false
    );
  });

  test('getDonationStatusMeta returns correct semantic label and tone', () => {
    assert.deepEqual(getDonationStatusMeta('pending_verification'), {
      label: 'Menunggu Verifikasi',
      tone: 'warning'
    });
    assert.deepEqual(getDonationStatusMeta('verified'), {
      label: 'Terverifikasi',
      tone: 'success'
    });
    assert.deepEqual(getDonationStatusMeta('rejected'), {
      label: 'Ditolak',
      tone: 'error'
    });
  });
});

describe('Admin Logic Utilities', () => {
  test('calculateAdminQueueCounts returns counts of pending items', () => {
    const donations: Partial<Donation>[] = [
      { id: 'd1', status: 'pending_verification' },
      { id: 'd2', status: 'verified' },
      { id: 'd3', status: 'pending_verification' }
    ];
    const reports: Partial<FieldReport>[] = [
      { id: 'r1', status: 'pending' },
      { id: 'r2', status: 'approved' }
    ];

    const counts = calculateAdminQueueCounts(donations as Donation[], reports as FieldReport[]);
    assert.equal(counts.pendingDonations, 2);
    assert.equal(counts.pendingReports, 1);
  });

  test('validateSpringInput checks spring name, village, and discharge', () => {
    assert.equal(
      validateSpringInput({ name: 'Tuk Bismo', village: 'Bismo', district: 'Blado', baseline_discharge_lps: 260 }).valid,
      true
    );
    assert.equal(
      validateSpringInput({ name: '', village: 'Bismo', district: 'Blado' }).valid,
      false
    );
  });

  test('validateCampaignInput checks title, targetAmount > 0 and instructions', () => {
    assert.equal(
      validateCampaignInput({
        springId: 'SPR-001',
        title: 'Restorasi Hulu',
        targetAmount: 50000000,
        paymentInstructions: 'Transfer Mandiri'
      }).valid,
      true
    );
    assert.equal(
      validateCampaignInput({
        springId: 'SPR-001',
        title: '',
        targetAmount: 50000000,
        paymentInstructions: 'Transfer'
      }).valid,
      false
    );
    assert.equal(
      validateCampaignInput({
        springId: 'SPR-001',
        title: 'Restorasi',
        targetAmount: 0,
        paymentInstructions: 'Transfer'
      }).valid,
      false
    );
  });
});
