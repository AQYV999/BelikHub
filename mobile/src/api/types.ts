// mobile/src/api/types.ts
// TypeScript definitions matching BelikHub backend API contracts (v1 and core)

export type Role = 'warga' | 'pengelola' | 'relawan' | 'donatur' | 'admin';

export type DonorType = 'individual' | 'organization';

export type ResidentLinkStatus = 'unlinked' | 'pending' | 'linked';

export type RetributionStatus = 'unpaid' | 'pending_verification' | 'paid' | 'rejected';

export type PaymentMethod = 'cash' | 'transfer' | 'qris';

export type ReportType =
  | 'Survei Mata Air'
  | 'Restorasi Mata Air'
  | 'Penanaman Pohon'
  | 'Pembangunan Rorak';

export type ReportStatus = 'pending' | 'approved' | 'rejected';

export type CampaignStatus = 'draft' | 'active' | 'completed';

export type UploadPurpose =
  | 'retribution_proof'
  | 'donation_proof'
  | 'revitalization_photo'
  | 'report_photo'
  | 'qris_image';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified?: boolean;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  role?: 'admin' | 'user';
  points: number;
  roles: Role[];
  managedSpringIds?: string[];
  springId?: string | null;
  residentId?: string | null;
  residentLinkStatus?: ResidentLinkStatus | null;
  donorType?: DonorType | null;
  phone?: string | null;
  organizationName?: string | null;
}

export interface CoordinatesPublic {
  lat: number;
  lng: number;
  is_grid_snapped?: boolean;
  grid_radius_km?: number;
}

export interface SpringPublic {
  id: string;
  name: string;
  village: string;
  district: string;
  regency: string;
  coordinates_public?: CoordinatesPublic;
  baseline_discharge_lps?: number;
  historical_discharge_lps?: number;
  beneficiaries_kk?: number;
  beneficiaries_people?: number;
  supply_target?: string;
  status: 'active' | 'rehabilitation' | 'critical' | string;
  uptime_percentage?: number;
  treatment_needed?: string[];
  historical_impact?: string;
  crisis_history?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpringSettings {
  springId: string;
  defaultMonthlyFee: number;
  paymentInstructions: string;
  qrisImagePath?: string | null;
  qrisReadUrl?: string | null;
  isFallback?: boolean;
  updatedByUid?: string | null;
  updatedAt?: string | null;
}

export interface Resident {
  id: string;
  springId: string;
  name: string;
  phone: string;
  kkLabel?: string | null;
  monthlyFee: number;
  userId: string | null;
  linkCode?: string | null;
  linkCodeExpiresAt?: string | null;
  claimedLinkCode?: string | null;
  active: boolean;
  createdByUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingUser {
  uid: string;
  id?: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  springId: string | null;
  residentLinkStatus: ResidentLinkStatus;
  createdAt: string | null;
}

export interface RetributionBill {
  id: string;
  springId: string;
  residentId: string;
  residentName?: string | null;
  userId?: string | null;
  period: string; // YYYY-MM
  amount: number;
  status: RetributionStatus;
  paymentMethod?: PaymentMethod | null;
  proofPath?: string | null;
  proofUrl?: string | null;
  rejectionReason?: string | null;
  paidAt?: string | null;
  verifiedByUid?: string | null;
  recordedByUid?: string | null;
  generatedByUid?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RetributionSummary {
  totalBilled: number;
  totalPaid: number;
  totalCash: number;
  totalNonCash: number;
  unpaidCount: number;
  pendingCount: number;
  paidCount: number;
}

export interface RevitalizationUpdate {
  id: string;
  campaignId: string;
  springId?: string;
  authorUid?: string;
  authorName?: string;
  authorRole?: string;
  title: string;
  notes?: string;
  progressPercent: number;
  photoPath?: string | null;
  photoUrl?: string | null;
  spentAmount?: number | null;
  createdAt: string;
}

export interface RevitalizationCampaign {
  id: string;
  springId: string;
  springName?: string;
  title: string;
  description?: string;
  targetAmount: number;
  collectedAmount: number;
  progressPercent: number;
  paymentInstructions?: string;
  qrisImagePath?: string | null;
  qrisReadUrl?: string | null;
  status: CampaignStatus;
  createdByUid?: string;
  createdAt: string;
  updatedAt: string;
  updates?: RevitalizationUpdate[];
  spring?: Partial<SpringPublic>;
}

export interface Donation {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  springId?: string;
  springName?: string | null;
  donorUid: string;
  donorName: string;
  donorEmail?: string | null;
  donorType: DonorType;
  organizationName?: string | null;
  isAnonymous: boolean;
  amount: number;
  paymentMethod: string;
  proofPath?: string | null;
  proofUrl?: string | null;
  status: 'pending_verification' | 'verified' | 'rejected';
  verifiedByUid?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FieldReport {
  id: string;
  reportType: ReportType;
  location: string;
  notes: string;
  photoUrl?: string | null;
  photoPath?: string | null;
  status: ReportStatus;
  createdAt: string;
  lat?: number;
  lng?: number;
  authorName?: string;
  authorEmail?: string;
  points?: number;
}

export interface AdminUser {
  uid: string;
  id?: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  roles: Role[];
  managedSpringIds?: string[];
  springId?: string | null;
  residentId?: string | null;
  residentLinkStatus?: ResidentLinkStatus | null;
  donorType?: DonorType | null;
  organizationName?: string | null;
  points: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RoleSummary {
  role: Role;
  period: string;
  // Specific role fields:
  bill?: RetributionBill | null;
  unpaidCount?: number;
  totalCollectedThisMonth?: number;
  activeSpring?: SpringPublic | null;
  latestRevitalization?: RevitalizationCampaign | null;
  stats?: {
    totalBilled?: number;
    totalCollected?: number;
    totalCashCollected?: number;
    totalNonCashCollected?: number;
    unpaidCount?: number;
    pendingProofCount?: number;
    paidCount?: number;
    totalSprings?: number;
    totalCampaigns?: number;
    totalTargetAmount?: number;
    totalCollectedAmount?: number;
    totalCollectedDonations?: number;
    totalReports?: number;
    approvedReports?: number;
    pendingReports?: number;
    myTotalDonated?: number;
    myVerifiedDonationsCount?: number;
    points?: number;
  };
  pendingQueues?: {
    pendingDonations?: number;
    pendingRetributions?: number;
    pendingReports?: number;
    unlinkedResidents?: number;
  };
  villageTransparency?: {
    springId: string;
    springName: string;
    period: string;
    totalPaidResidents: number;
    totalActiveResidents: number;
    totalCollectedThisMonth: number;
  };
}

export interface SpringMetrics {
  total_springs: number;
  total_potential_lps: number;
  beneficiaries_kk: number;
  uptime_target_pct: number;
  sla_hours: number;
  sla_target_pct: number;
  gps_accuracy_m: number;
  recession_limit_pct: number;
}
