# 구현 완료 후 디자인 리뷰 (Post-Implementation Review)

실제 코드 진단 후 작성. 체크박스 96% 완료 시점 기준.
**결론: 리포트 의도 대비 구조·토큰·상호작용 레벨에서 매우 충실하게 구현되었음.**
남은 작업은 코드 수정보다 "실기기 실측 + 미세 튜닝" 영역.

---

## 1. 한 줄 평

> 리디자인 의도를 **원본보다 정확하게** 코드로 번역한 드문 케이스. 리포트에 없던 디테일(`PillLeadDot`, `DOT_SVG` data URL 통일, Naver/Kakao 줌 매핑)까지 스스로 채워 넣음.

---

## 2. 구조 진단 — 잘 된 부분

### 2.1 토큰 시스템 ✅
- `theme.ts`가 **legacy alias와 신규 토큰 병존** — 기존 styled-components 무수정으로 살렸고, 신규 코드는 `ink*`/`space`/`z`/`safe`/`touch` 쓰도록 분리. 이게 제일 잘한 설계.
- `z` 스케일이 목적별로 네이밍됨(`mapFloatingButton`/`bottomSheet`/`island`) — 숫자 하드코딩 완전 제거.
- `touch.sm/md/lg` (40/44/52) — iOS HIG 지킴.
- **감점 요소 없음.**

### 2.2 지도 마커(CafeMarkers.tsx) ✅
- `PILL_MAX_LEVEL = 4` / `DOT_MAX_LEVEL = 2` — 2단계 체계로 간소화한 판단이 옳음. 중간 dot 모드는 도심에서 어차피 겹치는데, 리포트의 3단계 스펙을 **맹목적으로 따르지 않고 이유 주석까지 달아서** 제거한 게 좋음.
- `PillLeadDot` — "Kakao POI가 아닌 Mooda 추천 핀"임을 시각적으로 선언. 리포트에 없던 디테일인데 **있어야 맞다**.
- `DOT_SVG` data URL — 클러스터러에서 묶이지 않은 외톨이 마커도 스타일 통일. 보통 놓치는 포인트.
- `BOUNDS_PADDING_RATIO = 0.1` — ±10% 패딩. 메모리/DOM 관점 정확.
- `CLUSTER_STYLES`의 box-shadow spread로 halo 구현 — CSS 트릭 잘 씀.

### 2.3 BottomSheet ✅
- 열기/닫기 상태 머신이 견고함. `displayCafe`와 `visible`을 분리해서 **애니메이션 중 데이터 swap 금지** 패턴을 지킴. `closeTimerRef` cleanup까지 철저.
- `nmap://` 딥링크 + `visibilitychange` 기반 앱 성공 감지 + 웹 폴백 — 교과서적. Naver 공식 가이드보다 낫다.
- `safe-area-inset-bottom`을 `InfoSection` padding에 직접 반영. `env()` fallback `0px`까지 명시.

### 2.4 MoodFilterSheet ✅
- Draft 상태 + `toggleMoodFilter` diff 커밋 패턴 — 리포트 의도 그대로.
- `useCountCafesQuery` + 200ms debounce + `skip: !open` — 네트워크 낭비 zero.
- Radix Dialog 기반 — focus trap/ESC/스크롤 락 자동. 직접 구현 안 한 판단이 현명.
- Grid 52h/14r/1.5px border — 스펙 pixel-perfect.

### 2.5 지도 어댑터 ✅
- 인터페이스 대신 **컴포넌트 props 계약**(`CafeMapAdapterProps`)으로 통일 — React/SSR에 맞는 선택.
- `naverZoom = 20 − kakaoLevel` 매핑 — 두 SDK 줌 스케일 차이를 한 줄로 해결.
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 미설정 시 토글 disabled — 실무 에지 케이스 처리.
- `mooda:map-provider:v1` localStorage 키 네임스페이싱 + 마이그레이션 가능한 suffix.

