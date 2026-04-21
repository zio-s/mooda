# 🟡 지도 탭/페이지 이동 후 복귀 시 렌더 깨짐

> **기준 시각**: 2026-04-21, Phase 6 완료 직후 실기 실측 중 발견
> **영향 범위**: `/map` 핵심 경로 — 카카오맵 & 네이버지도 양쪽 모두
> **초기 심각도**: 🔴 Critical → **현 심각도: 🟡 Medium (로컬 크롬 재현 안 됨, 특정 상황 재발 가능성)**
> **상태 (2026-04-21 업데이트)**:
> - ✅ BUG-MAP-01/02 코드 수정 (커밋 `5e91180`)
> - ✅ 로컬 Chrome 서버에서 재현 없음 (사용자 확인)
> - ⏳ **특정 상황 재발 분석 — PART 8 체크리스트**
> - ⏳ 실기 매트릭스 QA (iOS Safari / Android Chrome / 데스크톱)

---

## PART 1 — 증상 & 재현

### 사용자 보고 증상
바텀시트가 열려 있거나 지도(`/map`)에 머무른 상태에서 **다른 탭 또는 다른 페이지로 이동 후 다시 지도로 돌아오면** 지도 뷰 영역이 깨짐. 지도 타일이 원래 뷰포트의 일부(좌상단) 영역만 렌더되고 나머지는 흰 배경으로 비어 있음.

### 첨부 스크린샷 해석
- 좌상단 약 `310 × 400px` 영역만 지도 타일 렌더 (합정역 주변 POI·도로 확인)
- 나머지 영역은 배경색 그대로 (타일 미로드)
- 우측 zoom 컨트롤(+/−)과 우하단 내 위치 버튼(N)은 정상 표시 — **absolute positioning이라 지도 canvas 와 독립**
- 제공자 탭 `네이버지도` 활성, `카카오맵` 비활성 → 네이버 어댑터에서 포착
- 좌상단 세그먼트 `지도 / 목록` 정상, 정렬 드롭다운 `거리순` 정상 → 오버레이 UI는 살아 있음

### 재현 경로 (추정 · 실기 검증 필요)
1. `/map` 진입 → 지도 로드 완료
2. 브라우저 탭 전환(예: `cmd+tab` 또는 다른 탭 클릭) · 혹은 Next.js 라우팅으로 `/profile` 이동 후 뒤로가기
3. `/map` 복귀 → 지도 영역 일부만 렌더
4. 제공자 토글(카카오↔네이버) 해도 동일 현상 유지 가능성

---

## PART 2 — 원인 진단 (코드 증거)

### 🎯 결정적 증거: 어댑터 양쪽 모두 **resize/relayout 핸들러 전무**

```bash
grep "relayout|refresh\(|resize|ResizeObserver|visibilitychange" \
  src/components/map/adapters/*.tsx
# → 0건
```

지도 SDK 문서는 **컨테이너 크기 변경 · 숨김 → 표시 전환 후 명시적 리레이아웃 호출**을 요구.

### 파일별 진단

#### 📍 `src/components/map/adapters/KakaoCafeMap.tsx`
- `react-kakao-maps-sdk` 의 `<Map>` 컴포넌트만 선언, **map 인스턴스 ref 자체를 안 보관**
- `onCreate={handleBoundsChange}` (L198) — 콜백 인자로만 map 을 받음
- **수정 시 구조 변경 필요**: `mapRef` 신설 + `onCreate`에서 ref 저장

#### 📍 `src/components/map/adapters/NaverCafeMap.tsx`
- `mapRef = useRef<NaverMap | null>(null)` (L122) — 인스턴스 저장 중
- `mapRef.current = map` (L188) 후 cleanup `= null` (L233)
- **`refresh()` / resize 반응 코드 없음**
- useEffect 5개 — center/bounds/user-location 추적만 담당

#### 📍 `src/components/map/BottomSheet.tsx:200`
- `visibilitychange` 이벤트 사용 중 — 단 **네이버지도 앱 딥링크 복귀 감지용** (L190 근방 `handleDirections`)
- 지도 refresh 용도 아님. 혼동 금지

#### 📍 `src/components/map/CafeMapWrapper.tsx`
- `dynamic(() => ..., { ssr: false })` → 최초 마운트 후 상주 → **탭 전환 시 언마운트 안 됨** (Next.js App Router 특성)
- 언마운트 안 되니 지도 인스턴스 살아있지만 렌더 캔버스가 stale 상태

