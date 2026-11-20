// mobile/src/theme/useColorScheme.ts
// BelikHub is a field tool used outdoors in direct sunlight: the app is locked to the
// high-contrast light theme. Flip FORCE_LIGHT to false to follow the system again.

import { useColorScheme as useSystemColorScheme } from 'react-native';

const FORCE_LIGHT = true;

export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  return FORCE_LIGHT ? 'light' : system === 'dark' ? 'dark' : 'light';
}
