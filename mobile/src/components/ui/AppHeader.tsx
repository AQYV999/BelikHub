// mobile/src/components/ui/AppHeader.tsx
// Brand header with EN | ID language toggle and account entry point.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../theme/useColorScheme';
import { colors, radius, spacing, typography, monoText } from '../../theme/tokens';
import { PressableScale } from './PressableScale';
import { Lang, useI18n } from '../../i18n';

export const AppHeader: React.FC<{ title: string; kicker?: string }> = ({ title, kicker }) => {
  const theme = useColorScheme() === 'dark' ? colors.dark : colors.light;
  const { lang, setLang, t } = useI18n();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: theme.accent }]}>
            <Ionicons name="water" size={14} color={theme.accentInk} />
          </View>
          <View>
            <Text style={[styles.brandName, { color: theme.ink }]}>BelikHub</Text>
            <Text style={[styles.tagline, { color: theme.muted }]}>{t('app.tagline')}</Text>
          </View>
        </View>

        <View style={styles.right}>
          <View style={[styles.toggle, { borderColor: theme.borderStrong, backgroundColor: theme.card }]}>
            {(['en', 'id'] as Lang[]).map((l) => {
              const active = l === lang;
              return (
                <PressableScale
                  key={l}
                  haptic="selection"
                  scaleTo={0.94}
                  accessibilityRole="button"
                  accessibilityLabel={l === 'en' ? 'English' : 'Bahasa Indonesia'}
                  accessibilityState={{ selected: active }}
                  onPress={() => setLang(l)}
                  style={[styles.toggleBtn, active && { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.toggleText, monoText, { color: active ? theme.accentInk : theme.muted }]}>
                    {l.toUpperCase()}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <PressableScale
            onPress={() => router.navigate('/(tabs)/profile')}
            accessibilityLabel={t('common.account')}
            style={[styles.account, { borderColor: theme.borderStrong, backgroundColor: theme.card }]}
          >
            <Ionicons name="person-outline" size={18} color={theme.ink} />
          </PressableScale>
        </View>
      </View>

      {kicker ? <Text style={[styles.kicker, monoText, { color: theme.accent }]}>{kicker}</Text> : null}
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: typography.fontFamilies.display, fontSize: typography.fontSizes.md, fontWeight: '800', letterSpacing: -0.2 },
  tagline: { fontFamily: typography.fontFamilies.text, fontSize: 10.5, marginTop: -1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 12, fontWeight: '700' },
  account: { width: 36, height: 36, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: spacing.sm },
  title: { fontFamily: typography.fontFamilies.display, fontSize: typography.fontSizes.xxl, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30 }
});
