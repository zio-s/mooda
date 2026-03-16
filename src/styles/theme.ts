export const theme = {
  colors: {
    // Brand (Amber/Coffee palette)
    primary: '#d97706',       // amber-600
    primaryDark: '#b45309',   // amber-700
    primaryLight: '#fef3c7',  // amber-50
    primaryMid: '#fde68a',    // amber-200
    primaryText: '#92400e',   // amber-800

    // Neutrals
    white: '#ffffff',
    black: '#000000',
    bg: '#ffffff',
    bgMuted: '#f9fafb',
    bgCard: '#ffffff',

    // Text
    text: '#111827',
    textMuted: '#6b7280',
    textLight: '#9ca3af',

    // Border
    border: '#e5e7eb',
    borderLight: '#f3f4f6',

    // Status
    success: '#16a34a',
    successBg: '#f0fdf4',
    error: '#dc2626',
    errorBg: '#fef2f2',
    warning: '#d97706',
    warningBg: '#fffbeb',

    // Kakao
    kakao: '#FEE500',
    kakaoText: '#3C1E1E',
  },

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
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    cardHover: '0 8px 16px -4px rgba(0,0,0,0.12), 0 4px 6px -2px rgba(0,0,0,0.06)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    toast: 400,
  },
} as const;

export type Theme = typeof theme;