### 2.6 PWA SW (sw.js) ✅
- Workbox 안 쓰고 **raw Service Worker로 5가지 전략** 섬세하게 분리. 번들 사이즈 이득.
- `mooda-v3-*` 네임스페이스 + activate 시 구버전 purge — 배포 안전.
- `x-mooda-cached-at` 커스텀 헤더로 TTL 추적 — LRU + 만료 둘 다 가능.
- SW 업데이트 토스트 + `SKIP_WAITING` + `controllerchange` reload — 완벽.

---

## 3. 개선 포인트 (Medium, 코드 수정 필요)

### 3.1 `CafeCard` PhotoCarousel 스크롤 성능 ⚠️
**현상**: `handleScroll`이 매 scroll event 마다 `Math.round` 계산. `CafeList`에 30장 렌더되면 동시 스크롤 시 jank 가능.

**개선**:
```tsx
// 개선안: scrollend 이벤트(iOS 16+) + rAF 폴백
const handleScrollEnd = useCallback(() => {
  const el = scrollRef.current;
  if (!el) return;
  setActiveSlide(Math.round(el.scrollLeft / el.offsetWidth));
}, []);

// onScroll → onScrollEnd (browser-support 체크 필요)
// 또는 passive listener + rAF throttle
```

**우선순위**: 실기기에서 jank 확인되면 수정. 아니면 보류.

### 3.2 `BottomSheet` 최대 높이 동적화 🔶
**현상**: `max-height: 75vh` 고정. iPhone SE(667px)에서 경로 상세 펼치면 컨텐츠가 잘릴 수 있음.

**개선**:
```tsx
// SheetWrap
max-height: calc(100dvh - 80px); // 지도 일부는 항상 보이게
// 또는 snap points (peek 30% / half 60% / full 90%) 3단 구현
```

**우선순위**: 유저가 "작은 폰에서 경로가 잘려요" 리포트하면 착수. 지금은 75vh로 충분할 가능성.

### 3.3 마커 pill `max-width: 180px` 검토 🔶
**현상**: 긴 카페명 "스타벅스 리저브 로스터리 성수점" 같은 건 `...`로 잘림.

**개선 옵션**:
- A. 120px로 줄이고 세로 2줄 허용 (`white-space: normal`, `-webkit-line-clamp: 2`)
- B. 180px 유지, 대신 선택 시 전체 이름 오버레이로 노출
- C. Mooda 추천 카페는 항상 짧은 alias를 관리자 페이지에서 지정

**우선순위**: 실제 DB의 긴 이름 비율 확인 후 결정. 10% 이상이면 수정.

### 3.4 `ResearchAreaChip` 위치 충돌 가능성 🔶
**현상**: `top: 12px` 고정. 지도 상단에 필터바/탭이 있으면 겹침.

**체크 필요**:
```tsx
// /map Toolbar 높이 측정 후 동적 offset
top: calc(12px + var(--toolbar-height, 0px) + env(safe-area-inset-top));
```

**우선순위**: Toolbar 구조 보고 실제 겹침 여부 확인 (아래 "남은 10%" 체크리스트에 포함).

### 3.5 `OpenBadge`의 "closing-soon" 임계값 🔶
**현상**: 30분 전 기준이 스펙. 카페에 따라 짧거나 길 수 있음.

**개선**:
```ts
// openStatus.ts
export function computeOpenStatus(
  hours: CafeHourInput[],
  opts: { closingSoonMinutes?: number } = {},
) {
  const threshold = opts.closingSoonMinutes ?? 30;
  // ...
}
```

나중에 유저 데이터 보고 15/30/60분 A/B 가능하도록 **파라미터화만** 해두면 충분.

---

## 4. 개선 포인트 (Low, nice-to-have)

### 4.1 `theme.ts`의 `primaryText` 모호성
`primaryText: '#92400e'`가 **카페명 색상**으로 쓰이는 경우(`CafeName`, `BottomSheet`) vs **브랜드 강조 텍스트**로 쓰이는 경우가 혼재. 지금 동작엔 문제없지만, 2개로 분리 제안:
- `primaryText` → `onPrimaryTint` (primaryLight 배경 위 텍스트)
- 카페명은 `ink900`으로 통일

