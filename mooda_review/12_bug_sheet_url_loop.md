# 🔴 Critical Bug — 상세 시트 닫힘 후 재열림 + URL 리프래시 루프

> **기준 시각**: 2026-04-22, Phase 7-B + ONDEMAND_ENRICHMENT(T-CODE-01~06+08) 완료 직후
> **영향 범위**: `/map` 핵심 경로 — BottomSheet(모바일/태블릿) + CafeOverlayCard(PC) 양쪽
> **심각도**: 🔴 **Critical** — 뒤로가기 / 오버레이 탭 시 시트가 다시 올라와짐 + 주소창이 쿼리파라미터 붙었다 떼었다 깜빡임
> **보고자**: 사용자 실기 QA (2026-04-22)

---

## PART 1 — 증상 & 재현

### 사용자 보고 (원문)
> 뒤로가기를 했거나, 맵을 클릭하여 하단 상세시트가 내려갔을 때 다시 올라와짐. URL 이 리프래시 되는 현상.

### 구체 증상
- `/map` 에서 카페 탭 → BottomSheet(모바일) 또는 CafeOverlayCard(PC) 열림
- 유저가 **(a) 뒤로가기** 또는 **(b) 지도 배경 클릭 / X 버튼 / 오버레이 클릭** 으로 시트를 닫음
- 시트가 슬라이드 다운 애니메이션 후 **다시 올라옴** (재열림)
- 주소창이 `/map?cafe=A` ↔ `/map` 깜빡이는 시각적 리프래시

### 재현 경로 (추정)
1. `/map` 진입
2. 카페 마커 또는 리스트 카드 A 클릭 → 시트/오버레이 열림 + URL `/map?cafe=A`
3. 뒤로가기 키 / 오버레이 배경 탭
4. 🚨 시트 닫히는 듯하다가 다시 올라옴 / URL 잠깐 `/map` 되었다가 `?cafe=A` 복귀

---

## PART 2 — 원인 진단 (코드 증거)

### 🎯 결정적 증거: history 조작이 **두 군데서 독립적으로** 일어남

`/map` 에서 카페 선택 시 history 에 영향을 주는 코드가 **2곳**:

| 파일 | 동작 | 목적 |
|---|---|---|
| `src/app/map/MapClient.tsx:272-285` | `router.replace('/map?cafe=A')` | URL ↔ Redux SSoT 동기화 (T7-B8) |
| `src/components/map/BottomSheet.tsx:87-127` | `window.history.pushState({mooda: 'bottom-sheet'}, '')` | 뒤로가기로 시트만 닫기 (BUG-MAP-01 시절 도입) |

두 코드가 서로 모르고 각자 history 를 만지면서 엔트리 구성이 어긋남.

### 📍 MapClient URL sync (현 구현)

```tsx
// line 258-285 요약
const cafeIdFromUrl = searchParamsHook.get('cafe');

// useEffect1: URL → Redux
useEffect(() => {
  if (cafeIdFromUrl && cafeIdFromUrl !== selectedCafeId) {
    dispatch(setSelectedCafe(cafeIdFromUrl));
  } else if (!cafeIdFromUrl && selectedCafeId) {
    dispatch(setSelectedCafe(null));
  }
}, [cafeIdFromUrl]);

// useEffect2: Redux → URL (replace 사용)
useEffect(() => {
  const current = new URLSearchParams(window.location.search);
  if (selectedCafeId) {
    if (current.get('cafe') !== selectedCafeId) {
      current.set('cafe', selectedCafeId);
      router.replace(`/map?${current.toString()}`, { scroll: false });
    }
  } else if (current.has('cafe')) {
    current.delete('cafe');
    const qs = current.toString();
    router.replace(qs ? `/map?${qs}` : '/map', { scroll: false });
  }
}, [selectedCafeId, router]);
```

### 📍 BottomSheet 자체 history 조작 (현 구현)