### 왜 "좌상단만 렌더" 증상으로 나타나는가
1. 최초 마운트 시 `MapArea` 컨테이너 크기 = 예: `310 × 400` (뷰포트 작은 시점 또는 초기 레이아웃 계산 순간)
2. 지도 SDK가 그 크기로 canvas 초기화 + 타일 요청
3. **탭 전환 동안**: 브라우저가 비활성 탭 렌더 일시 중단. `resize` 이벤트 놓침. 실제 컨테이너는 뷰포트에 따라 확장됨
4. **복귀 시**: 컨테이너는 현재 크기(예: `700 × 800`)이지만 **지도 canvas 는 여전히 구 크기** → 좌상단 영역만 타일이 있고 나머지는 비어 있음

### 부가 원인 후보 (검증 필요)
1. **BFCache 복원**: 브라우저 뒤로가기로 복귀 시 Page 가 BFCache에서 그대로 복원 → `pageshow` 이벤트의 `persisted === true`. 이때도 relayout 필요
2. **바텀시트 닫힘 직후 MapArea 크기 변동**: 바텀시트는 `position: fixed` 라 MapArea 크기에 영향 없음 (CSS 확인) → 이 시나리오는 낮음
3. **Provider 토글 후 DOM replace**: `KakaoCafeMap` ↔ `NaverCafeMap` 교체 시 이전 SDK 잔상 가능성 — 별도 이슈

---

## PART 3 — 수정 가이드 (Claude Code 실행용)

### T-BUG-MAP-01. NaverCafeMap visibility + resize 핸들러 추가 (40분)

**파일**: `src/components/map/adapters/NaverCafeMap.tsx`

**추가 위치**: `mapRef.current = map` 이후 useEffect 섹션 (L238 근처).

```tsx
// 1) 탭/창 복귀 시 강제 리페인트
useEffect(() => {
  const onVis = () => {
    if (document.hidden) return;
    const map = mapRef.current;
    if (!map) return;
    // 네이버 SDK: 2번째 인자 true → 타일 강제 리로드
    map.refresh(true);
  };
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}, []);

// 2) BFCache 복원 대응
useEffect(() => {
  const onShow = (e: PageTransitionEvent) => {
    if (e.persisted) mapRef.current?.refresh(true);
  };
  window.addEventListener('pageshow', onShow);
  return () => window.removeEventListener('pageshow', onShow);
}, []);

// 3) 컨테이너 크기 변동 감지 (ResizeObserver)
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  let scheduled = false;
  const obs = new ResizeObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      mapRef.current?.refresh(true);
    });
  });
  obs.observe(container);
  return () => obs.disconnect();
}, []);
```

**주의**:
- `requestAnimationFrame` throttle — ResizeObserver 는 프레임당 여러 번 발사될 수 있음
- `refresh(true)` 의 true 플래그 = **동기화 모드**, SDK 내부 상태와 타일 재요청 강제
- `containerRef` 는 `<div ref={containerRef}>` (L382) 로 이미 존재 → 재사용

---

### T-BUG-MAP-02. KakaoCafeMap 인스턴스 ref 확보 + relayout 추가 (1시간)

**파일**: `src/components/map/adapters/KakaoCafeMap.tsx`

**단계 1** — map 인스턴스 보관용 ref 신설:
```tsx
const mapRef = useRef<kakao.maps.Map | null>(null);
const containerRef = useRef<HTMLDivElement | null>(null);
```

**단계 2** — `onCreate` 에서 ref 할당:
```tsx
const handleCreate = useCallback((map: kakao.maps.Map) => {
  mapRef.current = map;
  handleBoundsChange(map);  // 기존 로직 유지
}, [handleBoundsChange]);

// <Map onCreate={handleCreate} ... />
```

**단계 3** — `<Map>` 래퍼를 `containerRef` 가 잡을 수 있는 구조로 (SDK는 `<Map>` 자체에 ref 못 꽂음. div 래핑):
```tsx
<div ref={containerRef} style={{ width: '100%', height: '100%' }}>
  <Map ... onCreate={handleCreate} />
</div>
```

**단계 4** — NaverCafeMap 와 동일한 3개 useEffect 추가. 호출만 SDK API 에 맞게:
```tsx
// 카카오 SDK: relayout()
mapRef.current?.relayout();
// relayout 직후 중심점이 튈 수 있음 → 저장된 center로 복원
mapRef.current?.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
```

**주의**:
- 카카오의 `relayout()` 은 **동기적**, 직후 setCenter 호출 안전
- Redux `center` 최신값을 useRef로 한 번 더 잡고 호출 (stale closure 회피)

