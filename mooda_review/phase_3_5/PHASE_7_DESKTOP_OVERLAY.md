# Phase 7 — PC Overlay 레이아웃 재설계 (+ 모바일에 이로운 부분 공유 적용)

> **⚠️ 스코프 원칙 (2026-04-21 사용자 최종 확정)**
>
> PC 시안을 출발점으로 재설계하되, **디자인 품질이 모바일에서도 개선되는 변경은 함께 적용** 한다. 반대로 모바일에서 의미 없거나 UX 를 해치는 변경은 PC 전용으로 격리한다. 판단 기준:
>
> **전역 적용** (PC + Tablet + Mobile 동일 혹은 각 뷰포트 자연 렌더)
> - **T7-B1** theme 토큰 추가 (z.overlayCard)
> - **T7-B2** Header 복원 — Phase 4 "몰입 경로 숨김" 결정 전역 철회. 높이 56 → 48 축소로 모바일 세로 공간 손실 최소화. 홈 복귀 + 브랜드 앵커는 모든 뷰포트 필수
> - **T7-B5** `CafeListCard` v2 — `/map` 의 ListPanel 카드만 수평 레이아웃으로 교체. 기존 `CafeCard` 는 홈/검색/즐찾 그리드에서 유지
> - **T7-B7** `CafeDetailBody` 공통 추출 — Overlay · BottomSheet · CafeDetailClient 가 공유
> - **T7-B8** URL `?cafe=` sync — 딥링크 공유. 모바일 BottomSheet 의 기존 pushState 로직과 통합 (pushState 제거, URL 을 SSoT)
> - **T7-B9** 하단 빈 공간 제거 + height 재계산 — 레이아웃 버그 수정
>
> **PC 전용** (`useIsDesktop` 훅 또는 `@media (min-width: ${theme.breakpoints.lg})`)
> - **T7-B3** FilterBar 한 줄 강제 (모바일은 현재 wrap 허용 유지)
> - **T7-B4** Segmented 제거 + Provider 토글 우하단 이동 (모바일은 Segmented + Toolbar 그대로)
> - **T7-B6** `CafeOverlayCard` floating (모바일은 BottomSheet 유지, 둘 중 하나만 render)
>
> **"일관성" 의 의미**: 디자인 토큰(색·타이포·아이콘·radius·shadow)과 컴포넌트 철학(공통 body 추출, 선택 강조 패턴, 4-액션 버튼 배치) 을 공유한다. **레이아웃 구조 통일이 아니다** — PC Overlay 와 Mobile BottomSheet 는 의도적으로 갈라지는 게 맞다.
>
> ---
>
> **목표**: `/map` 을 Airbnb/Google Maps 스타일의 **PC 오버레이 레이아웃**으로 재설계(≥1024px). 동시에 Header 전역 복원 + ListPanel 카드 정보 밀도 상향 + 딥링크 공유를 모든 뷰포트에 적용.
> **기간**: 2~2.5일 (집중) / 3~4일 (분산)
> **선행**: Phase 3~6 + P7-A 완료, BUG-MAP/BUG-SEARCH hotfix 랜딩
> **PR 전략**: task 별 커밋 10개 + 단일 PR. PC 전용 task 는 **미디어 쿼리 / `useIsDesktop` 훅**으로 엄격히 격리해 모바일 시각·동작 차이를 회귀 테스트로 확인
> **기반 시안**: 사용자 제공 "B · Overlay 상세 (지도 맥락 유지)" 스크린샷 — PC 기준

---

## 0. 왜 지금 이 변경인가 (Rationale)

### 0.1. 시안의 핵심 주장
- 지도를 **화면 주인공**으로 유지하면서 상세 정보를 **오버레이 카드** 로 띄우면, 유저가 **"보던 지역 컨텍스트를 잃지 않는다"**. 별도 라우트로 상세로 이동하면 맥락이 단절됨.
- 좌측 ListPanel + 중앙 Overlay + 우측 Map 의 3-column 구성은 검색/리스트/상세를 **한 화면에서 병렬 비교** 가능케 한다. 이는 Airbnb·Google Maps·부동산 서비스에서 검증된 모델.

### 0.2. 현재 구현의 구조적 한계
1. **`/map` 에서 Header 전면 숨김 (Phase 4 결정)** — 모바일 세로 공간 확보 의도였으나, 데스크톱에서는 세로 공간이 풍부하고, 어느 뷰포트든 **홈 복귀 + 로고(브랜드 앵커) 가 사라지면 UX 치명** (사용자 지적).
2. **데스크톱에서 "지도 / 목록" Segmented 잔류** — 모바일 모드 UX 를 그대로 승격. 데스크톱은 두 영역을 **병행 표시**해야 하므로 토글이 군더더기.
3. **FilterBar 가 줄바꿈 될 여지** — `flex-wrap: nowrap` 이지만 요소 수가 많아 좁은 뷰포트에서 shrink · overflow 발생. 시안은 **한 줄 강제 + 검색창 inline**.
4. **상세 페이지가 별도 라우트(`/cafes/[id]`)** — 카페 탭 시 페이지 전환 발생. 지도 상태(줌/center/마커 선택)가 URL 히스토리에 의존해 **되돌리기 비용 큼**. 오버레이는 맥락 유지 + 빠른 전환.
5. **리스트 카드 정보 밀도 부족** — 현재 `CafeCard` 는 **세로 레이아웃**(이미지 위 + 메타 아래). 리스트 패널 폭(320~368px)에서는 **수평 레이아웃**(썸네일 64 + 컨텐츠)이 정보 밀도 3배.
6. **`/map` 하단 빈 공간** — `ListPanel` 의 세로 flex 설정 문제로 리스트가 전체 높이 미활용.

### 0.3. 본 Phase 의 방향

#### 전역 정책 (모든 뷰포트 적용)
- **Header 복원 + 48px 축소** — Phase 4 의 몰입 경로 숨김 철회. 56→48 로 세로 공간 손실 최소화. 모바일에서도 로고/홈 복귀 필요 → "모바일은 건드리지 않는다" 가 아니라 **"디자인 개선은 함께 가져간다"** 원칙.
- **URL `?cafe=<id>` query 동기화** — PC Overlay 든 Mobile BottomSheet 든 동일한 쿼리로 딥링크 공유 가능. `/cafes/[id]` 라우트는 SEO/외부 공유용으로 유지하되, `/map` 내부 이동은 쿼리만 업데이트 (페이지 전환 없음).
- **`CafeListCard` v2 (수평 레이아웃)** — `/map` ListPanel 의 카드만 교체. 기존 `CafeCard` 는 홈/검색/즐찾 그리드에서 그대로 유지 (스코프 오염 방지). 수평 레이아웃은 PC/Tablet/Mobile 리스트 모드 모두에서 정보 밀도 상향.
- **`CafeDetailBody` 공통 추출** — Overlay/Sheet/Page 가 같은 body 섹션(메타·액션·분위기·정보·리뷰프리뷰) 을 공유. 뷰포트별 wrapper 만 달라짐.
- **하단 빈 공간 버그 수정 + height 재계산** — `min-height: 0` 명시 + Header 48 반영. 모든 뷰포트 영향.

#### PC 전용 레이아웃 (`≥1024px`)
- 3-column: `ListPanel 368 · Map flex · CafeOverlayCard absolute 420`
- FilterBar 한 줄 강제 (wrap 금지)
- Segmented(지도/목록) 미렌더 — 두 영역 병행
- Provider 토글을 MapArea 우하단 absolute 로 이동

#### Tablet (768~1023px)
- Header Full (Nav 표시)
- FilterBar wrap 허용 (기존 그대로)
- Segmented 유지 · BottomSheet 유지
- CafeOverlayCard 미렌더

#### Mobile (<768px)
- Header Compact (로고 + Avatar, Nav 는 Avatar 드롭다운으로 통합 — 기존 Header 구조 그대로)
- FilterBar wrap 허용 (기존 그대로)
- Segmented 유지 · BottomSheet 유지
- CafeOverlayCard 미렌더

