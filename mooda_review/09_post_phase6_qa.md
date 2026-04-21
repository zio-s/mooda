# Mooda v3 — Phase 6 완료 검증 + 후속 작업 리스트

> **기준 상태**: Phase 3·4·5·6 전부 커밋 완료 (커밋 `d938024` T6-6 검증까지).
> **본 문서 범위**: Phase 6 실구현 QA 결과 + **UI 레벨 넘어 데이터 레이어에 남아 있는 잔여 이슈** + 다음 Phase 후보.
> **기준 시각**: 2026-04-21 11:00. 직전 커밋 `d938024`.

---

## 📊 현재 상태 체감 점수 (Phase 6 후)

| 영역 | v3 시작 | Phase 5 후 | **Phase 6 후** | 비고 |
|---|---|---|---|---|
| 디자인 토큰 · 색 체계 | 95 | 98 | **98** | 안정 유지 |
| 이모지 의존도 | — | — | **0 (UI)** | apple-icon / icon 제외 |
| 공통 컴포넌트 | 95 | 95 | **96** | StarRatingInput lucide화 |
| 지도 (/map) | 90 | 90 | **92** | Skeleton · Naver/Kakao 에러 배너 아이콘화 |
| 상세 (/cafes/[id]) | 88 | 88 | **90** | HeroGlyph · placeholder 정리 |
| 검색 (/search) | 92 | 92 | **92** | 변동 없음 |
| 프로필 · 즐겨찾기 | 70 | **90** | 90 | Phase 4로 승격 유지 |
| 로그인 · 회원가입 | 65 | **88** | 88 | Phase 5로 승격 유지 |
| **MoodFilterSheet** | — | — | **93** | 카테고리 색 + lucide. 재설계 성공 |
| 데이터/타입 정합성 | — | — | **75** | **신규 이슈**. types/index.ts `Mood` 데드, seed/schema emoji 잔존 |
| PWA (install · offline) | 82 | 82 | 82 | 변동 없음 |
| **종합** | A− (88) | A (93) | **A (94/100)** | UI는 깔끔, **데이터 레이어 정리 남음** |

> Phase 6로 UI 레벨은 사실상 닫힘. 남은 약점은 **"DB/타입 레이어까지 이모지 제거가 닿지 않음"** 1점대 이슈.

---

## PART 1 — 🆕 Phase 6 검증에서 새로 포착된 이슈 (4건)

> T6-6의 DoD 스캔(`git grep -nP "[\x{1F300}-\x{1FAFF}...]" src/`)은 **src/ 경로만 검사**. 그래서 아래 4건은 UI 스캔을 통과했지만 데이터/타입 레이어에 남음. Claude Code 관점에선 "Phase 6 종료 조건 충족" 이 맞지만, **디자인 SSoT 관점에선 미완**.

### 🔴 **P6-06** `src/types/index.ts:10-16` — `Mood` 인터페이스가 stale

- **증상**:
  ```ts
  export interface Mood {
    id: string;
    key: string;
    label: string;
    category: 'atmosphere' | 'purpose' | 'photo';  // ← 3개만
    emoji?: string;                                  // ← 데드 필드
  }
  ```
- **실태**:
  - `moods.ts` T6-1에서 `MoodCategory` = 7개로 확장(`atmosphere·scene·purpose·interior·menu·facility·photo`)
  - 이 인터페이스는 **사용처 0건** (`grep "import.*\bMood\b" → Mood 전용 import 없음`)
- **왜 중요한가**: 타입 진실 소스가 2곳(`types/index.ts` vs `constants/moods.ts`)으로 갈림 → 향후 리뷰 작성 D2에서 Mood 타입 import하면 확장된 카테고리를 못 받음 → 타입 에러 또는 더 심각하게 `as any` 편법.
- **액션 옵션**:
  - **A (권장)**: 인터페이스 삭제. 사용처 0이므로 안전. `moods.ts`의 `MOODS[number]`, `MoodKey`, `MoodCategory` 를 SSoT로 승격.
  - B: 인터페이스 유지하되 `moods.ts` 기준으로 재정의. `emoji` 필드 제거 · `category: MoodCategory`.

### 🟡 **P6-07** `prisma/schema.prisma:117` — `Mood` 모델에 `emoji String?` 컬럼 잔존

- **증상**: Prisma schema Mood 모델에 `emoji String?` 컬럼 정의.
- **영향**:
  - DB 레벨 이모지가 여전히 저장됨
  - 앱 코드는 `select`에서 자연스럽게 무시 중 (Prisma가 타입 추론해서 옵셔널 처리)
  - 읽기 성능·저장 공간 영향 극미 (String? 컬럼 1개)
