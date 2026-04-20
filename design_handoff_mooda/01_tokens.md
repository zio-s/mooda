# 01. Design Tokens

현재 `src/styles/theme.ts`에서 바꿀 부분입니다. **한 번에 교체**하면 이후 작업이 편해집니다.

---

## 변경 개요

| 항목 | Before | After | 이유 |
|---|---|---|---|
| primary | `#d97706` (amber-600) | `#b45309` (amber-700) | 채도 낮춰 CTA 외 곳에도 쓸 수 있게 |
| gray | 순수/slate 추정 | **stone (warm)** | amber와 조화 |
| semantic | 없음 | `ok · warn · err` | 영업중/에러/폼 상태 |
| shadows | 단일 `md` | 4-tier `sm/md/lg/xl` | 깊이 계층 |

---

## theme.ts (제안 전체)

```ts
// src/styles/theme.ts
export const theme = {
  colors: {
    // 브랜드
    primary: '#b45309',        // amber-700
    primaryHover: '#92400e',   // amber-800
    primaryText: '#ffffff',
    primaryLight: '#fef7ed',   // tint (warm amber-50)
    primaryLight2: '#fde4b8',  // amber-200

    // 중성 (stone 기반 warm gray)
    ink900: '#1c1917',
    ink700: '#44403c',
    ink500: '#78716c',
    ink400: '#a8a29e',
    ink300: '#d6d3d1',
    ink200: '#e7e5e4',
    ink100: '#f5f5f4',
    ink50:  '#fafaf9',

    // 배경
    bg: '#fcfbf8',
    card: '#ffffff',
    overlay: 'rgba(0,0,0,0.45)',

    // Semantic
    ok: '#15803d',       // green-700 — 영업중
    okBg: '#ecfdf5',     // green-50
    warn: '#b45309',     // 주의 (브랜드와 동일 계열)
    warnBg: '#fed7aa',   // orange-200
    err: '#b91c1c',      // red-700
    errBg: '#fee2e2',    // red-100

    // Map overlays
    mapDim: '#e8e6e0',

    // Utility
    white: '#ffffff',
    black: '#000000',
    border: '#e7e5e4',       // = ink200
    text: '#1c1917',         // = ink900
    textMuted: '#78716c',    // = ink500
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
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  space: {
    1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
    6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px',
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
    sheet: '0 -6px 24px rgba(28,25,23,0.12)', // 바텀시트 전용
  },

  // PWA safe-area
  safe: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  },

  // 터치 타깃
  touch: {
    sm: '40px',  // icon-only
    md: '44px',  // secondary
    lg: '52px',  // primary CTA
  },

  // z-index
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
} as const;

export type Theme = typeof theme;
```

---

## globals.css 패치

```css
:root {
  --brand: #b45309;
  --brand-hover: #92400e;
  --brand-tint: #fef7ed;
  --brand-tint-2: #fde4b8;

  --ink-900: #1c1917;
  --ink-700: #44403c;
  --ink-500: #78716c;
  --ink-400: #a8a29e;
  --ink-300: #d6d3d1;
  --ink-200: #e7e5e4;
  --ink-100: #f5f5f4;
  --ink-50:  #fafaf9;

  --ok: #15803d; --ok-bg: #ecfdf5;
  --warn: #b45309; --warn-bg: #fed7aa;
  --err: #b91c1c; --err-bg: #fee2e2;

  --bg: #fcfbf8;
  --card: #ffffff;
}

/* PWA safe-area viewport */
html { height: -webkit-fill-available; }
body { min-height: 100dvh; background: var(--bg); }

/* iOS 자동 줌인 방지 — 인풋 16px 하한 */
input, textarea, select { font-size: max(16px, 1em); }
```

### `app/layout.tsx` `<head>`에 추가

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#b45309" media="(prefers-color-scheme: light)" />
```

---

## Tailwind bridge (shadcn 연결)

`tailwind.config.ts`:

```ts
extend: {
  colors: {
    brand: {
      DEFAULT: 'var(--brand)',
      hover: 'var(--brand-hover)',
      tint: 'var(--brand-tint)',
    },
    ink: {
      900: 'var(--ink-900)', 700: 'var(--ink-700)',
      500: 'var(--ink-500)', 400: 'var(--ink-400)',
      300: 'var(--ink-300)', 200: 'var(--ink-200)',
      100: 'var(--ink-100)', 50:  'var(--ink-50)',
    },
    ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)',
  },
  boxShadow: {
    sm: '0 1px 2px rgba(28,25,23,0.06)',
    md: '0 4px 12px rgba(28,25,23,0.08), 0 1px 3px rgba(28,25,23,0.04)',
    lg: '0 12px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',
    sheet: '0 -6px 24px rgba(28,25,23,0.12)',
  },
}
```

이후 styled-components와 Tailwind 양쪽 다 `var(--brand)` · `theme.colors.primary`로 접근 가능.

---

## 마이그레이션 체크

- [ ] 기존 `theme.colors.gray*`를 `theme.colors.ink*`로 grep-replace
- [ ] 기존 `shadows.md`만 쓰던 카드들 중 플로팅 → `md`, 시트 → `sheet`, 모달 → `xl`로 수동 재분류
- [ ] 하드코딩된 `#d97706` / `#f5f5f5` / `rgba(0,0,0,0.1)` grep → 토큰으로 교체
- [ ] 빌드 통과, 비주얼 회귀(주요 3화면 스크린샷 비교)
