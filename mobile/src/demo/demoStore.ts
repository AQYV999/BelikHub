// mobile/src/demo/demoStore.ts
// Pure TypeScript stateful in-memory Demo Mode store for all 5 roles
// ZERO React Native runtime imports so tests run fast and pure in Node

import {
  Role,
  UserProfile,
  SpringPublic,
  SpringSettings,
  Resident,
  PendingUser,
  RetributionBill,
  RetributionSummary,
  RevitalizationCampaign,
  RevitalizationUpdate,
  Donation,
  FieldReport,
  AdminUser,
  RoleSummary,
  UploadPurpose,
  PaymentMethod,
  DonorType,
  ReportType,
  SpringMetrics
} from '../api/types';

export const BASELINE_METRICS: SpringMetrics = {
  total_springs: 88,
  total_potential_lps: 1350,
  beneficiaries_kk: 2500,
  uptime_target_pct: 95,
  sla_hours: 72,
  sla_target_pct: 80,
  gps_accuracy_m: 15,
  recession_limit_pct: 20
};

export const BASELINE_SPRINGS: SpringPublic[] = [
  {
    id: 'SPR-001',
    name: 'Tuk Bismo',
    village: 'Desa Bismo',
    district: 'Kecamatan Blado',
    regency: 'Kabupaten Batang',
    coordinates_public: { lat: -7.083, lng: 109.716, is_grid_snapped: true, grid_radius_km: 5 },
    baseline_discharge_lps: 260.0,
    historical_discharge_lps: 300.0,
    beneficiaries_kk: 2500,
    beneficiaries_people: 10000,
    supply_target: '90% Air Baku PDAM Batang & Warga Desa',
    status: 'active',
    uptime_percentage: 98.2,
    treatment_needed: ['Sumur Resapan', 'Rorak', 'Perbaikan Apron Spring Box'],
    historical_impact: '200 sumur resapan & 2.000 pohon (2016-2017) terbukti menaikkan debit +9.57%',
    crisis_history: 'Banjir bandang & longsor Jan 2025 menimbun 5 bak penampung'
  },
  {
    id: 'SPR-002',
    name: 'Mata Air Wonomerto',
    village: 'Desa Wonomerto',
    district: 'Kecamatan Bandar',
    regency: 'Kabupaten Batang',
    coordinates_public: { lat: -7.052, lng: 109.741, is_grid_snapped: true, grid_radius_km: 5 },
    baseline_discharge_lps: 4.5,
    historical_discharge_lps: 0.0,
    beneficiaries_kk: 65,
    beneficiaries_people: 262,
    supply_target: 'Air Bersih Komunitas Desa Wonomerto',
    status: 'rehabilitation',
    uptime_percentage: 85.0,
    treatment_needed: ['Perbaikan Pipa Distribusi', 'Delineasi Springshed', 'Pencatatan Baseline'],
    crisis_history: 'Kekeringan total Sep 2023 selama 12+ bulan, kini kembali mengalir'
  },
  {
    id: 'SPR-003',
    name: 'Tuk Watulumbung',
    village: 'Desa Tambakboyo',
    district: 'Kecamatan Reban',
    regency: 'Kabupaten Batang',
    coordinates_public: { lat: -7.112, lng: 109.823, is_grid_snapped: true, grid_radius_km: 5 },
    baseline_discharge_lps: 38.0,
    historical_discharge_lps: 54.0,
    beneficiaries_kk: 850,
    beneficiaries_people: 3400,
    supply_target: 'Air Bersih Warga & Irigasi Petani Kopi',
    status: 'active',
    uptime_percentage: 92.5,
    treatment_needed: ['Reboisasi Pohon Beringin & Aren', 'Parit Resapan'],
    historical_impact: 'Konservasi lereng atas mempertahankan aliran di musim kemarau'
  },
  {
    id: 'SPR-004',
    name: 'Tuk Semampir',
    village: 'Desa Semampir',
    district: 'Kecamatan Reban',
    regency: 'Kabupaten Batang',
    coordinates_public: { lat: -7.135, lng: 109.845, is_grid_snapped: true, grid_radius_km: 5 },
    baseline_discharge_lps: 18.5,
    historical_discharge_lps: 25.0,
    beneficiaries_kk: 420,
    beneficiaries_people: 1680,
    supply_target: 'Air Bersih Komunitas Desa Semampir',
    status: 'active',
    uptime_percentage: 94.0,
    treatment_needed: ['Pembuatan Rorak Konservasi', 'Broncaptering'],
    historical_impact: 'Pembangunan 50 rorak menahan limpasan air hujan'
  }
];