---

### T-BUG-MAP-03. (옵션) Provider 토글 시 이전 인스턴스 확실히 파기 (20분)

**파일**: `src/components/map/CafeMap.tsx` 또는 adapter 선택 스위치 위치

**증상 재발 시나리오**: 카카오→네이버 토글 후 "탭 전환 복귀" 시 이전 어댑터 DOM 잔상.

**수정**: 스위치 컴포넌트에서 provider 변경 시 `key` prop 으로 강제 리마운트:
```tsx
const provider = useAppSelector((s) => s.map.provider);  // 'kakao' | 'naver'
return provider === 'naver'
  ? <NaverCafeMap key="naver" {...props} />
  : <KakaoCafeMap key="kakao" {...props} />;
```

key 가 바뀌면 React 가 unmount → remount 강제 → 이전 SDK 인스턴스 clean cleanup.

---

## PART 4 — Definition of Done

### 코드 체크
- [ ] `NaverCafeMap` 에 visibilitychange + pageshow(persisted) + ResizeObserver 3개 useEffect 추가
- [ ] `KakaoCafeMap` mapRef + containerRef 신설, onCreate에서 할당, 동일 3 useEffect 추가
- [ ] `mapRef.current?.refresh(true)` (Naver) / `mapRef.current?.relayout() + setCenter` (Kakao) 호출 확인
- [ ] `pnpm typecheck && pnpm build` 통과

### 수동 QA (실기)
- [ ] `/map` → 다른 브라우저 탭으로 전환 → 5초 대기 → `/map` 탭 복귀 → **전체 영역 정상 렌더**
- [ ] `/map` → `/profile` 링크로 이동 → 브라우저 뒤로가기로 `/map` 복귀 → **정상 렌더**
- [ ] `/map` → 모바일 Chrome에서 홈버튼 → 앱 복귀 → **정상 렌더**
- [ ] `/map` → 바텀시트 열기 → 다른 탭 → 복귀 → **지도 + 바텀시트 둘 다 정상**
- [ ] 카카오맵 · 네이버지도 각각 검증
- [ ] 제공자 토글 후 위 전부 재검증

### 회귀 3경로 (변경 없음 확인)
- [ ] 카페 마커 탭 → 바텀시트 오픈 → Android 뒤로 → 닫힘
- [ ] `/cafes/[id]` → 갤러리 → ESC
- [ ] `/search` → 한글 2자 → Enter → 상세

### 디바이스 매트릭스
- [ ] iOS Safari (14 Pro / SE)
- [ ] Android Chrome (Pixel / 갤럭시)
- [ ] 데스크톱 Chrome / Safari

---

## PART 5 — 리스크 & 엣지 케이스

### 리스크
1. **refresh(true) 과호출**: ResizeObserver 프레임당 발사. `requestAnimationFrame` 게이트로 완화했지만, 지도 타일이 1초에 수차례 재요청되면 대역폭/쿼터 낭비 → 실측 후 debounce(200ms) 추가 검토
2. **relayout 후 setCenter 중복**: 카카오는 relayout 자체가 setCenter 무효화하지 않는다는 문서화 없음. **실측 권장** — 필요시 제거
3. **ResizeObserver 지원**: 모든 타겟 기기(iOS 14+, Chrome 64+) 지원 → 문제없음

### 엣지 케이스
- **지도 loading 중 탭 전환**: `useKakaoLoader` 의 loading 단계에서 숨김되면 refresh 호출해도 인스턴스 없음. `mapRef.current ?? null` 체크로 방어됨
- **provider 토글 직후 탭 전환**: T-BUG-MAP-03 의 key prop 리마운트로 커버
- **iOS Safari memory pressure**: 백그라운드 장시간 시 지도 SDK 자체가 destroy 되는 경우 있음. 이 경우 refresh 불충분 → 어댑터 전체 remount 필요. **실기 실측 후 대응**

---

## PART 6 — 연관 이슈 · 참고

- **QA v2 N1** BottomSheet popstate 무한 루프 — 이미 수정 완료(`f692e5c`). 본 이슈와 독립
- **05 리뷰 4.2** 안드로이드 물리 뒤로가기 — 이미 수정 완료. 본 이슈와 독립
- **Phase 6 P6-02, P6-03** 어댑터 에러 배너 이모지 교체 — 무관
- 본 이슈 이후 **지도 SDK lifecycle 전반 QA** 가 필요할 수 있음 (Naver 토큰 만료, Kakao appkey 검증 실패 등)

