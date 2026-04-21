# Phase 6 — 이모지 전면 제거 & 아이콘 시스템 통합

> **목표**: 이모지로 표현된 모든 UI 요소를 **lucide-react 아이콘** 또는 **커스텀 SVG 토큰 일러스트**로 교체. AI 구현 흔적 제거 + 브랜드 일관성.
> **기간**: 1.5일 (≈ 12시간)
> **선행**: Phase 3-5 완료 권장 (의존성 없음 — 독립 진행 가능)

---

## 🎨 디자이너 판단 — 왜 제거하나

### 이모지의 문제
1. **플랫폼 렌더 편차** — iOS/Android/Windows가 전부 다른 모양. 브랜드 일관성 0.
2. **AI 구현 시그널** — "감성카페 🌸, 힙한 🔥, 로컬 📍" 패턴은 명백한 ChatGPT-식 나열.
3. **스케일 문제** — 16px 아이콘 옆 이모지는 12~20px 범위로 제멋대로 렌더.
4. **컬러 시스템 외부** — theme 토큰이 못 제어. 다크모드 전환 시 톤 깨짐.
5. **접근성** — 스크린리더가 이모지 이름을 읽어버림 ("체크 표시 이모지, 빨간색").

### 원칙 3가지
1. **의미 전달용 → lucide-react 아이콘** (monochrome, stroke-based, 14–20px)
2. **감성/분위기 표현 → 타입 + 색 칩** (아이콘 없이 label만 + 카테고리 색)
3. **브랜드 앵커 → Coffee 컴포넌트** (로고 자리에만 등장)

---

## 📊 전수조사 결과

### A. 제거 대상 (총 5군데 · 즉시 교체)

| 위치 | 현재 | 변경 |
|---|---|---|
| `CafeCard.tsx:159` PhotoPlaceholder | `☕` | `<Coffee size={32} color={ink300}/>` |
| `CafeDetailClient.tsx:357` HeroGlyph | `☕` | `<Coffee size={48} color={ink300}/>` |
| `cafes/[id]/error.tsx:18` | `☕` | `<AlertTriangle size={48} color={err}/>` |
| `MapClient.tsx:380` | `☕` | `<Coffee size={20} color={white}/>` |
| `pwa/InstallPrompt.tsx:64, 88` BannerIcon | `☕` | `<Coffee size={22} color={white}/>` (Phase 3에 예약됨) |

### B. 홈 Step 카드 (HomeClient.tsx · 3개)

현재: `🎯 🗺️ ✨` 
→ **교체**:
| Step | 현재 | 교체 아이콘 |
|---|---|---|
| STEP 01 | 🎯 | `Sparkles` (이미 Hero에 있음) 또는 `Filter` |
| STEP 02 | 🗺️ | `Map` |
| STEP 03 | ✨ | `Heart` 또는 `Coffee` |

**권장**: `Filter` → `Map` → `Coffee` (기능 흐름과 정확히 매칭)

### C. 앱 아이콘 (`app/icon.tsx`, `apple-icon.tsx`) — 보류 권장

현재 `☕` 이모지로 PWA 아이콘 생성. 이건 **별도 이슈** — 브랜드 로고 SVG가 필요. Phase 6 범위 밖, 차후 디자인 트랙에서 처리.

### D. MOODS 이모지 54개 — 핵심 의사결정

**옵션 A (권장): 이모지 완전 제거, 색 칩 시스템으로 전환**

이모지를 없애고 카테고리별 **색 칩 + label only** 로 표현:

```
[조용한]  ← atmosphere 파랑 톤
[감성카페] ← scene 핑크 톤
[데이트]  ← purpose 로즈 톤
[루프탑]  ← interior 그린 톤
[스페셜티커피] ← menu 앰버 톤 (brand)
[주차가능] ← facility 뉴트럴
[사진촬영] ← photo 퍼플
```

**장점**: 
- 이모지 0개. AI 시그널 완전 제거.
- 카테고리를 '색'으로 각인 (학습 효과).
- 가장 적은 구현 비용.

**단점**: 
- 시각 정보량 약간 감소 (현재도 label 병기라 영향 작음)

**옵션 B: lucide 아이콘 매핑 (54개 전체)**

