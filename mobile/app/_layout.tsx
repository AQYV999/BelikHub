// mobile/app/_layout.tsx
// Root layout for the board-based app. The previous Expo screens live in mobile/legacy/ (not routed).

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { BOARD_CSS } from '../src/proto/boardStyles';
import { loadWebFonts } from '../src/theme/webFonts';

function injectBoardCss(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('bh-board-css')) return;
  const style = document.createElement('style');
  style.id = 'bh-board-css';
  style.textContent = BOARD_CSS;
  document.head.appendChild(style);
  document.title = 'BelikHub';
}

export default function RootLayout() {
  // Inject before first paint so the splash never flashes unstyled.
  if (Platform.OS === 'web' && typeof document !== 'undefined') injectBoardCss();
  useEffect(() => {
    loadWebFonts();
  }, []);
  return <Slot />;
}