```tsx
// line 87-127 요약
const pushedRef = useRef(false);
useEffect(() => {
  if (cafe && !pushedRef.current) {
    pushedRef.current = true;
    window.history.pushState({ mooda: 'bottom-sheet' }, '');  // ← URL 유지, state 만 +1
  }
  const onPop = () => {
    if (pushedRef.current) {
      pushedRef.current = false;
      // 350ms 후 onClose()
    }
  };
  window.addEventListener('popstate', onPop);
  return () => {
    window.removeEventListener('popstate', onPop);
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.replaceState({}, '', url);  // cleanup 시 유령 엔트리 제거
    }
  };
}, [cafe, onClose, clearCloseTimer]);
```

### 🧬 루프 발생 시퀀스 (카페 A 탭 → 뒤로가기)

**시트 열림 순서**:
```
t0  유저가 카페 A 마커/카드 탭
t1  어댑터가 dispatch(setSelectedCafe('A'))
t2  MapClient useEffect2 발화 → router.replace('/map?cafe=A')
        history: [prev, /map?cafe=A] (이전 엔트리 교체)
t3  BottomSheet mount + cafe prop 세팅
t4  BottomSheet useEffect → pushState({mooda: 'bottom-sheet'}, '')
        history: [prev, /map?cafe=A, /map?cafe=A(mooda)]
```

**뒤로가기 시**:
```
t5  브라우저 back → [prev, /map?cafe=A] 로 이동 (state: undefined, URL: /map?cafe=A)
        popstate 발화
t6  BottomSheet onPop → setVisible(false) + 350ms 타이머
t7  350ms 후 onClose() → dispatch(setSelectedCafe(null))
```

**🚨 여기서 꼬임 발생**:
```
t8  MapClient useEffect2 재발화 (selectedCafeId: 'A' → null)
        현재 URL = /map?cafe=A 이므로 current.has('cafe') = true
        → router.replace('/map') → URL 교체
        history: [prev, /map]
t9  useSearchParams 업데이트 → cafeIdFromUrl = null
t10 MapClient useEffect1 재발화 (cafeIdFromUrl: 'A' → null)
        !cafeIdFromUrl && selectedCafeId = null && null → 스킵 OK
```

여기까지는 단순 닫힘인데, **실제로는 다음 중 하나 때문에 시트가 다시 뜸**:

### 🔴 루프 트리거 시나리오

#### 시나리오 A — 뒤로가기 두 번 발생 (BottomSheet cleanup 의 replaceState)

React 18 Strict Mode 또는 Next.js App Router 의 fast re-render 에서:
- t7 이후 BottomSheet 가 unmount 되면서 cleanup 실행
- cleanup 의 `replaceState({}, '', url)` 가 현 URL `/map?cafe=A` 를 그대로 replace
- t8 의 `router.replace('/map')` 와 경합 → 타이밍에 따라 `/map?cafe=A` 로 돌아갈 수 있음
- useSearchParams 가 `cafe=A` 다시 읽음 → useEffect1 → dispatch(setSelectedCafe('A')) → 시트 재열림

#### 시나리오 B — 유저가 한 번 더 back 눌렀을 때
- t7 이후 t8 `router.replace('/map')` 로 히스토리: `[prev, /map]`
- 유저가 한 번 더 뒤로가기 → `[prev]` 로 이동 → 홈 페이지로 나감 (의도 외 행동)
- 또는 브라우저 back/forward 패널에서 `/map?cafe=A` 가 보여 forward 로 재진입 → 시트 다시 열림

#### 시나리오 C — 오버레이 탭으로 닫기 (뒤로가기 아님)
- 유저가 오버레이(배경) 탭 → BottomSheet `handleClose` 호출
- `handleClose` 가 `pushedRef.current` 면 `window.history.back()` 호출 (line 148-151)
- back() → popstate → t5~t10 시퀀스 그대로
- **t8 에서 `router.replace` + BottomSheet cleanup `replaceState` 타이밍 경합으로 URL 이 깜빡임**
- 유저 체감 "URL 리프래시"

