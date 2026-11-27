// mobile/src/components/ui/DemoBanner.tsx
// Top banner explicitly marking Demo Mode with quick role switcher

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { Role } from '../../api/types';
import { colors, radius, typography, spacing } from '../../theme/tokens';
import { RoleSwitcher } from './RoleSwitcher';
import { PressableScale } from './PressableScale';

export const DemoBanner: React.FC = () => {
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;
  const { activeRole, setActiveRole, exitDemoMode } = useAuth();

  const allRoles: Role[] = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];

  return (
    <View
      testID="demo-banner"
      style={[styles.container, { backgroundColor: '#FDF0DC', borderColor: 'rgba(217,119,6,0.25)' }]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeLabel}>
          <Text style={styles.badgeText}>MODE DEMO</Text>
        </View>
        <Text style={[styles.title, { color: '#9A5200' }]}>
          Data lokal terisolasi
        </Text>
        <PressableScale onPress={exitDemoMode} haptic="medium" hitSlop={8} style={styles.exitBtn}>
          <Text style={styles.exitText}>Keluar</Text>
        </PressableScale>
      </View>

      <View style={styles.switcherRow}>
        <Text style={[styles.switchPrompt, { color: '#9A5200' }]}>
          Ganti Peran:
        </Text>
        <RoleSwitcher
          testID="role-switcher"
          roles={allRoles}
          activeRole={activeRole}
          onSelectRole={setActiveRole}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  badgeLabel: {
    backgroundColor: '#d97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs
  },
  badgeText: {
    fontFamily: typography.fontFamilies.mono,
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: '#ffffff'
  },
  title: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
    marginLeft: spacing.sm
  },
  exitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  exitText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    color: '#9A5200',
    fontWeight: typography.fontWeights.semibold
  },
  switcherRow: {
    marginTop: 4
  },
  switchPrompt: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    fontWeight: typography.fontWeights.medium,
    marginBottom: 2
  }
});
