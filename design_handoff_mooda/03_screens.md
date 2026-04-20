# 03. Screens

5개 핵심 화면의 구현 가이드. `mockups/index.html`을 브라우저로 열어 시각 레퍼런스를 함께 참고하세요.

---

## 01 지도 `/map`

### 레이아웃 Z-stack (bottom → top)

1. **Map canvas** — 전체 (fixed, inset 0)
2. **Map floating buttons** (right, top:180): zoom ±, locate (각 40×40, stack, radius 12, shadow md)
3. **"이 지역 재검색"** 플로팅 칩 — 중앙 상단 (top:180, z:15)
4. **Top overlay** — 검색 pill + 필터칩 row (top: safe-area-top + 12, z:20)
5. **Bottom sheet peek** — 선택된 마커 있을 때 (bottom:0, z:25)

### 검색 pill (헤더)
- height 48, radius 24, bg white, shadow `0 2px 14px rgba(0,0,0,.12)`
- `search icon + "성수동 조용한 카페" text (tap → router.push('/search'))`
- 우측: mic icon, divider 1×20, 프로필 원형 32×32 (amber-50 bg)
- **이 pill은 readonly** — 실제 입력은 /search에서만

### 필터칩 row
- 2px gap 6, overflow hidden (가로 스크롤 가능)
- [필터 N] — solid brand, 숫자 배지(white on tint)
- [조용한] [노트북] [통창] — 외관 chip (32h, radius 16, border ink-200, bg white)
- 활성 칩은 `selected=true` variant (brand border + brand-tint bg + brand-ink fg)

### 마커 LOD (ISSUE-06)

| 줌 | 마커 | 구현 |
|---|---|---|
| ≥16 | **이름 pill** | DOM overlay, bg white/brand, border, shadow, name 11.5/600, 선택 시 별 + scale + bounce |
| 13-15 | **도트** | 22px circle, brand, white border 2.5 |
| ≤12 | **클러스터** | 40px halo + 28px solid brand, 숫자 white 12/700 |

- 선택 마커: `animation: bounce 0.6s ease-out` + 우측 상단 별
- Kakao Map **CustomOverlay** (`kakao.maps.CustomOverlay`)로 React 포탈 렌더링
- 렌더 최적화: 화면 bounds 내 ±10% 패딩 내 마커만 생성, `zoom_changed` / `bounds_changed`에서 재구성

### "이 지역 재검색" (ISSUE-03)
- 조건: `moved_distance ≥ 300m OR zoom_changed` 이후 **사용자 idle 0.3s**
- 위치: top:180, 중앙, bg ink-900, fg white, radius 999, padding 8×14, fs 12.5/600
- 탭 → `fetchNearby({ center, zoom, bounds })` 발사, 이후 칩 숨김

### Bottom sheet peek (ISSUE-02)
선택 마커 있을 때.

```
┌─ handle (36×4) ─┐
┌──────┬─────────────────────┐
│ 92px │  [영업중] 로우키 커피  ❤ │
│ photo│  카페 · 성수동1가 · 350m │
│      │  ★ 4.7 (182) · 🚌 15분  │
│      │  [조용한][통창/뷰][노트북]│
└──────┴─────────────────────┘
[ 상세보기        ] [🧭] [↗]
```

- 높이 고정 peek 220px. 위로 드래그 → half(55vh) → full (라우트 `/cafes/[id]` 푸시)
- [상세보기] 탭 시에도 라우트 이동
- 닫기: 빈 지도 탭, 또는 아래로 스와이프

### 상태 연결
- `selectedCafeId: string | null` → UI slice
- `mapCenter`, `mapZoom`, `mapBounds` → UI slice  
  (04_state_and_api.md § 상태 분리)

---

## 02 검색 `/search`

### 레이아웃
- 상단 54px safe-area, 이후 헤더(back + 인풋), 이후 스크롤 본문
- bg white

### 헤더
- `[←] [🔍 성수|  ⊗]`
- 인풋: height 40, radius 20, border `1.5px var(--brand)`, bg ink-100
- 좌측 search icon, 우측 clear 버튼 (ink-300 원형 20)
- 입력 중 커서 표시, focus 상태에 brand ring

### 본문 섹션 순서
1. **최근 검색** (로컬스토리지)
   - 섹션 타이틀 12/600/ink-500 + 전체 삭제 버튼
   - 행: 32 clock icon + name + meta(12/13 형식) + delete icon
2. **(8px 구분 밴드 — bg ink-50)**
3. **실시간 결과** — 입력어 있을 때
   - "**성수** 검색 결과" (성수만 brand 강조)
   - 각 행:
     - 40 icon container (Mooda 등록이면 brandTint + sparkle, 아니면 ink-100 + pin)
     - name (입력어 부분 `bg rgba(180,83,9,0.14)` 하이라이트)
     - 옆에 [MOODA] 작은 배지 (등록된 카페)
     - 2행 주소
4. **안내 문구** — "Kakao Local 검색 기반 · 등록되지 않은 카페는 선택 시 Mooda에 자동 등록됩니다"

### 동작
- debounce 200ms, `useGetKakaoSearchQuery(keyword)` + `useGetMoodaMatchQuery(keyword)` 병렬
- 행 탭:
  - Mooda 등록 → `/cafes/[id]` 로 이동
  - 미등록 → POST `/api/cafes/register` (upsert by kakaoPlaceId) → 새 id로 이동
- 최근 검색은 **실제 상세로 이동한 항목만** 저장 (키워드가 아님)