export const DEMO_USERS: Record<Role, UserProfile> = {
  warga: {
    uid: 'demo-warga-uid',
    email: 'warga.bismo@belikhub.id',
    name: 'Pak Budi Santoso',
    roles: ['warga'],
    role: 'user',
    points: 150,
    springId: 'SPR-001',
    residentId: 'RES-001',
    residentLinkStatus: 'linked',
    phone: '081234567801'
  },
  pengelola: {
    uid: 'demo-pengelola-uid',
    email: 'denny.pengelola@belikhub.id',
    name: 'Denny (Pengelola Tuk Bismo)',
    roles: ['pengelola', 'warga'],
    role: 'user',
    points: 450,
    managedSpringIds: ['SPR-001', 'SPR-002'],
    springId: 'SPR-001',
    residentId: 'RES-001',
    residentLinkStatus: 'linked',
    phone: '081234567802'
  },
  relawan: {
    uid: 'demo-relawan-uid',
    email: 'rina.relawan@belikhub.id',
    name: 'Rina Kartika (Relawan Batang)',
    roles: ['relawan'],
    role: 'user',
    points: 600,
    phone: '081234567803'
  },
  donatur: {
    uid: 'demo-donatur-uid',
    email: 'donatur.batang@belikhub.id',
    name: 'PT Tirta Lestari Nusantara',
    roles: ['donatur'],
    role: 'user',
    points: 1200,
    donorType: 'organization',
    organizationName: 'PT Tirta Lestari Nusantara',
    phone: '081234567804'
  },
  admin: {
    uid: 'demo-admin-uid',
    email: 'admin@belikhub.id',
    name: 'Admin BelikHub',
    roles: ['admin', 'pengelola', 'warga', 'relawan', 'donatur'],
    role: 'admin',
    points: 2500,
    managedSpringIds: ['SPR-001', 'SPR-002', 'SPR-003', 'SPR-004'],
    springId: 'SPR-001',
    residentId: 'RES-001',
    residentLinkStatus: 'linked',
    phone: '081234567800'
  }
};

