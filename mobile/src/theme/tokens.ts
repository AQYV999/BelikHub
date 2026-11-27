// mobile/src/theme/tokens.ts
// BelikHub Design System Tokens, taken from belikhub-design-board.html (light only).
// Forest #124734, canvas #F8FAFC, sage #E2ECE9, amber #D97706, slate #0F172A.
// Type: Newsreader (headings) + Figtree (text) + DM Mono (numbers/codes).
// The dark palette is kept only so old imports compile; it is identical to light.
// Light: #f7f9fa bg, #ecf0f2 surface, #1f3038 ink, #5d6b72 muted, #0d7480 accent, #ffffff accentInk
// Dark: #0c131a bg, #141f28 surface, #f1f6f8 ink, #94a7b0 muted, #2dd4bf accent, #042f2e accentInk
// Typography: Epilogue + JetBrains Mono with clean system fallbacks

import { Platform } from 'react-native';

export const colors = {
  light: {
    bg: '#F8FAFC',
    surface: '#EDF1F0',
    surfaceHighlight: '#ffffff',
    card: '#ffffff',
    ink: '#0F172A',
    muted: 'rgba(15, 23, 42, 0.62)',
    accent: '#124734',
    accentInk: '#ffffff',
    accentMuted: '#E2ECE9',
    border: 'rgba(15, 23, 42, 0.10)',
    borderStrong: 'rgba(15, 23, 42, 0.18)',
    line: 'rgba(15, 23, 42, 0.10)',
    lineStrong: 'rgba(15, 23, 42, 0.18)',
    tint: 'rgba(18, 71, 52, 0.08)',
    // Status colors
    success: '#16A34A',
    successBg: '#E2ECE9',
    successInk: '#124734',
    warning: '#D97706',
    warningBg: '#FDF0DC',
    warningInk: '#9A5200',
    error: '#B42318',
    errorBg: '#FDE7E4',
    errorInk: '#B42318',
    info: '#0A84FF',
    infoBg: '#E8F2FF',
    infoInk: '#075985',
  },
  dark: {} as any
} as const;
(colors as any).dark = colors.light;

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
      web: '"Newsreader", Georgia, "Times New Roman", serif',
      ios: 'Georgia',
      android: 'serif',
      default: 'serif'
    }),
    text: Platform.select({
      web: '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
    mono: Platform.select({
      web: '"DM Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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

// Uniform corner scale: 16px for controls (buttons, inputs, chips), 20px for cards/sheets.
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 14,
  xl: 20,
  full: 9999
} as const;

// Soft, diffused shadows tinted with the brand ink colour (never pure black).
// Light theme only: on dark surfaces depth comes from borders / surface tone instead.
export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 4
  }
} as const;

export function getShadow(level: keyof typeof shadows, isDark: boolean) {
  if (isDark) {
    return { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
  }
  return shadows[level];
}

// Shared motion constants so every interaction feels the same.
export const motion = {
  press: { scale: 0.97, opacity: 0.88 },
  fast: 140,
  base: 220,
  slow: 360
} as const;

// Text hierarchy: use these presets instead of ad-hoc font sizes.
export const textStyles = {
  title: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.4
  },
  heading: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.2
  },
  body: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.regular,
    lineHeight: 22
  },
  subtitle: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.regular,
    lineHeight: 20
  },
  label: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: 0.3
  }
} as const;

export function getTheme(isDark = false): ThemeColors {
  return isDark ? colors.dark : colors.light;
}
