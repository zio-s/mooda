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

---

**Exit**: A+B 완료 → 릴리즈 가능. C는 스프린트 1~2일 추가 투자 시 완성도 A+ 도달. D+E+F는 릴리즈 후 지속.
