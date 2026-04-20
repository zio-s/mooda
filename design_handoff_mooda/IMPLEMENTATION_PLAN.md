# Implementation Plan

총 3단계. 각 단계 끝에 배포 가능한 상태여야 함.

---

## Week 1 — Quick Wins (FE 1명 · 5영업일)

임팩트가 크고 코드 리스크가 낮은 것부터. **토큰 → 공통 컴포넌트 → 화면 적용** 순.

### Day 1 — 디자인 토큰
- [x] `src/styles/theme.ts` 교체 → `01_tokens.md` 참고
  - [x] warm gray로 gray 팔레트 교체 (ink50–900, stone 기반)
  - [x] semantic 컬러 추가 (`ok`, `warn`, `err` + `*Bg`)
  - [x] shadows 4-tier (`sm`, `md`, `lg`, `xl`) + `sheet`
  - [x] radius · spacing 스케일 확인 (`space` 숫자 스케일 신규, 기존 `spacing` 유지)
  - [x] `safe`, `touch`, `z` 토큰 추가
  - [x] legacy key 별칭 유지 → 기존 styled-components 무수정 동작
- [x] CSS 변수 bridge — `globals.css :root`에 `--brand`, `--ink-*`, `--ok/warn/err`, `--shadow-*`, `--safe-*` 추가
- [x] `app/layout.tsx` viewport `themeColor` + `manifest.json theme_color` → `#b45309`
- [x] 기존 primary-heavy 사용처 grep → `tsc --noEmit` · `next build` 통과 확인

### Day 2 — 공통 컴포넌트
- [x] `OpenBadge.tsx` 신규 (영업중/곧마감/영업종료) + `lib/cafe/openStatus.ts` 헬퍼 (CafeHour 파싱, 마감 30분 전 → closing-soon, 자정 넘김 처리) — `02_components.md § OpenBadge`
- [x] `Button.tsx` 3-tier 높이 (lg 52 / md 44 / sm 40) + `fullWidth` · `loading`(스피너) · `leftIcon` · `rightIcon`. legacy variant(outline/destructive/link) · size(default/icon) 별칭 유지 — `02_components.md § Button`
- [x] `Tag.tsx` 변형 (solid/tint/outline) + `count` · `selected` · `onClick` 토글 — `02_components.md § Tag`
- [x] `SafeArea.tsx` (Top/Bottom/Inset/Fill) 래퍼 + globals.css에 `env(safe-area-inset-*)` 기반 CSS 변수 bridge — `02_components.md § safe-area`

### Day 3 — 검색 인풋 + 검색 화면
- [x] `app/search/page.tsx` + `SearchClient.tsx` + `page.styles.ts` 신규 — safe-area 헤더, 뒤로가기, 포커스 링, clear 버튼, 16px 인풋 — `03_screens.md § 02 검색`
- [x] `SearchTrigger.tsx` 신규 — readonly pill (h48/r24) · `/search` push · focus ring. MapClient에서 `CafeSearch` → `SearchTrigger`로 교체 (홈엔 검색 인풋 없음)
- [x] 플레이스홀더 "성수동 조용한 카페" 고정
- [x] `useRecentSearches` 훅 (localStorage v1, 최대 8개, 상세 이동 시에만 저장, clear/remove)
- [x] 결과 섹션 분리 — **Mooda 등록 카페**(sparkle 아이콘 + MOODA 배지) / **Kakao Local 검색**(pin 아이콘 + 자동등록 안내 노트). 키워드 하이라이트(`<mark>`) 적용. 디바운스 200ms, AbortController로 in-flight 취소

### Day 4 — 지도 개선 1
- [x] "이 지역 재검색" 플로팅 칩 — `ResearchAreaChip.tsx` 신규. top:12 / z:mapFloatingButton / ink-900 bg · white fg · r999 · fs12.5/700 · shadow lg. 커밋된 중심에서 300m↑ 드리프트, geohash6 버킷 변경, 또는 줌 변경 시 노출. 탭 → refetch + commit 갱신.
- [x] 드래그 종료 debounce 300ms (`useDebouncedMapBounds` / `useDebouncedMapCenter`) + geohash 버킷 (`lib/geohash.ts`, haversine 포함) — `04_state_and_api.md § RTK Query 튜닝`
- [x] 자동 페치 OFF — `committedParams`/`committedLevel` 상태만 `useSearchCafesQuery`에 전달. debounced bounds/center 변화는 드리프트 판단 용도로만 쓰이고 재요청을 쏘지 않음. 필터 변경과 최초 bounds 도달, area preset 선택 시에만 자동 커밋.
- [x] LocateBtn 36→40px (`theme.touch.sm`), border-radius 12, `theme.z.mapFloatingButton`

