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
- [ ] `OpenBadge.tsx` 신규 (영업중/곧마감/영업종료) — `02_components.md § OpenBadge`
- [ ] `Button.tsx` 3-tier 높이 (52/44/40) — `02_components.md § Button`
- [ ] `Tag.tsx` 변형 (solid/tint/outline) — `02_components.md § Tag`
- [ ] `SafeArea` 래퍼 혹은 global CSS에 `env(safe-area-inset-*)` 적용 — `02_components.md § safe-area`

### Day 3 — 검색 인풋 + 검색 화면
- [ ] `app/search/page.tsx` 신규 (full-screen 검색) — `03_screens.md § 02 검색`
- [ ] 홈/맵의 `SearchInput.tsx`를 **탭 시 `/search`로 push** 하는 트리거로 전환
- [ ] 플레이스홀더 정책 확정: "성수동 조용한 카페"
- [ ] 최근 검색 로컬스토리지 (`useRecentSearches` 훅)
- [ ] Kakao Local 자동완성 섹션 / Mooda 등록 카페 섹션 분리

### Day 4 — 지도 개선 1
- [ ] "이 지역 재검색" 플로팅 칩 — `03_screens.md § 01 지도`
- [ ] 드래그 종료 debounce 300ms + geohash 버킷 — `04_state_and_api.md § RTK Query 튜닝`
- [ ] 자동 페치 OFF, 명시 트리거로만 재요청
- [ ] LocateBtn 36→40px

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
