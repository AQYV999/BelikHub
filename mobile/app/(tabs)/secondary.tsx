// mobile/app/(tabs)/secondary.tsx
// Second tab dynamically routed by activeRole: Warga Mata Air, Relawan Lapor, Pengelola Retribusi, Donatur Riwayat, or Admin Verifikasi

import React from 'react';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { WargaSpringScreen } from '../../src/features/warga/WargaSpringScreen';
import { RelawanReportScreen } from '../../src/features/relawan/RelawanReportScreen';
import { PengelolaRetributionScreen } from '../../src/features/pengelola/PengelolaRetributionScreen';
import { DonaturHistoryScreen } from '../../src/features/donatur/DonaturHistoryScreen';
import { AdminVerificationScreen } from '../../src/features/admin/AdminVerificationScreen';
import { PlaceholderTabScreen } from '../../src/features/shared/PlaceholderTabScreen';

export default function SecondaryTabScreen() {
  const { activeRole } = useAuth();
  const tabs = getTabsForRole(activeRole);
  const tab1 = tabs[1] || { title: 'Kedua', icon: 'layers-outline' };

  if (activeRole === 'warga') {
    return <WargaSpringScreen />;
  }

  if (activeRole === 'relawan') {
    return <RelawanReportScreen />;
  }

  if (activeRole === 'pengelola') {
    return <PengelolaRetributionScreen />;
  }

  if (activeRole === 'donatur') {
    return <DonaturHistoryScreen />;
  }

  if (activeRole === 'admin') {
    return <AdminVerificationScreen />;
  }

  return (
    <PlaceholderTabScreen
      role={activeRole}
      tabTitle={tab1.title}
      tabIcon={tab1.icon}
    />
  );
}
