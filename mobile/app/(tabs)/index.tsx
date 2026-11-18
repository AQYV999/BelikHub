// mobile/app/(tabs)/index.tsx
// First tab dynamically routed by activeRole: Warga Retribusi, Relawan Home, or Placeholder

import React from 'react';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { WargaRetributionScreen } from '../../src/features/warga/WargaRetributionScreen';
import { RelawanHomeScreen } from '../../src/features/relawan/RelawanHomeScreen';
import { PlaceholderTabScreen } from '../../src/features/shared/PlaceholderTabScreen';

export default function IndexTabScreen() {
  const { activeRole } = useAuth();
  const tabs = getTabsForRole(activeRole);
  const tab0 = tabs[0] || { title: 'Beranda', icon: 'home-outline' };

  if (activeRole === 'warga') {
    return <WargaRetributionScreen />;
  }

  if (activeRole === 'relawan') {
    return <RelawanHomeScreen />;
  }

  return (
    <PlaceholderTabScreen
      role={activeRole}
      tabTitle={tab0.title}
      tabIcon={tab0.icon}
    />
  );
}
