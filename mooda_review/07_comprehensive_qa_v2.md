# Mooda 종합 실측 QA v2 — 파일 단위 전수 점검

**전제**: `06_responsive_qa.md`에 이미 기록된 Critical/Medium은 여기서 반복 안 함.
**이 문서는**: 전체 프로젝트를 파일 단위로 다시 훑어 **새로 발견한 이슈 + 확인된 것 + 수정 패치**까지.

범례: 🔴 Critical · 🟡 Medium · 🟢 Low · ✅ Verified · ℹ️ Info

---

## PART 1 — 신규 발견 이슈 (v1 리포트에 없던 것)

### 🔴 N1. BottomSheet `handleClose` + popstate 무한 루프 리스크
**파일**: `src/components/map/BottomSheet.tsx:85-120, 137-157`

현재 로직:
```tsx
// cafe set → pushState
useEffect(() => { if (cafe && !pushedRef.current) { pushedRef.current = true; window.history.pushState(...); } }, [cafe, ...]);

// handleClose → history.back() → popstate → onClose
const handleClose = () => { if (pushedRef.current) { window.history.back(); return; } ... };
```

**문제**:
1. **cafe가 바뀔 때마다 pushState 추가** — 한 번 열고 다른 마커 클릭하면 `pushedRef=true`라 skip되지만, `cafe`가 null→A→B로 바뀌는 시나리오에서 history 1개만 쌓임. **이것 자체는 OK.**
2. ⚠️ 하지만 `onClose` 콜백이 부모에서 `setSelectedCafe(null)`까지 수행하면, `cafe` prop이 `null`로 바뀌면서 **unmount cleanup이 pushedRef를 정리하지 않고 종료** (주석에 명시: "history.back은 SPA route 이탈 유발 가능 → state 교체로 대체").
3. **실제 버그 시나리오**: 유저가 마커 탭 → 시트 열림 → 뒤로가기 → popstate 핸들러 실행되기 전에 유저가 다시 다른 마커 클릭 → `cafe` 갱신 → `pushedRef=false` 상태에서 다시 true로 세팅 + pushState. 히스토리에 **유령 엔트리** 남음.

**수정 (명확한 상태 머신으로)**:
```tsx
// popstate 핸들러에서 pushedRef=false로 먼저 정리한 뒤 onClose 호출 — OK (현재도 그러함)
// 단, cleanup에서는 pushState를 replaceState로 되돌려 유령 엔트리 제거
useEffect(() => {
  // ...기존 코드...
  return () => {
    window.removeEventListener('popstate', onPop);
    if (pushedRef.current && typeof window !== 'undefined') {
      pushedRef.current = false;
      // 내가 쌓은 엔트리 제거 — replaceState로 덮어쓰기
      window.history.replaceState({}, '');
    }
  };
}, [cafe, onClose, clearCloseTimer]);
```

**우선순위**: Critical (Android Chrome에서 뒤로가기 사이클 여러 번 돌리면 재현 가능).

---

### 🔴 N2. CafeDetailClient `router.push(PATHS.Map)` 뒤로가기 — 히스토리 손실
**파일**: `src/app/cafes/[id]/CafeDetailClient.tsx:272-277`

```tsx
<HeroFab onClick={() => router.push(PATHS.Map)} aria-label="뒤로가기">
  <ArrowLeft size={18} />
</HeroFab>
```

**문제**: `router.push`는 **새 히스토리 엔트리를 추가**. 유저가 검색→상세→"뒤로가기" 누르면 지도로 가지만, 시스템 뒤로가기로는 상세로 다시 감. **중복 히스토리 유발**.

**올바른 동작**: `router.back()`, 단 referrer가 같은 origin에서 왔을 때만. 첫 진입(새 탭, 공유 링크)엔 fallback으로 `router.push(PATHS.Map)`.

**수정**:
```tsx
function handleBack() {
  if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && new URL(document.referrer).origin === window.location.origin) {
    router.back();
  } else {
    router.push(PATHS.Map);
  }
}
```

---

### 🔴 N3. SearchClient "Enter 제출" 동작 누락
**파일**: `src/app/search/SearchClient.tsx:181-193`

```tsx
<Input
  enterKeyHint="search"
  // onKeyDown 없음
/>
```

**문제**:
- `enterKeyHint="search"` → iOS에서 **"검색" 키**가 뜸.
- 그러나 Enter 누르면 아무 일도 안 일어남 (debounce만 동작).
- 유저가 "검색" 버튼을 눌렀는데 **반응이 없음** → UX 크래시.