---

## 03 분위기 필터 (Bottom sheet)

`/map` 상에서 필터 칩 탭 → modal bottom sheet.

### 시트 구조
- 상단 핸들 (36×4)
- 헤더(10-14 padding 좌우 20)
  - 타이틀 "분위기 필터" 19/700
  - sub: "선택 N개 · 매칭 카페 M곳" (N·M은 brand 색 강조)
  - 우측 "전체 해제" 버튼 (ink-100 bg 13/500)
- **카테고리 탭** (sticky): 분위기 · 씬 · 목적 · 인테리어 · 메뉴 · 편의시설
  - 활성 탭 밑줄 2px brand, 텍스트 700
- **2열 그리드** (padding 18-20)
  - 각 셀: 52h, border 1.5px (ink-200 or brand), radius 14
  - emoji 20px + label 14/500
  - 선택 시 bg brand-tint + border brand + checkmark (20 circle brand)
- **안내 박스** (bg ink-50, 12 padding)
  - 💡 "여러 카테고리에서 선택 가능 · 선택 태그 중 하나라도 매칭되는 카페"
- **sticky CTA 바** (bottom, 1px top border)
  - [N곳 카페 보기] 52h radius 14 brand

### 매칭 카운트 계산
- `/api/cafes/count?tags=[...]` — 디바운스 200ms로 호출
- 로딩 중에는 숫자 자리 Skeleton

---

## 04 카페 상세 `/cafes/[id]`

### Hero (320px)
- 사진 없을 때: `linear-gradient(135deg, amber-200, amber-50)` + 빗금 텍스처 오버레이 + ☕ 글리프
- 사진 있을 때: 가로 swipe carousel, 우하단에 `1/12` 카운트 pill (bg rgba(0,0,0,.55), backdrop-filter blur)
- 상단 오버레이: 원형 40 back / share / heart (bg rgba(255,255,255,.92), backdrop-blur)

### Meta row
- 상단: [영업중 · 22:00까지] [MOODA 인증] — 배지 두 개
- 타이틀 24/700/-0.02em
- 서브 "카페 · 성수동1가" 13.5/ink-500
- meta: ★ 4.7 (182) · | · 🚌 15분 (뚝섬역)

### Quick actions (4-칸 grid) — ISSUE-22
- 길찾기 / 전화 / 저장 / 공유
- 각 칸: bg brand-tint, radius 12, icon 16 + 11.5/600 label
- **길찾기 탭 시**: 시트 열고 "카카오맵으로 · 네이버지도로" 선택 (네이버 딥링크: `nmap://route/public?slat=...&slng=...&sname=...&dlat=...&dlng=...&dname=...`)

### Mood Vote 카드 — ISSUE-10
- bg ink-50, border ink-200, radius 16
- 헤더: "이 카페의 분위기" 14/700 + "총 247표" 11.5/ink-500
- 서브: "태그를 눌러 투표해보세요" 12/ink-500
- 태그 pills (wrap, gap 6):
  - 투표 완료: solid brand + 숫자 배지 (white 반투명 bg)
  - 미투표: border ink-200 + 숫자 배지 (ink-100)
- **옵티미스틱 업데이트**:
  - 탭 즉시 solid 전환, 숫자 +1
  - 서버 실패 시 롤백 + shake 애니메이션 + 토스트
  - `cafeApi.util.updateQueryData('getCafe', id, draft => ...)`로 낙관 패치, `onQueryError`로 revert

### 탭
- 정보 / 리뷰 N / 블로그 N / Google N / 사진 N
- 밑줄 스타일 (같은 스타일 패턴, 03 필터와 동일)
- 정보 탭: 주소(+서브 도로명) / 전화(blue link) / 영업시간(서브: 라스트오더)

### loading.tsx
- hero: 320px skeleton block
- title: 24/60% skeleton
- actions: 4칸 grid skeleton
- vote card: 라운드 박스 + pill skeleton 5개

---

## 05 목록 뷰 (/map segmented) — ISSUE-09

지도 탭과 목록 탭 전환. 같은 필터/검색어/bounds 공유.

### 전환 UI
- `/map` 페이지 상단, 검색 pill 아래에 **segmented control**
  - `[지도][목록]` — ink-100 배경 padding 3, 활성 탭 bg white + shadow sm
  - 목록 탭 우측에 결과 수 "24"
- 우측 별도: "거리순 ▾" 정렬 드롭다운 (거리/평점/인기)

### Applied filters row
- 활성 필터 칩들(해제 가능) + 맨 왼쪽에 [필터 N] chip (탭 시 03 필터 시트 열림)

### 카드 (list row)
- padding 16, border-bottom 1px ink-100
- 좌측 84×84 photo, radius 12
  - 좌상단 순번 배지 (22 circle, rgba(255,255,255,.92))
- 우측:
  - 상단: 이름 15/700 + heart 우측
  - 메타 영역: [영업중 배지] + 주소 · 거리
  - ★ 4.7 (182) · 🚌 20분
  - 태그 3개 (tint 스타일)

### 상태 공유
- UI slice에 `mapViewMode: 'map' | 'list'`, `sortOrder: 'distance' | 'rating' | 'popular'`
- 같은 `bounds`, `tags`로 쿼리 — 목록은 `sort` 파라미터만 추가

### 스크롤
- iOS 스크롤 bounce 그대로
- 무한 스크롤 (IntersectionObserver) — 20개씩 추가 페이지
