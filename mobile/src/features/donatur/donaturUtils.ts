// mobile/src/features/donatur/donaturUtils.ts
// Pure business logic and calculation utilities for Donatur features

import { RevitalizationCampaign, Donation, DonorType } from '../../api/types';

export function calculateFundingProgress(target: number, collected: number): {
  percent: number;
  remaining: number;
} {
  if (target <= 0) {
    return { percent: 0, remaining: 0 };
  }
  const percent = Math.round((collected / target) * 100);
  const remaining = Math.max(0, target - collected);
  return { percent, remaining };
}

export function filterCampaignsByStatus(
  campaigns: RevitalizationCampaign[],
  status: 'all' | 'active' | 'completed'
): RevitalizationCampaign[] {
  if (status === 'all') return campaigns;
  return campaigns.filter((c) => c.status === status);
}

export function validateDonationInput(data: {
  amount: number;
  donorType: DonorType;
  organizationName?: string;
}): { valid: boolean; error?: string } {
  if (!data.amount || data.amount < 10000) {
    return { valid: false, error: 'Nominal donasi minimal Rp 10.000.' };
  }
  if (data.donorType === 'organization' && (!data.organizationName || !data.organizationName.trim())) {
    return { valid: false, error: 'Nama organisasi/CSR wajib diisi untuk donatur organisasi.' };
  }
  return { valid: true };
}

export function getDonationStatusMeta(
  status: 'pending_verification' | 'verified' | 'rejected'
): { label: string; tone: 'warning' | 'success' | 'error' } {
  switch (status) {
    case 'verified':
      return { label: 'Terverifikasi', tone: 'success' };
    case 'rejected':
      return { label: 'Ditolak', tone: 'error' };
    case 'pending_verification':
    default:
      return { label: 'Menunggu Verifikasi', tone: 'warning' };
  }
}
