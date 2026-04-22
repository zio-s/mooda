## 남은 10% — Final Polish 체크리스트

코드 구현은 96% 완료. 이하는 실기 실측 + 미세 튜닝 영역.

### A. 실기기 실측 (사용자 작업)
- [ ] iPhone 12/13/14/15 PWA standalone — 레이아웃/safe-area/제스처
- [ ] iPhone SE(4.7") — BottomSheet 75vh 한계 확인
- [ ] 안드로이드 Pixel — 물리 뒤로가기로 BottomSheet 닫힘 동작
- [ ] iOS Safari 주소창 숨김 시 100dvh 정상 동작
- [ ] 오프라인 전환 직후 `/offline` 페이지 표시 + "다시 시도" 버튼
- [ ] SW 업데이트 토스트 수동 트리거 (dev tools에서 SW 업데이트 강제)

### B. Lighthouse / 성능 (사용자 작업)
- [ ] Lighthouse Performance ≥ 85 (mobile · 3G Slow)
- [ ] Lighthouse a11y ≥ 95
- [ ] First Load JS < 200KB (next build 확인)
- [ ] 지도 페이지 LCP ≤ 2.5s

### C. 코드 미세 수정 (Claude Code로 가능)
상세 진단은 `05_review_after_impl.md` 참조.
- [x] `BottomSheet` 물리 뒤로가기 통합 — `795b31c`
- [x] `NamePill`/`Dot` bounce 애니메이션에 `prefers-reduced-motion` 대응 — `a69fea8` (전역)
- [x] `openStatus.ts` `closingSoonMinutes` 옵션 파라미터화 — `53ea780`
- [x] `ResearchAreaChip` Toolbar/FilterBar와 겹침 여부 검증 — `e5142b8` (구조상 겹침 없음 확인 + CSS 변수 훅)
- [x] `CafeCard` PhotoDots 3개 초과 시 "N/M" 텍스트 인디케이터 — `d1cfb1d`
- [x] `primaryText` 토큰 리네이밍 → `onPrimaryTint`, 카페명 `ink900` 통일 — `4f72f5c`
- [x] `BottomSheet` 동적 max-height — `5a4c833` (`min(75vh, calc(100dvh-140px))`)
- [ ] `BottomSheet` snap points(peek/half/full) 3단 **[선택 · 릴리즈 후]**
- [ ] `CafeCard` PhotoCarousel `onScrollEnd` + rAF throttle **[선택 · jank 확인 후]**

### C'. 06_responsive_qa Phase 1 (QA 리뷰 반영)
- [x] QA-C1 Header safe-area-inset-top — `c2be9f3`
- [x] QA-C2 BottomSheet overscroll + scroll chain — `5a4c833`
- [x] QA-C3 MoodFilterSheet body scroll lock + overscroll — `faaa7e8`
- [x] QA-C4 Search 인풋/버튼 44px — `dba269e`
- [x] QA-C5 SearchTrigger compact + FilterBar 축소 — `4a0eb73`
- [x] QA-C7 Search Wrapper `height:100dvh; overflow:hidden` — `925cb3f`
- [x] QA-M9 한글 IME composition 처리 — `6eebd5f`

### C''. 추가 현장 수정 (실기 검증 중 발견)
- [x] 가로 스크롤 (skip-link `left:-9999px`) → clip-path — `6067d0d` + `e1171a3`
- [x] FilterBar overflow (flex-shrink:0 과다 적용) — `1317494`
- [x] MoodFilterSheet z-index 지도 컨트롤에 가림 — `1317494`
- [x] MoodFilterSheet 탭별 높이 변동 — `1317494` (fixed 80dvh)
- [x] MoodFilterSheet X 버튼 + "전체 해제" 겹침 (X 제거) — `3401442`
- [x] AreaSelect 드롭다운 우측 오버플로 — `3401442` (right-anchor)
- [x] 목록/즐겨찾기에서 카드 전체 영역 클릭 → 상세 이동 — `e1928b3`

### C'''. 06_responsive_qa Phase 2 — 권장 잔여
- [x] **M5** FavoriteBtn hit area 44×44 — `f637075`
- [x] **M7** MapClient EmptyState 이모지 div 인라인 스타일 제거 — `f637075`
- [x] **L6** `:focus-visible` box-shadow 교체 — `f637075`
- [x] M4 Header Nav 모바일 margin-left 축소 — `f637075`
- [x] L1 SegmentedBtn 아이콘 14→16 — `f637075`

### D. 관측 지표 설계 (제품 결정)
- [ ] 분위기 태그별 클릭률/선택률 로깅
- [ ] 검색 키워드 top 50 수집
- [ ] 지도 provider 전환 비율 (Kakao vs Naver)
- [ ] BottomSheet → 상세 전환율
- [ ] 길찾기/전화/저장/공유 Quick Action 탭 수

### E. 콘텐츠 QA
- [ ] 분위기 태그 16개 라벨 실제 적절성 검토
- [ ] `ErrorState` 문구 7종 감정 톤 통일
- [ ] `/offline` 카피 검토
- [ ] OpenBadge "곧 마감" 문구 UX 라이터 리뷰

### F. Post-release Backlog (다음 분기)
- [ ] **D2** 리뷰 작성 플로우 재설계 (사진·태그 투표·텍스트) — 1순위
- [ ] **D3** 프로필 "방문 이력" · "저장함" 탭
- [ ] **D5** 분위기 태그 "인기순" vs "카테고리별" 토글
- [ ] **D1** Naver 어댑터 클러스터러 v2

### G. Phase 3-6 실구현 완료 (Claude Design 지휘 · Claude Code 구현)
- [x] **Phase 3** — 토큰 잔여물 제거 + Polish (T3-1~8, 커밋 `8dbc657`~`dfaec5f`)
- [x] **Phase 4** — 프로필 허브 + Header 조건부 + `/api/users/me/stats` (T4-1~4, 커밋 `9642f97`~`8929ee0`)
- [x] **Phase 5** — 로그인/회원가입 리디자인 + toast action (T5-1~4, 커밋 `ee1d155`~`3a66222`)
- [x] **Phase 6** — UI 이모지 전면 제거 + 카테고리 색 시스템 (T6-1~6, 커밋 `cf6f379`~`d938024`)

### H. Phase 6 후속 (P7-A 후보 · 09 리포트 PART 1 참조)
- [x] **P6-06** `src/types/index.ts:10-16` `Mood` 인터페이스 삭제(사용처 0) 또는 재정의 (커밋 `d50e4df`)
- [ ] **P6-07** `prisma/schema.prisma:117` `Mood.emoji` 컬럼 유지/제거 결정 (= T7-3 · 사용자 결정 대기)
- [x] **P6-08** `prisma/seed.ts` + `scripts/seed-cafes.ts` emoji 필드 제거 + seed 일원화 (17 vs 54 불일치 해소) (커밋 `64acbf6`) — SSoT `src/constants/moods-data.ts` 로 3중 중복 제거

### I. Phase 7 후보 (09 리포트 PART 3)
- [x] **P7-A** Phase 6 후속 클린업 (H 섹션, 0.5일) — P6-06 `d50e4df` + P6-08 `64acbf6`. T7-4 재스캔 active emoji 0건
- [ ] **P7-B-original** D2 리뷰 작성 플로우 재설계 (3-5일) — K 섹션 Desktop Overlay 완료 후 재검토
- [ ] **P7-C** 다크모드 토큰 분기 (1.5일)
- [ ] **P7-D** 관측 지표 설계 (1일)
- [ ] **P7-E** 관리자 페이지 리디자인 (2일)
- [ ] **P7-F** view-transition 페이지 전환 (0.5일)

### K. ✅ Phase 7-B · Desktop Overlay 레이아웃 (`phase_3_5/PHASE_7_DESKTOP_OVERLAY.md`) — **완료 (2026-04-21)**
- [x] **T7-B1** `theme.z.overlayCard` 스케일 추가 (커밋 `70d208b`)
- [x] **T7-B2** Header 전역 복원 + 48px 축소 + `/search` 만 숨김 유지 (커밋 `bc80a1d`)
- [x] **T7-B3** FilterBar PC 한 줄 + SearchTrigger inline 확장 + `useIsDesktop` 훅 신설 (커밋 `a95548e`)
- [x] **T7-B4** PC 에서 Segmented 제거 + Provider 토글 우하단 이동 + Sort 를 ListHeader 로 이관 (커밋 `48bd98e`)
- [x] **T7-B5** `CafeListCard` v2 — 수평 썸네일+정보밀도 (커밋 `888aeee`)
- [x] **T7-B6** `CafeOverlayCard` — PC 전용 floating 상세 (커밋 `f3e0482`)
- [x] **T7-B7** `CafeDetailBody` 공통 추출 — Overlay 소비. 향후 `CafeDetailClient` 이관 가능 (커밋 `f7633c4`)
- [x] **T7-B8** `MapClient` 레이아웃 재구성 + URL `?cafe=` sync + `useGetCafeQuery` fallback (커밋 `1ceaf9f`)
- [x] **T7-B9** 하단 빈 공간 제거 + `min-height:0` 3곳 추가 (커밋 `47cf8a8`)
- [ ] **T7-B10** 회귀 QA + 반응형 매트릭스 — 실기 매트릭스(1440/1280/1024/768/375) 사용자 실측 대기

### J. Hotfix (10·11 리포트 참조)

#### J-1. BUG-MAP (10 리포트)
- [x] **BUG-MAP-01** `NaverCafeMap` visibilitychange + pageshow + ResizeObserver 추가 (커밋 `5e91180`)
- [x] **BUG-MAP-02** `KakaoCafeMap` mapRef + containerRef 신설 + relayout 핸들러 (커밋 `5e91180`)
- [x] **BUG-MAP 로컬 Chrome 재현 없음** (사용자 확인 2026-04-21)
- [x] **BUG-MAP-A2** `mapRef` 미할당 상태 refresh 큐잉 (pendingRefreshRef · 30분 · Naver/Kakao 양쪽) (커밋 `e8a6b19`)
- [x] **BUG-MAP-A3** ResizeObserver 가 container 0×0 에서 refresh 건너뛰기 (15분) (커밋 `63f4841`)
- [x] **BUG-MAP-A4** Provider 토글 `key` prop 강제 리마운트 (20분, 기존 BUG-MAP-03 승격) (커밋 `22b0f71`)
- [ ] **BUG-MAP-A5** (조사) SW 지도 타일 캐시 정책 검토 — `public/sw.js` / Kakao·Naver 타일 URL
- [ ] **BUG-MAP-A7** (조사) React Strict Mode 이중 useEffect 발화 여부 DevTools 로 확인
- [ ] (실기 QA) iOS Safari / Android Chrome / 데스크톱 × Kakao/Naver — 사용자 실측 대기
- [ ] (실기 QA) **BUG-MAP-A1** 재현 로그 수집 — 디바이스/브라우저/순서/"한 번 더 전환 시 정상 여부"

#### J-2. BUG-SEARCH (11 리포트)
- [x] **BUG-SEARCH-01** `/search` Row를 `<div role="button">` 로 전환 (40분) (커밋 `605b856`)
- [x] **BUG-SEARCH-02** styled.button 중첩 전수 스캔 0건 확인 (20분) — native button-in-button 0건. CardLink(a)+FavoriteBtn(button) 은 doc 명시 scope 밖(분리된 a11y 채무)

#### J-3. 🟢 BUG-SHEET URL LOOP (12 리포트, 2026-04-22) — **완료**
- [x] **T-BUG-SHEET-01** `BottomSheet.tsx:87-127` pushState/popstate/replaceState 제거 + handleClose 단순화 (커밋 `f5da079`)
- [x] **T-BUG-SHEET-02** `MapClient.tsx:272-285` URL sync 를 push 기반으로 재설계 + `openedByPushRef` 추가 (커밋 `dab34c2`)
- [x] **QA-1** enrich-images `router.refresh()` 루프 검증 — 기존 로직 안전 (304/204 early return + recent TTL + lock + cancelled flag). 코드 변경 없음
- [x] **QA-2** CafeOverlayCard ESC 닫기 focus 복귀 — `previousFocusRef` 추가 (커밋 `e40ee63`)
- [x] **QA-3** 모바일 딥링크 진입 시 body scroll lock — `visible` 동안 `body.overflow=hidden` (커밋 `e40ee63`)
- [ ] 실기 회귀: 안드로이드 물리 뒤로가기 + BUG-MAP 회귀 없음 + 딥링크 공유 정상 — 사용자 실측 대기

---

**Exit**: A+B 완료 → 릴리즈 가능. C는 스프린트 1~2일 추가 투자 시 완성도 A+ 도달. D+E+F는 릴리즈 후 지속. **G 완료 = Phase 3-6 종료**. H·I 는 다음 스프린트 결정 대기.