---

## 1. Definition of Done (최종 상태)

### 빌드 · 스캔 (공통)
- [ ] `pnpm typecheck && pnpm build` 통과
- [ ] `grep -n "IMMERSIVE_PREFIXES\|shouldHideHeader" src/components/layout/Header.tsx` → `/search` 외 경로 전부 Header 렌더 확인
- [ ] `grep -n "Segmented" src/app/map/MapClient.tsx` → PC (`isDesktop`) 에서 미렌더 처리 확인

### 전역 적용 (PC + Tablet + Mobile 공통)
- [ ] Header 가 `/`, `/map`, `/cafes/[id]`, `/profile`, `/login` 모두에서 표시 (`/search` 만 숨김 유지 — 자체 헤더 있음)
- [ ] Header 높이 48px (기존 56px 에서 축소)
- [ ] Mooda 로고 클릭 → 홈(`/`) 이동
- [ ] ListPanel 카드가 `CafeListCard` v2 (수평 레이아웃) 로 렌더 — 모바일 viewMode=list 에서도 동일
- [ ] `/map?cafe=<id>` 딥링크 진입 시 해당 카페 자동 선택 (PC: Overlay / Mobile: BottomSheet)
- [ ] 상세 닫기 시 URL `?cafe=` 제거
- [ ] `/map` 하단 빈 공간 없음 — 리스트가 세로 전체 활용
- [ ] 선택 ListCard 에 primaryLight 배경 + inset 3px primary border

### PC 전용 (≥1024px)
- [ ] 좌측 ListPanel(368px) 고정 + 우측 Map 영역 flex + 카페 선택 시 중앙 Overlay(420px) floating
- [ ] Overlay 가 ListPanel · 줌 컨트롤과 겹치지 않음
- [ ] Segmented(지도/목록) 미렌더
- [ ] FilterBar 한 줄 유지 (1280px 에서 줄바꿈 없음)
- [ ] Provider 토글이 MapArea 우하단 absolute 위치
- [ ] Sort 드롭다운이 ListPanel 헤더로 이동

### Tablet (768~1023px)
- [ ] Header Full 표시 (Nav 포함)
- [ ] Segmented(지도/목록) 유지 · BottomSheet 유지
- [ ] FilterBar 축약 레이아웃 (칩 스크롤 영역 존재)
- [ ] Overlay 미렌더

### Mobile (<768px)
- [ ] Header Compact (로고 + Avatar, Nav 는 Avatar 드롭다운) · 48px
- [ ] Segmented · BottomSheet · Toolbar Provider 전부 유지
- [ ] Overlay 미렌더
- [ ] BottomSheet 열기/닫기 동작 변화 없음 (단 URL `?cafe=` 는 동기화됨)

### 회귀 (모든 뷰포트)
- [ ] 기본 3경로 통과 (`/map` 시트 · `/cafes/[id]` 갤러리 ESC · `/search` 한글 Enter)
- [ ] BUG-MAP 재발 없음 (provider 토글 / 탭 전환 복귀)
- [ ] BUG-SEARCH hydration 에러 0건
- [ ] `/cafes/[id]` 직접 진입 정상 (외부 공유 링크)

---

## 2. 📐 디자인 명세

### 2.1. 뷰포트 매트릭스

| 브레이크포인트 | 범위 | Header | FilterBar | Main 영역 | 상세 표시 |
|---|---|---|---|---|---|
| **Mobile** | < 768px | 컴팩트 48px (로고+Avatar) | 줄바꿈 허용 | ViewMode 단일 (지도 or 목록) | BottomSheet |
| **Tablet** | 768~1023px | Full 48px | 한 줄 시도, 필요시 ChipsScroll | Segmented 토글 (지도 ↔ 목록) | BottomSheet |
| **Desktop** | ≥ 1024px | Full 48px + Nav | 한 줄 강제 | ListPanel 368 + Map flex + Overlay absolute | CafeOverlayCard |
| **Wide** | ≥ 1280px | Full 48px + Nav | 한 줄 + padding 여유 | ListPanel 368 + Map flex + Overlay 420 | CafeOverlayCard |

**토큰 참조**: `theme.breakpoints.md = 768px`, `theme.breakpoints.lg = 1024px`, `theme.breakpoints.xl = 1280px`.

### 2.2. 글로벌 Header (2형태)

#### Full (Tablet + Desktop, ≥768px)
```
┌────────────────────────────────────────────────────────────┐
│  [M] Mooda    지도 · 즐겨찾기 · 내 리뷰    피드백 · [민]  │  48px
└────────────────────────────────────────────────────────────┘
```
- 좌: Logo (Coffee icon 16 + "Mooda" 17px/700)
- 중: Nav — `지도` (active: primary 배경 pill) / `즐겨찾기` / `내 리뷰`
- 우: `피드백` 텍스트 버튼 (ghost) + Avatar 32 (드롭다운)
- 비로그인: 우측 `로그인 / 회원가입` 버튼

#### Compact (Mobile, <768px)
```
┌────────────────────────┐
│ [M] Mooda       [민] ≡ │  48px
└────────────────────────┘
```
- 좌: Logo
- 우: Avatar (또는 햄버거 메뉴 drawer 트리거)
- Nav 는 Avatar 드롭다운 내부로 통합

### 2.3. `/map` 레이아웃 (PC ≥1024px, 시안 구현)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header (48px)                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ FilterBar [분위기필터][검색창─────────][칩][지역이동▼] (56px)       │
├──────────────┬───────────────────────────────────────────────────────┤
│ ListPanel    │                                                       │
│ (368px)      │                Map Area (flex)                        │
│              │                                                       │
│  ┌────────┐  │   ┌──────────────────────────┐   [ 이 지역 재검색 ]  │
│  │ Card 1 │  │   │  CafeOverlayCard        │   [+]                  │
│  │ Card 2 │  │   │  (420px, floating,       │   [-]                  │
│  │ Card 3 │  │   │   absolute)              │                       │
│  │ ...    │  │   └──────────────────────────┘                        │
│  │        │  │                                                       │
│  │        │  │                                [카카오맵 | 네이버지도] │
│  └────────┘  │                                           (우하단)    │
└──────────────┴───────────────────────────────────────────────────────┘
```

#### 레이아웃 규칙
- `MapPageWrapper` height = `100dvh - Header(48) - safe-top`
- `FilterBar` = 한 줄 강제 (`flex-wrap: nowrap; overflow: hidden`)
- `MainArea` = flex row, overflow hidden
- `ListPanel` = `width: 368px; flex-shrink: 0; border-right: 1px solid border`
- `MapArea` = `flex: 1; position: relative` (Overlay 의 positioning context)
- `CafeOverlayCard` = `position: absolute; top: 16px; left: 16px; width: 420px; max-height: calc(100% - 32px); z-index: z.overlayCard`
- `ResearchAreaChip` = 현 위치 유지 (중앙 상단)
- `MapProviderToggle` = **우하단** 배치 (시안과 일치 — 현재는 Toolbar 안)

### 2.4. `/map` 레이아웃 (Tablet/Mobile)

Tablet: 기존 Segmented + ListPanel ↔ MapArea 토글. BottomSheet 유지.
Mobile: 동일 + Header 컴팩트.

**변경 포인트**: `MapPageWrapper` height 계산에서 Header 가 **되살아나므로** 56px (구) → 48px (신) 로 조정.

### 2.5. `CafeOverlayCard` (PC 전용 floating)

#### 구조 (시안 분해)
```
┌────────────────────────────────────────┐
│  [←]                       [♡][↗][×] │  ← Top nav (36px)
├────────────────────────────────────────┤
│                                        │
│            [Hero 이미지]                │  ← 16:10 ratio
│                                        │
│  1/12                                  │  ← 페이지 카운터 bottom-left
├────────────────────────────────────────┤
│  [영업중] · 22:00 영업종료             │
│                                        │
│  커피마이스터                           │  ← 20px/700
│  ★4.8 (412) · 720m · WWWW              │
│                                        │
│  ┌────┬────┬────┬────┐                 │
│  │ 길찾기│ 전화│인스타│ 공유│           │  ← 4 equal
│  └────┴────┴────┴────┘                 │
├────────────────────────────────────────┤
│  이 카페의 분위기                       │
│  [조용한 82][감성적인 67][노트북 54]... │
├────────────────────────────────────────┤
│  기본 정보                              │
│  📍 서울 성동구 성수2가 289-10          │
│  🕐 매일 08:00 – 22:00                  │
│  📞 02-123-4567                         │
│  🔗 인스타그램                          │
├────────────────────────────────────────┤
│  리뷰 412             [전체보기 →]     │
│  ┌──────────────────────────────────┐  │
│  │ [avatar] 민지 ★★★★★              │  │
│  │ 조용하고 집중하기 좋아요. 원두...  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