- **액션 옵션**:
  - **A (권장, 보수적)**: 컬럼 유지. 마이그레이션 리스크 회피. 단 `Mood` 조회 쿼리에서 `select` 로 emoji 제외.
  - B (적극): 컬럼 drop 마이그레이션. `prisma migrate dev --name drop_mood_emoji` 필요. 운영 DB 영향 확인 필수.
- **참고**: `prisma/migrations/20260303052036_init/migration.sql:84` 의 `"emoji" TEXT` 는 **히스토리 파일이므로 수정 금지**. 새 마이그레이션을 추가하는 방식.

### 🟡 **P6-08** Seed 파일 2개 모두 emoji 데이터 포함 + 카테고리 불일치

- **파일 1**: `prisma/seed.ts` — **17개 MOOD** 삽입, 카테고리 `atmosphere/purpose/photo` 3개만
- **파일 2**: `scripts/seed-cafes.ts:178~` — **54개 MOOD** 삽입, 카테고리는 `atmosphere/scene/purpose/interior/menu/facility/photo` 전 범위. emoji 필드 포함
- **왜 중요한가**:
  - 두 seed가 **서로 다른 데이터 계약** → 어느 쪽을 실행하느냐에 따라 카테고리 수가 달라짐
  - 현재 UI 구동(MoodFilterSheet)은 `constants/moods.ts`의 54개를 기준 → DB도 54개여야 맞음
  - `prisma/seed.ts` 17개 데이터는 **구버전**. 제거 또는 동기화 필요
- **액션 옵션**:
  - **A (권장)**: `prisma/seed.ts` 을 `scripts/seed-cafes.ts` 의 MOOD 데이터를 import 하도록 통합 → SSoT 1개로 귀결. emoji 필드 전부 제거.
  - B: `prisma/seed.ts` 자체 삭제. `scripts/seed-cafes.ts` 를 공식 seed로 지정하고 package.json 스크립트도 그쪽으로.

### 🟢 **P6-09** 세션 중 일시적 발견 — `scripts/seed-cafes.ts` 의 `scripts/seed-cafes.ts` 카테고리 키는 이미 7개 확장 반영됨 ✅

- **확인**: scripts/seed-cafes.ts 는 `atmosphere/scene/purpose/interior/menu/facility/photo` 7개 카테고리 전부 사용 중 → `constants/moods.ts`와 정합. emoji 필드만 제거하면 됨.

---

## PART 2 — 🧪 회귀 QA 체크리스트 (사용자 실측용)

Phase 6 영향 화면 + 기존 회귀 3경로 결합. 각 항목 실제 기기에서 한 번씩.

### 기본 회귀 3경로 (매 Phase 공통)
- [ ] `/map` → 카페 마커 탭 → 바텀시트 정상 오픈 → Android 뒤로가기로 닫힘
- [ ] `/cafes/[id]` → 갤러리 열기 → ESC 로 닫힘 + 좌/우 방향키
- [ ] `/search` → 한글 2자 이상 입력 → Enter 로 상세 이동

### Phase 6 영향 경로 (신규)
- [ ] **MoodFilterSheet** — `/map` 필터 버튼 탭
  - 카테고리 탭 7개 (Wind/Sparkles/Target/Home/Coffee/Settings2/Camera 아이콘) 스크롤 + 선택 전환
  - 탭 선택 시 활성화 색(카테고리별 `activeBg`) 정상 표시
  - 태그 셀 선택 → Check 아이콘 + activeBg 적용
  - 힌트 영역 `<Lightbulb size={14}/>` + 텍스트 같은 라인
  - 하단 CTA "N곳 카페 보기" 카운트 정상
- [ ] **MapSkeleton** — `/map` 초기 로드 시 `<Map size={36}/>` + "지도 불러오는 중..." 정상
- [ ] **Naver 지도 어댑터** — provider 토글 시 실패 상태에서 `<AlertTriangle/>` 정상 렌더 (네트워크 차단 테스트)
- [ ] **StarRatingInput** — 카페 상세 → "리뷰 작성" → 별점 hover/tap 시 lucide Star 스케일 1.15 + 노란색(`theme.colors.star`) 전환
- [ ] **CafeCard / HeroGlyph 빈 상태** — 이미지 없는 카페 1개 찾아서 PhotoPlaceholder 에 `<Coffee/>` 정상 표시
- [ ] **에러 페이지** — `/cafes/존재하지-않는-id` → AlertTriangle + err 색상
- [ ] **HomeClient Step** — `/` 하단 스크롤 → Filter/Map/Coffee 아이콘 3개 + primaryLight 배경 원형
- [ ] **MoodFilter 칩(서머리)** — 필터 선택 후 /map 상단 칩 리스트에 이모지 없이 label + × 만 표시

