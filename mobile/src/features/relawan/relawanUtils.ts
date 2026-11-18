// mobile/src/features/relawan/relawanUtils.ts
// Pure TypeScript utilities for Relawan features (ZERO React Native runtime imports)

import { ReportType, ReportStatus } from '../../api/types';
import { BadgeVariant } from '../../components/ui/Badge';

export const REPORT_TYPES: readonly ReportType[] = [
  'Survei Mata Air',
  'Restorasi Mata Air',
  'Penanaman Pohon',
  'Pembangunan Rorak'
] as const;

export interface FieldReportInput {
  reportType: ReportType;
  location: string;
  notes: string;
  lat?: number;
  lng?: number;
  photoPath?: string;
  photoUrl?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates relawan field report submission inputs:
 * - Must match one of 4 official BelikHub report categories
 * - Location must be between 1 and 200 characters
 * - Notes must be between 1 and 2000 characters
 * - Coordinates (if provided) must lie within Indonesian territory bounds:
 *   Latitude: -11.5 to 6.5
 *   Longitude: 94.0 to 141.5
 */
export function validateFieldReportInput(input: FieldReportInput): ValidationResult {
  if (!input) {
    return { valid: false, error: 'Data laporan wajib diisi' };
  }

  // 1. Report Type
  if (!REPORT_TYPES.includes(input.reportType)) {
    return {
      valid: false,
      error: `Tipe laporan tidak valid. Pilih salah satu dari: ${REPORT_TYPES.join(', ')}`
    };
  }

  // 2. Location
  const trimmedLoc = (input.location || '').trim();
  if (trimmedLoc.length === 0) {
    return { valid: false, error: 'Lokasi kegiatan wajib diisi' };
  }
  if (trimmedLoc.length > 200) {
    return { valid: false, error: 'Lokasi tidak boleh lebih dari 200 karakter' };
  }

  // 3. Notes
  const trimmedNotes = (input.notes || '').trim();
  if (trimmedNotes.length === 0) {
    return { valid: false, error: 'Catatan kegiatan lapangan wajib diisi' };
  }
  if (trimmedNotes.length > 2000) {
    return { valid: false, error: 'Catatan tidak boleh lebih dari 2000 karakter' };
  }

  // 4. GPS Coordinates (optional, but if provided must be in Indonesian bounds)
  if (input.lat !== undefined && input.lat !== null) {
    if (typeof input.lat !== 'number' || isNaN(input.lat)) {
      return { valid: false, error: 'Latitude harus berupa angka valid' };
    }
    if (input.lat < -11.5 || input.lat > 6.5) {
      return {
        valid: false,
        error: 'Latitude di luar batas wilayah Indonesia (-11.5 hingga 6.5)'
      };
    }
  }

  if (input.lng !== undefined && input.lng !== null) {
    if (typeof input.lng !== 'number' || isNaN(input.lng)) {
      return { valid: false, error: 'Longitude harus berupa angka valid' };
    }
    if (input.lng < 94.0 || input.lng > 141.5) {
      return {
        valid: false,
        error: 'Longitude di luar batas wilayah Indonesia (94.0 hingga 141.5)'
      };
    }
  }

  return { valid: true };
}

export interface ReportStatusMeta {
  label: string;
  tone: BadgeVariant;
}

/**
 * Returns user-facing Indonesian label and badge tone for a field report status.
 */
export function getReportStatusMeta(status: ReportStatus): ReportStatusMeta {
  switch (status) {
    case 'approved':
      return {
        label: 'Disetujui',
        tone: 'success'
      };
    case 'rejected':
      return {
        label: 'Ditolak',
        tone: 'error'
      };
    case 'pending':
    default:
      return {
        label: 'Menunggu Verifikasi',
        tone: 'warning'
      };
  }
}
