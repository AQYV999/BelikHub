// mobile/src/components/ui/Toast.tsx
// Floating, animated toast notifications (replaces blocking Alert.alert for feedback).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getShadow, radius, spacing, textStyles } from '../../theme/tokens';
import { triggerHaptic } from '../../utils/haptics';
import { PressableScale } from './PressableScale';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
}

export interface ToastApi {
  show: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION = 3200;

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'alert-circle',
  info: 'information-circle'
};

const ToastView: React.FC<{ item: ToastItem; onDone: () => void }> = ({ item, onDone }) => {
  const isDark = false;
  const theme = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const tone = {
    success: { fg: theme.success, bg: theme.successBg, ink: theme.successInk },
    error: { fg: theme.error, bg: theme.errorBg, ink: theme.errorInk },
    warning: { fg: theme.warning, bg: theme.warningBg, ink: theme.warningInk },
    info: { fg: theme.info, bg: theme.infoBg, ink: theme.infoInk }
  }[item.type];

  useEffect(() => {
    triggerHaptic(item.type === 'info' ? 'light' : item.type);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }).start();
    const t = setTimeout(dismiss, DURATION);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
      ({ finished }) => finished && onDone()
    );
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: insets.top + spacing.sm,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }]
        }
      ]}
    >
      <PressableScale
        onPress={dismiss}
        haptic="none"
        scaleTo={0.98}
        accessibilityRole="alert"
        accessibilityLabel={item.message}
        style={[
          styles.toast,
          { backgroundColor: isDark ? theme.surfaceHighlight : '#ffffff', borderColor: theme.border },
          getShadow('lg', isDark)
        ]}
      >
        <View style={[styles.iconBubble, { backgroundColor: tone.bg }]}>
          <Ionicons name={ICONS[item.type]} size={20} color={tone.fg} />
        </View>
        <View style={styles.textCol}>
          {item.title ? <Text style={[textStyles.label, { color: theme.ink }]}>{item.title}</Text> : null}
          <Text style={[textStyles.subtitle, { color: item.title ? theme.muted : theme.ink }]} numberOfLines={3}>
            {item.message}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const counter = useRef(0);

  const show = useCallback((type: ToastType, message: string, title?: string) => {
    counter.current += 1;
    setCurrent({ id: counter.current, type, message, title });
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m, t) => show('success', m, t),
      error: (m, t) => show('error', m, t),
      warning: (m, t) => show('warning', m, t),
      info: (m, t) => show('info', m, t)
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current && (
        <ToastView
          key={current.id}
          item={current}
          onDone={() => setCurrent((c) => (c && c.id === current.id ? null : c))}
        />
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback so a screen rendered outside the provider never crashes.
    const noop = () => {};
    return { show: noop, success: noop, error: noop, warning: noop, info: noop };
  }
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 1000 },
  toast: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth
  },
  iconBubble: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1, gap: 2 }
});
