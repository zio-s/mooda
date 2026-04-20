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
- [ ] 마커 탭 → **bottom sheet peek** — `03_screens.md § 01 지도 · bottom sheet`
- [ ] 기존 "마커 탭 → 상세 페이지 이동" 제거
- [ ] safe-area 최종 확인 (notch · home indicator · PWA standalone)
- [ ] 영업중/영업종료 배지 전면 적용
- [ ] iPhone 실기 PWA 설치 후 회귀 테스트

**Week 1 Exit 조건**: 모바일 PWA에서 검색·지도·선택까지 네이티브 느낌으로 완결.

---

## Week 2-3 — Core UX (FE 1 + BE 0.5 · 10영업일)

### Week 2
- [ ] **Mood Filter bottom sheet** — `03_screens.md § 03 필터`
  - [ ] 카테고리 탭 (분위기·씬·목적·인테리어·메뉴·편의시설)
  - [ ] 2열 그리드, 선택 상태, 실시간 매칭 카운트
  - [ ] sticky CTA "N곳 카페 보기"
- [ ] **마커 LOD** — `03_screens.md § 01 지도 · 마커`
  - [ ] 줌 ≥16: 이름 pill 마커
  - [ ] 줌 13-15: 도트 + 별
  - [ ] 줌 ≤12: 클러스터 숫자 배지
  - [ ] 선택 마커 bounce 애니메이션
- [ ] **스켈레톤 `loading.tsx`** — `03_screens.md § 04 카페 상세`
  - [ ] 카페 상세 · 목록 · 검색 결과 각각
- [ ] **에러 inline state** 컴포넌트 — `04_state_and_api.md § 에러`

### Week 3
- [ ] **카페 상세 리디자인** — `03_screens.md § 04 카페 상세`
  - [ ] 히어로 그라디언트 placeholder
  - [ ] 4-칸 quick action (길찾기·전화·저장·공유)
  - [ ] Mood Vote 카드 + **옵티미스틱 업데이트**
  - [ ] 탭(정보·리뷰·블로그·구글·사진)
- [ ] **/map segmented control** — `03_screens.md § 05 목록`
  - [ ] 지도/목록 상태 공유 (Redux UI slice)
  - [ ] 정렬 드롭다운(거리/평점/인기)
  - [ ] 목록 카드 디자인
- [ ] **RTK Query · UI slice 분리** — `04_state_and_api.md § 상태 분리`
  - [ ] 서버 상태는 RTK Query 전담
  - [ ] UI slice는 selectedMarkerId, mapCenter, activeFilters, sheetHeight 만

**Week 2-3 Exit 조건**: 사용자가 탐색 → 비교 → 선택 → 상세 → 투표 flow를 끊김 없이 완수 가능.

---

## Month 2 — Platform (FE 1 + BE 1 · 15-20영업일)

### 지도 어댑터
- [ ] `IMapAdapter` 인터페이스 정의 (`marker`, `cluster`, `bounds`, `event`)
- [ ] `KakaoMapAdapter` 리팩토링 (현 CafeMap 분리)
- [ ] `NaverMapAdapter` 구현 (Naver Maps JS v3)
- [ ] 런타임 swap — 유저 설정 또는 env 플래그
- [ ] 네이버지도 딥링크 (`nmap://route/public?...`) 상세 페이지 버튼

### PWA 오프라인
- [ ] Workbox 통합 (`04_state_and_api.md § 오프라인`)
- [ ] 최근 본 카페 7일 캐시 (CacheFirst)
- [ ] 오프라인 fallback 페이지 ("저장된 카페")
- [ ] SW 업데이트 토스트 ("새 버전 · 새로고침")

### 접근성
- [ ] 지도 영역 옆 시각적 숨김 목록 (`role="list"`)
- [ ] 마커·바텀시트 키보드 포커스 순서
- [ ] VoiceOver 라벨 (`aria-label` 전면 점검)
- [ ] 색상 외 의미 전달 (영업 상태에 아이콘 병행)
- [ ] Lighthouse a11y ≥ 95

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
