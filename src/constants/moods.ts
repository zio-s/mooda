export const MOOD_CATEGORIES = {
  atmosphere: '분위기',
  scene: '씬/감성',
  purpose: '목적',
  interior: '인테리어',
  menu: '음료/메뉴',
  facility: '편의시설',
  photo: '촬영특성',
} as const;

export const MOODS = [
  // ── 분위기 ──────────────────────────────────────────────────
  { key: 'quiet',        label: '조용한',        category: 'atmosphere', emoji: '🤫' },
  { key: 'lively',       label: '활기찬',        category: 'atmosphere', emoji: '⚡' },
  { key: 'romantic',     label: '로맨틱',        category: 'atmosphere', emoji: '💕' },
  { key: 'cozy',         label: '아늑한',        category: 'atmosphere', emoji: '🕯️' },
  { key: 'modern',       label: '모던/세련',     category: 'atmosphere', emoji: '🏙️' },
  { key: 'nature',       label: '자연친화',      category: 'atmosphere', emoji: '🌿' },
  { key: 'luxury',       label: '럭셔리',        category: 'atmosphere', emoji: '✨' },
  { key: 'minimal',      label: '미니멀',        category: 'atmosphere', emoji: '⬜' },
  { key: 'nordic',       label: '북유럽감성',    category: 'atmosphere', emoji: '🌨️' },
  { key: 'industrial',   label: '인더스트리얼',  category: 'atmosphere', emoji: '🏭' },
  { key: 'traditional',  label: '한옥/전통',     category: 'atmosphere', emoji: '🏯' },
  { key: 'art_gallery',  label: '아트갤러리',    category: 'atmosphere', emoji: '🖼️' },

  // ── 씬/감성 ──────────────────────────────────────────────────
  { key: 'cafe_vibe',    label: '카페감성',      category: 'scene', emoji: '☕' },
  { key: 'vintage',      label: '빈티지/레트로', category: 'scene', emoji: '🎞️' },
  { key: 'hiphop',       label: '힙합감성',      category: 'scene', emoji: '🎤' },
  { key: 'indie',        label: '인디감성',      category: 'scene', emoji: '🎸' },
  { key: 'jazz',         label: '재즈바',        category: 'scene', emoji: '🎷' },
  { key: 'local',        label: '로컬감성',      category: 'scene', emoji: '📍' },
  { key: 'trendy',       label: '힙한/트렌디',   category: 'scene', emoji: '🔥' },
  { key: 'aesthetic',    label: '감성카페',      category: 'scene', emoji: '🌸' },
  { key: 'bookish',      label: '책방느낌',      category: 'scene', emoji: '📚' },
  { key: 'lounge',       label: '라운지바',      category: 'scene', emoji: '🍸' },

  // ── 목적 ──────────────────────────────────────────────────
  { key: 'date',         label: '데이트',        category: 'purpose', emoji: '👫' },
  { key: 'study',        label: '공부/작업',     category: 'purpose', emoji: '💻' },
  { key: 'gathering',    label: '모임',          category: 'purpose', emoji: '👥' },
  { key: 'solo',         label: '혼카공',        category: 'purpose', emoji: '🧘' },
  { key: 'laptop',       label: '노트북작업',    category: 'purpose', emoji: '🖥️' },
  { key: 'business',     label: '비즈니스미팅',  category: 'purpose', emoji: '💼' },
  { key: 'anniversary',  label: '기념일',        category: 'purpose', emoji: '🎂' },
  { key: 'pet_friendly', label: '반려동물동반',  category: 'purpose', emoji: '🐶' },
  { key: 'brunch',       label: '브런치',        category: 'purpose', emoji: '🥞' },
  { key: 'first_meet',   label: '첫만남/소개팅', category: 'purpose', emoji: '🤝' },

  // ── 인테리어 ──────────────────────────────────────────────────
  { key: 'rooftop',      label: '루프탑',        category: 'interior', emoji: '🌇' },
  { key: 'terrace',      label: '테라스/정원',   category: 'interior', emoji: '🌳' },
  { key: 'large_window', label: '통창/뷰맛집',   category: 'interior', emoji: '🪟' },
  { key: 'hanok',        label: '한옥카페',      category: 'interior', emoji: '🏠' },
  { key: 'warehouse',    label: '창고형카페',    category: 'interior', emoji: '🏗️' },
  { key: 'forest',       label: '숲속카페',      category: 'interior', emoji: '🌲' },
  { key: 'underground',  label: '지하/비밀공간', category: 'interior', emoji: '🕳️' },

  // ── 음료/메뉴 ──────────────────────────────────────────────────
  { key: 'specialty',    label: '스페셜티커피',  category: 'menu', emoji: '☕' },
  { key: 'non_coffee',   label: '논커피/티',     category: 'menu', emoji: '🍵' },
  { key: 'dessert',      label: '디저트맛집',    category: 'menu', emoji: '🍰' },
  { key: 'signature',    label: '시그니처음료',  category: 'menu', emoji: '🥤' },
  { key: 'vegan',        label: '비건/건강',     category: 'menu', emoji: '🥗' },

  // ── 편의시설 ──────────────────────────────────────────────────
  { key: 'parking',      label: '주차가능',      category: 'facility', emoji: '🅿️' },
  { key: 'open24',       label: '24시간',        category: 'facility', emoji: '🌙' },
  { key: 'plug',         label: '콘센트많음',    category: 'facility', emoji: '🔌' },
  { key: 'group_seat',   label: '단체석',        category: 'facility', emoji: '🪑' },
  { key: 'drive_thru',   label: '드라이브스루',  category: 'facility', emoji: '🚗' },

  // ── 촬영특성 ──────────────────────────────────────────────────
  { key: 'photo',        label: '사진촬영',      category: 'photo', emoji: '📸' },
  { key: 'natural_light', label: '자연광',       category: 'photo', emoji: '☀️' },
  { key: 'photo_spot',   label: '감성배경',      category: 'photo', emoji: '🎨' },
  { key: 'sponsored',    label: '협찬가능',      category: 'photo', emoji: '🤝' },
] as const;

export type MoodKey = typeof MOODS[number]['key'];