---

## 결론 & 권장

**즉시 처리 권장**. 사용자 핵심 경로에서 발생하고 **되돌리기 어려운 UX 실패** (새로고침 외 복구 수단 없음).

### 작업 순서
1. **T-BUG-MAP-01** (Naver · 40분) — ref 이미 있으니 가장 빠름 ✅ 완료 `5e91180`
2. **T-BUG-MAP-02** (Kakao · 1시간) — ref 구조 변경 포함 ✅ 완료 `5e91180`
3. **T-BUG-MAP-03** (토글 · 20분, 옵션) — 실기 재현되면 착수 → PART 8 BUG-MAP-A4 로 이관
4. 실기 매트릭스 QA (1시간) — 사용자 대기

**총 예상**: 2-3시간. 단독 PR 권장 (`fix(map): resize/visibility 핸들러로 탭 복귀 시 뷰 깨짐 수정`).

### Phase 7 와의 관계
이 버그 수정은 **Phase 7 후보(P7-A~F)와 별개**. 현 상태에서 **hotfix 로 선처리** 후 Phase 7 착수 권장.

---

## PART 8 — 🔬 재발 분석 체크리스트 (2026-04-21 추가)

> **배경**: BUG-MAP-01/02 코드 수정 후 **로컬 크롬 서버에서는 재현 안 됨**. 단, 실사용자 리포트는 특정 상황에서만 터질 가능성이 높음. 아래 7개 가설 중 **A2~A4 는 코드 수정으로 예방 강화 가능**, **A1/A5~A7 은 조사·관찰**.

### 🔧 코드 수정 가능 (Claude Code 실행 가능) — "예방 강화" 패치

#### **BUG-MAP-A2** — `mapRef` 미할당 상태 refresh no-op 방어 (30분)

**가설**: SDK 로드 중(useKakaoLoader/Naver SDK) 유저가 탭 전환 → 복귀 시점에 `mapRef.current === null` → `refresh()` no-op → 이후 SDK 가 init 되지만 놓친 visibilitychange 를 복구 못 함.

**증상**: "탭 복귀 직후에는 깨져 있다가 한 번 더 전환하면 정상" — 두 번째 visibilitychange 가 trigger 되면 그제야 refresh 성공.

**파일**: `NaverCafeMap.tsx` · `KakaoCafeMap.tsx`

**수정 패턴** (양쪽 동일 적용):
```tsx
const pendingRefreshRef = useRef(false);

// visibilitychange / pageshow / ResizeObserver 핸들러 모두 같은 함수로 통합
const requestRefresh = useCallback(() => {
  if (mapRef.current) {
    // Naver
    mapRef.current.refresh(true);
    // 또는 Kakao: refreshMapView()
  } else {
    // map 아직 init 전 → 플래그만 세워두고 init 완료 후 flush
    pendingRefreshRef.current = true;
  }
}, []);

// handleCreate (Kakao) 또는 map init 완료 지점 (Naver) 에서 flush:
useEffect(() => {
  if (mapReady && pendingRefreshRef.current) {
    pendingRefreshRef.current = false;
    mapRef.current?.refresh(true);  // 또는 refreshMapView()
  }
}, [mapReady]);
```

**커밋**: `fix(map): SDK 초기화 전 visibility 이벤트 큐잉 (BUG-MAP-A2)`

---

#### **BUG-MAP-A3** — Container 0×0 상태 refresh 스킵 (15분)

**가설**: CafeMapWrapper 는 `dynamic({ ssr: false })` 로 클라 마운트 후 로드. 초기 렌더 한 프레임 중 container 크기가 0×0 일 수 있음. ResizeObserver 가 그 순간 refresh 호출하면 SDK 내부 상태가 왜곡될 가능성.

**파일**: `NaverCafeMap.tsx:267-282` · `KakaoCafeMap.tsx` 동등 위치

**수정 패턴**:
```tsx
const obs = new ResizeObserver((entries) => {
  const entry = entries[0];
  if (!entry) return;
  const { width, height } = entry.contentRect;
  // 0×0 스킵 — SDK 내부 canvas 가 유효하지 않은 크기로 갱신되는 것 방지
  if (width < 10 || height < 10) return;
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    mapRef.current?.refresh(true);
  });
});
```

**커밋**: `fix(map): ResizeObserver 가 container 0×0 에서 refresh 건너뛰도록 (BUG-MAP-A3)`

---

