# mooda_review — Claude Code 작업 허브

> **이 폴더는 Claude Design (디자인/QA/이슈 감독) 이 Claude Code (실구현) 에 넘기는 작업 지시서 저장소입니다.**
> **Claude Code 는 이 README.md 를 가장 먼저 읽고, "다음 작업" 섹션에 따라 순차 진행하세요.**

---

## 🚀 Claude Code — 작업 시작 절차 (Entry Point)

1. **이 README 를 먼저 읽는다** — 현재 상태 + 우선순위 + 라우팅 정보가 있습니다.
2. **"🎯 다음 작업 (우선순위 순)"** 섹션 최상단 1개를 집어 지시된 MD로 이동합니다.
3. 해당 MD 의 `PART 3/4 (수정 가이드)` 대로 작업을 수행합니다.
4. `pnpm typecheck && pnpm build` 2개 통과를 확인합니다.
5. 회귀 3경로(아래 "🧪 필수 회귀 QA") 를 수동 체크합니다.
6. 커밋 규칙("📋 커밋/PR 규칙") 대로 커밋합니다.
7. **이 README 를 업데이트** — 방금 완료한 작업의 번호에 ✅ + 커밋 해시 기입 (아래 "✍️ 완료 시 문서 업데이트 규칙").
8. 다음 우선순위 작업이 남아있으면 2번으로 돌아갑니다. 없으면 종료.

**중요**:
- 단일 작업은 단일 PR/커밋 단위로 분리. 여러 작업을 한 커밋에 섞지 않습니다.
- MD 안의 `PART 5 · DoD` 체크리스트가 있으면 반드시 자가 점검 후 완료 선언.
- 실기 QA (iOS Safari / Android Chrome 실 기기 테스트) 가 필요한 항목은 사용자가 따로 확인합니다. Claude Code 는 코드 + 빌드 통과까지 책임.

---

## 📊 현재 상태 (2026-04-21 기준)

| 영역 | 상태 |
|---|---|
| Phase 3 (토큰 수렴) | ✅ 완료 (커밋 `8dbc657`~`dfaec5f`) |
| Phase 4 (프로필 허브) | ✅ 완료 (커밋 `9642f97`~`8929ee0`) |
| Phase 5 (로그인/가입) | ✅ 완료 (커밋 `ee1d155`~`3a66222`) |
| Phase 6 (이모지 제거) | ✅ 완료 (커밋 `cf6f379`~`d938024`) |
| 🔴 BUG-MAP (지도 렌더 깨짐) | ✅ 코드 수정 완료 (커밋 `5e91180`) · 사용자 실기 QA 대기 |
| P7-A (데이터 레이어 클린업) | ⏳ 대기 |
| Phase 7 시나리오 (P7-B/C/D/E/F) | ❓ 사용자 결정 대기 |

**체감 점수**: A (94/100). UI 레벨 마감, 데이터 레이어 잔재 + hotfix 남음.

---

## 🎯 다음 작업 (우선순위 순)

### 🔴 **1순위** ✅ 완료 (커밋 `5e91180`, 2026-04-21) — BUG-MAP Hotfix

- **지시 문서**: [`10_bug_map_resize.md`](./10_bug_map_resize.md)
- **범위**: `PART 3` 의 `T-BUG-MAP-01` (NaverCafeMap) + `T-BUG-MAP-02` (KakaoCafeMap)
- **완료 내용**:
  - Naver/Kakao 어댑터에 `visibilitychange` + `pageshow(persisted)` + `ResizeObserver(rAF throttle)` 3개 useEffect 추가
  - Naver: `mapRef.current?.refresh(true)` — 기존 `containerRef`/`mapRef` 재사용
  - Kakao: `mapRef`/`containerRef`/`centerRef` 신설, `handleCreate` 에서 ref 할당, 외곽 `<div ref={containerRef}>` 래핑, `refreshMapView()` 에서 `relayout() → setCenter(centerRef.current)` 로 중심점 복원
  - `tsc --noEmit` + `pnpm build` 통과