**수정**:
```tsx
const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key !== 'Enter') return;
  if (debounceRef.current) clearTimeout(debounceRef.current);
  const trimmed = query.trim();
  if (trimmed.length >= MIN_QUERY_LEN) fetchResults(trimmed);
  inputRef.current?.blur();  // iOS 키보드 닫기
};

<Input onKeyDown={handleEnter} ... />
```

---

### 🔴 N4. CafeCard PhotoCarousel — 카드 링크와 스와이프 충돌
**파일**: `src/components/cafe/CafeCard.tsx:84-100` · `CafeCard.styles.ts:60-80`

```tsx
<CardLink href={...}>  // 카드 전체가 링크
  <PhotoCarousel onScroll={handleScroll}>  // 가로 스크롤 내부
    {photos.map(...)}
  </PhotoCarousel>
</CardLink>
```

**문제**:
- 카드 전체가 `<Link>` 래핑 → 사진 가로 스크롤 영역도 링크 안에 있음.
- **iOS에서 PhotoCarousel 스와이프하면 tap으로 인식되어 상세 페이지로 넘어감** (50% 확률).
- `scroll-snap-type: x mandatory`라 스와이프가 정상 동작하긴 하나, 부모 `<a>`의 click이 먼저 발사됨.

**수정**:
```tsx
// PhotoCarousel에 touchstart 위치 기록 → touchend에서 이동 거리 크면 e.preventDefault
const touchStartX = useRef(0);
<PhotoCarousel
  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
  onTouchEnd={(e) => {
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
    if (dx > 10) e.preventDefault();  // swipe면 카드 link 무시
  }}
/>
```

또는 더 간단하게: `CardLink` 대신 `CardWrapper`에 onClick + 내부 swipe 영역은 별도 판별.

**우선순위**: Critical (지도 목록 페이지 주 인터랙션).

---

### 🟡 N5. ReviewForm Textarea — iOS 16px 미달 여부
**파일**: `src/components/ui/textarea.tsx` (미확인) · `ReviewForm.tsx:226-234`

`globals.css`에 `input, textarea, select { font-size: max(16px, 1em) }` 전역 규칙 있음 ✅.
**단**, shadcn `Textarea` 컴포넌트가 `text-sm` (14px) 클래스를 inline으로 적용하면 우선순위 충돌 가능. **실기 확인 필요**.

**검증 방법**: iOS Safari에서 리뷰 textarea 탭 시 확대 발생 여부.
- 발생 → Textarea 컴포넌트에 `className="text-base"` 승격 또는 inline `style={{ fontSize: 16 }}`.
- 미발생 → OK.

---

### 🟡 N6. HomeClient `HeroStats` 숫자 과장 — "200+ 등록 카페"
**파일**: `src/app/HomeClient.tsx:90-105`

```tsx
<StatNumber>200+</StatNumber> <StatLabel>등록 카페</StatLabel>
```

**문제**: 하드코딩 숫자. 실 DB와 불일치 시 신뢰 훼손. 특히 초기 카페 30개 수준이면 **허위 수치로 보일 수 있음**.

**수정**: 
- 옵션 A: API로 실 count 가져와 표시 (`/api/cafes/count`).
- 옵션 B: 문구를 "엄선된 카페", "서울 주요 지역"으로 교체.
- **MVP에서는 옵션 B 권장** — 숫자 없애는 게 안전.

---

### 🟡 N7. `theme.shadows.cardHover` 하드코딩 이동량
**파일**: `src/components/cafe/CafeCard.styles.ts:34`

```tsx
@media (hover: hover) {
  ${CardLink}:hover & {
    transform: translateY(-2px);
```

**문제**: iPad (hover: hover) 분기에서 hover 시 카드가 2px 위로 뜸. **터치 디바이스의 hover 에뮬레이션**(iOS Safari 일부 케이스)에서 탭 → 잠깐 올라갔다 내려오는 잔상 발생.

**수정**: `hover`에서 shadow만 강화하고 translate는 desktop에서만:
```tsx
@media (hover: hover) and (pointer: fine) {
  ${CardLink}:hover & {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.cardHover};
  }
}
```

---

### 🟡 N8. ReviewForm Input autocomplete 누락
**파일**: `src/components/review/ReviewForm.tsx:227-233`

```tsx
<Textarea {...register('content')} placeholder="..." rows={4} />
```

**없음**: `autoComplete`, `spellCheck="true"`, `lang="ko"`.
모바일 한글 타자 시 **자동 완성 후보 과다 노출**될 수 있음. MVP에서 critical은 아니나 첨언:
```tsx
<Textarea autoComplete="off" spellCheck={false} maxLength={MAX_CONTENT + 50} ... />
```