export class DemoStore {
  private activeRole: Role = 'warga';
  private springs: SpringPublic[] = [];
  private springSettings: Map<string, SpringSettings> = new Map();
  private residents: Resident[] = [];
  private pendingUsers: PendingUser[] = [];
  private retributionBills: RetributionBill[] = [];
  private campaigns: RevitalizationCampaign[] = [];
  private campaignUpdates: RevitalizationUpdate[] = [];
  private donations: Donation[] = [];
  private reports: FieldReport[] = [];
  private users: UserProfile[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.activeRole = 'warga';
    this.springs = JSON.parse(JSON.stringify(BASELINE_SPRINGS));
    this.users = Object.values(DEMO_USERS).map((u) => JSON.parse(JSON.stringify(u)));

    // Settings
    this.springSettings.clear();
    this.springSettings.set('SPR-001', {
      springId: 'SPR-001',
      defaultMonthlyFee: 15000,
      paymentInstructions: 'Transfer ke Rekening Bank Jateng 2-045-12345-6 a/n Paguyuban Bismo Asri atau bayar tunai ke Pak Denny.',
      qrisImagePath: 'uploads/qris_image/qris-spr-001.png',
      qrisReadUrl: 'https://images.unsplash.com/photo-1595079672139-568a0420bbe0?w=600&auto=format&fit=crop&q=80',
      isFallback: false,
      updatedAt: '2026-11-01T08:00:00Z'
    });
    this.springSettings.set('SPR-002', {
      springId: 'SPR-002',
      defaultMonthlyFee: 10000,
      paymentInstructions: 'Setor tunai ke BUMDes Wonomerto atau transfer ke BRI 3044-01-002345-53-1.',
      qrisImagePath: null,
      qrisReadUrl: null,
      isFallback: false,
      updatedAt: '2026-11-01T08:00:00Z'
    });

    // Residents
    this.residents = [
      {
        id: 'RES-001',
        springId: 'SPR-001',
        name: 'Pak Budi Santoso',
        phone: '081234567801',
        kkLabel: 'RT 02 / RW 01',
        monthlyFee: 15000,
        userId: 'demo-warga-uid',
        active: true,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 'RES-002',
        springId: 'SPR-001',
        name: 'Ibu Siti Aminah',
        phone: '081234567812',
        kkLabel: 'RT 01 / RW 01',
        monthlyFee: 15000,
        userId: null,
        linkCode: 'ABCDEF',
        linkCodeExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        active: true,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 'RES-003',
        springId: 'SPR-001',
        name: 'Pak Joko Widodo (Warga Bismo)',
        phone: '081234567813',
        kkLabel: 'RT 03 / RW 01',
        monthlyFee: 15000,
        userId: null,
        active: true,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 'RES-004',
        springId: 'SPR-002',
        name: 'Pak Ahmad Fauzi',
        phone: '081234567824',
        kkLabel: 'RT 01 / RW 02',
        monthlyFee: 10000,
        userId: null,
        active: true,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }
    ];

    // Pending link requests
    this.pendingUsers = [
      {
        uid: 'user-pending-001',
        id: 'user-pending-001',
        name: 'Agus Priyono',
        email: 'agus.bismo@gmail.com',
        phone: '081234567899',
        springId: 'SPR-001',
        residentLinkStatus: 'pending',
        createdAt: '2026-11-10T14:30:00Z'
      }
    ];

    // Bills
    this.retributionBills = [
      {
        id: 'SPR-001_RES-001_2026-11',
        springId: 'SPR-001',
        residentId: 'RES-001',
        residentName: 'Pak Budi Santoso',
        userId: 'demo-warga-uid',
        period: '2026-11',
        amount: 15000,
        status: 'unpaid',
        paymentMethod: null,
        proofPath: null,
        proofUrl: null,
        rejectionReason: null,
        paidAt: null,
        verifiedByUid: null,
        recordedByUid: null,
        generatedByUid: 'demo-pengelola-uid',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z'
      },
      {
        id: 'SPR-001_RES-002_2026-11',
        springId: 'SPR-001',
        residentId: 'RES-002',
        residentName: 'Ibu Siti Aminah',
        userId: null,
        period: '2026-11',
        amount: 15000,
        status: 'paid',
        paymentMethod: 'cash',
        proofPath: null,
        paidAt: '2026-11-04T10:15:00Z',
        recordedByUid: 'demo-pengelola-uid',
        generatedByUid: 'demo-pengelola-uid',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-04T10:15:00Z'
      },
      {
        id: 'SPR-001_RES-003_2026-11',
        springId: 'SPR-001',
        residentId: 'RES-003',
        residentName: 'Pak Joko Widodo (Warga Bismo)',
        userId: null,
        period: '2026-11',
        amount: 15000,
        status: 'pending_verification',
        paymentMethod: 'transfer',
        proofPath: 'uploads/retribution_proof/demo-res003.jpg',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        paidAt: null,
        generatedByUid: 'demo-pengelola-uid',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-05T09:30:00Z'
      },
      {
        id: 'SPR-001_RES-001_2026-10',
        springId: 'SPR-001',
        residentId: 'RES-001',
        residentName: 'Pak Budi Santoso',
        userId: 'demo-warga-uid',
        period: '2026-10',
        amount: 15000,
        status: 'paid',
        paymentMethod: 'transfer',
        proofPath: 'uploads/retribution_proof/demo-oct.jpg',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        paidAt: '2026-10-05T14:20:00Z',
        verifiedByUid: 'demo-pengelola-uid',
        generatedByUid: 'demo-pengelola-uid',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-05T14:20:00Z'
      }
    ];

    // Campaigns
    this.campaigns = [
      {
        id: 'CAM-001',
        springId: 'SPR-001',
        springName: 'Tuk Bismo',
        title: 'Restorasi Hulu Tuk Bismo & Parit Resapan Rorak',
        description: 'Pembangunan 50 parit resapan rorak dan reboisasi 1.000 bibit pohon aren di daerah tangkapan air Tuk Bismo guna menjaga kontinuitas debit air baku.',
        targetAmount: 50000000,
        collectedAmount: 32500000,
        progressPercent: 65,
        paymentInstructions: 'Donasi disalurkan via rekening Bank Mandiri BelikHub 137-00-1928374-1 a/n Yayasan BelikHub Konservasi.',
        qrisImagePath: 'uploads/qris_image/qris-donasi.png',
        qrisReadUrl: 'https://images.unsplash.com/photo-1595079672139-568a0420bbe0?w=600&auto=format&fit=crop&q=80',
        status: 'active',
        createdByUid: 'demo-admin-uid',
        createdAt: '2026-09-15T00:00:00Z',
        updatedAt: '2026-11-05T00:00:00Z'
      },
      {
        id: 'CAM-002',
        springId: 'SPR-002',
        springName: 'Mata Air Wonomerto',
        title: 'Revitalisasi Pipa Distribusi & Perlindungan Mata Air Wonomerto',
        description: 'Perbaikan 400m pipa transmisi HDPE dan penguatan dinding broncaptering mata air agar air bersih kembali teralirkan ke 65 KK pasca kekeringan.',
        targetAmount: 25000000,
        collectedAmount: 14000000,
        progressPercent: 45,
        paymentInstructions: 'Donasi via BRI BelikHub Batang 0145-01-000987-50-8.',
        qrisImagePath: null,
        status: 'active',
        createdByUid: 'demo-admin-uid',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z'
      }
    ];

    // Campaign Updates
    this.campaignUpdates = [
      {
        id: 'UPD-001',
        campaignId: 'CAM-001',
        springId: 'SPR-001',
        authorUid: 'demo-pengelola-uid',
        authorName: 'Denny (Pengelola Tuk Bismo)',
        authorRole: 'pengelola',
        title: 'Pembangunan 30 Rorak Tahap I Selesai',
        notes: 'Alhamdulillah 30 rorak parit resapan telah selesai digali bersama warga dan relawan. Limpasan hujan kini langsung masuk ke tanah.',
        progressPercent: 50,
        spentAmount: 12000000,
        photoPath: 'uploads/revitalization_photo/demo-rorak-1.jpg',
        photoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-10-18T10:00:00Z'
      },
      {
        id: 'UPD-002',
        campaignId: 'CAM-001',
        springId: 'SPR-001',
        authorUid: 'demo-pengelola-uid',
        authorName: 'Denny (Pengelola Tuk Bismo)',
        authorRole: 'pengelola',
        title: 'Penanaman 500 Bibit Pohon Aren & Beringin',
        notes: 'Bibit pohon konservasi telah ditanam di sempadan mata air radius 200m untuk memperkuat resapan air jangka panjang.',
        progressPercent: 65,
        spentAmount: 8500000,
        photoPath: 'uploads/revitalization_photo/demo-pohon-1.jpg',
        photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
        createdAt: '2026-11-05T14:30:00Z'
      }
    ];

    // Donations
    this.donations = [
      {
        id: 'DON-001',
        campaignId: 'CAM-001',
        campaignTitle: 'Restorasi Hulu Tuk Bismo & Parit Resapan Rorak',
        springId: 'SPR-001',
        springName: 'Tuk Bismo',
        donorUid: 'demo-donatur-uid',
        donorName: 'PT Tirta Lestari Nusantara',
        donorEmail: 'donatur.batang@belikhub.id',
        donorType: 'organization',
        organizationName: 'PT Tirta Lestari Nusantara',
        isAnonymous: false,
        amount: 15000000,
        paymentMethod: 'transfer',
        proofPath: 'uploads/donation_proof/demo-don-001.jpg',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        status: 'verified',
        verifiedByUid: 'demo-admin-uid',
        verifiedAt: '2026-10-12T11:00:00Z',
        createdAt: '2026-10-12T09:00:00Z',
        updatedAt: '2026-10-12T11:00:00Z'
      },
      {
        id: 'DON-002',
        campaignId: 'CAM-001',
        campaignTitle: 'Restorasi Hulu Tuk Bismo & Parit Resapan Rorak',
        springId: 'SPR-001',
        springName: 'Tuk Bismo',
        donorUid: 'demo-warga-uid',
        donorName: 'Pak Budi Santoso',
        donorEmail: 'warga.bismo@belikhub.id',
        donorType: 'individual',
        isAnonymous: true,
        amount: 500000,
        paymentMethod: 'qris',
        proofPath: 'uploads/donation_proof/demo-don-002.jpg',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        status: 'pending_verification',
        createdAt: '2026-11-12T08:00:00Z',
        updatedAt: '2026-11-12T08:00:00Z'
      }
    ];

    // Reports
    this.reports = [
      {
        id: 'REP-001',
        reportType: 'Restorasi Mata Air',
        location: 'Sempadan Mata Air Tuk Bismo, Blok Curug',
        notes: 'Pembersihan sedimentasi lumpur di kolam apron spring box dan penanaman 20 pohon vetiver di bibir tebing.',
        photoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
        status: 'approved',
        createdAt: '2026-11-02T10:00:00Z',
        lat: -7.0831,
        lng: 109.7164,
        authorName: 'Rina Kartika (Relawan Batang)',
        authorEmail: 'rina.relawan@belikhub.id',
        points: 1000
      },
      {
        id: 'REP-002',
        reportType: 'Pembangunan Rorak',
        location: 'Perkebunan Kopi Lereng Atas Tuk Watulumbung',
        notes: 'Pembuatan 10 unit parit rorak penampung air limpasan hujan dengan dimensi 2m x 0.5m x 0.6m.',
        photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
        status: 'pending',
        createdAt: '2026-11-14T11:20:00Z',
        lat: -7.1125,
        lng: 109.8232,
        authorName: 'Rina Kartika (Relawan Batang)',
        authorEmail: 'rina.relawan@belikhub.id',
        points: 500
      }
    ];
  }

