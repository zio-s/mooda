# Mooda 반응형 & QA 리뷰

IMPLEMENTATION_PLAN 96% 완료 시점의 실측 전 **코드 기반 QA 진단**.
실기기 테스트 전에 사전 체크하면 좋을 항목 위주.

---

## 🚨 CRITICAL — 릴리즈 전 반드시 수정 (7건)

### C1. 🔴 지도 페이지 높이 계산 버그 — 지도가 잘리거나 여백 생김
**파일**: `src/app/map/page.styles.ts:8`

```tsx
// 현재
export const MapPageWrapper = styled.div`
  height: calc(100vh - 56px);
  @supports (height: 100dvh) {
    height: calc(100dvh - 56px);
  }
```

**문제**:
1. `56px`는 Header 높이 하드코딩. Header가 `.env(safe-area-inset-top)`을 고려 안 함.
2. FilterBar 높이(~48px) + Toolbar 높이(~42px)까지 포함된 **실제 지도 높이**는 더 작음.
3. iPhone notch 기기에서 Header가 safe-top에 붙어있지 않아 **상단 흰 띠** 발생 가능.

**수정**:
```tsx
// layout.tsx에 safe-area 포함한 Header padding 추가
export const HeaderWrapper = styled.header`
  padding-top: env(safe-area-inset-top, 0px);
`;

// MapPageWrapper는 그대로 56px 유지 가능 (Header 내부에서 safe-area 흡수)
```

또는 CSS 변수로 중앙 관리:
```css
:root { --header-h: 56px; }
html.has-safe-top { --header-h: calc(56px + env(safe-area-inset-top)); }
```

---

### C2. 🔴 BottomSheet + 지도 스크롤 충돌
**파일**: `src/components/map/BottomSheet.styles.ts:50`

```tsx
export const InfoSection = styled.div`
  overflow-y: auto;  /* ← 문제 */
```

**문제**: `SheetWrap`(max-height 75vh) 안에서 `InfoSection`이 `overflow-y: auto`. 시트 자체는 `flex-direction: column`이고 `InfoSection`은 `flex-shrink: 0`.

- iOS에서 바텀시트 위로 스크롤하면 배경 지도가 같이 스크롤 (scroll chain).
- "경로 상세" 펼쳤을 때 `InfoSection`과 `ExpandedSection` 둘 다 auto-scroll → **이중 스크롤 영역** 발생.

**수정**:
```tsx
// SheetWrap
overscroll-behavior: contain;  /* scroll chain 차단 */
touch-action: pan-y;

// InfoSection은 overflow visible로 (내용이 전부 보임)
overflow: visible;
// 스크롤이 필요한 건 ExpandedSection 하나뿐
```

---

### C3. 🔴 MoodFilterSheet 바디 스크롤 — 배경 지도도 같이 움직임
**파일**: `src/components/filter/MoodFilterSheet.tsx` `Body` 스타일

```tsx
const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
```

**문제**: `overscroll-behavior` 미지정. 필터 시트 바닥까지 스크롤한 뒤 더 당기면 body(지도)가 스크롤됨.

**수정**: Body에 `overscroll-behavior: contain;` 추가. Radix Dialog는 focus trap만 해주고 scroll lock은 안 해줌 → body에 `overflow: hidden` 수동 필요:

```tsx
useEffect(() => {
  if (!open) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = prev; };
}, [open]);
```

---

### C4. 🔴 검색 인풋 InputWrap 높이 40px — 터치 타겟 미달
**파일**: `src/app/search/page.styles.ts:40` · `BackButton:24`

```tsx
export const InputWrap = styled.div`
  height: 40px;  /* ← iOS HIG 최소 44px */
export const BackButton = styled.button`
  width: 40px;
  height: 40px;
```

**문제**: `theme.touch.sm = 40px` 사용. 뒤로가기 + 검색 인풋 둘 다 40px. 인풋은 `font-size: 16px`라 줌은 안 되지만 **터치 타겟 44px 권장 기준 미달**.

**수정**: 검색 페이지의 인풋/버튼만 44px로 승격 (검색은 빈도 높은 primary action).
```tsx
export const InputWrap = styled.div`
  height: 44px;
  border-radius: 22px;  /* height/2 유지 */
```

---

### C5. 🔴 FilterBar 가로 overflow — 320px에서 깨질 가능성
**파일**: `src/app/map/MapClient.tsx:264-284` · `page.styles.ts:19`

**현재 구조**:
```
[분위기 필터 버튼] [SearchTrigger pill] [선택된 칩 scroll] [지역 이동 ▼]
     축소금지         flex:1 1 auto       flex:1 1          축소금지
