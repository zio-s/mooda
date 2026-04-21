/**
 * 분위기 태그 SSoT (Single Source of Truth).
 *
 * UI 레이어(constants/moods.ts · CATEGORY_META) 와 seed 스크립트(prisma/seed.ts ·
 * scripts/seed-cafes.ts) 가 공통으로 이 파일에서 MOODS 를 가져온다. lucide-react
 * 같은 UI 전용 의존성을 포함하지 않아 ts-node 로 prisma 컨텍스트에서도
 * 안전하게 import 가능.
 *
 * sortOrder 는 배열 순서(1-based index) 로 seed 단계에서 자동 파생 — 여기서는
 * 의미 순서를 유지하기 위해 카테고리별로 묶어서 선언만 한다.
 */
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