- **잔여**: `T-BUG-MAP-03` (provider 토글 `key` prop 강제 리마운트) 은 실기 재현 시 착수 보류
- **실기 QA**: 사용자가 iOS Safari / Android Chrome / 데스크톱 × Kakao/Naver 매트릭스 확인 필요 (10 리포트 PART 4)

### 🟡 **2순위** — P7-A 데이터 레이어 클린업 (0.5일)

- **지시 문서**: [`09_post_phase6_qa.md`](./09_post_phase6_qa.md)
- **범위**: `PART 4` 의 `T7-1` + `T7-2` (T7-3 은 사용자 결정 대기로 제외)
  - **T7-1** `src/types/index.ts` 의 `Mood` 인터페이스 삭제 (사용처 0 건 확인됨) + `CafeMood.moodCategory` 타입을 `moods.ts` 의 `MoodCategory` 로 좁힘
  - **T7-2** `prisma/seed.ts` 의 MOOD 배열을 `scripts/seed-cafes.ts` 와 일원화 + emoji 필드 제거 + 카테고리 7개 반영
- **PR 분리**: 커밋 2개 (types · seed 독립).
- **커밋 메시지 예시**:
  ```
  refactor(types): Mood 인터페이스 제거 + CafeMood.moodCategory 타입 좁힘 (P6-06)
  chore(seed): MOOD seed 일원화 + emoji 필드 제거 (P6-08)
  ```
- **T7-3** (Prisma schema `Mood.emoji` 컬럼 drop) 은 **사용자 결정 대기**. 지금 처리 금지.

### ⏸ **3순위** — Phase 7 착수 (시나리오 선택 후)

- **상태**: 시나리오(1/2/3) 를 사용자가 선택하면 Claude Design 이 `phase_3_5/PHASE_7_*.md` 를 작성합니다.
- **Claude Code 는 현재는 진입 금지**. 1·2순위 완료 후 새 지시서가 커밋되면 그때 이어서 작업.

---

## 📁 문서 지도

| 문서 | 역할 |
|---|---|
| `README.md` (이 파일) | **Claude Code 진입점**. 우선순위 라우팅 |
| `plan_append.md` | 전체 작업 체크리스트 히스토리 (A~J 섹션) |
| `05_review_after_impl.md` | 초기 구현 완료 후 post-impl 리뷰 |
| `06_responsive_qa.md` | 반응형/QA 진단 (C1-C7, M1-M9, L1-L6) — **대부분 처리됨** |
| `07_comprehensive_qa_v2.md` | 전수 재점검 (N1-N17) — **처리됨** |
| `08_next_iteration_v3.md` | v3 이후 재설계 지시 (V3-01~12) + Phase 3~6 완료 기록 |
| `09_post_phase6_qa.md` | **Phase 6 검증 + P6-06~08 후속 + Phase 7 후보(A~F)** |
| `10_bug_map_resize.md` | 🔴 **Critical bug 리포트 + T-BUG-MAP-01/02/03 실행 가이드** |
| `phase_3_5/README.md` | Phase 3~6 가이드 폴더 index |
| `phase_3_5/PHASE_{3,4,5,6}_*.md` | 각 Phase 상세 가이드 (완료) |

**작업 순서 판단 규칙**:
- 🔴 마크가 붙은 것 최우선
- 그 다음 이 README 의 "다음 작업" 순서
- 09 나 10 같은 최신 문서가 구버전 문서(05~07) 지적을 override 합니다 (08/09 의 "Phase N 완료 기록" 을 기준으로)

---

## 🧪 필수 회귀 QA (모든 작업 완료 시 수동 확인)

매 작업 후 아래 3경로 + Phase 6 영향 경로 자가 체크:

### 기본 3경로
- [ ] `/map` → 카페 마커 탭 → 바텀시트 오픈 → Android 뒤로가기로 닫힘
- [ ] `/cafes/[id]` → 갤러리 열기 → ESC 로 닫힘 + 좌/우 방향키
- [ ] `/search` → 한글 2자 이상 입력 → Enter → 상세 이동

### Phase 6 영향 (이모지 제거 관련)
- [ ] MoodFilterSheet 카테고리 탭 7개 아이콘 + 색 + 선택 동작
- [ ] MapSkeleton · Naver/Kakao 에러 배너 아이콘 정상
- [ ] StarRatingInput 별점 hover/tap 시 lucide Star 동작
- [ ] 카페 이미지 없을 때 `<Coffee/>` placeholder 정상