이유: 카페명은 브랜드 컬러일 필요 없음. ink900이 읽기 더 쉬움.

### 4.2 `BottomSheet` 휴지통/뒤로가기 버튼
안드로이드 Chrome에서 물리 뒤로가기 눌렀을 때 시트만 닫히고 페이지는 유지되어야 함. 현재 history.pushState 없음 → 뒤로가기 시 맵 페이지에서 아예 나가버림. 개선:

```tsx
useEffect(() => {
  if (!visible) return;
  history.pushState({ sheet: true }, '');
  const onPop = () => handleClose();
  window.addEventListener('popstate', onPop);
  return () => window.removeEventListener('popstate', onPop);
}, [visible, handleClose]);
```

### 4.3 `NamePill`의 `bounce` 애니메이션 prefers-reduced-motion 미대응
```css
@media (prefers-reduced-motion: reduce) {
  animation: none;
  transition: none;
}
```
a11y 체크리스트에 추가 권장.

### 4.4 CafeCard `PhotoDots` 3개 초과 시 UX
20장 넘는 카페도 있을 텐데 점 20개는 시각적 노이즈. 개선:
- 점 3개 max + "1 / 20" 텍스트 인디케이터 전환
- 또는 현재 점 3개만 렌더 + 앞/뒤 상태 인디케이션

---

## 5. 디자인 일관성 체크 (시각 톤)

### 5.1 SSoT 준수도: **95%**

- 모든 주요 컴포넌트가 `theme.ts` 참조 ✅
- legacy 랜딩(`app/page.styles.ts`) 1건만 의도적 잔류 ✅
- 하드코딩 검출 필요 항목:
  - `#03c75a` (naver green) — `BottomSheet.styles.ts` 하드코딩 중. **정당** (naver 브랜드 컬러는 토큰에 없음이 맞음). 다만 `theme.colors.naverGreen`으로 올릴지는 팀 논의.
  - `#ef4444` (favorite heart red) — `CafeCard.tsx` 하드코딩. **정당** (heart는 유니버설 red).
  - `#fbbf24` (star yellow) — 동일. **정당**.

결론: 하드코딩 3건은 전부 의도적/정당함. 리팩토링 불필요.

### 5.2 radius 사용 일관성: **90%**
- 주요 값: `borderRadius.md`(10), `lg`(14), `xl`(20), `full`
- 지각 이슈: BottomSheet `border-top-left-radius: 20px` 하드코딩 → `theme.borderRadius.xl` 로 통일 가능 (low-prio)

### 5.3 shadows 사용: **100%**
`sm/md/lg/xl/sheet` 스케일 전원 사용. 하드코딩 없음.

---

## 6. 기술 부채 (Post-release backlog)

| ID | 항목 | 난이도 | 임팩트 |
|---|---|---|---|
| D1 | Naver 어댑터 클러스터러 v2 | M | 중 |
| D2 | 리뷰 작성 플로우 (사진/태그/텍스트) | L | 고 |
| D3 | 프로필 "방문 이력" · "저장함" 탭 | L | 중 |
| D4 | 지도 스타일 커스텀 (사용자가 dim/satellite 선택) | M | 저 |
| D5 | 분위기 태그 "인기순" vs "카테고리별" 토글 | S | 중 |
| D6 | 오프라인에서 지도 타일 캐시 (복잡·법적 검토) | XL | 저 |

**권장**: D2(리뷰 작성)를 다음 분기 1순위로. 다른 건 데이터 보고 결정.

---

## 7. 총평

**점수: A (92/100)**