### 접근성 체크
- [ ] 모든 lucide 플레이스홀더에 `aria-hidden` — 스크린리더 노이즈 없음
- [ ] `<StarBtn aria-label="{N}점">` 그대로 유지, svg는 aria-hidden
- [ ] 카테고리 탭 `role="tab" aria-selected` 유지

---

## PART 3 — 🎯 다음 Phase 후보 (우선순위 논의용)

Phase 3-6 로 "현존 UI 표면의 디자인 품질"은 거의 닫힘. 남은 스코프 후보를 비용·임팩트로 정렬.

| # | 후보 | 예상 기간 | 임팩트 | 리스크 |
|---|---|---|---|---|
| **P7-A** | **Phase 6 후속 클린업 (P6-06~08)** | 0.5일 | 타입/데이터 정합성 | 낮음 (사용처 0건 확인됨) |
| **P7-B** | **D2 — 리뷰 작성 플로우 재설계** | 3-5일 | **높음** (핵심 경로) | 중간 (스키마 결정 포함) |
| **P7-C** | **다크모드 토큰 분기** | 1.5일 | 중 (야간 사용층) | 낮음 (토큰 1벌 추가) |
| **P7-D** | **관측 지표 설계** | 1일 | 의사결정 근거 | 낮음 (로깅만 추가) |
| **P7-E** | **관리자 페이지 리디자인** | 2일 | 낮음 (내부 툴) | 낮음 |
| **P7-F** | **페이지 전환 애니메이션 (view-transition)** | 0.5일 | 중 (PWA 감각) | 낮음 (Next 15+ 지원) |

### 🏆 추천 시나리오

**시나리오 1 (빠른 마감)**: P7-A → P7-D → 릴리즈
- 0.5일 클린업 + 1일 관측 → 총 1.5일. 현 앱을 최대한 단정하게 내보내고 지표 수집 시작.

**시나리오 2 (제품 깊이)**: P7-A → P7-B → 릴리즈
- 0.5일 클린업 + 3-5일 리뷰 재설계 → 총 3.5-5.5일. 핵심 경로 품질 향상. **추천**.

**시나리오 3 (완성도)**: P7-A → P7-C → P7-F → P7-D → 릴리즈
- 0.5 + 1.5 + 0.5 + 1 = 3.5일. UX 완성도 + 지표. 리뷰는 다음 분기로.

### 결정 요청
- 어느 시나리오로 진행할지 알려주시면 해당 Phase MD 가이드를 `phase_3_5/PHASE_7_*.md` 로 작성해서 Claude Code 에 넘길 수 있는 상태로 만들어 드립니다.
- **P7-A 0.5일**은 어느 시나리오를 택하든 선행 권장. 이것만 먼저 처리할지 결정하는 것도 가능.

---

## PART 4 — 📋 즉시 반영 작업 리스트 (P7-A 구체화)

P7-A 선택 시 `phase_3_5/PHASE_7_CLEANUP.md` 로 별도 만들 예정. 미리보기:

### T7-1. `src/types/index.ts` 정리 (15분)
- `Mood` 인터페이스 삭제 (사용처 0)
- `CafeMood.moodCategory: string` → `MoodCategory` 로 좁힘 (`moods.ts` 에서 re-export)
- 커밋: `refactor(types): Mood 인터페이스 제거 + CafeMood.moodCategory 타입 좁힘 (P6-06)`

### T7-2. `prisma/seed.ts` 일원화 (30분)
- `prisma/seed.ts` 의 MOOD 배열을 삭제하고 `constants/moods.ts` 또는 `scripts/seed-cafes.ts` 의 SSoT 에서 import
- emoji 필드 제거
- seed 실행 후 Mood 테이블 카테고리 수 확인 (7개)
- 커밋: `chore(seed): MOOD seed 일원화 + emoji 필드 제거 (P6-08)`

### T7-3. Prisma schema emoji 컬럼 처리 결정 (보류/결정 대기)
- **권장 보수**: 컬럼 유지, 쿼리에서 `select: { emoji: false }` 불필요 (Prisma가 타입 차원에서 이미 옵셔널 처리) → **실질적 조치 없음**
- **권장 적극**: `emoji String?` 제거 + 새 마이그레이션 추가. 운영 DB 영향 확인 후 진행
- 사용자 결정 필요