### BUG-MAP Hotfix 후 (10_bug_map_resize.md PART 4 참조)
- [ ] `/map` → 다른 브라우저 탭 전환 → 5초 대기 → 복귀 → **전체 영역 정상 렌더**
- [ ] `/map` → `/profile` 이동 → 뒤로가기 복귀 → **정상**
- [ ] 카카오 · 네이버 양쪽 모두 검증

---

## 📋 커밋/PR 규칙

- **커밋 메시지 형식**: `<type>(<scope>): <subject> (작업ID)`
  - type: `feat` / `fix` / `refactor` / `chore` / `docs` / `style` / `test`
  - scope: `map` / `auth` / `profile` / `filter` / `cafe` / `ui` / `api` / `types` / `seed` 등
  - 작업ID: `T4-2`, `T6-5`, `BUG-MAP-01`, `P6-06` 등 참조 가능한 코드
- **Co-Authored-By** 유지: 기존 커밋 패턴 따라
- **PR 분리 원칙**: Phase 6 때처럼 Task 단위 커밋. 한 PR에 여러 Task 섞지 않음
- **훅 우회 금지**: `--no-verify` 금지. 훅 실패 시 원인 수정 후 새 커밋
- **강제 푸시 금지**: `git push --force` 사용자 명시 없이는 금지

---

## ✍️ 완료 시 문서 업데이트 규칙

작업 완료 후 **반드시** 아래 2개 파일 업데이트:

### 1) 이 README.md 의 "🎯 다음 작업" 섹션
- 완료한 작업 번호 옆에 ✅ + 커밋 해시 + 날짜 기입
- 예:
  ```md
  ### 🔴 1순위 ✅ 완료 (커밋 `abc1234`, 2026-04-21) — BUG-MAP Hotfix
  ```
- 완료된 작업이 다음 세션에서 다시 지시되지 않도록 "📊 현재 상태" 표도 업데이트

### 2) `plan_append.md` 의 해당 체크박스
- 예: J 섹션의 `- [ ] BUG-MAP-01 ...` → `- [x] BUG-MAP-01 ... (커밋 abc1234)`

### 3) (선택) `08_next_iteration_v3.md` 하단 append
- Phase 단위 대규모 완료일 때만. 개별 task 커밋은 불필요.
- 형식:
  ```md
  ## {Phase/BUG} 완료 (YYYY-MM-DD)
  - 커밋 해시 범위
  - 변경 요약 3-5줄
  ```

---

## 🛑 Claude Code 가 절대 하지 말아야 할 것

- **사용자 미승인 Phase 7 착수 금지** — 현 README 에서 "시나리오 대기" 로 표시된 것은 Claude Design 의 PHASE_7_*.md 가 커밋되기 전까지 진행 불가
- **Prisma 마이그레이션 생성 금지** (T7-3 Mood.emoji 컬럼 drop 등) — 운영 DB 영향 때문에 사용자 명시 필요
- **기존 완료 Phase (3~6) 의 이미 커밋된 결정 되돌리기 금지** — 토큰 명명, 카테고리 색 시스템 등
- **이 README 에 없는 MD 지시를 선택적으로 수행 금지** — 구버전(05~07) 에서 해결되지 않은 것처럼 보이는 항목도 08/09 의 완료 기록을 우선 신뢰
- **`app/icon.tsx`, `apple-icon.tsx`** 의 `☕` 이모지는 Phase 6 명시적 제외 — 수정 금지

---

## 📞 막혔을 때

- MD 에서 "**판단 필요 시**" 또는 "**사용자 결정 대기**" 섹션에 해당하는 결정이 필요하면, 진행 중단하고 커밋 메시지/PR 설명에 **❓ 결정 필요** 라고 명시한 채 push 후 사용자에게 핑.
- 의존성 추가/버전 업 필요하면 중단 후 문의.
- 빌드/타입 에러가 해당 MD 지시와 무관한 곳에서 발생 → 중단 후 상황 보고. 근본 원인 찾기 전 우회 금지.