#### 스펙
- 폭: 420px (wide ≥1280), 380px (desktop 1024~1279), 숨김 (<1024)
- 배경: `theme.colors.card`
- border: `1px solid theme.colors.border`
- border-radius: `theme.borderRadius.xl (20px)`
- shadow: `theme.shadows.lg`
- max-height: `calc(100% - 32px)` (위아래 16px 여백)
- overflow-y: `auto` (내부 스크롤)
- Top nav:
  - 좌측 `←` 뒤로가기 (모바일 플로우 재현, 옵션)
  - 우측 3버튼 (44×44 터치): ♡ 즐겨찾기 / ↗ 외부 공유 / × 닫기
  - position: sticky top, 반투명 배경 blur
- Hero 이미지:
  - `aspect-ratio: 16/10` (=420×263 wide 기준)
  - 여러 장일 경우 가로 스크롤 + scroll-snap
  - `1/12` 인디케이터 bottom-left absolute
- 액션 버튼 4개: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px`
- 분위기 태그: `CATEGORY_META` 색 재사용, count는 `MoodChipCount` 스타일
- 기본 정보: `MapPin/Clock/Phone/Instagram` lucide 아이콘 + 정보 row
- 리뷰 프리뷰: 1개 (최고 평점 or 최신) + "전체보기 →" 링크 → Overlay 내부 리뷰 탭 전환 또는 `/cafes/[id]?tab=reviews` 이동

### 2.6. `ListPanel` + `CafeListCard` (v2, 수평)

#### 시안 분해
```
┌─────┬──────────────────────────┐
│     │ 브이어스 [ww]            │
│ 썸  │ ★4.7(238) · 522m · 영업중│
│ 네일│ [조용한][감성적인][노트북]│
│ 64  │                          │
└─────┴──────────────────────────┘
     ↑ 선택 시 좌측 3px primary border
     ↑ primaryLight 배경
```

#### 스펙
- Wrapper: `display: flex; gap: 12px; padding: 12px; border-radius: 12px; transition: background 0.15s`
- 썸네일: `64x64; border-radius: 8px; object-fit: cover; flex-shrink: 0`
- 컨텐츠: `flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px`
- 첫 줄: `<CafeName>` (14.5px/700) + 가격대 태그 (`WWW` = 중간, 작은 폰트)
- 둘째 줄: `★4.7(238) · 522m · [영업중]` (12px/500)
- 셋째 줄: MoodTag 3개 max, overflow hidden + ellipsis
- 선택 상태: `background: primaryLight; border-left: 3px solid primary (inset)` — 또는 `box-shadow: inset 3px 0 0 primary`
- hover: `background: ink50`

#### Phase 6 일관성
- MoodTag 는 **CATEGORY_META 색 시스템** 적용 — 카테고리별 bg/fg
- 영업중 배지는 기존 `OpenBadge` 재사용 (`openStatus.ts`)

### 2.7. FilterBar (PC 한 줄)

#### 시안
```
[○ 분위기 필터 ②] [🔍 성수동 조용한 카페                    ] [조용한 ×][노트북 ×] [📍 성수/건대 ▼]
```

#### 스펙 (PC ≥1024px)
- `flex-direction: row; flex-wrap: nowrap; gap: 10px`
- 분위기 필터 버튼: 고정 폭 `flex-shrink: 0`
- **검색창 inline**: `flex: 1; min-width: 200px; max-width: 520px` — 현재는 `SearchTrigger` (모달 트리거)만 → PC 에서는 **실제 입력 가능한 검색창**으로 교체 (또는 클릭 시 search 페이지 openInSheet 모드)
- 칩 영역: `flex-shrink: 0; display: flex; gap: 6px; overflow-x: auto`
- 지역 이동 드롭다운: 고정 폭 `flex-shrink: 0`

#### Tablet/Mobile
- 현재 구조 유지. 검색창은 SearchTrigger (모달).

### 2.8. Toolbar 재구성 (PC 에서 Segmented 제거)

현재: `Toolbar = Segmented + Sort + MapProviderToggle`

변경:
- **PC (≥1024px)**: Segmented 미렌더. Toolbar 자체를 ListPanel 헤더로 이동 (`카페 N곳 · 정렬 ▼`). Provider 토글은 **우하단 지도 위로 이동** (시안 대로).
- **Tablet/Mobile**: 현재 Toolbar 유지.

### 2.9. URL deep-link (cafe query)

- `/map?cafe=abc123` → Overlay 자동 열림 + 해당 카페 마커 선택 + 지도 중심 이동
- Overlay 닫기 시 `cafe` 쿼리 제거
- `router.replace` 사용 (history 쌓기 방지). 뒤로가기는 ESC 와 동등 처리
- 모바일(<768px)은 BottomSheet 열림 (동일 URL 로직)
- 외부에서 공유받은 `?cafe=xxx` 로 진입 시: 카페 데이터 fetch → 마커 표시 + Overlay/Sheet 렌더
- 기존 `/cafes/[id]` 는 딥링크/SEO 용으로 유지. SSR fallback.

---

## 3. 🧩 컴포넌트 계층도

```
<Header />                               (전역 · 복원)
  └── <Logo> · <Nav> · <HeaderRight>
      └── <Avatar dropdown>
<MapPageWrapper>
  <FilterBar>
    <FilterButton> · <InlineSearch> (PC) / <SearchTrigger> (Mobile)
    · <ChipsScroll> · <AreaSelect>
  <Toolbar>                              (Tablet/Mobile 전용)
    <Segmented> · <SortWrap> (PC 에서는 Toolbar 자체 제거 또는 ListPanel 헤더로 이동)
  <MainArea>
    <MapArea>
      <CafeMapWrapper>
      <ResearchAreaChip>
      <MapProviderToggle>              (우하단 · PC 에서)
      <CafeOverlayCard>                (PC 전용, selectedCafeId 있을 때)
    <ListPanel>                         (PC/Tablet 에서)
      <ListPanelHeader> ("카페 N곳 · 정렬 ▼")
      <CardList>
        <CafeListCard[]>               (v2 수평)
    <BottomSheet>                       (Tablet/Mobile 전용)
```

### 공통 추출 — `CafeDetailBody`
`CafeOverlayCard` · `CafeDetailClient` · (`BottomSheet` 일부) 가 공유하는 섹션을 별도 컴포넌트로 분리:

```
<CafeDetailBody>
  <CafeMeta>            (영업상태 + 이름 + 별점/거리/가격대)
  <CafeActions>         (길찾기/전화/인스타/공유)
  <CafeMoodSection>     (이 카페의 분위기 칩)
  <CafeBasicInfo>       (주소/시간/전화/링크)
  <CafeReviewPreview>   ("리뷰 N" + 1개 샘플 + 전체보기)
