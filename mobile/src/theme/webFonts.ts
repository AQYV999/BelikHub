// mobile/src/theme/webFonts.ts
// Loads Newsreader, Figtree and DM Mono on web (the board's type). Native and offline fall back to system fonts.

import { Platform } from 'react-native';

const HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap';

export function loadWebFonts(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('bh-fonts')) return;
  const link = document.createElement('link');
  link.id = 'bh-fonts';
  link.rel = 'stylesheet';
  link.href = HREF;
  document.head.appendChild(link);
}
