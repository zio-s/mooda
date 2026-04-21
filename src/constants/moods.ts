import {
  Wind,
  Sparkles,
  Target,
  Home,
  Coffee,
  Settings2,
  Camera,
  type LucideIcon,
} from 'lucide-react';

export const MOOD_CATEGORIES = {
  atmosphere: '분위기',
  scene: '씬/감성',
  purpose: '목적',
  interior: '인테리어',
  menu: '음료/메뉴',
  facility: '편의시설',
  photo: '촬영특성',
} as const;

export type MoodCategory = keyof typeof MOOD_CATEGORIES;

/**
 * 카테고리별 메타 — 아이콘 + 색 토큰.
 *
 * 카테고리를 '색'으로 학습시키는 시스템. menu는 브랜드 amber(primary),
 * 나머지는 각자의 hue 를 가져가되 톤은 전부 light-tint 계열로 맞춤.
 * active 변종은 dark-fill 로 명확한 선택 상태 표현.
 */
export interface CategoryMeta {
  icon: LucideIcon;
  bg: string;
  fg: string;
  border: string;
  activeBg: string;
  activeFg: string;
}

export const CATEGORY_META: Record<MoodCategory, CategoryMeta> = {
  atmosphere: {
    icon: Wind,
    bg: '#eff6ff',
    fg: '#1e40af',
    border: '#bfdbfe',
    activeBg: '#1e40af',
    activeFg: '#ffffff',
  },
  scene: {
    icon: Sparkles,
    bg: '#fdf2f8',
    fg: '#9d174d',
    border: '#fbcfe8',
    activeBg: '#9d174d',
    activeFg: '#ffffff',
  },
  purpose: {
    icon: Target,
    bg: '#fff1f2',
    fg: '#9f1239',
    border: '#fecdd3',
    activeBg: '#9f1239',
    activeFg: '#ffffff',
  },
  interior: {
    icon: Home,
    bg: '#f0fdf4',
    fg: '#166534',
    border: '#bbf7d0',
    activeBg: '#166534',
    activeFg: '#ffffff',
  },
  menu: {
    // 브랜드 amber — primary 계열과 동기화
    icon: Coffee,
    bg: '#fef3c7',
    fg: '#92400e',
    border: '#fde68a',
    activeBg: '#b45309',
    activeFg: '#ffffff',
  },
  facility: {
    icon: Settings2,
    bg: '#f5f5f4',
    fg: '#44403c',
    border: '#e7e5e4',
    activeBg: '#44403c',
    activeFg: '#ffffff',
  },
  photo: {
    icon: Camera,
    bg: '#faf5ff',
    fg: '#6b21a8',
    border: '#e9d5ff',
    activeBg: '#6b21a8',
    activeFg: '#ffffff',
  },
};

// MOODS SSoT 는 moods-data.ts 로 분리 — prisma/seed.ts · scripts/seed-cafes.ts
// 가 lucide-react 없이도 안전하게 import 하도록.
export { MOODS, type MoodKey } from './moods-data';
