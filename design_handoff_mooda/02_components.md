# 02. Components

신규/수정 공통 컴포넌트 스펙. 각 섹션은 **Props · Markup · 스타일 · 사용 예**를 포함.

---

## OpenBadge (신규 · ISSUE-21, 25)

영업 상태를 한눈에.

```tsx
// src/components/cafe/OpenBadge.tsx
type Props = {
  status: 'open' | 'closing-soon' | 'closed';
  size?: 'sm' | 'md';
};

const MAP = {
  open:          { label: '영업중',   bg: 'var(--ok-bg)',   fg: 'var(--ok)',   dot: '●' },
  'closing-soon':{ label: '곧 마감',  bg: 'var(--warn-bg)', fg: 'var(--warn)', dot: '◐' },
  closed:        { label: '영업종료', bg: 'var(--ink-100)', fg: 'var(--ink-500)', dot: '○' },
};
```

- 높이: sm=18px (카드용), md=22px (상세 상단)
- radius: 4px, padding: 2px 7px
- 폰트: 10.5px / weight 700
- **아이콘(●◐○) + 텍스트 병행** — 색맹 접근성

### 파생 헬퍼
`src/lib/cafe/openStatus.ts` — 운영시간 문자열 파싱 후 현재 시각 기준 상태 계산. 마감 30분 전이면 `closing-soon`.

---

## Button (수정 · ISSUE-19)

높이 3-tier, variant 3종.

```tsx
type Props = {
  size?: 'lg' | 'md' | 'sm';  // 52 / 44 / 40
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  leftIcon?: ReactNode; rightIcon?: ReactNode;
  loading?: boolean;
};
```

| variant | bg | fg | border |
|---|---|---|---|
| primary | `--brand` | white | none · shadow md |
| secondary | `--ink-100` | `--ink-900` | none |
| ghost | transparent | `--ink-700` | none |

- radius: 14px (lg) / 12px (md) / 10px (sm)
- 폰트: lg=15/700, md=14/600, sm=13/600
- loading 시 좌측 스피너 + 라벨 dim

---

## Tag (수정 · ISSUE-16)

분위기 태그.

```tsx
type Props = {
  label: string;
  variant?: 'solid' | 'tint' | 'outline';
  count?: number;        // 투표수 노출
  selected?: boolean;
  onClick?: () => void;  // 투표 토글
};
```

| variant | 용도 | 스타일 |
|---|---|---|
| solid | 상위 2개 태그, 선택된 투표 | bg `--brand`, fg white |
| tint | 일반 (카드 일람) | bg `--brand-tint`, fg amber-900 (`#78350f`) |
| outline | 비선택 필터 옵션 | bg white, border `--ink-200` |

- radius 999 (pill), padding 3px 8px, fs 11/500
- count 있을 때 우측 내부에 작은 배지 (fs 10/700, bg 반투명)
- **한 카드에 solid 최대 2개** — 투표수 상위 2개만

---

## BottomSheet (신규 · ISSUE-02, 14)

지도 마커 peek + 필터용 공통.

```tsx
type Props = {
  open: boolean;
  onClose: () => void;
  snapPoints?: ('peek' | 'half' | 'full')[];
  initialSnap?: 'peek' | 'half' | 'full';
  children: ReactNode;
};
```

- `peek`: 220px 고정 / `half`: 55vh / `full`: 88vh (상단 safe-area 남김)
- 드래그 핸들(36×4, ink-300), 탭/스와이프로 스냅 전환
- **radius**: 24px 상단만, `shadow: var(--shadow-sheet)`
- **safe-area-inset-bottom** 하단 padding에 반영
- 배경 dim(open=full·half 일 때만, peek에서는 투명)
- 구현 권장: **vaul** 또는 **@radix-ui/react-dialog + framer-motion**
- ESC / 바깥 탭으로 닫힘 · focus trap

---

## ErrorState (신규 · ISSUE-11)

Inline error · 재시도.

```tsx
type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  variant?: 'banner' | 'block';
};
```

- `banner`: 상단/하단 플로팅 (지도용). 아이콘 + 1줄 + 재시도 버튼
- `block`: 콘텐츠 영역 대체 (빈 상태 · 아이콘 + 제목 + 설명 + CTA)
- 색상: `--err-bg` / `--err` 조합

---

## Skeleton (신규 · ISSUE-12)

```tsx
<Skeleton w={200} h={16} r={8}/>
<SkeletonText lines={3}/>
<SkeletonBlock h={320}/>  // 히어로용
```

- bg: linear-gradient 애니메이션 (`--ink-100` → `--ink-200`)
- 2s ease infinite

### 사용처 `loading.tsx`
- `app/cafes/[id]/loading.tsx` — hero + title + 4-action grid + vote card 형태
- `app/map/loading.tsx` — 목록 카드 5개 반복
- `app/search/loading.tsx` — 결과 rows 반복

---

## safe-area 래퍼 (ISSUE-14)

```tsx
// src/components/layout/SafeAreaTop.tsx
export const SafeAreaTop = styled.div`
  padding-top: env(safe-area-inset-top, 0px);
`;
export const SafeAreaBottom = styled.div`
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;
```

- `app/layout.tsx` 루트에 `viewport-fit=cover` 필수
- 바텀시트, 플로팅 버튼, 하단 CTA 바 모두 적용

---

## 터치 타깃 (ISSUE-23)

- icon-only 버튼: **40×40 min** (기존 36 → 40)
- 지도 플로팅 버튼 stack은 40×40 + gap 8
- 주변 여백으로 실효 48 확보

---

## 인풋 (ISSUE-24)

- `font-size: max(16px, 1em)` — iOS 자동 줌인 방지
- 검색 인풋: height 48px, radius 24px, bg white, shadow `0 2px 14px rgba(0,0,0,.1)`
- 포커스 시 ring: `box-shadow: 0 0 0 2px var(--brand-tint)` + border `--brand`

---

## 토큰 브릿지 (ISSUE-20)

- styled-components: `theme.colors.primary`
- Tailwind: `bg-brand`, `text-ink-900`
- **두 경로 모두 `var(--brand)` → `:root` 정의에서 출발**  
  → `theme.ts`가 `var()`를 반환하도록 해도 되고, 값과 CSS 변수를 **둘 다** export 해서 일치 유지

---

## 삭제 대상

- 옛 `marker-normal.svg` — 새 마커 컴포넌트(DOM 기반)로 대체 (03_screens.md § 지도)
- Redux slice 내 `isLoading`, `cafes[]`, `error` 중복 필드 — RTK Query로 이전 (04_state_and_api.md)