#### **BUG-MAP-A4** — Provider 토글 시 `key` prop 강제 리마운트 (20분, 기존 T-BUG-MAP-03 승격)

**가설**: 카카오 ↔ 네이버 토글 시 이전 어댑터가 unmount 되면서 destroy 호출 전에 새 어댑터가 mount → 이전 SDK 인스턴스가 DOM 에 일시적으로 overlap. 그 상태에서 탭 전환 → 복귀 시 어느 인스턴스가 refresh 되는지 불확정.

**파일**: `src/components/map/CafeMap.tsx` (또는 어댑터 선택 스위치 위치)

**수정 패턴**:
```tsx
const provider = useAppSelector((s) => s.map.provider);
return provider === 'naver'
  ? <NaverCafeMap key="naver" {...props} />
  : <KakaoCafeMap key="kakao" {...props} />;
```

`key` 가 바뀌면 React 가 기존 tree unmount + 새 tree mount 를 **동기 순서** 로 보장 → 이전 SDK 의 `destroy()` 가 새 SDK 의 `new Map()` 전에 완료.

**커밋**: `fix(map): provider 토글 시 key prop 으로 어댑터 강제 리마운트 (BUG-MAP-A4)`

---

### 🔬 조사·관찰 필요 (코드 수정 불확실 · 사용자 보고 의존)

#### **BUG-MAP-A1** — 재현 시나리오 수집

재현된 기기/브라우저/순서/타이밍을 구체적으로 잡기 전까진 나머지 가설 검증 불가.

**관찰 포맷** (실기 QA 시 기록):
```
- 디바이스: iPhone 15 Pro (iOS 17.x) / Galaxy S22 (Android 14) / macOS Safari …
- 브라우저: 네이티브 Safari / 카톡 인앱 WebView / Chrome …
- 지도 provider: Kakao / Naver
- 재현 순서:
  1) /map 진입 → 지도 로드 완료 확인
  2) [다른 탭 클릭 / 홈 버튼 / /profile 이동 / 앱 백그라운드 N초]
  3) /map 복귀
- 현상: 좌상단만 렌더 / 전체 흰 배경 / 타일만 깨짐 / 마커 위치 어긋남
- 새로고침 시 정상: Y/N
- 한 번 더 탭 전환 후 정상: Y/N  ← A2 가설 검증 포인트
```

#### **BUG-MAP-A5** — SW 타일 캐시 정책 검토

**의심**: `public/sw.js` (또는 `mooda-v3-*` 전략) 가 지도 타일 URL 을 캐시하면, 오래된 타일이 반환되면서 새 크기의 canvas 와 미스매치 → 깨진 것처럼 보일 가능성.

**조사 대상**:
- Kakao/Naver 타일 URL 패턴 (`map*.daumcdn.net`, `nrbe.map.naver.net` 등)
- 현재 SW 가 이 URL 을 intercept 하는지
- 한다면 캐시 TTL 이 얼마인지

**기대 결과**: 타일 URL 은 SW 캐시 배제 (`NetworkOnly`) 또는 짧은 TTL (<5분) 확인.

#### **BUG-MAP-A6** — BottomSheet 열린 상태 복귀 UX 오해 여부

바텀시트가 열린 채 탭 전환 → 복귀 시 지도는 정상 렌더됐지만 바텀시트가 화면 70% 차지 → 유저 눈엔 "깨진 것처럼" 보일 수 있음.

**조사**: 이건 버그 아님. 설명/QA 가이드라인 보강 필요 여부만.

#### **BUG-MAP-A7** — React Strict Mode 이중 useEffect 발화

Next.js 개발 모드는 strict mode 로 useEffect 2회 실행. 리스너 cleanup 이 완전하지 않으면 중복 리스너 → refresh 중복 호출.

**조사**:
- 3개 useEffect cleanup 전부 `removeEventListener` 확인 (현 코드 OK)
- React DevTools Profiler 로 Naver/KakaoCafeMap 의 useEffect 실행 횟수 확인

### 📋 재발 분석 작업 순서 (권장)

1. **A2·A3 먼저 코드 수정** — 로컬 재현 없이도 합리적 방어. 실기 QA 전에 묶어서 배포
2. **A4 는 실기 재현 확인 후** — provider 토글 관련 증상이 있다면 착수
3. **A5 는 SW 코드 리뷰** — 단독 조사. 영향 있으면 별도 hotfix
4. **A1·A6·A7 은 실기 QA 와 병행** — 재현 로그 수집 → 위 가설 중 어디와 일치하는지 매칭