```
Props: `cafe: Cafe`, `variant: 'overlay' | 'page' | 'sheet'` (spacing/padding 만 다름)

---

## 4. 🔨 Task 목록

### T7-B1. 테마 z-index + 토큰 보강 (30분) — **🌐 전역**

**파일**: `src/styles/theme.ts`

```ts
// z 에 overlayCard 추가 (bottomSheet 보다 낮게, mapFloatingButton 보다 높게)
z: {
  ...
  mapFloatingButton: 100,
  overlayCard: 200,        // ← 신규
  bottomSheet: 9999,
  ...
}
```

**커밋**: `feat(theme): z.overlayCard 스케일 추가 (T7-B1)`

---

### T7-B2. Header 전역 복원 + 컴팩트 모드 (2시간) — **🌐 전역 (PC/Tablet/Mobile 공통)**

**파일**: `src/components/layout/Header.tsx`, `Header.styles.ts`

**수정 전** (Phase 4 결정):
```tsx
const IMMERSIVE_PREFIXES = ['/map', '/search', '/cafes/'];
function shouldHideHeader(pathname: string): boolean {
  return IMMERSIVE_PREFIXES.some(...);
}
...
if (shouldHideHeader(pathname)) return null;
```

**수정 후**:
```tsx
// Phase 7 에서 Phase 4 의 "몰입 경로 숨김" 결정 철회.
// 홈 복귀 경로 + 브랜드 앵커가 더 중요.
// 대신 Header 높이를 56 → 48 로 절감해서 세로 공간 최소 손실.
// /search 는 자체 전용 상단 UI (검색 input + 뒤로가기) 를 가지므로 계속 숨김.
const HIDDEN_PREFIXES = ['/search'];
function shouldHideHeader(pathname: string): boolean {
  return HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
```

**Header.styles.ts 변경**:
- `HeaderWrapper` height: `56px` → `48px`
- `HeaderInner` padding 조정
- Mobile에서 Nav 숨김 (Avatar 드롭다운에 통합) — 이미 기존 구조가 그러함. 확인 후 유지.
- Nav 에 `즐겨찾기`, `내 리뷰` 추가 (시안). `내 리뷰` 는 프로필 경로로 라우팅 (현재 전용 페이지 없음 → Phase 4 의 `/profile` 내부 "내 리뷰" 카운트 섹션으로 스크롤).

**MapPageWrapper height 재계산**:
- `src/app/map/page.styles.ts:10` `calc(100vh - 56px - env(safe-area-inset-top, 0px))` → `calc(100dvh - 48px - env(safe-area-inset-top, 0px))`
- 동일하게 `/profile` 등의 height 도 영향 없는지 확인 (대부분 전체 viewport 사용 아님)

**수동 QA**:
- [ ] `/map` Header 표시, Mooda 로고 클릭 → 홈(`/`) 이동
- [ ] Header 높이 48px, `/map` 하단 잘림 없음
- [ ] Mobile (360×800) Header 로고 + Avatar 만
- [ ] 회귀: `/search` 는 여전히 Header 숨김

**커밋**: `feat(header): 전역 복원 + 높이 48px 축소 + Phase 4 몰입 숨김 철회 (T7-B2)`

---

### T7-B3. FilterBar PC 한 줄 + Inline Search (2시간) — **🖥️ PC 전용 (모바일 wrap 유지)**

**파일**: `src/app/map/page.styles.ts`, `MapClient.tsx`, `src/components/search/SearchTrigger.tsx`

**FilterBar 수정**:
```ts
export const FilterBar = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.bg};
  padding: 8px 10px;
  flex-shrink: 0;
  min-width: 0;
  z-index: ${theme.zIndex.dropdown};

  @media (min-width: ${theme.breakpoints.md}) { gap: 8px; padding: 8px 12px; }
  @media (min-width: ${theme.breakpoints.lg}) {
    gap: 10px;
    padding: 10px 20px;
    /* PC 는 완전 한 줄 강제. 넘치면 ChipsScroll 이 흡수. */
    overflow: hidden;
  }
`;
```

**Inline Search 도입**:
- 새 컴포넌트 `<InlineSearch>` 또는 `SearchTrigger` 에 `variant="inline"` prop 추가
- PC 에서는 input type="text" 렌더, `onFocus` 시 `/search` 라우팅 **대신** `/search?openOverlay=1` 또는 내부 모달 open
- **권장 (MVP)**: inline 보기는 SearchTrigger pill 확장형. `flex: 1; min-width: 200px; max-width: 520px`. 클릭 시 기존 `/search` 라우팅 유지 (PC 에서도 /search 는 자체 페이지). 추후 Phase 에서 inline 입력형으로 업그레이드.

**MapClient.tsx 변경**:
- FilterBar 내부 요소 순서: `[FilterButton] [SearchTrigger flex:1] [ChipsScroll] [AreaSelect]`
- PC 에서 `SearchTrigger compact=false` 로 풀 폭 사용

**반응형**:
```tsx
// SearchTrigger 는 tablet/mobile 에서 기존 compact 로직 유지
<SearchTrigger compact={viewportIsMobile || filters.moods.length > 0} />
```

**커밋**: `feat(map): FilterBar PC 한 줄 + SearchTrigger inline 확장 (T7-B3)`

---

### T7-B4. Toolbar 재구성 — PC Segmented 제거 + Provider 이동 (1시간) — **🖥️ PC 전용 (모바일 Toolbar 전체 유지)**

**파일**: `src/app/map/MapClient.tsx`, `page.styles.ts`

#### PC (≥1024px)
- `<Toolbar>` 자체 미렌더 또는 **ListPanel 상단으로 이동**
- Segmented(지도/목록) 제거 — ListPanel 과 Map 이 병행 표시되므로 불필요
- Sort 드롭다운은 **ListPanel 헤더**로 이동 → "`카페 N곳`  `정렬 ▼`"
- `MapProviderToggle` 은 **MapArea 내부 우하단**으로 absolute 배치

#### Tablet/Mobile
- 현재 Toolbar 구조 유지
- Provider 토글도 Toolbar 우측 유지

**조건부 렌더**:
```tsx
<ListPanel $visible={showListOrDesktop}>
  <ListPanelHeader>
    <ListCount>카페 {cafes.length}곳</ListCount>
    <SortWrap>...</SortWrap>
  </ListPanelHeader>
  ...
</ListPanel>

{/* MapArea 내부 */}
<MapArea>
  <CafeMapWrapper ... />
  <DesktopOnly>
    <MapProviderToggleFloating />  {/* position: absolute; bottom: 16px; right: 16px */}
  </DesktopOnly>
</MapArea>
```

**Styled 추가**:
```ts
export const MapProviderToggleFloating = styled.div`
  @media (min-width: ${theme.breakpoints.lg}) {
    position: absolute;
    bottom: 16px;
    right: 16px;
    z-index: ${theme.z.mapFloatingButton};
  }
  @media (max-width: ${theme.breakpoints.lg}) {
    display: none;
  }
`;
```

**커밋**: `feat(map): PC 에서 Segmented 제거 + Provider 토글 우하단 이동 (T7-B4)`

---

### T7-B5. `CafeListCard` 신설 — 수평 레이아웃 (2~3시간) — **🌐 전역 (`/map` ListPanel 한정)**

> **스코프 주의**: `/map` 의 ListPanel 에서만 `CafeListCard` 사용. 홈(`HomeClient`의 `인기 카페`), 검색 결과 페이지, 즐겨찾기 그리드, 컬렉션 등 **다른 경로의 `CafeCard` 는 건드리지 않는다** (기존 세로 레이아웃 유지).

**파일**: `src/components/cafe/CafeListCard.tsx` (신규), `CafeListCard.styles.ts` (신규)

**기존 `CafeCard` 는 유지** (홈 "이 주 추천", 검색 결과, 즐겨찾기 그리드에서 계속 사용). `CafeListCard` 는 `/map` 의 ListPanel 전용.

