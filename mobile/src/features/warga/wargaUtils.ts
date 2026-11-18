// mobile/src/features/warga/wargaUtils.ts
// Pure TypeScript utilities for Warga features (ZERO React Native runtime imports)

import { RetributionStatus } from '../../api/types';
import { BadgeVariant } from '../../components/ui/Badge';

/**
 * Format a numeric amount into Indonesian Rupiah format.
 * Example: 25000 -> 'Rp 25.000'
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

export interface RetributionStatusMeta {
  label: string;
  tone: BadgeVariant;
}

/**
 * Returns user-facing Indonesian label and semantic badge tone for a retribution bill status.
 */
export function getRetributionStatusMeta(status: RetributionStatus): RetributionStatusMeta {
  switch (status) {
    case 'paid':
      return {
        label: 'Lunas',
        tone: 'success'
      };
    case 'pending_verification':
      return {
        label: 'Menunggu Verifikasi',
        tone: 'warning'
      };
    case 'rejected':
      return {
        label: 'Ditolak',
        tone: 'error'
      };
    case 'unpaid':
    default:
      return {
        label: 'Belum Bayar',
        tone: 'error'
      };
  }
}

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

/**
 * Format YYYY-MM period into readable Indonesian month year.
 * Example: '2026-11' -> 'November 2026'
 */
export function formatPeriod(period: string): string {
  if (!period || typeof period !== 'string') return '';
  const parts = period.trim().split('-');
  if (parts.length !== 2) return period;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return period;
  }

  return `${INDONESIAN_MONTHS[month - 1]} ${year}`;
}

/**
 * Validates a 6-character alphanumeric uppercase resident link code.
 */
export function validateLinkCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z0-9]{6}$/.test(code.trim());
}