### Day 5 — 지도 개선 2 + QA
- [x] 마커 탭 → **bottom sheet peek** — 기존 onCafeSelect 플로우 유지, 오버레이 제거로 인해 마커 탭은 peek만 표시
- [x] 기존 "마커 탭 → 상세 페이지 이동" 제거 — `CafeMap.tsx`의 yAnchor 1.35 리치 팝업 (상세 페이지 `<a>` 링크 포함) 삭제. Routing은 BottomSheet의 "상세 보기" 버튼을 통한 명시적 액션으로만.
- [x] safe-area 최종 확인 — BottomSheet `InfoSection` 하단 padding에 `env(safe-area-inset-bottom)` 추가, `LocateBtn` bottom/right도 safe-area 반영. 기존 `viewportFit: 'cover'`, `globals.css html height: -webkit-fill-available; body min-height: 100dvh`와 조합.
- [x] 영업중/곧마감/영업종료 배지 전면 적용 — `CafeCard`의 StatusBadge(binary) → `OpenBadge`(3-state, `computeOpenStatus(cafe.hours)` 기반)으로 교체. `BottomSheet` MetaRow에도 `OpenBadge size="md"` 노출. `cafe.hours`가 없으면 레거시 `isOpen` 부울로 폴백.
- [ ] iPhone 실기 PWA 설치 후 회귀 테스트 *(사용자 확인 필요 — 코드 준비 완료)*

**Week 1 Exit 조건**: 모바일 PWA에서 검색·지도·선택까지 네이티브 느낌으로 완결.

---

## Week 2-3 — Core UX (FE 1 + BE 0.5 · 10영업일)

### Week 2
- [x] **Mood Filter bottom sheet** — `MoodFilterSheet.tsx` + API `/api/cafes/count` + `useCountCafesQuery` 훅 — `03_screens.md § 03 필터`
  - [x] 카테고리 탭 (분위기·씬·목적·인테리어·메뉴·편의시설·촬영특성) · 선택 카운트 배지 · 활성 탭 brand 밑줄
  - [x] 2열 그리드 · 52h · r14 · 1.5px border (ink-200/brand) · 선택 시 primaryLight + 체크 원 · draft 상태로 "적용" 전까지 홀드
  - [x] 실시간 매칭 카운트 — 200ms 디바운스 후 `/api/cafes/count` (Prisma count, moods + openNow + bounds 필터 재사용)
  - [x] sticky CTA "N곳 카페 보기" — 적용 시 draft → 기존 `toggleMoodFilter` diff로 mapSlice 커밋 + 시트 닫기
- [x] **마커 LOD** — `03_screens.md § 01 지도 · 마커`
  - [x] `components/map/markers/CafeMarkers.tsx` 신규 — kakao level 기반 분기. level ≤ 3: 이름 pill (r999 · 11.5/600 · brand 선택 강조), level 4-6: 22px 도트 + 선택 시 별 배지, level ≥ 7: 기존 MarkerClusterer.
  - [x] 선택 마커 bounce 0.6s + scale 강조 (pill 1.05 / dot 1.25)
  - [x] 뷰포트 ±10% 패딩 bounds 내 마커만 렌더 → 줌인 상태에서 불필요한 DOM 오버레이 제거
- [x] **스켈레톤 `loading.tsx`** — `03_screens.md § 04 카페 상세`
  - [x] `app/cafes/[id]/loading.tsx` — 320 hero + title + 4칸 quick action + vote card
  - [x] `app/map/loading.tsx` — 필터바 + 지도 placeholder + 목록 rows 3개
  - [x] `app/search/loading.tsx` — 헤더 + rows 6개 (가변 폭으로 자연스러움)
  - [x] `ui/skeleton.tsx` 개편 — linear-gradient shimmer(ink-100 → ink-200) 2s, `SkeletonText`/`SkeletonBlock` 파생 컴포넌트 추가
- [x] **에러 inline state** 컴포넌트 — `components/feedback/ErrorState.tsx` (variant banner/block + onRetry + err/errBg 색상) — `04_state_and_api.md § 에러`

