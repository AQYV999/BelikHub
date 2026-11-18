// mobile/src/features/shared/PlaceholderTabScreen.tsx
// Typed placeholder screen for Pengelola, Donatur, and Admin tabs completed in Task 8

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { Role } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';

export interface PlaceholderTabScreenProps {
  role: Role;
  tabTitle: string;
  tabIcon?: string;
}

export const PlaceholderTabScreen: React.FC<PlaceholderTabScreenProps> = ({
  role,
  tabTitle,
  tabIcon = 'construct-outline'
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { setActiveRole } = useAuth();

  const roleNameMap: Record<Role, string> = {
    pengelola: 'Pengelola Mata Air',
    donatur: 'Donatur & CSR',
    admin: 'Administrator',
    warga: 'Warga',
    relawan: 'Relawan'
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name={tabIcon as any} size={36} color={theme.accent} />
        </View>

        <View style={styles.badgeRow}>
          <Badge label={roleNameMap[role] || role} variant="accent" size="md" />
          <Badge label="Segera di Task 8" variant="warning" size="md" />
        </View>

        <Text style={[styles.title, { color: theme.ink }]}>{tabTitle}</Text>

        <Text style={[styles.description, { color: theme.muted }]}>
          Layar fitur untuk peran {roleNameMap[role]} sedang disiapkan dan akan diimplementasikan penuh pada Task 8.
          Saat ini alur lengkap untuk <Text style={{ fontWeight: 'bold' }}>Warga</Text> dan <Text style={{ fontWeight: 'bold' }}>Relawan</Text> sudah aktif!
        </Text>

        <View style={styles.quickSwitchBox}>
          <Text style={[styles.switchPrompt, { color: theme.muted }]}>
            Coba alur yang sudah aktif:
          </Text>
          <View style={styles.btnRow}>
            <Button
              title="Peran Warga"
              variant="outline"
              size="sm"
              onPress={() => setActiveRole('warga')}
              icon={<Ionicons name="water-outline" size={16} color={theme.accent} />}
            />
            <Button
              title="Peran Relawan"
              variant="outline"
              size="sm"
              onPress={() => setActiveRole('relawan')}
              icon={<Ionicons name="camera-outline" size={16} color={theme.accent} />}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    borderRadius: radius.xl,
    gap: spacing.md
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(13, 116, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display,
    textAlign: 'center'
  },
  description: {
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: typography.fontFamilies.text
  },
  quickSwitchBox: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)'
  },
  switchPrompt: {
    fontSize: typography.fontSizes.xs
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm
  }
});
