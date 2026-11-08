// lib/springs-seed.js
// Data baseline resmi BelikHub (RISPAM Kab. Batang 2022, Pergub Jateng No. 7/2026).
// Cadangan selama koleksi Firestore "springs" masih kosong.
// Aturan: bila dua sumber data bertabrakan, sumber pertama dipakai (tidak digabung).

export const METRICS = {
  total_springs: 88,
  total_potential_lps: 1350,
  beneficiaries_kk: 2500,
  uptime_target_pct: 95,
  sla_hours: 72,
  sla_target_pct: 80,
  gps_accuracy_m: 15,
  recession_limit_pct: 20
};

export const SPRINGS = [
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
    supply_target: '90% Air Baku PDAM Batang & Warga Desa',
    status: 'active',
    uptime_percentage: 98.2,
    treatment_needed: ['Sumur Resapan', 'Rorak', 'Perbaikan Apron Spring Box'],
    historical_impact: '200 sumur resapan & 2.000 pohon (2016-2017) terbukti menaikkan debit +9.57%',
    crisis_history: 'Banjir bandang & longsor Jan 2025 menimbun 5 bak penampung (kerugian PDAM Rp 1 M)',
    permit_quota_lps: 204 // PRIVAT: tidak ikut dikirim ke publik
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
    crisis_history: 'Kekeringan total Sep 2023 selama 12+ bulan (zero baseline), kini kembali mengalir'
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
    supply_target: 'Air Mineral & PDAM Batang',
    status: 'active',
    uptime_percentage: 96.0,
    treatment_needed: ['Konservasi Hulu Pegunungan Dieng', 'Sumur Resapan'],
    crisis_history: 'Kerusakan lereng hulu Pegunungan Dieng; debit turun sekitar 30%'
  }
];