- **구조** (35/35): 토큰/어댑터/SW 모두 확장 가능. 감점 없음.
- **디자인 일관성** (28/30): 하드코딩 정당, 시각 톤 통일. 약간의 radius 하드코딩 잔존.
- **사용자 체감 개선** (20/25): 리포트 mockup 의도 그대로 전달. 실기기 실측 남음.
- **문서화** (9/10): IMPLEMENTATION_PLAN.md 체크박스 + 커밋 메시지 명확.

### 릴리즈 준비도
- **코드**: 릴리즈 가능
- **QA**: 실기 회귀 테스트만 남음
- **지표**: Lighthouse 실측 + 실유저 1주 관찰 후 튜닝 PR 1회 권장

### 다음 단계 우선순위
1. 실기 PWA 테스트(iPhone 12-15, 안드로이드 Pixel) — 2일
2. Lighthouse 실측 + 성능 개선 PR — 1일
3. Post-release 1주 관찰 (에러 로그, 분위기 태그 클릭 지표)
4. D2(리뷰 작성 플로우) 스펙 착수

---

## 8. 남은 10% 체크리스트 (Final Polish)

### A. 실기기 실측 (사용자 작업)
- [ ] iPhone 12/13/14/15 PWA standalone — 레이아웃/safe-area/제스처
- [ ] iPhone SE(4.7") — BottomSheet 75vh 한계 확인
- [ ] 안드로이드 Pixel — 물리 뒤로가기로 BottomSheet 닫힘 동작
- [ ] iOS Safari 주소창 숨김 시 100dvh 정상 동작
- [ ] 오프라인 전환 직후 `/offline` 페이지 표시 + "다시 시도" 버튼
- [ ] SW 업데이트 토스트 수동 트리거 (dev tools에서 SW 업데이트 강제)

### B. Lighthouse / 성능 (사용자 작업)
- [ ] Lighthouse Performance ≥ 85 (mobile · 3G Slow) — 실측
- [ ] Lighthouse a11y ≥ 95 — 실측
- [ ] 번들 사이즈 체크: `next build` 후 First Load JS < 200KB
- [ ] LCP 측정: 지도 페이지 기준 2.5s 이내

### C. 코드 미세 수정 (Claude Code로 가능)
- [ ] `BottomSheet` 뒤로가기 통합 (§ 4.2)
- [ ] `NamePill` prefers-reduced-motion 대응 (§ 4.3)
- [ ] `openStatus.ts` `closingSoonMinutes` 파라미터화 (§ 3.5)
- [ ] `BottomSheet` snap points(peek/half/full) — 선택
- [ ] `ResearchAreaChip` Toolbar 오프셋 검증
- [ ] `CafeCard` PhotoDots 3개 이상일 때 "N/M" 인디케이터 (§ 4.4)
- [ ] `primaryText` → `onPrimaryTint` 리네이밍 + 카페명 ink900 통일 (§ 4.1)

### D. 관측 지표 설계 (제품 결정)
- [ ] 분위기 태그별 클릭률/선택률 로깅
- [ ] 검색 키워드 top 50 수집
- [ ] 지도 provider 전환 비율 (Kakao vs Naver)
- [ ] BottomSheet → 상세 전환율
- [ ] 길찾기 버튼 탭 수 (전화/저장/공유 대비)

### E. 콘텐츠 QA
- [ ] 분위기 태그 16개 라벨 실제 적절성 검토
- [ ] `ErrorState` 문구 7종 감정 톤 통일 확인
- [ ] `/offline` 카피 검토
- [ ] OpenBadge "곧 마감" 문구 UX 라이터 리뷰

---

## 9. 문서 구조 정리 제안

현재 `design_handoff_mooda/`:
```
README.md
IMPLEMENTATION_PLAN.md   ← 96% 체크됨
ISSUES.md
01_tokens.md
02_components.md
03_screens.md
04_state_and_api.md
mockups/
```

추가 제안:
```
05_review_after_impl.md  ← 이 문서
06_monitoring.md         ← 릴리즈 후 지표 정의 (선택)
CHANGELOG.md             ← 릴리즈 노트용
```

---