### Week 3
- [x] **카페 상세 리디자인** — `03_screens.md § 04 카페 상세`
  - [x] 히어로 그라디언트 placeholder — HeroShell 320px + primaryLight2→primaryLight 135deg + 빗금 텍스처 + ☕ 글리프. 사진 있을 때 HeroPhotoFill로 스왑, HeroCountPill("1/N") 노출.
  - [x] 4-칸 quick action — 길찾기(네이버/카카오 딥링크 confirm) · 전화(tel: 승격, 없으면 disabled+toast) · 저장(favorite 토글) · 공유(navigator.share + clipboard 폴백). brandTint bg / r12 / 11.5/600 · active scale 0.97.
  - [x] Mood Vote 카드 + 실패 shake — 기존 로컬 옵티미스틱 유지, 실패 시 MoodVoteButton `$shake` keyframes 400ms + 전용 toast. *(cacheApi.util.updateQueryData 도입은 CafeDetailClient가 initialData 주입 방식이라 스킵 — 필요 시 별도 PR)*
  - [x] 탭(정보·리뷰·블로그·구글·사진) — 기존 Radix Tabs 유지, Hero/메타 재구성에 맞춰 ContentInner 래퍼로 감쌈.
  - [x] OpenBadge md 메타에 전면 배치 + 운영시각 "22:00까지"로 축약.
- [x] **/map segmented control** — `03_screens.md § 05 목록`
  - [x] 지도/목록 상태 공유 — mapSlice `viewMode: 'map' | 'list'` + `setViewMode` 액션 추가. 기존 로컬 `showList` state 제거.
  - [x] 정렬 드롭다운(거리/평점/인기) — SortWrap/SortMenu + role=menuitemradio, 외부 클릭 닫힘, `setSort` 디스패치.
  - [x] Segmented UI — bg ink-100 padding 3 / 활성 탭 bg white + shadow sm + 700 weight, 목록 탭에 결과수 배지.
  - [x] 목록 카드 디자인 — 기존 `CafeCard` 재사용 (Day 5에서 OpenBadge로 개편 완료).
- [x] **RTK Query · UI slice 분리** — `04_state_and_api.md § 상태 분리`
  - [x] 서버 상태는 RTK Query 전담 — `cafesApi`(search, count, getCafe, blogs, google reviews, favorites, transit, searchNearby) 확인, slice에 서버 데이터 없음(isLoading/cafes[]/error 없음).
  - [x] UI slice는 center/level/bounds/selectedCafeId/userLocation/viewMode/filters만 보유 — 스냅 높이는 바텀시트 컴포넌트 로컬 상태로 남김.

**Week 2-3 Exit 조건**: 사용자가 탐색 → 비교 → 선택 → 상세 → 투표 flow를 끊김 없이 완수 가능.

---

## Month 2 — Platform (FE 1 + BE 1 · 15-20영업일)

### 지도 어댑터
- [x] 어댑터 추상화 — 인터페이스 대신 **컴포넌트 레벨**(`CafeMapAdapterProps`)로 통합. React/SSR에 자연스럽고 imperative 핸들링 불필요. `components/map/adapters/types.ts`.
- [x] `KakaoCafeMap` 어댑터 — 기존 `CafeMap.tsx` 로직을 `adapters/KakaoCafeMap.tsx`로 통째 이동 (behavior-preserving). `CafeMap.tsx`는 provider router.
- [x] `NaverCafeMap` 어댑터 — Naver Maps JS v3. `useNaverMapsLoader` 훅으로 SDK 동적 로드(onload/onerror 이벤트 + 중복 주입 방지), `naver.maps.Map` 인스턴스를 ref 관리, idle/click 이벤트로 bounds/center/zoom을 Redux에 sync. 마커는 inline SVG(brand 22px dot) icon.content로 표시 + click handler → setSelectedCafe. zoom ↔ Kakao level 변환 매핑(`naverZoom = 20 − kakaoLevel`) 포함. v1은 클러스터 미구현(marker-tools submodule은 훅만 준비).
- [x] 런타임 swap — `mapSlice.provider` ('kakao' | 'naver') + localStorage persist(`mooda:map-provider:v1`), `hydrateMapProvider` 액션으로 SSR/CSR hydration mismatch 방지. `MapProviderToggle` segmented 컨트롤을 /map Toolbar에 노출. `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 미설정 시 Naver 버튼 disabled + title로 안내.
- [x] 네이버지도 딥링크 (`nmap://route/public?...`) — 상세 페이지 Quick Actions 길찾기 및 BottomSheet "네이버지도 길찾기" 버튼 (별도 커밋에서 선반영, `90103cd`).