**컴포넌트 스켈레톤**:
```tsx
'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedCafe } from '@/store/slices/mapSlice';
import { OpenBadge } from '@/components/cafe/OpenBadge';
import { computeOpenStatus } from '@/lib/cafe/openStatus';
import { CATEGORY_META } from '@/constants/moods';
import { theme } from '@/styles/theme';
import type { Cafe } from '@/types';
import {
  Wrapper,
  Thumb,
  ThumbPlaceholder,
  Content,
  TitleRow,
  CafeName,
  PriceTag,
  MetaRow,
  MetaItem,
  MoodRow,
  MoodTag,
} from './CafeListCard.styles';

interface CafeListCardProps {
  cafe: Cafe;
}

function formatDistance(m?: number) {
  if (m === undefined) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

export function CafeListCard({ cafe }: CafeListCardProps) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.map.selectedCafeId);
  const isSelected = selectedId === cafe.id;

  const topMoods = [...cafe.moods]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3);

  const openStatus = cafe.hours && cafe.hours.length > 0
    ? computeOpenStatus(cafe.hours)
    : (cafe.isOpen === true ? 'open' : cafe.isOpen === false ? 'closed' : null);

  const mainPhoto = cafe.mainPhoto ?? cafe.photos?.[0]?.url;

  return (
    <Wrapper
      type="button"
      $selected={isSelected}
      aria-pressed={isSelected}
      onClick={() => dispatch(setSelectedCafe(cafe.id))}
    >
      <Thumb>
        {mainPhoto ? (
          <Image src={mainPhoto} alt="" fill sizes="64px" />
        ) : (
          <ThumbPlaceholder />
        )}
      </Thumb>
      <Content>
        <TitleRow>
          <CafeName>{cafe.name}</CafeName>
          {/* 가격대: 별도 필드 없으면 생략. Phase 7 범위 밖. */}
        </TitleRow>
        <MetaRow>
          <MetaItem>
            <Star size={12} fill={theme.colors.star} color={theme.colors.star} />
            {cafe.avgRating.toFixed(1)} ({cafe.reviewCount})
          </MetaItem>
          {cafe.distance !== undefined && (
            <MetaItem>· {formatDistance(cafe.distance)}</MetaItem>
          )}
          {openStatus && <OpenBadge status={openStatus} size="xs" />}
        </MetaRow>
        {topMoods.length > 0 && (
          <MoodRow>
            {topMoods.map((m) => (
              <MoodTag key={m.moodId} $category={m.moodCategory as keyof typeof CATEGORY_META}>
                {m.moodLabel}
              </MoodTag>
            ))}
          </MoodRow>
        )}
      </Content>
    </Wrapper>
  );
}
```

**Styles 핵심**:
```ts
export const Wrapper = styled.button<{ $selected: boolean }>`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: ${theme.borderRadius.lg};
  background: ${({ $selected }) => ($selected ? theme.colors.primaryLight : 'transparent')};
  box-shadow: ${({ $selected }) =>
    $selected ? `inset 3px 0 0 ${theme.colors.primary}` : 'none'};
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover { background: ${({ $selected }) =>
    $selected ? theme.colors.primaryLight : theme.colors.ink50}; }
`;

export const Thumb = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  background: ${theme.colors.ink100};

  img { object-fit: cover; }
`;

export const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const CafeName = styled.span`
  font-size: 14.5px;
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.ink900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${theme.colors.ink500};
`;

export const MoodRow = styled.div`
  display: flex;
  gap: 4px;
  overflow: hidden;

  > * {
    flex-shrink: 0;
  }
`;

export const MoodTag = styled.span<{ $category: keyof typeof CATEGORY_META }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${theme.borderRadius.full};
  font-size: 11.5px;
  font-weight: ${theme.fontWeight.medium};
  background: ${({ $category }) => CATEGORY_META[$category]?.bg ?? theme.colors.ink100};
  color: ${({ $category }) => CATEGORY_META[$category]?.fg ?? theme.colors.ink700};
  white-space: nowrap;
`;
```

**MapClient.tsx 반영**:
- 기존 `<CafeCard>` 를 `<CafeListCard>` 로 교체 (ListPanel 에서만)
- 홈/검색/즐겨찾기 등 다른 경로의 `<CafeCard>` 는 건드리지 않음

**키보드**:
- Wrapper 가 native `<button>` 이므로 Enter/Space 기본 동작. 선택 마킹 `aria-pressed`.

**커밋**: `feat(cafe): CafeListCard v2 — 수평 썸네일+정보밀도 (T7-B5)`

---

### T7-B6. `CafeOverlayCard` 신설 (3~4시간) — **🖥️ PC 전용 (`@media min-width: lg` + `useIsDesktop` 이중 가드)**

**파일**: `src/components/map/CafeOverlayCard.tsx` (신규), `CafeOverlayCard.styles.ts` (신규)

**컴포넌트 Props**:
```tsx
interface CafeOverlayCardProps {
  cafe: Cafe;
  onClose: () => void;
  onFavorite?: (cafeId: string, isFav: boolean) => void;
  isFavorited?: boolean;
}
```

**레이아웃** (시안 2.5 스펙 그대로):
```tsx
export function CafeOverlayCard({ cafe, onClose, onFavorite, isFavorited }: Props) {
  return (
    <OverlayWrap role="dialog" aria-label={`${cafe.name} 상세 정보`}>
      <TopNav>
        <BackBtn onClick={onClose} aria-label="닫기 (뒤로가기)">
          <ArrowLeft size={18} />
        </BackBtn>
        <TopActions>
          <IconBtn aria-label={isFavorited ? '즐겨찾기 제거' : '즐겨찾기'}
                   onClick={() => onFavorite?.(cafe.id, !isFavorited)}>
            <Heart size={18} fill={isFavorited ? theme.colors.err : 'none'}
                              color={isFavorited ? theme.colors.err : 'currentColor'} />
          </IconBtn>
          <IconBtn aria-label="공유 / 새 탭에서 열기"
                   onClick={() => window.open(`${window.location.origin}/cafes/${cafe.id}`, '_blank')}>
            <ArrowUpRight size={18} />
          </IconBtn>
          <IconBtn aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </TopActions>
      </TopNav>

      <HeroArea>
        {/* PhotoCarousel 재사용 or 경량 버전 */}
        <HeroImage cafe={cafe} />
        {cafe.photos.length > 1 && (
          <PhotoCounter>{activeIdx + 1}/{cafe.photos.length}</PhotoCounter>
        )}
      </HeroArea>

      <CafeDetailBody cafe={cafe} variant="overlay" />
    </OverlayWrap>
  );
}
```

**Styled 핵심**:
```ts
export const OverlayWrap = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 420px;
  max-width: calc(100% - 32px);
  max-height: calc(100% - 32px);
  background: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.lg};
  overflow-y: auto;
  overscroll-behavior: contain;
  z-index: ${theme.z.overlayCard};

  @media (max-width: ${theme.breakpoints.xl}) { width: 380px; }
  @media (max-width: ${theme.breakpoints.lg}) { display: none; }
`;

export const TopNav = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${theme.colors.borderLight};
  z-index: 1;
`;

/* BackBtn / IconBtn / TopActions 생략 — 44×44 touch target, ghost 버튼 */
```

**CafeDetailBody** 내부에 기존 Hero 이미지 / 액션 4버튼 / 분위기 / 기본 정보 / 리뷰 프리뷰 전부 배치. T7-B7 에서 분리 추출.

**ESC 키 + 배경 클릭 처리**:
```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [onClose]);
```

배경 클릭: Overlay 는 지도 위에 떠있지만 지도 자체를 가리지 않음 (좌측 420px 만 차지). 지도 클릭 시 BottomSheet 처럼 자동 닫기는 **하지 않음** (Airbnb 스타일). × 나 ESC 명시적 닫기.

**URL sync**: T7-B8 에서 처리.

**커밋**: `feat(map): CafeOverlayCard — PC 전용 floating 상세 (T7-B6)`

---

### T7-B7. `CafeDetailBody` 공통 추출 (1~2시간) — **🌐 전역 (Overlay/Sheet/Page 공유)**

