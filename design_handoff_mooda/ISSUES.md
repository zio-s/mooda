# Issues (27)

각 이슈는 `ISSUE-NN`로 라벨. 커밋 메시지 / PR 제목에 참조.

## Critical (4)

### ISSUE-01 — 검색 인풋 full-screen 부재
- **영역**: UX · 검색
- **파일**: `src/components/common/SearchInput.tsx`, `src/app/search/page.tsx` (신규)
- **상세**: `03_screens.md § 02 검색`

### ISSUE-02 — 마커 탭 시 상세로 직행, 비교 탐색 불가
- **영역**: UX · 지도
- **파일**: `src/components/map/CafeMap.tsx`
- **상세**: `03_screens.md § 01 지도 · Bottom Sheet`

### ISSUE-03 — "이 지역 재검색" 없음, 과도한 자동 페치
- **영역**: 성능 · UX
- **파일**: `src/store/api/cafeApi.ts`, `src/components/map/CafeMap.tsx`
- **상세**: `04_state_and_api.md § RTK Query 튜닝`

### ISSUE-04 — 카카오맵 SDK 재로드 · 리스너 leak 위험
- **영역**: 성능 · SSR/CSR
- **파일**: `src/app/layout.tsx`, `src/components/map/*`
- **상세**: `04_state_and_api.md § Kakao SDK 전역 로드`

## Medium (11)

### ISSUE-05 — 검색 인풋 네이티브 pill 감성 부재
- **파일**: `src/components/common/SearchInput.tsx`
- **상세**: `03_screens.md § 02 검색 · 헤더 인풋`

### ISSUE-06 — 마커가 단색 SVG 하나, LOD 없음
- **파일**: `src/components/map/*`, `public/marker-*.svg`
- **상세**: `03_screens.md § 01 지도 · 마커 LOD`

### ISSUE-07 — 16개 분위기 태그 가로 스크롤만, 전체 조망 불가
- **파일**: `src/components/filter/MoodFilter.tsx`
- **상세**: `03_screens.md § 03 필터`

### ISSUE-08 — 네이버지도 딥링크 부재
- **파일**: 카페 상세 액션 섹션
- **상세**: `IMPLEMENTATION_PLAN.md § Month 2`

### ISSUE-09 — 지도/목록 전환 UI 없음
- **파일**: `src/app/map/page.tsx`
- **상세**: `03_screens.md § 05 목록 뷰`

### ISSUE-10 — 리뷰 투표 UX 약함, CTA 부족
- **파일**: `src/components/cafe/MoodVotes.tsx` (혹은 해당 위치)
- **상세**: `03_screens.md § 04 카페 상세 · Mood Vote 카드`

### ISSUE-11 — 에러 상태 UI가 전역 토스트뿐
- **파일**: `src/components/common/ErrorState.tsx` (신규)
- **상세**: `04_state_and_api.md § 에러 · 로딩 · 스켈레톤`

### ISSUE-12 — 전역 스피너 로딩, 레이아웃 시프트
- **파일**: `src/app/cafes/[id]/loading.tsx` (신규) 외
- **상세**: `04_state_and_api.md § 에러 · 로딩 · 스켈레톤`

### ISSUE-13 — Redux store에 서버상태·UI상태 혼재
- **파일**: `src/store/slices/*`
- **상세**: `04_state_and_api.md § 상태 분리`

### ISSUE-14 — safe-area-inset 미적용
- **파일**: `src/app/layout.tsx`, `BottomSheet.tsx`
- **상세**: `02_components.md § safe-area`

### ISSUE-15 — 지도 마커 키보드·SR 접근 불가
- **파일**: `src/components/map/CafeMap.tsx`
- **상세**: `IMPLEMENTATION_PLAN.md § Month 2 · 접근성`

## Low (12)

### ISSUE-16 — 태그 배지 전부 primary
- **파일**: `src/components/ui/Tag.tsx`
- **상세**: `02_components.md § Tag`

### ISSUE-17 — 카페 상세 히어로 빈 placeholder
- **파일**: `src/app/cafes/[id]/page.tsx`
- **상세**: `03_screens.md § 04 카페 상세 · 히어로`

### ISSUE-18 — 그림자 토큰 단조 (단일 md)
- **파일**: `src/styles/theme.ts`
- **상세**: `01_tokens.md § shadows`

### ISSUE-19 — CTA 44px, 시각 무게 부족
- **파일**: `src/components/ui/Button.tsx`
- **상세**: `02_components.md § Button`

### ISSUE-20 — styled-components + shadcn 소스 일원화
- **파일**: `src/styles/theme.ts`, `tailwind.config.ts`
- **상세**: `02_components.md § 토큰 브릿지`

### ISSUE-21 — 영업중/영업종료 텍스트만, 스캔 어려움
- **파일**: `src/components/cafe/OpenBadge.tsx` (신규)
- **상세**: `02_components.md § OpenBadge`

### ISSUE-22 — 상세 페이지 주요 액션 흩어짐
- **파일**: `src/app/cafes/[id]/page.tsx`
- **상세**: `03_screens.md § 04 카페 상세 · 4-칸 quick action`

### ISSUE-23 — LocateBtn 36px, HIG 44 미달
- **파일**: `src/components/map/CafeMap.styles.ts`
- **상세**: `02_components.md § 터치 타깃`

### ISSUE-24 — 인풋 폰트 16px 미만, iOS 자동 줌인
- **파일**: 인풋이 있는 모든 파일
- **상세**: `02_components.md § 인풋`

### ISSUE-25 — 색상만으로 의미 전달 (색맹)
- **파일**: `OpenBadge.tsx` 등
- **상세**: `02_components.md § OpenBadge`

### ISSUE-26 — PWA 오프라인 전략 부재
- **파일**: `public/sw.js`, `src/lib/workbox/*` (신규)
- **상세**: `04_state_and_api.md § 오프라인`

### ISSUE-27 — Google/Blog 리뷰 통합 UI
- **파일**: `src/app/cafes/[id]/page.tsx`
- **상세**: `03_screens.md § 04 카페 상세 · 탭`