현재 이모지 각각을 lucide 아이콘으로 1:1 매핑:
`🤫 → VolumeOff`, `⚡ → Zap`, `💕 → Heart`, `🕯️ → Flame`, `🏙️ → Building2`, `🌿 → Leaf`, `✨ → Sparkles`, `⬜ → Square`, `🌨️ → Snowflake`, `🏭 → Factory`, `🏯 → Landmark`, `🖼️ → Image`, `☕ → Coffee`, `🎞️ → Film`, `🎤 → Mic`, `🎸 → Guitar`, `🎷 → Music`, `📍 → MapPin`, `🔥 → Flame`, `🌸 → Flower`, `📚 → BookOpen`, `🍸 → Wine` (Martini 없음), `👫 → Users`, `💻 → Laptop`, `👥 → Users`, `🧘 → User`, `🖥️ → Monitor`, `💼 → Briefcase`, `🎂 → Cake`, `🐶 → Dog`, `🥞 → Utensils`, `🤝 → Handshake`, `🌇 → Sunset`, `🌳 → Trees`, `🪟 → RectangleVertical`, `🏠 → Home`, `🏗️ → Warehouse`, `🌲 → TreePine`, `🕳️ → Circle`, `🍵 → Leaf`, `🍰 → Cake`, `🥤 → CupSoda`, `🥗 → Salad`, `🅿️ → ParkingCircle`, `🌙 → Moon`, `🔌 → Plug`, `🪑 → Armchair`, `🚗 → Car`, `📸 → Camera`, `☀️ → Sun`, `🎨 → Palette`

**장점**: 시각 정보량 유지, 브랜드 일관성 확보 (monochrome stroke)
**단점**: 54개 매핑 관리, 일부는 어색한 매칭 (`🤫 → VolumeOff`, `🕳️ → Circle`)

**옵션 C (하이브리드 · 최종 권장): 카테고리 아이콘 + 태그 색 칩**

- 태그 개별 아이콘은 없앰 (옵션 A)
- 대신 **카테고리 7개에만** lucide 아이콘 부여 (MoodFilterSheet 탭/헤더 등에)
- 태그는 카테고리 색 칩 + label

```
[카테고리]    [아이콘]
atmosphere  → Wind       (분위기)
scene       → Sparkles   (씬/감성)
purpose     → Target     (목적)
interior    → Home       (인테리어)
menu        → Coffee     (음료/메뉴)
facility    → Settings2  (편의시설)
photo       → Camera     (촬영특성)
```

**→ 이 가이드는 옵션 C로 진행합니다.** 필요 시 옵션 B로 바꿀 수 있는 훅만 남겨둠.

---

## 🎯 DoD

```bash
# 이모지 유니코드 range 검색 — 0건이어야 함 (단, moods.ts 타입 필드 유지 시 허용)
git grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/ ':!src/app/icon.tsx' ':!src/app/apple-icon.tsx'
# 기대: moods.ts 외 0건 (옵션 A/C) 혹은 전체 0건 (emoji 필드 삭제 시)
```

- [ ] A 항목 5군데 전부 lucide 아이콘으로 교체
- [ ] 홈 Step 카드 3개 lucide 교체
- [ ] MoodFilterSheet: 카테고리 탭에 아이콘, 태그 셀은 label only + 색 칩
- [ ] MoodFilter(칩 리스트): 태그 이모지 삭제, label only
- [ ] HomeClient의 인기 무드에서 이모지 제거
- [ ] `pnpm typecheck && pnpm build` 통과
- [ ] 모바일 360×800 에서 필터 바텀시트 렌더 확인 (밀도 체크)

---

## 🧩 작업 목록 (6 tasks)

### T6-1. moods.ts 재설계 — category 메타 + 색 시스템 (1시간)

**파일**: `src/constants/moods.ts`

