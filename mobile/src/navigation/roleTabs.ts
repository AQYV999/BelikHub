// mobile/src/navigation/roleTabs.ts
// Pure TypeScript declarative tab definitions per role (ZERO React Native runtime imports)
// 3 role-specific tabs + 1 shared 'Profil' tab = 4 clean tabs per role

import { Role } from '../api/types';

export interface TabConfig {
  name: string;
  title: string;
  icon: string;
  href?: string;
}

export function getTabsForRole(role: Role): TabConfig[] {
  const profileTab: TabConfig = {
    name: 'profile',
    title: 'Profil',
    icon: 'person-outline'
  };

  switch (role) {
    case 'warga':
      return [
        {
          name: 'retribusi',
          title: 'Retribusi',
          icon: 'receipt-outline'
        },
        {
          name: 'mata-air',
          title: 'Mata Air',
          icon: 'water-outline'
        },
        {
          name: 'laporan',
          title: 'Laporan',
          icon: 'document-text-outline'
        },
        profileTab
      ];

    case 'pengelola':
      return [
        {
          name: 'beranda',
          title: 'Beranda',
          icon: 'home-outline'
        },
        {
          name: 'retribusi',
          title: 'Retribusi',
          icon: 'cash-outline'
        },
        {
          name: 'revitalisasi',
          title: 'Revitalisasi',
          icon: 'leaf-outline'
        },
        profileTab
      ];

    case 'relawan':
      return [
        {
          name: 'peta',
          title: 'Mata Air',
          icon: 'map-outline'
        },
        {
          name: 'lapor',
          title: 'Lapor',
          icon: 'camera-outline'
        },
        {
          name: 'riwayat',
          title: 'Riwayat',
          icon: 'time-outline'
        },
        profileTab
      ];

    case 'donatur':
      return [
        {
          name: 'program',
          title: 'Program',
          icon: 'heart-outline'
        },
        {
          name: 'donasi',
          title: 'Donasi Saya',
          icon: 'gift-outline'
        },
        {
          name: 'detail',
          title: 'Detail',
          icon: 'information-circle-outline'
        },
        profileTab
      ];

    case 'admin':
      return [
        {
          name: 'ringkasan',
          title: 'Ringkasan',
          icon: 'speedometer-outline'
        },
        {
          name: 'verifikasi',
          title: 'Verifikasi',
          icon: 'checkmark-circle-outline'
        },
        {
          name: 'kelola',
          title: 'Kelola',
          icon: 'shield-outline'
        },
        profileTab
      ];

    default:
      return [
        {
          name: 'beranda',
          title: 'Beranda',
          icon: 'home-outline'
        },
        {
          name: 'mata-air',
          title: 'Mata Air',
          icon: 'water-outline'
        },
        {
          name: 'laporan',
          title: 'Laporan',
          icon: 'document-text-outline'
        },
        profileTab
      ];
  }
}
