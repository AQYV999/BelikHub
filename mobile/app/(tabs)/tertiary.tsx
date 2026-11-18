// mobile/app/(tabs)/tertiary.tsx
// Third tab dynamically routed by activeRole: Warga Laporan/Community, Relawan Riwayat, Pengelola Revitalisasi, Donatur Detail, or Admin Kelola

import React from 'react';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { WargaHomeScreen } from '../../src/features/warga/WargaHomeScreen';
import { RelawanHistoryScreen } from '../../src/features/relawan/RelawanHistoryScreen';
import { PengelolaRevitalizationScreen } from '../../src/features/pengelola/PengelolaRevitalizationScreen';
import { DonaturCampaignDetailScreen } from '../../src/features/donatur/DonaturCampaignDetailScreen';
import { AdminManageScreen } from '../../src/features/admin/AdminManageScreen';
import { PlaceholderTabScreen } from '../../src/features/shared/PlaceholderTabScreen';

export default function TertiaryTabScreen() {
  const { activeRole } = useAuth();
  const tabs = getTabsForRole(activeRole);
  const tab2 = tabs[2] || { title: 'Ketiga', icon: 'grid-outline' };

  if (activeRole === 'warga') {
    return <WargaHomeScreen />;
  }

  if (activeRole === 'relawan') {
    return <RelawanHistoryScreen />;
  }

  if (activeRole === 'pengelola') {
    return <PengelolaRevitalizationScreen />;
  }

  if (activeRole === 'donatur') {
    return <DonaturCampaignDetailScreen />;
  }

  if (activeRole === 'admin') {
    return <AdminManageScreen />;
  }

  return (
    <PlaceholderTabScreen
      role={activeRole}
      tabTitle={tab2.title}
      tabIcon={tab2.icon}
    />
  );
}
