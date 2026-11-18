// mobile/src/features/pengelola/pengelolaUtils.ts
// Pure business logic and calculation utilities for Pengelola features

import { RetributionBill, RetributionSummary } from '../../api/types';

export function calculateRetributionBreakdown(bills: RetributionBill[]): RetributionSummary {
  let totalBilled = 0;
  let totalPaid = 0;
  let totalCash = 0;
  let totalNonCash = 0;
  let unpaidCount = 0;
  let pendingCount = 0;
  let paidCount = 0;

  for (const b of bills) {
    totalBilled += b.amount;
    if (b.status === 'paid') {
      totalPaid += b.amount;
      paidCount++;
      if (b.paymentMethod === 'cash') {
        totalCash += b.amount;
      } else {
        totalNonCash += b.amount;
      }
    } else if (b.status === 'pending_verification') {
      pendingCount++;
    } else if (b.status === 'unpaid') {
      unpaidCount++;
    }
  }

  return {
    totalBilled,
    totalPaid,
    totalCash,
    totalNonCash,
    unpaidCount,
    pendingCount,
    paidCount
  };
}

export function filterBillsByStatus(
  bills: RetributionBill[],
  status: 'all' | 'unpaid' | 'pending_verification' | 'paid'
): RetributionBill[] {
  if (status === 'all') return bills;
  return bills.filter((b) => b.status === status);
}

export function validateResidentInput(data: {
  name: string;
  phone: string;
  monthlyFee: number;
}): { valid: boolean; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { valid: false, error: 'Nama warga wajib diisi.' };
  }
  if (!data.phone || !data.phone.trim()) {
    return { valid: false, error: 'Nomor telepon/HP wajib diisi.' };
  }
  if (!data.monthlyFee || data.monthlyFee <= 0) {
    return { valid: false, error: 'Iuran bulanan harus lebih besar dari 0.' };
  }
  return { valid: true };
}

export function validateCampaignUpdateInput(data: {
  title: string;
  progressPercent: number;
  notes?: string;
}): { valid: boolean; error?: string } {
  if (!data.title || !data.title.trim()) {
    return { valid: false, error: 'Judul pembaruan wajib diisi.' };
  }
  if (
    typeof data.progressPercent !== 'number' ||
    isNaN(data.progressPercent) ||
    data.progressPercent < 0 ||
    data.progressPercent > 100
  ) {
    return { valid: false, error: 'Persentase progres harus berada antara 0% dan 100%.' };
  }
  return { valid: true };
}