  // Demo user management
  public setActiveDemoRole(role: Role): void {
    this.activeRole = role;
  }

  public getActiveRole(): Role {
    return this.activeRole;
  }

  public getDemoUser(role: Role): UserProfile {
    return this.users.find((u) => u.roles.includes(role)) || DEMO_USERS[role];
  }

  public getActiveDemoUser(): UserProfile {
    return this.getDemoUser(this.activeRole);
  }

  // BelikHubClient implementation
  public async getMe(): Promise<UserProfile> {
    return this.getActiveDemoUser();
  }

  public async onboarding(data: {
    role: Role;
    name?: string;
    phone?: string;
    springId?: string;
    linkCode?: string;
    donorType?: DonorType;
    organizationName?: string;
  }): Promise<{ success: boolean; user: UserProfile }> {
    const user = this.getActiveDemoUser();
    if (!user.roles.includes(data.role)) {
      user.roles.push(data.role);
    }
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.springId) user.springId = data.springId;
    if (data.donorType) user.donorType = data.donorType;
    if (data.organizationName) user.organizationName = data.organizationName;

    if (data.role === 'warga' && data.linkCode) {
      const match = this.residents.find((r) => r.linkCode?.toUpperCase() === data.linkCode?.toUpperCase().trim());
      if (match) {
        match.userId = user.uid;
        match.linkCode = null;
        user.residentId = match.id;
        user.residentLinkStatus = 'linked';
      }
    }