### 🧩 "URL 이 리프래시된다" 체감의 정체

`router.replace` 가 단일 렌더 사이클 내 2번 실행될 수 있음:
1. 첫 `router.replace('/map?cafe=A')` (선택)
2. Redux null → 두 번째 `router.replace('/map')` (해제)
사이에 BottomSheet `replaceState` 또는 `history.back` 이 끼어들면서 주소창이 `?cafe=A` 붙었다 떼었다 깜빡. 유저 눈엔 페이지가 새로 로딩되는 것처럼 보임.

---

## PART 3 — 수정 가이드 (Claude Code 실행용)

### T-BUG-SHEET-01. BottomSheet 자체 history 조작 제거 (30분)

**목적**: history 조작을 MapClient URL sync 단일 경로로 일원화. BottomSheet 는 순수하게 prop 기반 UI 만.

**파일**: `src/components/map/BottomSheet.tsx`

**수정 — line 87~127 블록 전체 삭제**:
```tsx
// ❌ 삭제 대상 (전체)
const pushedRef = useRef(false);
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (cafe && !pushedRef.current) {
    pushedRef.current = true;
    window.history.pushState({ mooda: 'bottom-sheet' }, '');
  }
  const onPop = () => {
    if (pushedRef.current) {
      pushedRef.current = false;
      setVisible(false);
      setShowRoute(false);
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        onClose();
      }, 350);
    }
  };
  window.addEventListener('popstate', onPop);
  return () => {
    window.removeEventListener('popstate', onPop);
    if (pushedRef.current) {
      pushedRef.current = false;
      try {
        const url = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.history.replaceState({}, '', url);
      } catch { /* ignore */ }
    }
  };
}, [cafe, onClose, clearCloseTimer]);
```

**수정 — `handleClose` 단순화 (line 140~159)**:
```tsx
// ❌ 이전
const handleClose = useCallback((e?: React.MouseEvent) => {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  if (typeof window !== 'undefined' && pushedRef.current) {
    window.history.back();
    return;
  }
  setVisible(false);
  setShowRoute(false);
  clearCloseTimer();
  closeTimerRef.current = setTimeout(() => {
    closeTimerRef.current = null;
    onClose();
  }, 350);
}, [onClose, clearCloseTimer]);

// ✅ 이후
const handleClose = useCallback((e?: React.MouseEvent) => {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  setVisible(false);
  setShowRoute(false);
  clearCloseTimer();
  closeTimerRef.current = setTimeout(() => {
    closeTimerRef.current = null;
    onClose();  // ← 부모가 dispatch(setSelectedCafe(null)) → MapClient URL sync 가 history 정리
  }, 350);
}, [onClose, clearCloseTimer]);
```

**영향**:
- `pushedRef`, `onPop`, `popstate` 리스너, cleanup 의 `replaceState` 전부 제거
- 시트 표시/숨김은 순수하게 `cafe` prop 과 `visible` state 로만 결정
- 뒤로가기 처리는 **MapClient URL sync 가 담당** (T-BUG-SHEET-02)

---

### T-BUG-SHEET-02. MapClient URL sync 를 push 기반으로 재설계 (1시간)

**목적**: 카페 선택 = history push / 명시 닫기 = history back 으로 일원화. 브라우저 뒤로가기로 시트 자연 닫힘.

**파일**: `src/app/map/MapClient.tsx`