**파일**: `src/components/cafe/CafeDetailBody.tsx` (신규), `CafeDetailBody.styles.ts` (신규)

`CafeOverlayCard` 와 `CafeDetailClient` 가 공유할 섹션 묶음:

```tsx
interface Props {
  cafe: Cafe;
  variant: 'overlay' | 'page' | 'sheet';
}

export function CafeDetailBody({ cafe, variant }: Props) {
  return (
    <Body $variant={variant}>
      <CafeMeta cafe={cafe} />
      <CafeActions cafe={cafe} />
      <CafeMoodSection cafe={cafe} />
      <CafeBasicInfo cafe={cafe} />
      <CafeReviewPreview cafe={cafe} />
    </Body>
  );
}
```

각 하위 섹션:
- `<CafeMeta>` — OpenBadge + 닫는 시간 + 이름 + 별점·거리·가격대
- `<CafeActions>` — `[길찾기][전화][인스타][공유]` grid 4. 각 버튼 `lib/externalLinks.ts` 재사용 (QA v2 N12 해결)
- `<CafeMoodSection>` — 분위기 칩 (카테고리 색 + count). `MoodFilterSheet` 의 셀 스타일 재활용
- `<CafeBasicInfo>` — MapPin/Clock/Phone/Instagram 아이콘 + 정보 row
- `<CafeReviewPreview>` — 리뷰 헤더(`리뷰 N · 전체보기 →`) + 샘플 1

`variant` 는 주로 패딩 차이:
- `overlay`: padding 20px
- `page`: padding 16px 24px (넓은 화면)
- `sheet`: padding 16px 12px

**중요**: 기존 `CafeDetailClient.tsx` 의 Hero 이미지와 탭 구조는 별도로 두고, **탭 내부 body 섹션** 만 `CafeDetailBody` 로 추출. 초기 단계는 중복 잔존 허용 → 추후 리팩토링.

**현실적 스코프 축소**: T7-B7 을 **완전 공통 추출 대신** `CafeOverlayCard` 에 inline 섹션 구현 후 `CafeDetailClient` 공통화는 후속 Phase 로 미룰 수 있음. 판단 기준: 3시간 넘기면 축소 버전으로.

**커밋**: `refactor(cafe): CafeDetailBody 공통 추출 (T7-B7)` 또는 `feat(cafe): CafeOverlayCard 내부 섹션 구성 (T7-B7 축소)`

---

### T7-B8. `MapClient` 레이아웃 재구성 + URL sync (3~4시간) — **🌐 전역 (URL sync) + 🖥️ PC 전용 (레이아웃 3-col)**

> **이중 스코프**: URL `?cafe=` 동기화는 전역 (모바일 BottomSheet 도 해당 쿼리로 열림). 3-column 레이아웃 변경은 PC 전용. 두 로직을 한 파일에서 다루므로 `useIsDesktop` 훅 분기를 명확히.

**파일**: `src/app/map/MapClient.tsx`

#### 변경 1 — 뷰포트 감지 훅 신설
**새 훅**: `src/hooks/useViewport.ts`
```ts
'use client';
import { useState, useEffect } from 'react';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}
```
이유: SSR hydration 미스매치 방지. 초기 false 로 render 후 client 에서 업데이트.

#### 변경 2 — URL query sync
`useSearchParams` + `useRouter` 조합:
```tsx
const router = useRouter();
const params = useSearchParams();
const cafeIdFromUrl = params.get('cafe');

// URL → Redux
useEffect(() => {
  if (cafeIdFromUrl && cafeIdFromUrl !== selectedCafeId) {
    dispatch(setSelectedCafe(cafeIdFromUrl));
  }
  if (!cafeIdFromUrl && selectedCafeId) {
    dispatch(setSelectedCafe(null));
  }
}, [cafeIdFromUrl]);

// Redux → URL (선택 카페 변경 시)
useEffect(() => {
  const current = new URLSearchParams(window.location.search);
  if (selectedCafeId) {
    if (current.get('cafe') !== selectedCafeId) {
      current.set('cafe', selectedCafeId);
      router.replace(`/map?${current.toString()}`, { scroll: false });
    }
  } else {
    if (current.has('cafe')) {
      current.delete('cafe');
      const qs = current.toString();
      router.replace(qs ? `/map?${qs}` : '/map', { scroll: false });
    }
  }
}, [selectedCafeId]);
```

**주의**: `scroll: false` 는 Next.js 15+ 에서 지원. 지도 페이지 스크롤 튐 방지.

#### 변경 3 — 카페 데이터 확보
`?cafe=xxx` 로 직접 진입 시 해당 카페가 현재 `cafes` 배열에 없을 수 있음 (다른 지역). 해결:
- Overlay 가 열릴 cafe 객체를 선제 fetch: `useGetCafeByIdQuery(selectedCafeId)` 활용
- 있으면 Overlay 에 전달, 없으면 cafe 리스트에서 find

#### 변경 4 — 조건부 렌더
```tsx
const isDesktop = useIsDesktop();
const selectedCafeObj = useMemo(() => {
  if (!selectedCafeId) return null;
  return cafes.find((c) => c.id === selectedCafeId) ?? cafeFromDirectFetch ?? null;
}, [selectedCafeId, cafes, cafeFromDirectFetch]);

return (
  <MapPageWrapper>
    <FilterBar>...</FilterBar>
    {/* PC 에서는 Toolbar 제거, Sort 는 ListPanel 헤더로 */}
    {!isDesktop && <Toolbar>...</Toolbar>}

    <MainArea>
      <MapArea>
        <CafeMapWrapper ... />
        <ResearchAreaChip ... />
        {isDesktop && <MapProviderToggleFloating />}
        {isDesktop && selectedCafeObj && (
          <CafeOverlayCard cafe={selectedCafeObj} onClose={handleCloseOverlay} />
        )}
      </MapArea>

      <ListPanel $visible={showListOrDesktop}>
        <ListPanelHeader>
          <ListCount>카페 {cafes.length}곳</ListCount>
          {isDesktop && <SortWrap>...</SortWrap>}
        </ListPanelHeader>
        ...
        {cafes.map((c) => <CafeListCard key={c.id} cafe={c} />)}
      </ListPanel>

      {!isDesktop && (
        <BottomSheet cafe={selectedCafeObj} onClose={handleCloseSheet} ... />
      )}
    </MainArea>
  </MapPageWrapper>
);
```

**`showListOrDesktop` 결정**:
```tsx
const showListOrDesktop = isDesktop || viewMode === 'list';
```
PC 는 항상 ListPanel 표시, Tablet/Mobile 은 `viewMode` 따름.

**MapArea `$hidden`**:
```tsx
<MapArea $hidden={!isDesktop && viewMode === 'list'}>
```
PC 는 항상 표시, Tablet/Mobile 은 list 모드에서 숨김.

#### 변경 5 — ListCard 클릭 핸들링
`CafeListCard` 내부에서 `dispatch(setSelectedCafe(cafe.id))` 만 함 → URL sync useEffect 가 `?cafe=` 추가 → Overlay 조건부 렌더. Redux 를 중앙 저장소로.

**커밋**: `feat(map): MapClient Overlay 레이아웃 + URL sync (T7-B8)`

---

### T7-B9. 하단 빈 공간 제거 + MapPageWrapper 재계산 (30분) — **🌐 전역**

**파일**: `src/app/map/page.styles.ts`

#### 기존 이슈
- `MapPageWrapper` height = `100dvh - 56 - safe-top` → Header 48px 로 바뀌면 `100dvh - 48 - safe-top`
- `ListInner` 의 `flex: 1; overflow-y: auto` 는 정상. 이슈는 **`ListPanel` 가 flex parent 의 height 계산 문제 가능**:
  - `MainArea` `flex: 1; overflow: hidden` → OK
  - `ListPanel` `display: flex; flex-direction: column` → OK
  - `ListInner` `flex: 1; overflow-y: auto` → OK