```ts
import { Wind, Sparkles, Target, Home, Coffee, Settings2, Camera, type LucideIcon } from 'lucide-react';

export const MOOD_CATEGORIES = {
  atmosphere: '분위기',
  scene:      '씬/감성',
  purpose:    '목적',
  interior:   '인테리어',
  menu:       '음료/메뉴',
  facility:   '편의시설',
  photo:      '촬영특성',
} as const;

export type MoodCategory = keyof typeof MOOD_CATEGORIES;

// 카테고리별 메타 — 아이콘 + 색 토큰(OKLCH 계열)
export const CATEGORY_META: Record<MoodCategory, {
  icon: LucideIcon;
  /** 칩 배경 */
  bg: string;
  /** 칩 글자색 */
  fg: string;
  /** 선택 상태 배경 */
  activeBg: string;
  /** 선택 상태 글자색 */
  activeFg: string;
  /** 테두리 */
  border: string;
}> = {
  atmosphere: {
    icon: Wind,
    bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe',
    activeBg: '#1e40af', activeFg: '#ffffff',
  },
  scene: {
    icon: Sparkles,
    bg: '#fdf2f8', fg: '#9d174d', border: '#fbcfe8',
    activeBg: '#9d174d', activeFg: '#ffffff',
  },
  purpose: {
    icon: Target,
    bg: '#fff1f2', fg: '#9f1239', border: '#fecdd3',
    activeBg: '#9f1239', activeFg: '#ffffff',
  },
  interior: {
    icon: Home,
    bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0',
    activeBg: '#166534', activeFg: '#ffffff',
  },
  menu: {
    // 브랜드 amber 톤 — primary 계열
    icon: Coffee,
    bg: '#fef3c7', fg: '#92400e', border: '#fde68a',
    activeBg: '#b45309', activeFg: '#ffffff',
  },
  facility: {
    icon: Settings2,
    bg: '#f5f5f4', fg: '#44403c', border: '#e7e5e4',
    activeBg: '#44403c', activeFg: '#ffffff',
  },
  photo: {
    icon: Camera,
    bg: '#faf5ff', fg: '#6b21a8', border: '#e9d5ff',
    activeBg: '#6b21a8', activeFg: '#ffffff',
  },
};

// ⚠️ emoji 필드 제거. label + key + category만 유지.
export const MOODS = [
  // ── 분위기 ─────────────────────────────────
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
  // ── 씬/감성 ───────────────────────────────
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
  // ── 목적 ─────────────────────────────────
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
  // ── 인테리어 ─────────────────────────────
  { key: 'rooftop',      label: '루프탑',        category: 'interior' },
  { key: 'terrace',      label: '테라스/정원',   category: 'interior' },
  { key: 'large_window', label: '통창/뷰맛집',   category: 'interior' },
  { key: 'hanok',        label: '한옥카페',      category: 'interior' },
  { key: 'warehouse',    label: '창고형카페',    category: 'interior' },
  { key: 'forest',       label: '숲속카페',      category: 'interior' },
  { key: 'underground',  label: '지하/비밀공간', category: 'interior' },
  // ── 음료/메뉴 ────────────────────────────
  { key: 'specialty',    label: '스페셜티커피',  category: 'menu' },
  { key: 'non_coffee',   label: '논커피/티',     category: 'menu' },
  { key: 'dessert',      label: '디저트맛집',    category: 'menu' },
  { key: 'signature',    label: '시그니처음료',  category: 'menu' },
  { key: 'vegan',        label: '비건/건강',     category: 'menu' },
  // ── 편의시설 ─────────────────────────────
  { key: 'parking',      label: '주차가능',      category: 'facility' },
  { key: 'open24',       label: '24시간',        category: 'facility' },
  { key: 'plug',         label: '콘센트많음',    category: 'facility' },
  { key: 'group_seat',   label: '단체석',        category: 'facility' },
  { key: 'drive_thru',   label: '드라이브스루',  category: 'facility' },
  // ── 촬영특성 ─────────────────────────────
  { key: 'photo',        label: '사진촬영',      category: 'photo' },
  { key: 'natural_light', label: '자연광',       category: 'photo' },
  { key: 'photo_spot',   label: '감성배경',      category: 'photo' },
  { key: 'sponsored',    label: '협찬가능',      category: 'photo' },
] as const;

export type MoodKey = typeof MOODS[number]['key'];
```

**타입 영향**: `src/types/index.ts:15` `emoji?: string` 필드 — 사용처 전부 제거 후 삭제.
```bash
git grep -n "\.emoji" src/
# 사용처를 각 task에서 모두 처리한 뒤 emoji 필드 삭제
```

**커밋**: `refactor(moods): emoji 제거 + CATEGORY_META (색·아이콘) 추가`