    this.activeRole = data.role;
    return { success: true, user };
  }

  public async updateProfile(data: {
    name?: string;
    phone?: string;
    donorType?: DonorType;
    organizationName?: string;
    springId?: string;
    linkCode?: string;
  }): Promise<{ success: boolean; user: UserProfile }> {
    const user = this.getActiveDemoUser();
    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.donorType !== undefined) user.donorType = data.donorType;
    if (data.organizationName !== undefined) user.organizationName = data.organizationName;
    if (data.springId !== undefined) user.springId = data.springId;

    if (data.linkCode) {
      const match = this.residents.find((r) => r.linkCode?.toUpperCase() === data.linkCode?.toUpperCase().trim());
      if (match) {
        match.userId = user.uid;
        match.linkCode = null;
        user.residentId = match.id;
        user.residentLinkStatus = 'linked';
      }
    }

    return { success: true, user };
  }

  public async uploadImage(
    purpose: UploadPurpose,
    base64Data: string,
    mimeType = 'image/jpeg'
  ): Promise<{ objectPath: string; readUrl: string }> {
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const objectPath = `uploads/${purpose}/demo_${Date.now()}.${ext}`;
    const readUrl = `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80`;
    return { objectPath, readUrl };
  }

  public async listSprings(): Promise<{ metrics: SpringMetrics; source: string; springs: SpringPublic[] }> {
    return {
      metrics: BASELINE_METRICS,
      source: 'demo_store',
      springs: JSON.parse(JSON.stringify(this.springs))
    };
  }

  public async createSpring(data: Partial<SpringPublic> & { seedBaseline?: boolean }): Promise<{
    success: boolean;
    spring?: SpringPublic;
    message?: string;
  }> {
    if (data.seedBaseline) {
      return { success: true, message: `Loaded ${BASELINE_SPRINGS.length} baseline springs` };
    }
    const newSpring: SpringPublic = {
      id: data.id || `SPR-${String(this.springs.length + 1).padStart(3, '0')}`,
      name: data.name || 'Mata Air Baru',
      village: data.village || 'Desa Bismo',
      district: data.district || 'Kecamatan Blado',
      regency: data.regency || 'Kabupaten Batang',
      status: data.status || 'active',
      uptime_percentage: data.uptime_percentage || 90.0,
      baseline_discharge_lps: data.baseline_discharge_lps || 10.0,
      coordinates_public: data.coordinates_public || { lat: -7.08, lng: 109.72, is_grid_snapped: true }
    };
    this.springs.push(newSpring);
    return { success: true, spring: newSpring };
  }

  public async updateSpring(id: string, updates: Partial<SpringPublic>): Promise<{ success: boolean; spring: SpringPublic }> {
    const idx = this.springs.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Mata air dengan ID ${id} tidak ditemukan`);
    this.springs[idx] = { ...this.springs[idx], ...updates, id };
    return { success: true, spring: this.springs[idx] };
  }

  public async getSpringSettings(springId: string): Promise<SpringSettings> {
    const existing = this.springSettings.get(springId);
    if (existing) return existing;
    return {
      springId,
      defaultMonthlyFee: 15000,
      paymentInstructions: 'Hubungi pengelola setempat untuk pembayaran retribusi air.',
      qrisImagePath: null,
      qrisReadUrl: null,
      isFallback: true
    };
  }

  public async putSpringSettings(
    springId: string,
    settings: { defaultMonthlyFee: number; paymentInstructions: string; qrisImagePath?: string | null }
  ): Promise<{ success: boolean; settings: SpringSettings }> {
    const updated: SpringSettings = {
      springId,
      defaultMonthlyFee: settings.defaultMonthlyFee,
      paymentInstructions: settings.paymentInstructions,
      qrisImagePath: settings.qrisImagePath || null,
      qrisReadUrl: settings.qrisImagePath ? 'https://images.unsplash.com/photo-1595079672139-568a0420bbe0?w=600' : null,
      isFallback: false,
      updatedAt: new Date().toISOString()
    };
    this.springSettings.set(springId, updated);
    return { success: true, settings: updated };
  }

  public async listResidents(springId?: string): Promise<{
    success: boolean;
    residents: Resident[];
    pendingUsers: PendingUser[];
    pendingLinkRequests: PendingUser[];
  }> {
    let list = this.residents;
    if (springId) {
      list = list.filter((r) => r.springId === springId);
    }
    return {
      success: true,
      residents: JSON.parse(JSON.stringify(list)),
      pendingUsers: JSON.parse(JSON.stringify(this.pendingUsers)),
      pendingLinkRequests: JSON.parse(JSON.stringify(this.pendingUsers))
    };
  }

  public async createResident(data: {
    springId: string;
    name: string;
    phone: string;
    monthlyFee: number;
  }): Promise<{ success: boolean; resident: Resident }> {
    const newResident: Resident = {
      id: `RES-${String(this.residents.length + 1).padStart(3, '0')}`,
      springId: data.springId,
      name: data.name,
      phone: data.phone,
      monthlyFee: data.monthlyFee,
      userId: null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.residents.push(newResident);
    return { success: true, resident: newResident };
  }

  public async updateResident(id: string, updates: Partial<Resident>): Promise<{ success: boolean; resident: Resident }> {
    const idx = this.residents.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Data warga ${id} tidak ditemukan`);
    this.residents[idx] = { ...this.residents[idx], ...updates, id, updatedAt: new Date().toISOString() };
    return { success: true, resident: this.residents[idx] };
  }

  public async generateLinkCode(
    residentId: string
  ): Promise<{ success: boolean; linkCode: string; linkCodeExpiresAt: string; residentId: string }> {
    const resident = this.residents.find((r) => r.id === residentId);
    if (!resident) throw new Error('Data warga tidak ditemukan');
    const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const linkCodeExpiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    resident.linkCode = linkCode;
    resident.linkCodeExpiresAt = linkCodeExpiresAt;
    return { success: true, linkCode, linkCodeExpiresAt, residentId };
  }

  public async approveLink(data: {
    userUid: string;
    residentId?: string;
    createResident?: { name: string; phone: string; monthlyFee: number };
  }): Promise<{ success: boolean; message: string; resident: Resident }> {
    let resident: Resident | undefined;
    if (data.residentId) {
      resident = this.residents.find((r) => r.id === data.residentId);
      if (!resident) throw new Error('Data warga tidak ditemukan');
      resident.userId = data.userUid;
    } else if (data.createResident) {
      const res = await this.createResident({
        springId: 'SPR-001',
        name: data.createResident.name,
        phone: data.createResident.phone,
        monthlyFee: data.createResident.monthlyFee
      });
      resident = res.resident;
      resident.userId = data.userUid;
    } else {
      throw new Error('Harus menyertakan residentId atau createResident');
    }

    this.pendingUsers = this.pendingUsers.filter((u) => u.uid !== data.userUid);
    return { success: true, message: 'Akun berhasil ditautkan', resident };
  }

  public async listRetributions(params?: {
    springId?: string;
    period?: string;
    status?: string;
    residentId?: string;
  }): Promise<{ success: boolean; bills: RetributionBill[]; summary: RetributionSummary }> {
    let filtered = [...this.retributionBills];
    if (params?.springId) filtered = filtered.filter((b) => b.springId === params.springId);
    if (params?.period) filtered = filtered.filter((b) => b.period === params.period);
    if (params?.status) filtered = filtered.filter((b) => b.status === params.status);
    if (params?.residentId) filtered = filtered.filter((b) => b.residentId === params.residentId);

    let totalBilled = 0;
    let totalPaid = 0;
    let totalCash = 0;
    let totalNonCash = 0;
    let unpaidCount = 0;
    let pendingCount = 0;
    let paidCount = 0;

    for (const b of filtered) {
      totalBilled += b.amount;
      if (b.status === 'paid') {
        totalPaid += b.amount;
        paidCount++;
        if (b.paymentMethod === 'cash') totalCash += b.amount;
        else totalNonCash += b.amount;
      } else if (b.status === 'pending_verification') {
        pendingCount++;
      } else if (b.status === 'unpaid') {
        unpaidCount++;
      }
    }

    return {
      success: true,
      bills: JSON.parse(JSON.stringify(filtered)),
      summary: {
        totalBilled,
        totalPaid,
        totalCash,
        totalNonCash,
        unpaidCount,
        pendingCount,
        paidCount
      }
    };
  }

  public async generateBills(data: {
    springId: string;
    period: string;
  }): Promise<{ success: boolean; createdCount: number; skippedCount: number; period: string; springId: string }> {
    const activeResidents = this.residents.filter((r) => r.springId === data.springId && r.active !== false);
    let createdCount = 0;
    let skippedCount = 0;

    for (const res of activeResidents) {
      const docId = `${data.springId}_${res.id}_${data.period}`;
      const existing = this.retributionBills.find((b) => b.id === docId);
      if (existing) {
        skippedCount++;
      } else {
        const newBill: RetributionBill = {
          id: docId,
          springId: data.springId,
          residentId: res.id,
          residentName: res.name,
          userId: res.userId,
          period: data.period,
          amount: res.monthlyFee,
          status: 'unpaid',
          paymentMethod: null,
          proofPath: null,
          paidAt: null,
          generatedByUid: this.getActiveDemoUser().uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.retributionBills.push(newBill);
        createdCount++;
      }
    }

    return {
      success: true,
      createdCount,
      skippedCount,
      period: data.period,
      springId: data.springId
    };
  }

  public async submitRetributionProof(
    billId: string,
    data: { proofPath: string; paymentMethod?: PaymentMethod }
  ): Promise<{ success: boolean; bill: RetributionBill }> {
    const bill = this.retributionBills.find((b) => b.id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    bill.status = 'pending_verification';
    bill.proofPath = data.proofPath;
    bill.proofUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600';
    bill.paymentMethod = data.paymentMethod || 'transfer';
    bill.updatedAt = new Date().toISOString();
    return { success: true, bill };
  }

  public async recordCash(billId: string): Promise<{ success: boolean; bill: RetributionBill }> {
    return this.recordCashRetribution(billId);
  }

  public async recordCashRetribution(billId: string): Promise<{ success: boolean; bill: RetributionBill }> {
    const bill = this.retributionBills.find((b) => b.id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    bill.status = 'paid';
    bill.paymentMethod = 'cash';
    bill.paidAt = new Date().toISOString();
    bill.recordedByUid = this.getActiveDemoUser().uid;
    bill.updatedAt = new Date().toISOString();
    return { success: true, bill };
  }

  public async verifyRetribution(
    billId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<{ success: boolean; bill: RetributionBill }> {
    const bill = this.retributionBills.find((b) => b.id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (action === 'approve') {
      bill.status = 'paid';
      bill.paidAt = new Date().toISOString();
      bill.verifiedByUid = this.getActiveDemoUser().uid;
    } else {
      bill.status = 'rejected';
      bill.rejectionReason = rejectionReason || 'Bukti transfer tidak terbaca';
    }
    bill.updatedAt = new Date().toISOString();
    return { success: true, bill };
  }

  public async listCampaigns(params?: {
    status?: string;
    springId?: string;
  }): Promise<{ success: boolean; campaigns: RevitalizationCampaign[] }> {
    let list = this.campaigns;
    if (params?.status) list = list.filter((c) => c.status === params.status);
    if (params?.springId) list = list.filter((c) => c.springId === params.springId);
    return { success: true, campaigns: JSON.parse(JSON.stringify(list)) };
  }

  public async getCampaign(id: string): Promise<{ success: boolean; campaign: RevitalizationCampaign }> {
    const campaign = this.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error('Program revitalisasi tidak ditemukan');
    const updates = this.campaignUpdates.filter((u) => u.campaignId === id);
    return {
      success: true,
      campaign: {
        ...JSON.parse(JSON.stringify(campaign)),
        updates: JSON.parse(JSON.stringify(updates))
      }
    };
  }

  public async createCampaign(data: {
    springId: string;
    title: string;
    description: string;
    targetAmount: number;
    paymentInstructions: string;
    qrisImagePath?: string | null;
  }): Promise<{ success: boolean; campaign: RevitalizationCampaign }> {
    const spring = this.springs.find((s) => s.id === data.springId);
    const newCampaign: RevitalizationCampaign = {
      id: `CAM-${String(this.campaigns.length + 1).padStart(3, '0')}`,
      springId: data.springId,
      springName: spring?.name || 'Mata Air',
      title: data.title,
      description: data.description,
      targetAmount: data.targetAmount,
      collectedAmount: 0,
      progressPercent: 0,
      paymentInstructions: data.paymentInstructions,
      qrisImagePath: data.qrisImagePath || null,
      status: 'active',
      createdByUid: this.getActiveDemoUser().uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.campaigns.push(newCampaign);
    return { success: true, campaign: newCampaign };
  }

  public async updateCampaign(
    id: string,
    updates: Partial<RevitalizationCampaign>
  ): Promise<{ success: boolean; campaign: RevitalizationCampaign }> {
    const idx = this.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Program revitalisasi tidak ditemukan');
    this.campaigns[idx] = { ...this.campaigns[idx], ...updates, id, updatedAt: new Date().toISOString() };
    return { success: true, campaign: this.campaigns[idx] };
  }

  public async createCampaignUpdate(
    campaignId: string,
    data: {
      title: string;
      notes?: string;
      progressPercent: number;
      photoPath?: string | null;
      spentAmount?: number | null;
    }
  ): Promise<{ success: boolean; update: RevitalizationUpdate }> {
    const campaign = this.campaigns.find((c) => c.id === campaignId);
    if (!campaign) throw new Error('Program revitalisasi tidak ditemukan');

    const update: RevitalizationUpdate = {
      id: `UPD-${String(this.campaignUpdates.length + 1).padStart(3, '0')}`,
      campaignId,
      springId: campaign.springId,
      authorUid: this.getActiveDemoUser().uid,
      authorName: this.getActiveDemoUser().name || 'Pengelola',
      authorRole: this.activeRole,
      title: data.title,
      notes: data.notes || '',
      progressPercent: data.progressPercent,
      spentAmount: data.spentAmount || null,
      photoPath: data.photoPath || null,
      photoUrl: data.photoPath ? 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600' : null,
      createdAt: new Date().toISOString()
    };

    this.campaignUpdates.unshift(update);
    campaign.progressPercent = data.progressPercent;
    campaign.updatedAt = new Date().toISOString();

    return { success: true, update };
  }

  public async listDonations(params?: { campaignId?: string }): Promise<{ success: boolean; donations: Donation[] }> {
    let list = this.donations;
    if (this.activeRole === 'donatur') {
      const user = this.getActiveDemoUser();
      list = list.filter((d) => d.donorUid === user.uid);
    }
    if (params?.campaignId) {
      list = list.filter((d) => d.campaignId === params.campaignId);
    }
    return { success: true, donations: JSON.parse(JSON.stringify(list)) };
  }

  public async createDonation(data: {
    campaignId: string;
    amount: number;
    donorType?: DonorType;
    organizationName?: string;
    isAnonymous?: boolean;
    paymentMethod?: string;
    proofPath?: string;
  }): Promise<{ success: boolean; donation: Donation }> {
    const campaign = this.campaigns.find((c) => c.id === data.campaignId);
    if (!campaign) throw new Error('Program revitalisasi tidak ditemukan');
    const user = this.getActiveDemoUser();

    const newDonation: Donation = {
      id: `DON-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campaignId: data.campaignId,
      campaignTitle: campaign.title,
      springId: campaign.springId,
      springName: campaign.springName,
      donorUid: user.uid,
      donorName: user.name || 'Donatur',
      donorEmail: user.email,
      donorType: data.donorType || 'individual',
      organizationName: data.organizationName || null,
      isAnonymous: Boolean(data.isAnonymous),
      amount: data.amount,
      paymentMethod: data.paymentMethod || 'transfer',
      proofPath: data.proofPath || null,
      proofUrl: data.proofPath ? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600' : null,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.donations.unshift(newDonation);
    return { success: true, donation: newDonation };
  }

  public async verifyDonation(
    id: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<{ success: boolean; donation: Donation }> {
    const donation = this.donations.find((d) => d.id === id);
    if (!donation) throw new Error('Donasi tidak ditemukan');

    if (donation.status !== 'pending_verification') {
      const err: any = new Error(
        `409: Donasi sudah diproses sebelumnya (status: ${donation.status}). Approval kedua tidak diizinkan.`
      );
      err.status = 409;
      throw err;
    }

    if (action === 'approve') {
      donation.status = 'verified';
      donation.verifiedByUid = this.getActiveDemoUser().uid;
      donation.verifiedAt = new Date().toISOString();

      const campaign = this.campaigns.find((c) => c.id === donation.campaignId);
      if (campaign) {
        campaign.collectedAmount += donation.amount;
      }
    } else {
      donation.status = 'rejected';
      donation.rejectionReason = rejectionReason || 'Bukti transfer tidak valid';
    }

    donation.updatedAt = new Date().toISOString();
    return { success: true, donation };
  }

  public async listMyReports(): Promise<{ reports: FieldReport[]; total: number }> {
    const user = this.getActiveDemoUser();
    const my = this.reports.filter((r) => r.authorEmail === user.email || r.authorName?.includes(user.name || ''));
    return { reports: JSON.parse(JSON.stringify(my)), total: my.length };
  }

  public async listAllReports(params?: { status?: string; limit?: number }): Promise<{ reports: FieldReport[]; total: number }> {
    let list = this.reports;
    if (params?.status) list = list.filter((r) => r.status === params.status);
    return { reports: JSON.parse(JSON.stringify(list)), total: list.length };
  }

  public async createReport(data: {
    reportType: ReportType;
    location: string;
    notes: string;
    lat?: number;
    lng?: number;
    photoPath?: string;
    photoUrl?: string;
  }): Promise<{ success: boolean; id: string; points: number }> {
    const user = this.getActiveDemoUser();
    const pts = data.reportType.includes('Restor') ? 1000 : data.reportType.includes('Rorak') ? 500 : 100;
    const newReport: FieldReport = {
      id: `REP-${String(this.reports.length + 1).padStart(3, '0')}`,
      reportType: data.reportType,
      location: data.location,
      notes: data.notes,
      lat: data.lat || -7.083,
      lng: data.lng || 109.716,
      photoUrl: data.photoUrl || (data.photoPath ? 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600' : null),
      photoPath: data.photoPath || null,
      status: 'pending',
      authorName: user.name || 'Relawan',
      authorEmail: user.email || undefined,
      points: pts,
      createdAt: new Date().toISOString()
    };
    this.reports.unshift(newReport);
    return { success: true, id: newReport.id, points: pts };
  }

  public async updateReportStatus(id: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; status: string }> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) throw new Error('Laporan tidak ditemukan');
    report.status = status;
    return { success: true, status };
  }

  public async listAdminUsers(): Promise<{ success: boolean; users: AdminUser[] }> {
    const adminUsers: AdminUser[] = this.users.map((u) => ({
      uid: u.uid,
      id: u.uid,
      email: u.email,
      name: u.name,
      phone: u.phone || null,
      roles: u.roles,
      managedSpringIds: u.managedSpringIds || [],
      springId: u.springId || null,
      residentId: u.residentId || null,
      residentLinkStatus: u.residentLinkStatus || null,
      donorType: u.donorType || null,
      organizationName: u.organizationName || null,
      points: u.points || 0,
      createdAt: u.createdAt || null,
      updatedAt: null
    }));
    return { success: true, users: adminUsers };
  }

  public async setAdminUserRoles(
    uid: string,
    data: { roles: Role[]; managedSpringIds?: string[] }
  ): Promise<{ success: boolean; user: { uid: string; roles: Role[]; managedSpringIds?: string[] } }> {
    const user = this.users.find((u) => u.uid === uid);
    if (user) {
      user.roles = data.roles;
      if (data.managedSpringIds) user.managedSpringIds = data.managedSpringIds;
    }
    return {
      success: true,
      user: {
        uid,
        roles: data.roles,
        managedSpringIds: data.managedSpringIds
      }
    };
  }

  public async getSummary(role?: Role): Promise<{ success: boolean; summary: RoleSummary }> {
    const targetRole = role || this.activeRole;
    const nowIso = new Date().toISOString();
    const period = nowIso.slice(0, 7);

    // Compute retribution stats
    let totalBilled = 0;
    let totalCollected = 0;
    let totalCashCollected = 0;
    let totalNonCashCollected = 0;
    let unpaidCount = 0;
    let pendingProofCount = 0;
    let paidCount = 0;

    for (const b of this.retributionBills) {
      totalBilled += b.amount;
      if (b.status === 'paid') {
        totalCollected += b.amount;
        paidCount++;
        if (b.paymentMethod === 'cash') totalCashCollected += b.amount;
        else totalNonCashCollected += b.amount;
      } else if (b.status === 'pending_verification') {
        pendingProofCount++;
      } else if (b.status === 'unpaid') {
        unpaidCount++;
      }
    }

    const totalSprings = this.springs.length;
    const totalCampaigns = this.campaigns.length;
    let totalTargetAmount = 0;
    let totalCollectedAmount = 0;
    for (const c of this.campaigns) {
      totalTargetAmount += c.targetAmount;
      totalCollectedAmount += c.collectedAmount;
    }

    const pendingDonations = this.donations.filter((d) => d.status === 'pending_verification').length;
    const pendingRetributions = this.retributionBills.filter((b) => b.status === 'pending_verification').length;
    const pendingReports = this.reports.filter((r) => r.status === 'pending').length;
    const unlinkedResidents = this.residents.filter((r) => r.userId == null).length;

    const baseSummary: RoleSummary = {
      role: targetRole,
      period,
      stats: {
        totalBilled,
        totalCollected,
        totalCashCollected,
        totalNonCashCollected,
        unpaidCount,
        pendingProofCount,
        paidCount,
        totalSprings,
        totalCampaigns,
        totalTargetAmount,
        totalCollectedAmount,
        totalCollectedDonations: totalCollectedAmount,
        totalReports: this.reports.length,
        approvedReports: this.reports.filter((r) => r.status === 'approved').length,
        pendingReports,
        myTotalDonated: 15500000,
        myVerifiedDonationsCount: 1,
        points: this.getActiveDemoUser().points
      },
      pendingQueues: {
        pendingDonations,
        pendingRetributions,
        pendingReports,
        unlinkedResidents
      },
      villageTransparency: {
        springId: 'SPR-001',
        springName: 'Tuk Bismo',
        period,
        totalPaidResidents: paidCount,
        totalActiveResidents: this.residents.filter((r) => r.springId === 'SPR-001').length,
        totalCollectedThisMonth: totalCollected
      }
    };

    if (targetRole === 'warga') {
      const myBill = this.retributionBills.find((b) => b.residentId === 'RES-001' && b.period === '2026-11');
      baseSummary.bill = myBill || null;
      baseSummary.unpaidCount = myBill && myBill.status === 'unpaid' ? 1 : 0;
      baseSummary.activeSpring = this.springs[0];
      baseSummary.latestRevitalization = this.campaigns[0];
    }

    return { success: true, summary: baseSummary };
  }
}

export const demoStore = new DemoStore();

export function createDemoStore(): DemoStore {
  return new DemoStore();
}