- 만약 하단 공간이 남는다면 다른 원인: `ListPanel` 이 `height: 100%` 누락, 또는 `MainArea height` 누락. 확인:

```ts
MainArea: flex: 1; overflow: hidden;  ✓
ListPanel: display: flex; flex-direction: column;
  /* height: 100% 추가 필요? MainArea 가 flex row 이므로 child 는 stretch 됨 */
```

#### 수정안
```ts
export const MapPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px - env(safe-area-inset-top, 0px));
  @supports (height: 100dvh) {
    height: calc(100dvh - 48px - env(safe-area-inset-top, 0px));
  }
  min-height: 0;  /* flex children 이 height: 0 과 flex: 1 로 잘 계산되도록 */
`;

export const MainArea = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;  /* ← overflow 계산 안정 */
  overflow: hidden;
`;

export const ListPanel = styled.div<{ $visible?: boolean }>`
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  flex-direction: column;
  min-height: 0;
  ...
`;

export const ListInner = styled.div`
  padding: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;  /* 기존 확인 */
`;
```

**핵심**: `min-height: 0` 이 flex children 의 스크롤 영역 계산에서 빠지면 flexbox가 자연 높이로 커지면서 하단이 뜸. 이걸 명시.

**커밋**: `fix(map): 하단 빈 공간 제거 + height calc 48px Header 반영 (T7-B9)`

---

### T7-B10. 회귀 QA + 반응형 매트릭스 (1시간) — **🌐 전역**

#### 자동 검증
```bash
pnpm typecheck
pnpm build
```

#### 수동 QA 매트릭스

| 뷰포트 | 시나리오 | 통과 조건 |
|---|---|---|
| 1440×900 | `/map` 진입 → 카페 카드 클릭 | ListPanel 카드 선택 강조 + Overlay 420 렌더 + URL `?cafe=` 반영 |
| 1440×900 | Overlay × 클릭 | Overlay 사라짐 + 카드 선택 해제 + URL `?cafe=` 제거 |
| 1440×900 | Overlay 에서 ESC | × 와 동일 |
| 1440×900 | Provider 토글 (우하단) | 카카오 ↔ 네이버 전환 정상 (BUG-MAP-A4 회귀 확인) |
| 1280×800 | Overlay 폭 | 380px 표시, 지도와 여백 유지 |
| 1024×768 | Overlay 사라짐 | 1024 경계에서 Overlay 미렌더, BottomSheet 로 전환 |
| 768×1024 | Tablet | Segmented 표시, 목록↔지도 토글 동작 |
| 375×812 | Mobile | Header 컴팩트, BottomSheet 정상 |
| 360×800 | 작은 모바일 | FilterBar 줄바꿈 허용, 주요 기능 전부 도달 |

#### 딥링크
- [ ] 새 탭에 `https://localhost:3000/map?cafe=<id>` 붙여넣기 → Overlay 자동 열림
- [ ] `/cafes/<id>` 직접 진입 → 기존 상세 페이지 (브라우저 뒤로가기 → 홈 복귀)

#### 회귀 3경로
- [ ] `/map` → 카페 탭 → Overlay/BottomSheet → × → 정상 닫힘
- [ ] `/cafes/[id]` → 갤러리 → ESC
- [ ] `/search` → 한글 → Enter

**커밋**: `docs: Phase 7-B 완료 기록 + 회귀 QA 체크`

---

## 5. 🎨 상세 스펙 (요약)

### 5.1. CafeOverlayCard
- 폭: 420 (wide) / 380 (desktop) / hidden (< lg)
- Top nav: sticky + backdrop-filter blur(8px) + semi-transparent white
- Hero: 16:10 ratio, 다중 이미지 시 가로 스크롤
- 액션 4버튼: grid-cols-4 + 8px gap + 44×44 square outlined
- 분위기 섹션: 카테고리 색 재사용 (T6-1 CATEGORY_META)
- 리뷰 프리뷰: 1개 + "전체보기 →" 링크 (`/cafes/[id]#reviews`)

### 5.2. CafeListCard
- Wrapper: flex row + 12px gap + 12px padding
- 썸네일: 64×64 border-radius 8px
- 선택 강조: inset 3px primary border + primaryLight 배경
- 태그: 카테고리 색, max 3개

### 5.3. Header (Full vs Compact)
- Full (≥md): `flex-direction: row; justify-content: space-between`. Nav 중앙
- Compact (<md): Logo 좌 + Avatar/메뉴 우. Nav 숨김 (드롭다운 통합)
- 공통: 48px, `theme.colors.bg`, `backdrop-filter: saturate(180%) blur(20px)` 유지

---

## 6. 📱 반응형 규칙

### 미디어 쿼리 상수
```ts
// theme.breakpoints
sm: '640px'
md: '768px'
lg: '1024px'
xl: '1280px'
2xl: '1536px'
```

### 핵심 분기점
- `< 768px` = Mobile: Header 컴팩트 / BottomSheet / Segmented / FilterBar 줄바꿈 허용
- `768~1023px` = Tablet: Header Full / BottomSheet / Segmented / FilterBar 한 줄 시도
- `≥ 1024px` = Desktop: Header Full+Nav / Overlay / ListPanel+Map 병행 / FilterBar 한 줄 강제
- `≥ 1280px` = Wide: Desktop 동일 + Overlay 420 폭

---

## 7. 🔁 데이터 흐름

### 7.1. `selectedCafeId` 는 Redux `mapSlice` 에서 SSoT
- `CafeListCard` 클릭 → `dispatch(setSelectedCafe(id))`
- Marker 클릭 → 어댑터에서 `dispatch(setSelectedCafe(id))`
- Overlay / BottomSheet 의 닫기 → `dispatch(setSelectedCafe(null))`

### 7.2. URL query sync (T7-B8)
- Redux → URL: `useEffect([selectedCafeId], update query)`
- URL → Redux: `useEffect([cafeIdFromUrl], dispatch)`
- 순환 방지: 값이 다를 때만 업데이트

### 7.3. popstate 처리
- 현재 BottomSheet 는 pushState 로 뒤로가기 지원 (QA v2 N1)
- Desktop Overlay 는 **pushState 안 함** (replaceState 만 사용)
  - 이유: 지도 state 가 히스토리에 계속 쌓이면 무한 뒤로가기
  - Overlay 닫기 = ESC 또는 × 로만. 브라우저 뒤로가기 는 `/map` → 이전 경로 (예: `/`)
- Mobile/Tablet BottomSheet 는 기존 pushState 로직 유지

### 7.4. 직접 진입 (`/map?cafe=abc`)
- URL query 먼저 읽음 → Redux 에 반영 → cafes 리스트에 없으면 `useGetCafeByIdQuery` fallback → Overlay/BottomSheet 렌더

---

## 8. ♿ a11y 체크

- [ ] CafeListCard 가 `<button>` 이고 `aria-pressed` 로 선택 상태 표현
- [ ] CafeOverlayCard `role="dialog"` + `aria-label="{카페명} 상세 정보"`
- [ ] Overlay 열릴 때 focus 를 × 버튼으로 이동 (`useRef` + `useEffect`)
- [ ] Overlay 닫힐 때 focus 를 선택된 ListCard 로 복귀
- [ ] ESC 키로 Overlay 닫기
- [ ] Overlay 내부 Tab 순서: Back → 액션 3개 → Body 내부
- [ ] 뷰포트 <1024 에서 Overlay 미렌더 → BottomSheet 만. 중복 focus trap 방지

---

## 9. ⚡ 성능 고려

- **CafeListCard 이미지**: `<Image fill sizes="64px">` → 64px 썸네일 최적화
- **Overlay 의 Hero 이미지**: `sizes="(max-width: 1280px) 380px, 420px"` 로 적정 해상도
- **URL replace 빈도**: 마커 쫙쫙 클릭 시 replaceState 플러드 가능. throttle 불필요 (replaceState 는 값싸다) 그래도 값이 같으면 업데이트 스킵 (T7-B8 규칙)
- **조건부 렌더**: `!isDesktop && <BottomSheet>` / `isDesktop && <CafeOverlayCard>` → 하나만 mount. 둘 다 mount 되면 focus trap 충돌