---

### T6-2. MoodFilterSheet 재설계 (3시간) — 이 Phase의 핵심

**파일 1**: `src/components/filter/MoodFilterSheet.tsx`

**핵심 변화**:
- 카테고리 탭: 아이콘 + 라벨 (`Wind` / `Sparkles` / ...)
- 태그 셀: **아이콘 없음**, label만. 선택 시 카테고리 activeBg/activeFg
- 상단 선택 카운터: `{selected.length} / 전체` 

```tsx
import { X, Check } from 'lucide-react';
import { MOODS, MOOD_CATEGORIES, CATEGORY_META, type MoodCategory } from '@/constants/moods';
import {
  Backdrop,
  Sheet,
  Header,
  Title,
  CloseBtn,
  TabRow,
  Tab,
  TabIconWrap,
  TabLabel,
  TagGrid,
  TagCell,
  Footer,
  ResetBtn,
  ApplyBtn,
  SelectedCount,
} from './MoodFilterSheet.styles';

export function MoodFilterSheet({ open, onClose, value, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<MoodCategory>('atmosphere');
  const [tempSelected, setTempSelected] = useState<string[]>(value);

  // ... IME/scroll lock 로직 기존 유지

  const filtered = MOODS.filter((m) => m.category === activeCategory);

  return (
    <Backdrop $open={open} onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>분위기 선택</Title>
          <CloseBtn onClick={onClose} aria-label="닫기"><X size={20} /></CloseBtn>
        </Header>

        <TabRow role="tablist">
          {(Object.keys(MOOD_CATEGORIES) as MoodCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const isActive = activeCategory === cat;
            return (
              <Tab
                key={cat}
                role="tab"
                aria-selected={isActive}
                $active={isActive}
                $activeBg={meta.activeBg}
                $activeFg={meta.activeFg}
                onClick={() => setActiveCategory(cat)}
              >
                <TabIconWrap><Icon size={14} /></TabIconWrap>
                <TabLabel>{MOOD_CATEGORIES[cat]}</TabLabel>
              </Tab>
            );
          })}
        </TabRow>

        <TagGrid>
          {filtered.map((mood) => {
            const meta = CATEGORY_META[mood.category];
            const selected = tempSelected.includes(mood.key);
            return (
              <TagCell
                key={mood.key}
                aria-pressed={selected}
                $selected={selected}
                $bg={meta.bg}
                $fg={meta.fg}
                $border={meta.border}
                $activeBg={meta.activeBg}
                $activeFg={meta.activeFg}
                onClick={() => toggleMood(mood.key)}
              >
                {selected && <Check size={14} style={{ flexShrink: 0 }} />}
                <span>{mood.label}</span>
              </TagCell>
            );
          })}
        </TagGrid>

        <Footer>
          <SelectedCount>{tempSelected.length}개 선택</SelectedCount>
          <div style={{ display: 'flex', gap: 8 }}>
            <ResetBtn onClick={() => setTempSelected([])}>초기화</ResetBtn>
            <ApplyBtn onClick={() => { onChange(tempSelected); onClose(); }}>적용</ApplyBtn>
          </div>
        </Footer>
      </Sheet>
    </Backdrop>
  );
}
```

**파일 2**: `src/components/filter/MoodFilterSheet.styles.ts`