### T7-4. DoD 재스캔 (10분)
```bash
# 데이터 레이어 + src/ 통합 스캔
grep -rn "emoji" prisma/ scripts/ src/ ':!*/node_modules/*' ':!*/_*'
# 기대: prisma/migrations/*/migration.sql 만 (히스토리, 수정 금지), 그 외 0건
```

---

## PART 5 — ✅ Phase 6 실제 달성 확인

아래는 **실제로 반영된 것**의 최종 체크. Claude Code 결과물 리뷰.

### UI 이모지 제거 (완료)
- [x] `moods.ts` 54개 emoji 필드 삭제 + `CATEGORY_META` 추가 (T6-1)
- [x] `MoodFilterSheet` 카테고리 아이콘 + 색 시스템 (T6-2)
- [x] `MoodFilter` 칩 이모지 제거 (T6-3)
- [x] `HomeClient` Step/인기 무드 아이콘화 (T6-4)
- [x] `CafeCard` PhotoPlaceholder `<Coffee size={32}/>` + ink100/ink300 (T6-5)
- [x] `CafeDetail` HeroGlyph `<Coffee size={48}/>` + currentColor 패턴 (T6-5)
- [x] `/cafes/[id]/error.tsx` `<AlertTriangle/>` (T6-5)
- [x] **초과 달성**: `src/app/error.tsx` 😵 → `<AlertTriangle/>` (가이드 범위 밖, 자발 처리)
- [x] `MapClient` EmptyState error/empty 분기 (T6-5)
- [x] `MapSkeleton` 🗺️ → `<Map size={36}/>` (T6-5, 가이드 누락분 자발 처리)
- [x] `NaverCafeMap` 🗺️ × 2 → `<AlertTriangle/>` (T6-5, 가이드 누락분 자발 처리)
- [x] `KakaoCafeMap` 🗺️ → `<AlertTriangle/>` (T6-5, 가이드 누락분 자발 처리)
- [x] `MoodFilterSheet` Hint 💡 → `<Lightbulb/>` (T6-5, 가이드 누락분 자발 처리)
- [x] `StarRatingInput` `★` → lucide `<Star fill/>` (T6-5, 가이드 누락분 자발 처리)

### 검증
- [x] `src/` 이모지 스캔 0건 (apple-icon / icon / moods.ts 제외 조건 하에)
- [x] `pnpm typecheck` 통과
- [x] `pnpm build` 통과
- [x] `08_next_iteration_v3.md` 하단 Phase 6 완료 섹션 append

### 데이터 레이어 (미완, P6-06~08로 이월)
- [ ] `types/index.ts` `Mood` 인터페이스 stale
- [ ] `prisma/schema.prisma` Mood.emoji 컬럼
- [ ] `prisma/seed.ts` + `scripts/seed-cafes.ts` emoji 데이터 + 카테고리 불일치

### 정당 잔류 (조치 불필요)
- `src/app/icon.tsx`, `src/app/apple-icon.tsx` — PWA 앱 아이콘 (브랜드 로고 SVG 대체는 별도 트랙)
- 주석 내 `♥`·`★`·`☕` — 코드 문서용
- `prisma/migrations/20260303052036_init/migration.sql` — 히스토리 파일 수정 금지

---

## 결론

**UI 레벨 디자인 품질**: A (94/100). Phase 3-6 로 "앱을 열었을 때 보이는 모든 디자인 표면"은 토큰 + lucide 로 정렬됨.

**남은 약점 1지점**: 데이터/타입 레이어의 emoji 잔재 (P6-06~08). 0.5일 클린업으로 마감 가능.

**의사결정 요청**:
1. **P7-A 선행 여부**: 지금 바로 처리 vs 다음 Phase 와 함께
2. **P7 시나리오 선택**: 시나리오 1(빠른 마감) / 2(리뷰 재설계, 추천) / 3(완성도) 중
3. **P6-07 Prisma 컬럼 제거**: 보수(유지) vs 적극(마이그레이션)

결정되면 해당 Phase 의 `PHASE_7_*.md` 가이드를 Claude Code 가 바로 실행 가능한 상태로 작성합니다.

---

## ⚠️ 2026-04-21 추가 — Release Blocker 발견

실기 실측 중 지도 탭/페이지 이동 후 복귀 시 **뷰 렌더 깨짐** 현상 보고됨. 어댑터 양쪽 모두 relayout/refresh 핸들러 누락이 원인. 상세 진단 + 수정 가이드는:

📄 **`10_bug_map_resize.md`** (단독 리포트, Claude Code 실행용 T-BUG-MAP-01~03)

**우선순위**: Phase 7 어느 시나리오를 택하든 **이 hotfix 가 선행**. 예상 2-3시간.