**수정 — line 272~285 블록 교체**:
```tsx
// ❌ 이전 (항상 replace)
useEffect(() => {
  if (typeof window === 'undefined') return;
  const current = new URLSearchParams(window.location.search);
  if (selectedCafeId) {
    if (current.get('cafe') !== selectedCafeId) {
      current.set('cafe', selectedCafeId);
      router.replace(`/map?${current.toString()}`, { scroll: false });
    }
  } else if (current.has('cafe')) {
    current.delete('cafe');
    const qs = current.toString();
    router.replace(qs ? `/map?${qs}` : '/map', { scroll: false });
  }
}, [selectedCafeId, router]);

// ✅ 이후 (선택=push, 닫기=back 또는 replace)
const openedByPushRef = useRef(false);

useEffect(() => {
  if (typeof window === 'undefined') return;
  const current = new URLSearchParams(window.location.search);
  const urlCafe = current.get('cafe');

  if (selectedCafeId && selectedCafeId !== urlCafe) {
    // 카페 선택 — URL push 로 history 엔트리 +1 (뒤로가기로 닫을 수 있게)
    current.set('cafe', selectedCafeId);
    router.push(`/map?${current.toString()}`, { scroll: false });
    openedByPushRef.current = true;
  } else if (!selectedCafeId && urlCafe) {
    // 명시 닫기 (X / 오버레이 탭 / ESC) — push 엔트리가 있으면 back 으로 소비
    if (openedByPushRef.current) {
      openedByPushRef.current = false;
      router.back();
    } else {
      // 딥링크 직접 진입 (/map?cafe=xxx) 후 명시 닫기 — push 엔트리 없으므로 replace
      current.delete('cafe');
      const qs = current.toString();
      router.replace(qs ? `/map?${qs}` : '/map', { scroll: false });
    }
  }
}, [selectedCafeId, router]);
```

**추가 — 뒤로가기 감지 (선택적 강화)**:
브라우저 뒤로가기로 URL 이 `/map` 으로 돌아간 경우, `openedByPushRef` 도 리셋:
```tsx
// useEffect1 안 (URL → Redux) 확장
useEffect(() => {
  if (cafeIdFromUrl && cafeIdFromUrl !== selectedCafeId) {
    dispatch(setSelectedCafe(cafeIdFromUrl));
  } else if (!cafeIdFromUrl && selectedCafeId) {
    dispatch(setSelectedCafe(null));
    openedByPushRef.current = false;  // ← 뒤로가기로 URL 정리됐으면 push 엔트리 상태도 리셋
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cafeIdFromUrl]);
```

**동작 시나리오 검증**:

| 시나리오 | 동작 |
|---|---|
| 카페 A 탭 | Redux=A → `router.push('/map?cafe=A')` → history: `[prev, /map, /map?cafe=A]`. `openedByPushRef=true` |
| 뒤로가기 | URL `/map` 로 back → useEffect1 → `cafeIdFromUrl=null` → Redux null + `openedByPushRef=false` → 시트 닫힘 (BottomSheet `cafe` prop null 이라 `visible=false` 애니메이션). useEffect2 는 null && null 이라 스킵 |
| X / 오버레이 탭 | `handleClose` → `onClose()` → Redux null → useEffect2 → `openedByPushRef=true` 라 `router.back()` → URL 이전 엔트리로. useEffect1 재발화 시 cafeIdFromUrl=null + selectedCafeId=null 이미 동기 — 스킵 |
| 딥링크 `/map?cafe=xxx` | useEffect1 → Redux set + `openedByPushRef` false 유지. X 닫기 시 useEffect2 → `openedByPushRef=false` 라 `router.replace('/map')` — history 누수 없음 |
| 카페 A → 카페 B (다른 카페 탭) | Redux A→B. useEffect2 → `selectedCafeId !== urlCafe` 이므로 `router.push`. history +1 — 일부러 쌓는 게 맞음 (뒤로가기로 A → `null` 순차 복원) |

---

### 보조 — QA-1. enrich-images router.refresh 루프 검증 (15분)

**파일**: `src/app/cafes/[id]/CafeDetailClient.tsx:145-167`, `src/app/api/cafes/[id]/enrich-images/route.ts`

**현 상태 (확인됨)**:
- `/api/cafes/[id]/enrich-images` route 가 **Redis `enrich:recent:${id}` TTL 1h** 로 중복 호출 차단 (line 39: `RECENT_TTL_SEC = 60 * 60`)
- recent 있으면 `304 Not Modified` 반환 → CafeDetailClient 가 `!res.ok || res.status === 204 || res.status === 304` 에서 early return → `router.refresh()` 호출 안 함
- **루프 위험 낮음**. 단 다음 2건 확인:

**확인 Task**:
- [ ] enrich-images route 응답이 실제로 304 일 때 `router.refresh()` 가 불리지 않는지 DevTools Network 에서 검증
- [ ] saved > 0 이고 `router.refresh()` 호출 후 `cafe.photos.length` 가 3 이상으로 갱신되어 useEffect 재발화 시 스킵되는지 확인
- [ ] React Strict Mode (dev) 에서 useEffect 2회 실행되어도 두 번째는 Redis lock(60s) 에 걸려 409 반환 → `!res.ok` 로 early return

**이슈 없으면 문서에 "정상 동작 확인" 메모만 추가, 코드 변경 없음**

---

### 보조 — QA-2. CafeOverlayCard ESC 닫기 포커스 복귀 (30분)

**파일**: `src/components/map/CafeOverlayCard.tsx`

**현 상태 (확인됨)**:
- line 77: `if (e.key === 'Escape') onClose()` 
- line 138: `<IconBtn ref={closeBtnRef} aria-label="닫기" onClick={onClose}>` — `closeBtnRef` 있음 (열릴 때 포커스 이동용으로 추정)

**확인 Task**:
- [ ] Overlay 열릴 때 closeBtnRef 로 포커스 이동 구현됐는지 확인
- [ ] Overlay 닫힐 때 **선택된 ListCard** 또는 **원래 포커스 요소**로 복귀하는지 확인 — 없으면 focus trap 끝난 후 document.body 로 가서 Tab 키 탐색이 처음부터 시작됨
- [ ] 필요 시 `onMount` 시점의 `document.activeElement` 를 ref 에 저장 → `onUnmount` 시점에 `.focus()` 복귀

**예시 패턴**:
```tsx
const previousFocusRef = useRef<HTMLElement | null>(null);
useEffect(() => {
  previousFocusRef.current = document.activeElement as HTMLElement | null;
  closeBtnRef.current?.focus();
  return () => {
    previousFocusRef.current?.focus?.();
  };
}, []);
```

---

### 보조 — QA-3. 딥링크 진입 시 body scroll lock (15분)

**파일**: `src/components/map/BottomSheet.tsx`

**확인 Task**:
- [ ] 모바일에서 `/map?cafe=xxx` 직접 접근 → BottomSheet 자동 열림 → `body { overflow: hidden }` 적용되는지
- [ ] 시트 닫힘 시 해제되는지
- 현 코드에서 `InfoSection overflow-y: auto` + `overscroll-behavior: contain` 이 scroll chain 은 막지만 body scroll lock 은 아님. 모바일 주소창 영향 확인

**이슈 있으면 (있을 가능성 낮음)**:
```tsx
useEffect(() => {
  if (!visible) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = prev; };
}, [visible]);
```

---

## PART 4 — Definition of Done

### 코드 체크
- [ ] `BottomSheet.tsx` line 87-127 `pushState`/`popstate`/`replaceState` 블록 제거
- [ ] `BottomSheet.tsx` `handleClose` 단순화 (pushedRef 분기 제거)
- [ ] `MapClient.tsx` useEffect2 URL sync 가 `router.push` 기반 + `openedByPushRef` 추가
- [ ] `MapClient.tsx` useEffect1 에 `openedByPushRef = false` 리셋 추가
- [ ] `grep -n "pushState\|popstate" src/components/map/BottomSheet.tsx` → 0건
- [ ] `grep -n "openedByPushRef" src/app/map/MapClient.tsx` → 1-2건
- [ ] `pnpm typecheck && pnpm build` 통과