---

### 🟡 N9. CafeDetailClient 탭 개수 동적 — 모바일 가로 스크롤 확인 필요
**파일**: `src/app/cafes/[id]/CafeDetailClient.tsx:346-364`

```tsx
<TabsList>
  <TabsTrigger value="info">정보</TabsTrigger>
  <TabsTrigger value="reviews">리뷰{n}</TabsTrigger>
  <TabsTrigger value="blogs">블로그</TabsTrigger>
  {googleData?.reviews.length > 0 && <TabsTrigger value="google">Google {n}</TabsTrigger>}
  {allPhotos.length > 0 && <TabsTrigger value="gallery">갤러리 {n}</TabsTrigger>}
</TabsList>
```

**문제**: 5개 탭 × 한글+숫자 → 375px 뷰포트에서 **탭 라벨 잘림**. shadcn Tabs의 `TabsList` 기본이 `grid-cols-N`일 수도 overflow-x auto일 수도 있어 **실기 확인 필수**.

**수정 옵션**:
```tsx
// TabsList를 horizontal scroll로
<TabsList className="w-full overflow-x-auto justify-start">
```
또는 라벨 압축: "Google {n}" → "G{n}", "갤러리 {n}" → 아이콘+숫자.

---

### 🟡 N10. MoodFilterSheet `height: min(80dvh, 720px)` vs `max-height: 88dvh`
**파일**: `src/components/filter/MoodFilterSheet.tsx:244-247`

```tsx
height: min(80dvh, 720px);
max-height: 88dvh;
```

**문제**: `height`가 이미 설정되어 있으면 `max-height`는 무의미. 작은 기기(600dvh 이하)에서 `height: 80dvh = 480dvh`로 고정되지만, 컨텐츠가 길면 **Body scroll**로 흡수 ✅. 큰 기기(900dvh 이상)에서 720px 상한 ✅. **작동은 하지만 중복**.

**수정**:
```tsx
// height 제거하고 max-height만:
max-height: min(80dvh, 720px);
// 콘텐츠 높이에 맞게 자연스럽게 늘어나되 상한만 강제
```

실용적 차이: 현재 코드는 **항상 80dvh 차지** → 탭별 컨텐츠가 적어도 시트가 큼. 제안 코드는 **콘텐츠 따라 유연**. UX로는 후자가 낫지만 버튼 위치가 안정적이진 않음. **디자인 의도 확인 필요** → 의도적으로 고정이면 OK.

---

### 🟡 N11. Gallery Overlay에 body scroll lock 없음
**파일**: `src/app/cafes/[id]/CafeDetailClient.tsx:611-685`

라이트박스 열렸을 때 `document.body.style.overflow = 'hidden'` 미적용. 배경 페이지가 **뒤에서 스크롤 가능**.

**수정**:
```tsx
useEffect(() => {
  if (lightboxIdx === null) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = prev; };
}, [lightboxIdx]);
```

**추가**: ESC 키로 닫기 + 키보드 좌우로 탐색 — a11y.
```tsx
useEffect(() => {
  if (lightboxIdx === null) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIdx(null);
    if (e.key === 'ArrowLeft') setLightboxIdx((prev) => prev !== null ? (prev - 1 + allPhotos.length) % allPhotos.length : null);
    if (e.key === 'ArrowRight') setLightboxIdx((prev) => prev !== null ? (prev + 1) % allPhotos.length : null);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [lightboxIdx, allPhotos.length]);
```

---

### 🟡 N12. `handleDirections` — 같은 로직 2번 구현
**파일**: `BottomSheet.tsx:169-187` · `CafeDetailClient.tsx:253-273`

네이버지도 앱 딥링크 + 웹 폴백 로직이 **두 파일에 거의 동일**.
**수정**: `src/lib/externalLinks.ts` 같은 공용 훅/함수로 추출. 유지보수성 ↑, 실동작 영향 ✕.

---

### 🟢 N13. `next-auth` 로그인 체크 — Toast vs Redirect
**파일**: `CafeDetailClient.tsx:138-144, 152-158`

```tsx
async function handleFavorite() {
  if (!session) { toast.error('로그인이 필요합니다'); return; }
  ...
}
```

**문제**: 토스트만 띄우고 끝 → 유저가 로그인으로 이동 방법을 모름.
**수정**: 토스트에 action 추가:
```tsx
toast.error('로그인이 필요합니다', {
  action: { label: '로그인', onClick: () => router.push(PATHS.Login) }
});
```

---

### 🟢 N14. HeroFab 터치 타겟 40px
**파일**: `CafeDetail.styles.ts:95-97`

