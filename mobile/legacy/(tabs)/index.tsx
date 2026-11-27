// mobile/app/(tabs)/index.tsx
// First tab dynamically routed by activeRole: Warga Retribusi, Relawan Home, Pengelola Home, Donatur Explore, or Admin Home

import React from 'react';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { WargaHomeScreen } from '../../src/features/warga/WargaHomeScreen';
import { RelawanHomeScreen } from '../../src/features/relawan/RelawanHomeScreen';
import { PengelolaHomeScreen } from '../../src/features/pengelola/PengelolaHomeScreen';
import { DonaturExploreScreen } from '../../src/features/donatur/DonaturExploreScreen';
import { AdminHomeScreen } from '../../src/features/admin/AdminHomeScreen';
import { PlaceholderTabScreen } from '../../src/features/shared/PlaceholderTabScreen';

export default function IndexTabScreen() {
  const { activeRole } = useAuth();
  const tabs = getTabsForRole(activeRole);
  const tab0 = tabs[0] || { title: 'Beranda', icon: 'home-outline' };

  if (activeRole === 'warga') {
    return <WargaHomeScreen />;
  }

  if (activeRole === 'relawan') {
    return <RelawanHomeScreen />;
  }

  if (activeRole === 'pengelola') {
    return <PengelolaHomeScreen />;
  }

  if (activeRole === 'donatur') {
    return <DonaturExploreScreen />;
  }

  if (activeRole === 'admin') {
    return <AdminHomeScreen />;
  }

  return (
    <PlaceholderTabScreen
      role={activeRole}
      tabTitle={tab0.title}
      tabIcon={tab0.icon}
    />
  );
}