### 수동 QA — PC (≥1024px, CafeOverlayCard)
- [ ] 카페 A 카드 탭 → Overlay 열림 + URL `/map?cafe=A`
- [ ] 뒤로가기 → Overlay 닫힘 + URL `/map` + 시트 다시 뜨지 않음
- [ ] X 버튼 → Overlay 닫힘 + URL `/map` + 뒤로가기 엔트리 정리
- [ ] ESC 키 → X 와 동일
- [ ] 오버레이 배경 클릭 — 시안 정책대로 (Airbnb 스타일은 닫지 않음. 현 구현 확인)
- [ ] 카페 A → 카페 B 연속 탭 → URL 갱신 + 뒤로가기로 A 복원 (또는 닫힘, 두 동작 중 정책 결정)

### 수동 QA — Mobile/Tablet (<1024px, BottomSheet)
- [ ] 카페 A 마커 탭 → BottomSheet 슬라이드 업 + URL `/map?cafe=A`
- [ ] Android 물리 뒤로가기 → 시트 닫힘 + URL `/map` + **시트 다시 뜨지 않음** 🔴 최우선 확인
- [ ] 오버레이 (배경 어둡게 된 영역) 탭 → 시트 닫힘 + URL 정리 + 리프래시 없음
- [ ] X 버튼 탭 → 동일
- [ ] 시트 열린 상태에서 URL 복사해서 새 탭 붙여넣기 → 해당 카페 시트 자동 열림

### 딥링크 & 회귀
- [ ] `/map?cafe=<id>` 직접 진입 → PC Overlay / Mobile BottomSheet 자동 열림
- [ ] 딥링크 상태에서 X 닫기 → URL `/map` 로 교체 + 뒤로가기 시 이전 앱 외 페이지로 나감 (정상)
- [ ] BUG-MAP 회귀 없음 — 탭 전환 / provider 토글 후 지도 정상 렌더
- [ ] BUG-SEARCH 회귀 없음 — `/search` Row hydration 에러 0건

### 보조 QA
- [ ] **QA-1**: `/cafes/[id]` 사진 없는 카페 진입 → enrich 완료 후 1회만 `router.refresh()` → 재진입 시 304 로 refresh 안 함 (Network 탭)
- [ ] **QA-2**: Overlay 열릴 때 닫기 버튼에 포커스, 닫을 때 원래 요소로 복귀
- [ ] **QA-3**: 모바일 딥링크 진입 시 body scroll lock 작동

---

## PART 5 — 리스크 & 엣지 케이스

### 리스크
1. **`router.push` 로 히스토리 누적** — 유저가 카페 10개 연속 탭 → 뒤로가기 10번 눌러야 원래 페이지로. 의도된 동작이나 누적 과도하면 UX 저하. 모니터링 후 필요 시 "연속 선택은 replace, 신규 세션은 push" 로 튜닝
2. **`router.back()` 이 Mooda 외부로 나감** — 외부에서 `/map?cafe=A` 로 바로 진입 + X 닫기 시 `openedByPushRef=false` 이므로 replace 사용 → 안전. 이 분기 반드시 유지
3. **BottomSheet pushState 제거로 안드로이드 물리 뒤로가기 동작 변화** — 기존엔 시트만 닫혔음. 새 구조에서도 URL `?cafe=` 제거로 시트 자동 닫힘 + 같은 URL 위치 유지 (페이지 안 나감). **실기 확인 최우선**

### 엣지 케이스
- **카페 A → B → C 빠른 연속 탭**: 각각 push → 뒤로가기 3번 필요. `router.push` 가 동일 카페 반복 push 하지 않도록 `selectedCafeId !== urlCafe` 가드 유지
- **동시 선택 (지도 마커 A + 리스트 카드 B)**: 어댑터가 dispatch 하는 순서대로 Redux 갱신 — 마지막이 이김. URL 은 마지막 선택으로 push 됨
- **새로고침 (F5)**: URL `/map?cafe=A` 유지 → useEffect1 이 Redux set → 시트 자동 열림. `openedByPushRef=false` 상태 (push 한 적 없음) → X 닫기는 replace 사용. OK
- **페이지 내 앵커 이동 등 URL hash 변경**: useEffect2 는 `cafe` 쿼리만 다루므로 hash 무관

---

## PART 6 — 대안 검토 (참고용, 채택 안 함)