```ts
export const TabRow = styled.div`
  display: flex;
  gap: 6px;
  padding: 12px 16px 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const Tab = styled.button<{ $active: boolean; $activeBg: string; $activeFg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid ${({ $active, $activeBg }) => ($active ? $activeBg : theme.colors.border)};
  background: ${({ $active, $activeBg }) => ($active ? $activeBg : theme.colors.card)};
  color: ${({ $active, $activeFg }) => ($active ? $activeFg : theme.colors.ink700)};
  font-size: 13px;
  font-weight: ${theme.fontWeight.medium};
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
`;

export const TabIconWrap = styled.span`
  display: inline-flex;
`;
export const TabLabel = styled.span``;

export const TagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 16px;
  max-height: calc(70vh - 180px);
  overflow-y: auto;
  overscroll-behavior: contain;
`;

export const TagCell = styled.button<{
  $selected: boolean;
  $bg: string; $fg: string; $border: string;
  $activeBg: string; $activeFg: string;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid ${({ $selected, $activeBg, $border }) => ($selected ? $activeBg : $border)};
  background: ${({ $selected, $bg, $activeBg }) => ($selected ? $activeBg : $bg)};
  color: ${({ $selected, $fg, $activeFg }) => ($selected ? $activeFg : $fg)};
  font-size: 13px;
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: transform 0.1s, background 0.15s;
  
  &:active { transform: scale(0.97); }
`;

export const SelectedCount = styled.span`
  font-size: 13px;
  color: ${theme.colors.ink500};
`;
```

**핵심 설계 포인트**:
- 태그 자체에 아이콘 없음 → 깔끔
- 카테고리 색이 칩 전체 배경을 살짝 칠함 → 카테고리를 색으로 학습
- 선택 시 `activeBg` 로 fill, `Check` 아이콘만 표시 (선택됨 명확)
- WCAG AA: `fg` 계열은 각 카테고리의 dark variant로 4.5:1 확보

**커밋**: `feat(filter): MoodFilterSheet 재설계 — 이모지 제거, 카테고리 색 시스템`

---

### T6-3. MoodFilter(칩 리스트) 업데이트 (30분)

**파일**: `src/components/filter/MoodFilter.tsx`

```tsx
// line 45, 80 — emoji 제거
// before
<span>{mood.emoji}</span>
// after
// ✖ 제거. label만 표시.

// before (line 80)
{mood.emoji} {mood.label} ×
// after
{mood.label} ×
```

**파일**: `src/components/filter/MoodFilter.styles.ts:59`
```ts
// MoodEmoji 삭제
- export const MoodEmoji = styled.span``;
```

import에서도 `MoodEmoji` 제거.

**커밋**: `refactor(filter): MoodFilter 이모지 제거`

---

### T6-4. 홈 화면 정리 (1시간)

**파일**: `src/app/HomeClient.tsx`

**(a) Step 카드 아이콘 교체** (line 50~70 근방):

```tsx
import { Filter, Map, Coffee } from 'lucide-react';

const STEPS = [
  {
    step: 'STEP 01',
    Icon: Filter,
    title: '분위기 선택',
    desc: '...',
  },
  {
    step: 'STEP 02',
    Icon: Map,
    title: '지도로 탐색',
    desc: '...',
  },
  {
    step: 'STEP 03',
    Icon: Coffee,
    title: '카페 발견',
    desc: '...',
  },
] as const;
```

렌더 부분:
```tsx
{STEPS.map((s) => (
  <StepCard key={s.step}>
    <StepIconWrap>
      <s.Icon size={22} color={theme.colors.primary} />
    </StepIconWrap>
    <StepNumber>{s.step}</StepNumber>
    <StepTitle>{s.title}</StepTitle>
    <StepDesc>{s.desc}</StepDesc>
  </StepCard>
))}
```

**파일**: `src/app/page.styles.ts` — `StepIconWrap` 스타일
```ts
export const StepIconWrap = styled.span`
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.primaryLight};
`;
```
기존 `StepIcon` (이모지 렌더링용 큰 폰트 span) 제거.

**(b) 인기 무드 섹션에서 이모지 제거** (HomeClient line 136):
```tsx
// before
<MoodTagEmoji>{mood.emoji}</MoodTagEmoji>
// after
// 완전 제거. 칩은 label만.
```
`page.styles.ts:249` `MoodTagEmoji` styled 삭제, import 제거.

**커밋**: `refactor(home): Step 카드 + 인기 무드 이모지 제거`

---

### T6-5. 이모지 플레이스홀더 5군데 일괄 교체 (1시간)

**파일 1**: `src/components/cafe/CafeCard.tsx:159`
```tsx
import { Coffee } from 'lucide-react';
// before
<PhotoPlaceholder>☕</PhotoPlaceholder>
// after
<PhotoPlaceholder>
  <Coffee size={32} color={theme.colors.ink300} strokeWidth={1.5} />
</PhotoPlaceholder>
```
`PhotoPlaceholder` styled — font-size 규칙이 이모지 크기용이면 제거, flex center 유지:
```ts
export const PhotoPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${theme.colors.ink100};
`;
```

**파일 2**: `src/app/cafes/[id]/CafeDetailClient.tsx:357`
```tsx
// before
<HeroGlyph aria-hidden>☕</HeroGlyph>
// after
<HeroGlyph aria-hidden>
  <Coffee size={48} color={theme.colors.ink300} strokeWidth={1.5} />
</HeroGlyph>
```
`HeroGlyph` font-size 스타일 제거.

**파일 3**: `src/app/cafes/[id]/error.tsx:18`
```tsx
import { AlertTriangle } from 'lucide-react';
// before
<span style={{ fontSize: 48 }}>☕</span>
// after
<AlertTriangle size={48} color={theme.colors.err} strokeWidth={1.5} />
```

**파일 4**: `src/app/map/MapClient.tsx:380` (마커 또는 placeholder)
확인 후 컨텍스트에 맞게:
```tsx
// 맥락에 따라
<Coffee size={20} color={theme.colors.white} />
// 또는 marker용이면 브랜드 색 마커
```

**파일 5**: `src/components/pwa/InstallPrompt.tsx:64, 88`
```tsx
// before
<BannerIcon>☕</BannerIcon>
// after
<BannerIcon>
  <Coffee size={22} color={theme.colors.white} strokeWidth={2} />
</BannerIcon>
```
`BannerIcon` styled에 flex center 추가 (Phase 3 T3-5에 예약된 작업이지만 여기서 확정).

**커밋**: `refactor(ui): 플레이스홀더/배너 이모지 → lucide Coffee/AlertTriangle`

---

### T6-6. 검증 + 정리 (1시간)

**(a) 잔여 이모지 스캔**:
```bash
# Unicode emoji range 전체
git grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{1F000}-\x{1F02F}]" src/ \
  ':!src/app/icon.tsx' \
  ':!src/app/apple-icon.tsx'
