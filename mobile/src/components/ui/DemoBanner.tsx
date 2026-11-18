// mobile/src/components/ui/DemoBanner.tsx
// Top banner explicitly marking Demo Mode with quick role switcher

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { Role } from '../../api/types';
import { colors, radius, typography, spacing } from '../../theme/tokens';
import { RoleSwitcher } from './RoleSwitcher';

export const DemoBanner: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { activeRole, setActiveRole, exitDemoMode } = useAuth();

  const allRoles: Role[] = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#451a03' : '#fffbeb', borderColor: '#f59e0b' }]}>
      <View style={styles.topRow}>
        <View style={styles.badgeLabel}>
          <Text style={styles.badgeText}>MODE DEMO</Text>
        </View>
        <Text style={[styles.title, { color: isDark ? '#fef3c7' : '#92400e' }]}>
          Data lokal terisolasi
        </Text>
        <TouchableOpacity
          onPress={exitDemoMode}
          activeOpacity={0.7}
          style={styles.exitBtn}
        >
          <Text style={styles.exitText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.switcherRow}>
        <Text style={[styles.switchPrompt, { color: isDark ? '#fde68a' : '#78350f' }]}>
          Ganti Peran:
        </Text>
        <RoleSwitcher
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
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
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  exitText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    color: '#d97706',
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