```

**문제**:
- iPhone SE(375px) – 16px padding = 343px 실폭
- 분위기 필터(~130px) + 지역 이동(~110px) + gap 12px + SearchTrigger min-content 가정
- 선택 칩 1개 추가되면 **343 - 240 - 12 = 91px** 남음 → SearchTrigger 축소 OK but pill 라벨 "성수동 조용한 카페"(100px+) 잘림
- **실제 터치 영역 침범** 가능

**수정**:
```tsx
// SearchTrigger pill 최소 너비 보장
min-width: 120px;

// 또는 ChipsScroll이 있을 때 SearchTrigger 숨기기
{filters.moods.length > 0 ? <ChipsScroll>...</ChipsScroll> : <SearchTrigger />}
```

---

### C6. 🔴 `ListPanel` 좌우 스와이프 영역 부재
**파일**: `src/app/map/MapClient.tsx:344-376`

**문제**: 목록 ↔ 지도 전환이 **Segmented 탭 터치**만으로 가능. 모바일 제스처 관습(스와이프) 없음.

**영향**: 치명적이지 않으나 **네이버지도 준거** 관점에서 UX 이질감. 좌스와이프로 목록, 우스와이프로 지도 복귀를 지원하면 모바일 네이티브 느낌.

**수정 (Low priority, optional)**:
```tsx
// MainArea에 framer-motion drag 또는 pointer events
// 현 스코프에서는 Known Issue로 기록만 하고 다음 스프린트.
```

**우선순위**: Medium → 릴리즈 후

---

### C7. 🔴 세로 스크롤 충돌: `Body`(검색 결과) + 페이지 자체
**파일**: `src/app/search/page.styles.ts:80`

```tsx
export const Body = styled.div`
  flex: 1;
  overflow-y: auto;
```

`Wrapper`는 `min-height: 100dvh`, `Body`는 그 안에서 `flex:1; overflow-y:auto`.
iOS Safari에서 **주소창이 열렸다 닫힐 때 100dvh가 재계산**되면서 Body 스크롤 위치가 튐.

**수정**:
```tsx
// Wrapper를 height로 고정 + overscroll-behavior
export const Wrapper = styled.div`
  height: 100dvh;
  overflow: hidden;  /* Body만 scroll */
`;

export const Body = styled.div`
  overscroll-behavior: contain;
```

---

## 🟡 MEDIUM — 릴리즈 전 권장 수정 (9건)

### M1. BottomSheet `max-height: 75vh` — iPhone SE(667px)에선 500px
경로 상세 펼치면 잘릴 수 있음. **해결**:
```tsx
max-height: min(75vh, calc(100dvh - 140px));
```

### M2. MoodFilterSheet Tabs sticky top — 스크롤 시 Header와 겹침 가능
```tsx
const Tabs = styled.div`
  position: sticky;
  top: 0;  /* ← Header 높이 0px 가정, but Sheet 안이라 OK */
```
**실제로는 OK**. 다만 `Dialog.Content` 안이라 독립 맥락. 오히려 `Handle` + `Header`(Title/Sub)가 sticky가 아니라 스크롤되면서 **Tabs가 최상단에 붙는 게 어색**. 개선:
```tsx
const Header = styled.div`
  position: sticky;
  top: 0;
  background: ${theme.colors.card};
`;
```

### M3. `SearchTrigger`의 shadow가 FilterBar 배경과 충돌
`box-shadow: 0 2px 14px rgba(0,0,0,0.12)` → `FilterBar` 흰 배경 위에서 과하게 진함.
**수정**: `theme.shadows.sm` 사용으로 통일.

### M4. Header의 Logo 아이콘 간격 — 모바일 375px에서 빠듯
`Nav`가 `margin-left: 24px` → 로고+Nav+HeaderRight 합쳐서 가끔 넘침.
**수정**: 모바일 `margin-left: 12px`.

### M5. `CafeCard` 터치 타겟 — FavoriteBtn이 아이콘 16px 단독
현재 `<Heart size={16}>` 버튼. **터치 영역이 하트 자체 크기**일 가능성. 버튼 min-width/height 보장:
```tsx
export const FavoriteBtn = styled.button`
  width: 44px;
  height: 44px;
  /* padding으로 아이콘은 16px 유지, hit area만 확장 */
`;
```

### M6. `ResearchAreaChip` 위치 — FilterBar와 겹침
`top: 12px` 절대값. MapClient의 `MapArea` 기준 top인데, **FilterBar 바로 아래에 Toolbar까지 있어서 지도 시작점은 Header+FilterBar+Toolbar ≈ 146px**. 지도 내부 top: 12는 OK but 유저가 "필터" 아이콘 근처로 보일 수 있음. 실측 필요.

### M7. `EmptyState` 안의 이모지 div — padding 충돌
`EmptyState` 자식 `div`가 `background: ${theme.colors.bgMuted}` 원형이어야 하는데, MapClient에선 `<div style={{ fontSize: 36 }}>☕</div>` 인라인 → **원형 배경 안 들어감**.

