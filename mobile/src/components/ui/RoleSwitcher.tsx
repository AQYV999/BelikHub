// mobile/src/components/ui/RoleSwitcher.tsx
// Role switcher chip list allowing users to quickly switch perspectives

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
  useColorScheme
} from 'react-native';
import { Role } from '../../api/types';
import { colors, radius, typography, spacing } from '../../theme/tokens';

export interface RoleSwitcherProps {
  roles: Role[];
  activeRole: Role;
  onSelectRole: (role: Role) => void;
  style?: ViewStyle;
}

const ROLE_LABELS: Record<Role, string> = {
  warga: 'Warga',
  pengelola: 'Pengelola',
  relawan: 'Relawan',
  donatur: 'Donatur',
  admin: 'Admin'
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  roles,
  activeRole,
  onSelectRole,
  style
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {roles.map((r) => {
          const isActive = r === activeRole;
          return (
            <TouchableOpacity
              key={r}
              activeOpacity={0.7}
              onPress={() => onSelectRole(r)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? theme.accent : theme.surface,
                  borderColor: isActive ? theme.accent : theme.border
                }
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive ? theme.accentInk : theme.ink,
                    fontWeight: isActive
                      ? typography.fontWeights.bold
                      : typography.fontWeights.medium
                  }
                ]}
              >
                {ROLE_LABELS[r] || r}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  }
});