### PWA 오프라인
- [x] Workbox **미사용**·수제 전략 — `public/sw.js` 재작성. 정적(script/style/font/image/_next/static) = Stale-While-Revalidate, `/api/cafes/*` 일반 = Network First (3s timeout + 24h TTL), `/api/cafes/{id}` = Cache First (7일 · 50 entries LRU), 네비게이션 = Network First + offline fallback. 캐시 이름 `mooda-v3-*`로 네임스페이스 + activate 시 valid 아닌 캐시 전량 purge.
- [x] 최근 본 카페 7일 캐시 (CacheFirst) — `x-mooda-cached-at` 헤더로 저장 시각 태깅 + `enforceEntryLimit`로 LRU 축출. `/cafes/{id}` 네비게이션 HTML도 동일 전략으로 오프라인에서도 열람 가능.
- [x] 오프라인 fallback 페이지 — `app/offline/page.tsx` + `OfflineClient.tsx`. 최근 본 카페 목록(useRecentSearches 재사용) · navigator.onLine 관찰 · "다시 시도" 버튼. `precacheAndRoute` 대체로 `/offline`을 SW install 시 강제 캐시.
- [x] SW 업데이트 토스트 — `components/pwa/ServiceWorkerManager.tsx`. reg.waiting / updatefound / installing.statechange 감지해서 "새 버전이 준비됐어요" sonner 토스트 + "새로고침" 액션 → `postMessage({type:'SKIP_WAITING'})` → controllerchange 이벤트에서 reload. 1시간마다 reg.update()로 장시간 켜둔 탭 대응.

### 접근성
- [x] 지도 영역 옆 시각적 숨김 목록 — `components/a11y/VisuallyHidden.tsx` + `components/map/VisuallyHiddenCafeList.tsx`. role="list" + 포커스 가능한 상세 링크로 스크린리더/키보드 사용자가 지도 마커 정보에 접근 가능.
- [x] 마커·바텀시트 키보드 포커스 순서 — 스킵 링크(`skip-to-content`) + `:focus-visible` 브랜드 outline 전역 스타일 추가. Radix Dialog(MoodFilterSheet) 자체 focus trap 이미 내장. 마커 `role=button` + `aria-label` 적용됨.
- [x] VoiceOver 라벨 전면 점검 — lightbox X 버튼/prev/next, HeroFab, OpenBadge `role=status`, SearchTrigger `aria-label`, MapProviderToggle `role=group` + `aria-pressed` 등 주요 인터랙션 지점 aria-label 추가. SVG icons에 `aria-hidden` 명시.
- [x] 색상 외 의미 전달 — OpenBadge가 status별 아이콘(●/◐/○) + 텍스트 병행 (02_components.md § OpenBadge). 나머지 지표(별점/거리)는 숫자 텍스트 병행이므로 색맹 접근성 문제 없음.
- [ ] Lighthouse a11y ≥ 95 *(사용자가 브라우저에서 실측 필요 — 코드 준비 완료)*

### 커뮤니티 고도화
- [ ] 리뷰 작성 플로우 재설계 (사진·태그 투표·텍스트)
- [ ] 프로필 페이지 저장·방문 이력
- [ ] 다른 사용자 큐레이션(옵션)

**Month 2 Exit 조건**: 지도 공급자 전환 가능, 오프라인에서도 최근 카페 열람 가능, a11y 기준 통과.

---

## 작업 브랜치 & PR 전략

- 브랜치: `refactor/design-system-tokens` → `feat/search-fullscreen` → `feat/map-bottomsheet` … 처럼 작업 단위로 분리
- PR 하나당 이슈 1-3개 커버, 주 단위 릴리즈 브랜치로 merge
- 각 PR 템플릿에 "해당 이슈 번호(`ISSUES.md` § ID) · 스크린샷 · 모바일 실기 확인 체크"

## 전역 수용 기준

- [ ] iPhone 12-15 PWA standalone 기준 레이아웃 이상 없음
- [ ] 320px 너비에서 가로 스크롤 없음
- [ ] Lighthouse Performance ≥ 85 (mobile · 3G Slow throttle)
- [ ] TypeScript strict 유지 — `any` 신규 금지
- [ ] 모든 styled-component의 색/간격/라디우스는 `theme.ts` 참조 (하드코딩 금지)