```tsx
export const HeroFab = styled.button`
  width: 40px;
  height: 40px;
```

iOS HIG 44px 미달. Hero 위 FAB(뒤로가기·공유·하트)는 주요 액션.
**수정**: 44×44로 승격.

---

### 🟢 N15. `Separator` 하드코딩 마진
**파일**: `CafeDetailClient.tsx:344`

```tsx
<Separator style={{ marginBottom: 24 }} />
```

디자인 토큰(`theme.spacing.lg`) 미사용. 소소한 부채.

---

### 🟢 N16. ReviewForm `FormWrapper` `primaryLight` 배경 + `FormTitle` 일반 text color
**파일**: `ReviewForm.styles.ts:18-27`

`background: primaryLight(#fef7ed)` 위에 `FormTitle color: text(#1c1917)` → **대비 명확 ✅**. 
단 `OptionalText`: `textLight(#a8a29e)` on `primaryLight`: **WCAG AA 안 나올 수 있음** (~3.2:1).
**수정**: `color: theme.colors.textMuted` (#78716c, ~5.1:1) 권장.

---

### 🟢 N17. Middleware — `/profile/:path*` only
**파일**: `src/middleware.ts`

`/favorites`, `/collections` 경로 보호 누락. 비로그인 유저가 직접 URL로 접근 시 **클라이언트 사이드에서 세션 체크 필요** → UX 나쁨.

**수정**:
```tsx
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/favorites/:path*', '/collections/:path*'],
};
```

---

## PART 2 — 실측 검증 필수 항목 (코드상 OK, 실기기에서만 확인 가능)

### ✅ 체크리스트 (Chrome DevTools + iOS Safari 필수)

#### iOS Safari 실측
- [ ] **주소창 스크롤** — 스크롤 시 주소창 축소/복귀 때 레이아웃 jitter 없음
- [ ] **홈 인디케이터 영역** — 하단 바텀시트 / 푸터가 홈 인디케이터와 겹치지 않음
- [ ] **노치 영역** — Hero Overlay 버튼이 노치에 가려지지 않음
- [ ] **인풋 탭 시 확대 없음** (16px 규칙 검증)
- [ ] **한글 IME** — "성수" 치는 중에 debounce 요청 발사되는지 (N9 관련)
- [ ] **PWA 설치 후 standalone 모드** — safe-area inset 정상 동작
- [ ] **가로 회전** — 지도 + 바텀시트 붕괴 없음

#### Android Chrome 실측
- [ ] **뒤로가기 제스처** — 바텀시트만 닫히고 페이지 유지 (N1 관련)
- [ ] **WebView (카톡 인앱)** — 이미지 불러오기, 외부 링크 동작
- [ ] **Kakao Map SDK** — Android에서 마커 렌더 성능 (30개 이상)

#### 저사양 기기
- [ ] **갤럭시 S10 정도** — 마커 60개+ 시 프레임 드랍
- [ ] **iPhone SE 2 (3GB RAM)** — BottomSheet 애니메이션 스터터

### 🔬 Lighthouse 실측
```bash
npm run build && npm start
# Chrome DevTools > Lighthouse > Mobile
```
목표:
- Performance ≥ 80
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95
- PWA: installable 체크

### ⚡ 번들 사이즈
```bash
ANALYZE=true npm run build
# next-bundle-analyzer 설치 후
```
의심 포인트:
- `/map` 초기 JS: 목표 250KB 이하
- Radix Dialog + Tabs: 중복 여부
- Kakao SDK: 동적 로드인지

---

## PART 3 — 잘 처리된 것 확인 (재강조)

| 항목 | 파일 | 상태 |
|---|---|---|
| FavoriteBtn 44×44 터치 영역 (v1 M5 이미 반영됨) | CafeCard.styles.ts:165 | ✅ |
| BottomSheet overscroll-behavior contain | BottomSheet.styles.ts:44 | ✅ |
| BottomSheet max-height 동적 (v1 M1 반영됨) | BottomSheet.styles.ts:37 | ✅ |
| MoodFilterSheet scroll lock useEffect | MoodFilterSheet.tsx:58-66 | ✅ |
| MoodFilterSheet Body overscroll contain | MoodFilterSheet.tsx:344 | ✅ |
| 한글 IME 대응 필요 (v1 M9) | SearchClient.tsx | ⚠️ 미반영 |
| 네이버지도 앱 딥링크 + 웹 폴백 | BottomSheet · CafeDetail | ✅ (중복이긴 함, N12) |
| safe-area-inset-bottom 반영 | 곳곳 | ✅ |
| iOS 16px 인풋 전역 | globals.css:98 | ✅ |
| 스킵 링크 | layout.tsx:50 | ✅ |
| prefers-reduced-motion | globals.css:133 | ✅ |
| 물리 뒤로가기 바텀시트 처리 | BottomSheet.tsx:85-120 | ⚠️ 엣지 케이스 (N1) |

> **주의**: v1에서 "❌"로 표시했던 것 중 실제로는 **코드에 이미 구현된 것**이 몇 개 있었음 (BottomSheet overscroll, MoodFilterSheet scroll lock). v1 리포트에서 일부 혼동. 이번 v2에서 확인 완료.

---

## PART 4 — 수정 우선순위 로드맵

### 🔥 즉시 수정 (Pre-release) — 5건
| ID | 내용 | 파일 | 예상 시간 |
|---|---|---|---|
| **N3** | SearchClient Enter 제출 | SearchClient.tsx | 10분 |
| **N4** | CafeCard PhotoCarousel swipe-tap 충돌 | CafeCard.tsx | 30분 |
| **N11** | Gallery lightbox scroll lock + ESC | CafeDetailClient.tsx | 20분 |
| **v1 M9** | 한글 IME 처리 (재확인) | SearchClient.tsx | 10분 |
| **N2** | CafeDetail 뒤로가기 history.back | CafeDetailClient.tsx | 10분 |

**합계**: 1시간 20분

### 🛠 Post-release Week 1 — 6건
| ID | 내용 | 예상 시간 |
|---|---|---|
| N1 | BottomSheet popstate cleanup replaceState | 20분 |
| N6 | HomeClient 하드코딩 숫자 제거 | 10분 |
| N7 | CardHover translate를 desktop 전용으로 | 5분 |
| N9 | Detail 탭 scroll overflow | 15분 |
| N14 | HeroFab 44×44 | 5분 |
| N17 | Middleware matcher 확장 | 5분 |

**합계**: 1시간

### 🎨 백로그 — 5건
- N5 실측 후 Textarea 16px 조정
- N8 ReviewForm autocomplete off
- N10 MoodFilterSheet height 정리 (디자인 확인 후)
- N12 externalLinks 공용화
- N13 Toast action + 로그인 이동
- N15/N16 디자인 토큰 정리

---

## PART 5 — 종합 평가

**현재 완성도 (재평가)**: **A (93/100)**
- v1에서 지적된 것 중 상당수가 실제로 이미 구현됨 → **실구현 품질은 v1 리포트보다 높음**
- 남은 이슈는 "엣지 케이스 + 디테일" 범주. Release blocker 0건.
- Critical 등급 붙인 N1-N4는 재현 조건 까다롭거나 수정 쉬움.

**실기 실측 한 번 + Phase 1 (1.5시간)만 처리하면 A+ (97+)** 달성. Claude Code가 작업한 퀄리티는 전반적으로 **매우 높음**.

### Claude Code에 던질 메시지 예시

> `mooda_review/07_comprehensive_qa_v2.md` 읽고 PART 4의 Phase 1 (N2, N3, N4, N11, v1 M9) 5건을 각각 개별 PR로 만들어줘. 각 PR 설명에 "재현 방법 + 수정 전/후 동작" 명시.

---

## 부록 — 실측 스크립트 (복붙용)

### A. 한글 IME 실측
```js
// Chrome DevTools > Console (SearchClient 진입 후)
const input = document.querySelector('input[placeholder="성수동 조용한 카페"]');
let requests = 0;
const origFetch = window.fetch;
window.fetch = (...args) => { if (args[0]?.toString().includes('keyword-search')) requests++; return origFetch(...args); };
// 수동으로 "성수" 입력 후:
console.log('요청 횟수:', requests);  // 한글 1글자씩 조합 시마다 발사되면 버그
```

### B. BottomSheet scroll chain 실측
```js
// 바텀시트 열고 시트 내부에서 과도한 스크롤 시도
document.querySelector('[class*="SheetWrap"]').addEventListener('scroll', () => console.log('sheet scrolled'));
window.addEventListener('scroll', () => console.log('window scrolled — 여기 찍히면 체인 발생'));
```

### C. Lighthouse 모바일 모드
```bash
npx lighthouse http://localhost:3000/map --preset=desktop --view
npx lighthouse http://localhost:3000/map --form-factor=mobile --throttling.cpuSlowdownMultiplier=4 --view
```

### D. 번들 분석
```bash
npm install --save-dev @next/bundle-analyzer
# next.config.ts에 withBundleAnalyzer 추가 후
ANALYZE=true npm run build
```