---

## 10. ✅ 회귀 QA (간결 버전)

### 기본 3경로 (모든 뷰포트)
- [ ] `/map` 마커 탭 → Overlay(PC) / BottomSheet(Mobile·Tablet) → × → 닫힘
- [ ] `/cafes/[id]` 갤러리 → ESC → 닫힘
- [ ] `/search` 한글 2자 → Enter → 상세

### 전역 신규 (PC + Tablet + Mobile 공통)
- [ ] `/` · `/profile` · `/map` · `/cafes/[id]` 모두 Header 표시
- [ ] `/search` 는 Header 숨김 유지 (회귀)
- [ ] Mooda 로고 클릭 → 홈 복귀 — **모바일에서도 동작**
- [ ] Header 높이 48px — 모바일 세로 스크롤 영역이 기존 대비 8px 감소 (56→48)
- [ ] ListCard 선택 → primaryLight 배경 + inset 3px primary border 강조
- [ ] `/map?cafe=<id>` 딥링크 → PC Overlay / Mobile BottomSheet 자동 열림
- [ ] 상세 닫기 → URL `?cafe=` 제거 확인 (DevTools Network/URL)

### PC 전용 (≥1024px)
- [ ] Overlay 420 (wide≥1280) / 380 (1024~1279) 정상 렌더, ListPanel 과 줌 컨트롤 모두 비침범
- [ ] FilterBar 한 줄 유지, 1280px 에서 overflow 없음
- [ ] Segmented(지도/목록) 미렌더
- [ ] Sort 드롭다운이 ListPanel 헤더에 표시
- [ ] Provider 토글이 MapArea 우하단 absolute

### 🚨 모바일 회귀 방지 (Critical)
> PC 전용 task (T7-B3/B4/B6) 가 모바일 UX 에 영향을 주지 않음을 확인.
- [ ] 모바일 360×800 에서 FilterBar 렌더가 Phase 7-B 전후 **시각적으로 동일** (스크린샷 비교 권장)
- [ ] 모바일 Segmented(지도/목록) 정상 토글 동작
- [ ] 모바일 BottomSheet 슬라이드 애니메이션 · 뒤로가기 닫기 · drag dismiss (있다면) 모두 기존 동작
- [ ] 모바일 Provider 토글이 Toolbar 우측 기존 위치에 남아있음 (우하단 floating 로 이동되지 않음)
- [ ] 모바일에서 ListPanel `viewMode='list'` 모드로 전환 시 CafeListCard 가 풀-폭으로 자연스럽게 렌더 (썸네일 64 + 컨텐츠 flex:1)

### BUG-MAP 회귀
- [ ] BUG-MAP-A2/A3/A4 전역 회귀 — 탭 전환 복귀 · 0×0 · provider 토글 정상 (T7-B4 provider 이동이 A4 와 충돌 없는지 확인)

---

## 11. 🤔 판단 필요 시

| 포인트 | 선택지 | 권장 |
|---|---|---|
| Overlay 뒤로가기 버튼 (좌측 ←) | 유지 vs 제거 | **제거 권장** (PC 에선 × 만으로 충분, 공간 절약). Mobile BottomSheet 에만 유지. 시안에는 있지만 conceptual |
| 홈 복귀 경로 | 로고 클릭만 vs 로고 + 뒤로가기 버튼 | **로고 클릭**. 표준 패턴. |
| Nav "내 리뷰" | 신규 `/profile/reviews` vs 프로필 내부 스크롤 | **Phase 7 범위 밖**. `/profile` 로 이동 후 추후 전용 페이지 (D2 리뷰 재설계에서 처리). |
| URL sync 의 query name | `?cafe=` vs `?c=` 단축 | **?cafe=** (가독성). |
| Overlay 공유 버튼 | 클립보드 복사 vs 새 탭 열기 | **새 탭 열기** (`/cafes/[id]`) — 시안의 ↗ 아이콘에 부합 |
| T7-B7 공통 추출 범위 | 풀 추출 vs 축약 | **시간 제약 시 축약** — OverlayCard 내부 inline. 추후 D2 리뷰 재설계 때 함께 |
| Inline Search (PC) | 즉시 input vs SearchTrigger pill | **SearchTrigger pill 유지** (MVP). Phase 8+ 에서 inline input 업그레이드 |
| FilterBar 가격대/거리 필터 | 신규 추가 | **Phase 7 범위 밖**. 시안에 없음. |

---

## 12. 🗺️ Phase 7 → Phase 8 로드맵

Phase 7 완료 후 자연스럽게 이어지는 후속:
- **Phase 8-A**: Inline Search — PC FilterBar 에서 실시간 입력 + 드롭다운 결과
- **Phase 8-B**: D2 리뷰 작성/편집 플로우 (리뷰 섹션이 Overlay 에서 탭 전환 가능하도록)
- **Phase 8-C**: 다크모드 (이제 Overlay · Header · ListCard 까지 토큰 2벌 필요)
- **Phase 8-D**: URL share / deeplink 확장 — `?cafe=`, `?moods=`, `?area=` 조합

---

## 13. 📦 Phase 7 커밋 종합

```
feat(theme): z.overlayCard 스케일 추가 (T7-B1)
feat(header): 전역 복원 + 높이 48px 축소 + Phase 4 몰입 숨김 철회 (T7-B2)
feat(map): FilterBar PC 한 줄 + SearchTrigger inline 확장 (T7-B3)
feat(map): PC 에서 Segmented 제거 + Provider 토글 우하단 이동 (T7-B4)
feat(cafe): CafeListCard v2 — 수평 썸네일+정보밀도 (T7-B5)
feat(map): CafeOverlayCard — PC 전용 floating 상세 (T7-B6)
refactor(cafe): CafeDetailBody 공통 추출 (T7-B7)
feat(map): MapClient Overlay 레이아웃 + URL sync (T7-B8)
fix(map): 하단 빈 공간 제거 + height calc 48px Header 반영 (T7-B9)
docs: Phase 7-B 완료 기록 + 회귀 QA 체크
```

**규칙 재강조**: 커밋 메시지에 `Co-Authored-By: Claude …` / `🤖 Generated with Claude Code` **절대 금지** (mooda_review/README.md 상단 글로벌 규칙 + `~/.claude/CLAUDE.md` 참조).

---

## 14. 🚫 Phase 7 에서 건드리지 않는 것

- `CafeCard` (홈/검색/즐겨찾기 그리드 용) — 기존 그대로. `CafeListCard` 는 `/map` ListPanel 한정 신규 컴포넌트
- `CafeDetailClient` (`/cafes/[id]`) — Hero/탭 구조 유지. `CafeDetailBody` 추출 후 탭 내부만 갱신 (T7-B7)
- `BottomSheet` 의 애니메이션·pushState 로직·slide/drag UX — 기존 그대로. T7-B8 에서는 cafe prop 소스만 Redux `selectedCafeId` 로 일원화 (기존에도 그러함)
- `MoodFilterSheet` — Phase 6 에서 재설계 완료. 건드리지 않음
- Prisma schema / 마이그레이션 — 불필요
- 인증/권한 로직 — 불필요
- 모바일 FilterBar 의 wrap 허용 · ChipsScroll 구조 — T7-B3 는 PC 미디어쿼리 분기로만 추가
- 모바일 Toolbar 의 Segmented + Provider 토글 위치 — T7-B4 는 PC 분기로만

---

**Phase 7 종료 조건**: §1 DoD 전부 통과 + §10 회귀 QA 전부 통과 + 위 커밋 10개 push → README 에 "Phase 7 완료" 추가 + plan_append `K` 섹션 체크.
