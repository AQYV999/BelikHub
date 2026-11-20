// mobile/src/components/ui/RoleSwitcher.tsx
// Role switcher chip list allowing users to quickly switch perspectives

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  ViewStyle
} from 'react-native';
import { useColorScheme } from '../../theme/useColorScheme';
import { Role } from '../../api/types';
import { colors, radius, typography, spacing } from '../../theme/tokens';
import { PressableScale } from './PressableScale';
import { triggerHaptic } from '../../utils/haptics';

export interface RoleSwitcherProps {
  roles: Role[];
  activeRole: Role;
  onSelectRole: (role: Role) => void;
  style?: ViewStyle;
  testID?: string;
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
  style,
  testID
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
            <PressableScale
              key={r}
              haptic="none"
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              testID={testID ? `${testID}-chip-${r}` : `role-chip-${r}`}
              onPress={() => {
                if (!isActive) {
                  triggerHaptic('selection');
                  LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
                }
                onSelectRole(r);
              }}
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
            </PressableScale>
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    letterSpacing: 0.2
  }
});