```
기대: 0건. 1건이라도 나오면 해당 파일 수정.

**(b) 타입 안정성**:
```bash
pnpm typecheck
```
`.emoji` 잔여 접근 있으면 에러로 잡힘.

**(c) 수동 QA**:
- 홈: 인기 무드 칩 깔끔 (이모지 없음), Step 카드 아이콘 정상
- `/map` 필터 버튼 → 바텀시트: 카테고리 탭 아이콘 + 색, 태그 셀 label only
- 태그 선택 → `Check` 아이콘 + activeBg
- 카페 카드: 이미지 없는 카페에 Coffee 아이콘 렌더
- 카페 상세: Hero 영역 Coffee 아이콘
- Install prompt: Coffee 아이콘 반투명 위

**(d) 문서**:
`mooda_review/` 하위 진행 기록에 "Phase 6 완료 — 이모지 0건 달성" 추가.

**커밋**: `chore: Phase 6 이모지 제거 검증 완료`

---

## 🤔 판단 필요 시

- **카테고리 색 톤**: 위 7색은 초안. 앱 전체 톤(브랜드 amber)과 경쟁하지 않는지 확인. 너무 알록달록하면 `menu`만 amber(brand)로 두고 나머지는 neutral 계열 + 톤만 달리하는 옵션도 있음. → **권장**: 일단 초안 적용 후 스크린샷 보고 조정.
- **옵션 A vs C**: 카테고리 탭에도 아이콘 없애고 label only로 갈지 (옵션 A 순수형) → **권장**: C 유지 (카테고리는 7개라 아이콘이 네비 역할)
- **pet_friendly 등 "의미 아이콘 필요" 태그**: 향후 옵션 B로 개별 아이콘 추가 여지. 현 Phase는 제외.
- **앱 아이콘** (`icon.tsx`, `apple-icon.tsx`): 별도 브랜드 로고 SVG 필요 — 이 Phase 제외.

---

**Phase 6 종료 조건**: DoD 전부 체크 + 이모지 스캔 0건 + 빌드 통과.

---

## 🎉 전체 현황 (Phase 3-6 후)

| 영역 | 상태 |
|---|---|
| 디자인 토큰 밖 컬러 | 0건 |
| 이모지 (moods/ui) | **0건** |
| 프로필 허브화 | ✅ |
| 로그인/가입 브랜드 톤 | ✅ |
| 카테고리 색 시스템 | ✅ |
| 아이콘 시스템 통합 (lucide) | ✅ |
