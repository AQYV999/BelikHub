// mobile/src/features/admin/adminUtils.ts
// Pure business logic and calculation utilities for Admin features

import { Donation, FieldReport, SpringPublic } from '../../api/types';

export function calculateAdminQueueCounts(
  donations: Donation[],
  reports: FieldReport[],
  pendingRetributions = 0,
  unlinkedResidents = 0
): {
  pendingDonations: number;
  pendingReports: number;
  pendingRetributions: number;
  unlinkedResidents: number;
  totalQueued: number;
} {
  const pendingDonations = donations.filter((d) => d.status === 'pending_verification').length;
  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const totalQueued = pendingDonations + pendingReports + pendingRetributions + unlinkedResidents;

  return {
    pendingDonations,
    pendingReports,
    pendingRetributions,
    unlinkedResidents,
    totalQueued
  };
}

export function validateSpringInput(data: Partial<SpringPublic>): { valid: boolean; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { valid: false, error: 'Nama mata air wajib diisi.' };
  }
  if (!data.village || !data.village.trim()) {
    return { valid: false, error: 'Nama desa wajib diisi.' };
  }
  if (!data.district || !data.district.trim()) {
    return { valid: false, error: 'Nama kecamatan wajib diisi.' };
  }
  return { valid: true };
}

export function validateCampaignInput(data: {
  springId: string;
  title: string;
  targetAmount: number;
  paymentInstructions: string;
}): { valid: boolean; error?: string } {
  if (!data.springId) {
    return { valid: false, error: 'Mata air wajib dipilih.' };
  }
  if (!data.title || !data.title.trim()) {
    return { valid: false, error: 'Judul program revitalisasi wajib diisi.' };
  }
  if (!data.targetAmount || data.targetAmount <= 0) {
    return { valid: false, error: 'Target pendanaan harus lebih besar dari 0.' };
  }
  if (!data.paymentInstructions || !data.paymentInstructions.trim()) {
    return { valid: false, error: 'Petunjuk pembayaran/transfer wajib diisi.' };
  }
  return { valid: true };
}
