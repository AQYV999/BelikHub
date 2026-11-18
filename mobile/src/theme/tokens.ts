// mobile/src/theme/tokens.ts
// BelikHub Design System Tokens matching index.html
// Light: #f7f9fa bg, #ecf0f2 surface, #1f3038 ink, #5d6b72 muted, #0d7480 accent, #ffffff accentInk
// Dark: #0c131a bg, #141f28 surface, #f1f6f8 ink, #94a7b0 muted, #2dd4bf accent, #042f2e accentInk
// Typography: Epilogue + JetBrains Mono with clean system fallbacks

import { Platform } from 'react-native';

export const colors = {
  light: {
    bg: '#f7f9fa',
    surface: '#ecf0f2',
    surfaceHighlight: '#ffffff',
    card: '#ffffff',
    ink: '#1f3038',
    muted: '#5d6b72',
    accent: '#0d7480',
    accentInk: '#ffffff',
    accentMuted: '#e0f2f1',
    border: '#dbe2e6',
    borderStrong: '#b8c5cc',
    line: 'rgba(31, 48, 56, 0.12)',
    lineStrong: 'rgba(31, 48, 56, 0.22)',
    tint: 'rgba(13, 116, 128, 0.08)',
    // Status colors
    success: '#16a34a',
    successBg: '#f0fdf4',
    successInk: '#14532d',
    warning: '#d97706',
    warningBg: '#fffbeb',
    warningInk: '#78350f',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorInk: '#7f1d1d',
    info: '#0284c7',
    infoBg: '#f0f9ff',
    infoInk: '#075985',
  },
  dark: {
    bg: '#0c131a',
    surface: '#141f28',
    surfaceHighlight: '#1d2a36',
    card: '#141f28',
    ink: '#f1f6f8',
    muted: '#94a7b0',
    accent: '#2dd4bf',
    accentInk: '#042f2e',
    accentMuted: 'rgba(45, 212, 191, 0.15)',
    border: 'rgba(241, 246, 248, 0.12)',
    borderStrong: 'rgba(241, 246, 248, 0.22)',
    line: 'rgba(241, 246, 248, 0.12)',
    lineStrong: 'rgba(241, 246, 248, 0.22)',
    tint: 'rgba(45, 212, 191, 0.1)',
    // Status colors
    success: '#34d399',
    successBg: 'rgba(52, 211, 153, 0.15)',
    successInk: '#a7f3d0',
    warning: '#fbbf24',
    warningBg: 'rgba(251, 191, 36, 0.15)',
    warningInk: '#fde68a',
    error: '#f87171',
    errorBg: 'rgba(248, 113, 113, 0.15)',
    errorInk: '#fecaca',
    info: '#38bdf8',
    infoBg: 'rgba(56, 189, 248, 0.15)',
    infoInk: '#bae6fd',
  }
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHighlight: string;
  card: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  accentMuted: string;
  border: string;
  borderStrong: string;
  line: string;
  lineStrong: string;
  tint: string;
  success: string;
  successBg: string;
  successInk: string;
  warning: string;
  warningBg: string;
  warningInk: string;
  error: string;
  errorBg: string;
  errorInk: string;
  info: string;
  infoBg: string;
  infoInk: string;
}

export const typography = {
  fontFamilies: {
    display: Platform.select({
      web: '"Epilogue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
    text: Platform.select({
      web: '"Epilogue", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
    mono: Platform.select({
      web: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    })
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.6
  }
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  }
} as const;

export function getTheme(isDark = false): ThemeColors {
  return isDark ? colors.dark : colors.light;
}
