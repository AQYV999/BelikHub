// mobile/app/(tabs)/secondary.tsx
// Second tab dynamically routed by activeRole: Warga Mata Air, Relawan Lapor, or Placeholder

import React from 'react';
import { useAuth } from '../../src/auth/AuthProvider';
import { getTabsForRole } from '../../src/navigation/roleTabs';
import { WargaSpringScreen } from '../../src/features/warga/WargaSpringScreen';
import { RelawanReportScreen } from '../../src/features/relawan/RelawanReportScreen';
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

  return (
    <PlaceholderTabScreen
      role={activeRole}
      tabTitle={tab1.title}
      tabIcon={tab1.icon}
    />
  );
}
