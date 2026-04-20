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
- [ ] `BottomSheet` 물리 뒤로가기 통합 — history.pushState + popstate (§ 4.2)
- [ ] `NamePill`/`Dot` bounce 애니메이션에 `prefers-reduced-motion` 대응 (§ 4.3)
- [ ] `openStatus.ts` `closingSoonMinutes` 옵션 파라미터화 (§ 3.5)
- [ ] `ResearchAreaChip` Toolbar/FilterBar와 겹침 여부 검증 및 동적 top 오프셋 (§ 3.4)
- [ ] `CafeCard` PhotoDots 3개 초과 시 "N/M" 텍스트 인디케이터로 전환 (§ 4.4)
- [ ] `primaryText` 토큰 리네이밍 → `onPrimaryTint`, 카페명은 `ink900`으로 통일 (§ 4.1)
- [ ] `BottomSheet` snap points(peek/half/full) 3단 — 경로 상세 펼칠 때 잘림 방지 (§ 3.2) **[선택]**
- [ ] `CafeCard` PhotoCarousel `onScroll` → `onScrollEnd` + rAF throttle (§ 3.1) **[선택, jank 확인 후]**

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