**수정**:
```tsx
// MapClient.tsx
<EmptyState>
  <div>☕</div>  {/* 스타일은 styles의 div 셀렉터가 적용 */}
  <p>지도를 이동하거나<br />필터를 변경해보세요</p>
</EmptyState>
```

### M8. MoodFilterSheet Body bottom padding 0
```tsx
const Body = styled.div`
  padding: 16px 20px 0;  /* bottom 0 */
```
**문제**: Footer(sticky) 위까지 Body 스크롤 가능한데, 마지막 Grid row가 Footer에 바짝 붙음.
**수정**: `padding-bottom: 16px`.

### M9. `Input`의 한글 IME 조합 처리
검색 인풋은 debounce 200ms인데, **한글 조합 중(onCompositionStart/End)** 체크 없음. "성수"를 치는 중에도 네트워크 요청 발생.
```tsx
const [composing, setComposing] = useState(false);
// onCompositionStart={() => setComposing(true)}
// onCompositionEnd={(e) => { setComposing(false); handleChange(e.target.value); }}
// handleChange 내부: if (composing) return;
```

---

## 🟢 LOW — 폴리싱 (6건)

### L1. SegmentedBtn 아이콘 크기 14px
`svg { width: 14px; height: 14px; }` → iconography가 작음. 16px 권장.

### L2. AreaDropdown `max-height: 280px` + 10개 옵션
한 옵션 `padding: 7px 10px` × 10개 = ~400px → **스크롤 발생**. OK but 스크롤바 안 보이게:
```tsx
&::-webkit-scrollbar { display: none; }
```

### L3. SearchTrigger label 길이 14.5px
"성수동 조용한 카페" (9자) × 14.5px = ~130px. 현재 min-width: 0으로 shrink 가능 but shrink 시 placeholder 잘림. `min-width: 120px` 권장 (위 C5와 연동).

### L4. BottomSheet가 노출된 상태에서 마커 재클릭 시 애니메이션
`displayCafe` 교체 로직은 정확한데, 다른 마커 탭 시 시트가 **잠깐 닫혔다 다시 열림**. 매끄러운 UX는 데이터만 swap (closing animation skip). 현재도 OK but 개선 여지.

### L5. `loading.tsx` 스켈레톤 — 실제 레이아웃과 픽셀 일치 확인
`app/map/loading.tsx` 등이 **실제 렌더된 결과와 높이 차이**가 있으면 layout shift. 직접 대조 필요.

### L6. `:focus-visible` 글로벌 outline — 일부 rounded 버튼에서 outline 각지게 보임
```css
:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
```
`border-radius: 999px` pill에선 outline이 각진 박스로 보임. 해결:
```css
:focus-visible { outline-offset: 2px; box-shadow: 0 0 0 2px var(--brand); outline: none; }
```

---

## 📱 반응형 브레이크포인트 매트릭스

| 뷰포트 | 대상 기기 | 점검 결과 |
|---|---|---|
| **320px** | iPhone SE 1st gen | ⚠️ FilterBar 넘침 가능 (C5) |
| **375px** | iPhone SE/Mini/12 | ✅ 대부분 OK. Header 빠듯 (M4) |
| **390px** | iPhone 14/15 | ✅ 최적 |
| **414px** | iPhone 14 Plus | ✅ 최적 |
| **428px** | iPhone 14/15 Pro Max | ✅ 최적 |
| **768px (md)** | iPad 세로 | ✅ ListPanel=320px 고정 |
| **1024px (lg)** | iPad 가로 | ✅ ListPanel=368px |
| **≥1280px** | Desktop | ✅ MaxWidth 1280 |

**주요 리스크**: 320-375px 구간. iPhone SE 1세대(~2020년 아이폰 SE) 쓰는 유저 있으면 FilterBar 실측 필수.

---

## 🎯 입력/인풋 전용 QA

| 항목 | 상태 | 비고 |
|---|---|---|
| 인풋 최소 16px (iOS zoom 방지) | ✅ | globals.css 전역 처리 |
| `enterKeyHint="search"` | ✅ | SearchClient |
| `inputMode="search"` | ✅ | SearchClient |
| `autoComplete="off"` | ✅ | SearchClient |
| 자동 포커스 | ✅ | /search 진입 시 |
| 한글 IME 조합 중 debounce | ❌ | **M9 수정 필요** |
| Clear 버튼 터치 영역 | ⚠️ | 20x20px → **M5처럼 패딩** |
| Enter 제출 동작 | ⚠️ | form 래퍼 없음. Enter 시 검색은 debounce로만 동작. 명시적 submit 처리 권장 |

---

## 🔄 바텀시트 QA

| 항목 | 상태 | 비고 |
|---|---|---|
| 슬라이드 애니메이션 | ✅ | cubic-bezier(0.32, 0.72, 0, 1) 350ms — 네이티브급 |
| 오버레이 탭 닫기 | ✅ | `handleClose` |
| X 버튼 | ✅ | 32x32 터치 OK |
| 물리 뒤로가기 | ❌ | **C2/리포트 § 4.2에서 지적** |
| scroll lock | ❌ | **C2 수정 필요** |
| scroll chain 차단 | ❌ | **C2 수정 필요** |
| safe-area bottom | ✅ | `env(safe-area-inset-bottom)` 반영 |
| drag-to-close | ❌ | 미구현 (릴리즈 후) |
| snap points | ❌ | 미구현 (경로 펼칠 때 jagged) |

---

## ⚡ 성능 포인트 (예상, 실측 필요)

| 항목 | 예상 | 실측 필요 |
|---|---|---|
| LCP (지도 페이지) | 2.5-3.5s | Kakao SDK 300KB + 지도 타일 |
| FID | <100ms | 마커 30개 CustomOverlay 렌더 |
| CLS | <0.1 | FilterBar/Toolbar 고정 — OK |
| 번들 크기 (First Load JS) | ~250KB | 예상 초과 — Redux + Kakao + Radix |

**번들 최적화 아이디어** (릴리즈 후):
- `MoodFilterSheet` dynamic import — 필터 버튼 클릭 시 로드
- Radix Dialog를 헤드리스 구현으로 교체 (~40KB 절감)
- Naver 어댑터는 provider toggle 시에만 로드

---

## 🎬 수정 우선순위 (3단계)

### 🔥 Phase 1 — Pre-release (필수, 반나절)
1. **C1** Header safe-area padding
2. **C2** BottomSheet scroll lock + overscroll
3. **C3** MoodFilterSheet scroll lock
4. **C4** 검색 인풋 44px로 승격
5. **C5** SearchTrigger min-width + FilterBar 구조 조정
6. **C7** Wrapper height 고정
7. **M9** 한글 IME 처리

### 🛠 Phase 2 — Post-release Week 1 (권장, 하루)
8. **M1** BottomSheet 동적 max-height
9. **M5** FavoriteBtn 터치 영역
10. **M7** EmptyState 구조
11. **M8** MoodFilterSheet Body padding
12. **L6** focus-visible box-shadow

### 🎨 Phase 3 — Nice-to-have (릴리즈 후 2주차)
13. C6 스와이프 전환
14. L1-L5 폴리싱
15. 번들 사이즈 최적화

---

## 📋 남은 10% → 업데이트

**이 리뷰 반영하여 `IMPLEMENTATION_PLAN.md § 남은 10%` C 섹션을 다음으로 교체 권장:**

### C. 코드 미세 수정 (QA 리뷰 반영)
Pre-release 필수 7건:
- [ ] **C1** HeaderWrapper `padding-top: env(safe-area-inset-top)`
- [ ] **C2** BottomSheet — `overscroll-behavior: contain` + scroll lock
- [ ] **C3** MoodFilterSheet — body scroll lock (useEffect)
- [ ] **C4** SearchClient 인풋 + BackButton 44px로 승격
- [ ] **C5** SearchTrigger min-width + FilterBar 축소 규칙 정리
- [ ] **C7** Search Wrapper `height: 100dvh; overflow:hidden`
- [ ] **M9** SearchClient 한글 IME `onCompositionStart/End`

Post-release Week 1 권장 5건:
- [ ] **M1** BottomSheet `max-height: min(75vh, calc(100dvh - 140px))`
- [ ] **M5** FavoriteBtn hit area 44x44
- [ ] **M7** MapClient EmptyState 이모지 div 인라인 스타일 제거
- [ ] **M8** MoodFilterSheet Body `padding-bottom: 16px`
- [ ] **L6** `:focus-visible` box-shadow로 교체 (rounded 친화)

---

## ✅ 잘 처리된 것들 (칭찬 섹션)

- `overflow` 관리 전반 ✅
- safe-area 반영 (일부 제외) ✅
- iOS 16px input 전역 처리 ✅
- prefers-reduced-motion 전역 대응 ✅
- 스킵 링크 ✅
- Korean `word-break: keep-all` ✅
- backdrop-filter Header ✅
- scroll-behavior 세팅 ✅
- AbortController로 in-flight 요청 취소 ✅
- debounce 200-300ms 일관성 ✅

**종합**: Phase 1만 처리하면 모바일 실기 회귀 테스트에서 큰 이슈 없을 것. Phase 2는 사용자 피드백 보면서 PR 1-2개로 묶기. 전체 A- → A+ 승격에 3일이면 충분.
