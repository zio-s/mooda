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

// emoji 필드 완전 제거 — UI 어디서도 더 이상 참조하지 않음.
export const MOODS = [
  // ── 분위기 ──────────────────────────────────────────────────
  { key: 'quiet',        label: '조용한',        category: 'atmosphere' },
  { key: 'lively',       label: '활기찬',        category: 'atmosphere' },
  { key: 'romantic',     label: '로맨틱',        category: 'atmosphere' },
  { key: 'cozy',         label: '아늑한',        category: 'atmosphere' },
  { key: 'modern',       label: '모던/세련',     category: 'atmosphere' },
  { key: 'nature',       label: '자연친화',      category: 'atmosphere' },
  { key: 'luxury',       label: '럭셔리',        category: 'atmosphere' },
  { key: 'minimal',      label: '미니멀',        category: 'atmosphere' },
  { key: 'nordic',       label: '북유럽감성',    category: 'atmosphere' },
  { key: 'industrial',   label: '인더스트리얼',  category: 'atmosphere' },
  { key: 'traditional',  label: '한옥/전통',     category: 'atmosphere' },
  { key: 'art_gallery',  label: '아트갤러리',    category: 'atmosphere' },

  // ── 씬/감성 ──────────────────────────────────────────────────
  { key: 'cafe_vibe',    label: '카페감성',      category: 'scene' },
  { key: 'vintage',      label: '빈티지/레트로', category: 'scene' },
  { key: 'hiphop',       label: '힙합감성',      category: 'scene' },
  { key: 'indie',        label: '인디감성',      category: 'scene' },
  { key: 'jazz',         label: '재즈바',        category: 'scene' },
  { key: 'local',        label: '로컬감성',      category: 'scene' },
  { key: 'trendy',       label: '힙한/트렌디',   category: 'scene' },
  { key: 'aesthetic',    label: '감성카페',      category: 'scene' },
  { key: 'bookish',      label: '책방느낌',      category: 'scene' },
  { key: 'lounge',       label: '라운지바',      category: 'scene' },

  // ── 목적 ──────────────────────────────────────────────────
  { key: 'date',         label: '데이트',        category: 'purpose' },
  { key: 'study',        label: '공부/작업',     category: 'purpose' },
  { key: 'gathering',    label: '모임',          category: 'purpose' },
  { key: 'solo',         label: '혼카공',        category: 'purpose' },
  { key: 'laptop',       label: '노트북작업',    category: 'purpose' },
  { key: 'business',     label: '비즈니스미팅',  category: 'purpose' },
  { key: 'anniversary',  label: '기념일',        category: 'purpose' },
  { key: 'pet_friendly', label: '반려동물동반',  category: 'purpose' },
  { key: 'brunch',       label: '브런치',        category: 'purpose' },
  { key: 'first_meet',   label: '첫만남/소개팅', category: 'purpose' },

  // ── 인테리어 ──────────────────────────────────────────────────
  { key: 'rooftop',      label: '루프탑',        category: 'interior' },
  { key: 'terrace',      label: '테라스/정원',   category: 'interior' },
  { key: 'large_window', label: '통창/뷰맛집',   category: 'interior' },
  { key: 'hanok',        label: '한옥카페',      category: 'interior' },
  { key: 'warehouse',    label: '창고형카페',    category: 'interior' },
  { key: 'forest',       label: '숲속카페',      category: 'interior' },
  { key: 'underground',  label: '지하/비밀공간', category: 'interior' },

  // ── 음료/메뉴 ──────────────────────────────────────────────────
  { key: 'specialty',    label: '스페셜티커피',  category: 'menu' },
  { key: 'non_coffee',   label: '논커피/티',     category: 'menu' },
  { key: 'dessert',      label: '디저트맛집',    category: 'menu' },
  { key: 'signature',    label: '시그니처음료',  category: 'menu' },
  { key: 'vegan',        label: '비건/건강',     category: 'menu' },

  // ── 편의시설 ──────────────────────────────────────────────────
  { key: 'parking',      label: '주차가능',      category: 'facility' },
  { key: 'open24',       label: '24시간',        category: 'facility' },
  { key: 'plug',         label: '콘센트많음',    category: 'facility' },
  { key: 'group_seat',   label: '단체석',        category: 'facility' },
  { key: 'drive_thru',   label: '드라이브스루',  category: 'facility' },

  // ── 촬영특성 ──────────────────────────────────────────────────
  { key: 'photo',        label: '사진촬영',      category: 'photo' },
  { key: 'natural_light', label: '자연광',       category: 'photo' },
  { key: 'photo_spot',   label: '감성배경',      category: 'photo' },
  { key: 'sponsored',    label: '협찬가능',      category: 'photo' },
] as const;

export type MoodKey = typeof MOODS[number]['key'];
