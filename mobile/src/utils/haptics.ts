// mobile/src/utils/haptics.ts
// Safe haptics wrapper: no-op on web / unsupported devices, never throws.

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error' | 'none';

export function triggerHaptic(kind: HapticKind = 'light'): void {
  if (Platform.OS === 'web' || kind === 'none') return;
  try {
    switch (kind) {
      case 'light':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'selection':
        void Haptics.selectionAsync();
        break;
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Haptics are a nicety; ignore device errors.
  }
}