### 대안 X — 옵션 A (현 구현 유지 + BottomSheet 우선)
- BottomSheet pushState 유지 + MapClient URL sync 제거
- 장점: BottomSheet 자체 완결
- 단점: 딥링크 공유 불가 (URL `?cafe=` 가 없음). T-B8 목적에 역행 — **기각**

### 대안 Y — 옵션 C (현 구조 + 타이밍 동기화)
- 현 코드 유지 + `requestAnimationFrame` / `setTimeout` 으로 타이밍 맞춤
- 단점: 근본 해결 아님. 엣지 케이스 계속 발생 — **기각**

### 대안 Z — PC 와 Mobile 정책 분리
- PC 는 `router.push`, Mobile 은 자체 `pushState`
- 단점: 두 정책 공존 → 유지보수 비용 ↑. 코드 일관성 저하 — **기각**

**→ T-BUG-SHEET-01 (BottomSheet 자체 history 제거) + T-BUG-SHEET-02 (MapClient push 기반) 조합이 가장 단순 + 완결**

---

## PART 7 — 연관 이슈 · 참고

- **BUG-MAP-01 (커밋 `5e91180`)** — `BottomSheet.tsx` popstate 로직은 원래 안드로이드 물리 뒤로가기로 시트만 닫히게 하려던 의도. T-B8 URL sync 도입으로 **중복** 발생. 이번 수정에서 URL 이 SSoT 가 되므로 원래 의도는 그대로 충족 (URL `?cafe=` 제거 = 시트 닫힘)
- **Phase 7-B · T7-B8 (커밋 `1ceaf9f`)** — URL sync 자체 설계는 정확. push vs replace 선택만 수정
- **CafeOverlayCard** — 자체 history 조작 없음 (확인 완료). 본 수정으로 Overlay UX 자동 개선
- **ONDEMAND_ENRICHMENT T-CODE-04** — `router.refresh()` 호출. Redis recent TTL 로 루프 방지됨 (QA-1 에서 확인)

---

## PART 8 — 📋 커밋 규칙 (재강조)

🚫 **커밋 메시지 / PR 본문에 `Co-Authored-By: Claude …` / `🤖 Generated with Claude Code` 절대 금지**. 전역 규칙 (`~/.claude/CLAUDE.md` + `mooda_review/README.md` 상단).

### 권장 커밋
```
refactor(bottomsheet): 자체 history 조작 제거 — URL sync SSoT 일원화 (T-BUG-SHEET-01)
fix(map): URL sync push/back 기반 — 뒤로가기 자연 닫힘 + 리프래시 루프 제거 (T-BUG-SHEET-02)
```

보조 QA (수정 없을 수도 있음):
```
chore(qa): enrich-images refresh 루프 없음 확인 (QA-1)
fix(overlay): ESC 닫기 후 포커스 복귀 (QA-2)   # 필요 시
fix(sheet): 모바일 딥링크 진입 시 body scroll lock (QA-3)  # 필요 시
```

---

## 결론 & 권장

- **즉시 처리 권장**. 뒤로가기가 핵심 경로에서 잘못 동작하고 URL 리프래시는 체감 장애.
- **단일 PR · 2 커밋** (T-BUG-SHEET-01 + 02) + 필요 시 보조 QA 1~3 commit
- **예상 시간**: 1.5~2시간 (핵심 2건) + 실기 QA 30분
- **회귀 주의**: BUG-MAP 에서 BottomSheet popstate 수정했던 이력 있음. 제거해도 URL sync 가 동일 역할 → 회귀 없음 검증 필수

### README 라우팅
본 문서 작성 후 `mooda_review/README.md` 의 "🎯 다음 작업" 섹션에:
- **신규 1순위**: BUG-SHEET URL LOOP 수정 (T-BUG-SHEET-01 + 02)
- 기존 상태표에 `🔴 BUG-SHEET (상세 시트 URL 루프)` 행 추가

Claude Code 가 한 번의 작업 루프로 마감 가능.
