// src/styles/theme.ts
// Design tokens — Mooda redesign (see design_handoff_mooda/01_tokens.md)
// Legacy keys are preserved as aliases so existing styled-components keep building.
// Prefer the new names going forward.

export const theme = {
  colors: {
    // Brand (warm amber — channel down from -600 to -700)
    primary: '#b45309',       // amber-700 (was #d97706)
    primaryHover: '#92400e',  // amber-800
    primaryLight: '#fef7ed',  // warm tint (was #fef3c7)
    primaryLight2: '#fde4b8', // amber-200 tint
    /**
     * primaryText (amber-800): primaryLight(tint) 배경 위 텍스트 색. 브랜드
     * 톤을 유지하면서 읽기 가능. 순수 헤드라인에는 ink900 이 더 나음.
     * @deprecated 의미가 명확하도록 `onPrimaryTint` 사용 권장.
     */
    primaryText: '#92400e',
    onPrimaryTint: '#92400e', // primaryLight 배경 위 텍스트 (semantic)
    onPrimary: '#ffffff',     // text on primary (solid) surface

    // Legacy primary aliases (back-compat)
    primaryDark: '#92400e',
    primaryMid: '#fde4b8',

    // Neutral (warm stone-based)
    ink900: '#1c1917',
    ink700: '#44403c',
    ink500: '#78716c',
    ink400: '#a8a29e',
    ink300: '#d6d3d1',
    ink200: '#e7e5e4',
    ink100: '#f5f5f4',
    ink50:  '#fafaf9',

    // Surfaces
    bg: '#fcfbf8',
    card: '#ffffff',
    overlay: 'rgba(0,0,0,0.45)',

    // Legacy surface aliases
    bgMuted: '#f5f5f4',   // = ink100
    bgCard: '#ffffff',

    // Text
    text: '#1c1917',
    textMuted: '#78716c',
    textLight: '#a8a29e',

    // Borders
    border: '#e7e5e4',    // = ink200
    borderLight: '#f5f5f4',

    // Semantic
    ok: '#15803d',
    okBg: '#ecfdf5',
    warn: '#b45309',
    warnBg: '#fed7aa',
    err: '#b91c1c',
    errBg: '#fee2e2',

    // Legacy status aliases
    success: '#15803d',
    successBg: '#ecfdf5',
    error: '#b91c1c',
    errorBg: '#fee2e2',
    warning: '#b45309',
    warningBg: '#fed7aa',

    // Map overlays
    mapDim: '#e8e6e0',

    // Utility
    white: '#ffffff',
    black: '#000000',

    // Kakao brand (unchanged)
    kakao: '#FEE500',
    kakaoText: '#3C1E1E',
  },

  fontSize: {
    xs: '11px',
    sm: '12.5px',
    base: '14px',
    md: '15px',
    lg: '17px',
    xl: '19px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '36px',
  },

  fontWeight: {
    regular: 400,
    normal: 400,      // legacy alias
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Numeric scale (new)
  space: {
    1: '4px',  2: '8px',  3: '12px', 4: '16px', 5: '20px',
    6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px',
  },

  // Named scale (legacy, kept for existing styled-components)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(28,25,23,0.06)',
    md: '0 4px 12px rgba(28,25,23,0.08), 0 1px 3px rgba(28,25,23,0.04)',
    lg: '0 12px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',
    xl: '0 24px 60px rgba(28,25,23,0.18), 0 4px 12px rgba(28,25,23,0.08)',
    sheet: '0 -6px 24px rgba(28,25,23,0.12)',
    // Legacy aliases
    card: '0 1px 2px rgba(28,25,23,0.06)',
    cardHover: '0 4px 12px rgba(28,25,23,0.08), 0 1px 3px rgba(28,25,23,0.04)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  // PWA safe-area inset helpers
  safe: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  },

  // Minimum touch targets (iOS HIG)
  touch: {
    sm: '40px',
    md: '44px',
    lg: '52px',
  },

  // z-index (new)
  z: {
    map: 1,
    mapOverlay: 10,
    mapFloatingButton: 15,
    search: 20,
    bottomSheet: 25,
    modal: 50,
    toast: 60,
    island: 999,
  },

  // Legacy z-index scale
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    toast: 400,
  },
} as const;

export type Theme = typeof theme;
