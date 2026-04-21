# Mooda v3 — 8 PR 반영 후 추가 디자인 / 수정 리포트

> **기준 상태**: QA v2 Phase 1 8 PR 반영 완료 (N2·N3·N4·N11·N14·N7·N6·N17·N9·N1 + Google 리뷰 탭 깜빡임 수정).
> **본 문서 범위**: 이 상태에서 **새로 발견된 이슈**, **디자인 보완**, **제품 결정 필요 항목**만 정리. 이미 커밋된 내용은 중복하지 않음.

---

## 📊 현재 상태 체감 점수

| 영역 | 점수 | 비고 |
|---|---|---|
| 디자인 토큰 · 색·여백 체계 | 95 | warm stone + amber-700 안정 |
| 공통 컴포넌트 (Tag · OpenBadge · Skeleton · ErrorState · EmptyMessage) | 95 | 재사용 가능, 일관 |
| 지도 (/map) | 90 | 마커·바텀시트·popstate·필터 정리됨 |
| 상세 (/cafes/[id]) | 88 | 갤러리·탭·Google 리뷰·Back 히스토리 |
| 검색 (/search) | 92 | IME·Enter·Abort·debounce 안정 |
| 프로필 · 즐겨찾기 · 컬렉션 | **70** | 재디자인 손 거의 안 닿음 |
| 로그인 · 회원가입 (/login) | **65** | 구버전 톤 그대로 (v2 때 미지적) |
| 관리자 (/admin) | 70 | 리뷰 대상 외 |
| PWA (install · offline) | 82 | 동작은 됨, UX는 보통 |
| 접근성 / 키보드 | 80 | dialog·aria 기본기 OK, 마커 포커스 미흡 |
| **종합** | **A− (88/100)** | **프로필 계열 + 로그인 화면이 약점** |

> v2 대비 +5점. 남은 약점은 **"리뷰 범위에서 빠져 있던 화면들"** — 프로필·로그인. 지금이 손대기 좋은 타이밍.

---

## PART 1 — 🆕 새로 발견된 이슈 (12건)

### 🔴 Critical / High (3건)

#### **V3-01** 프로필·즐겨찾기 페이지가 디자인 시스템 뒤에 멈춰 있음
- **경로**: `src/app/profile/ProfilePageClient.tsx:37-49`, `src/app/profile/favorites/page.tsx:30-50`
- **증상**:
  - `<Heart size={20} color="#ef4444" />` — 하드코딩 hex, `theme.colors.err` 미사용
  - `<FolderOpen color="#d97706" />` — **구 primary(amber-600)** 그대로. 신 토큰 `#b45309` 적용 안 됨
  - `<Skeleton style={{ height: 208 }} />` — 토큰 무시
  - EmptyState가 block 중앙 정렬만 있고 아이콘/CTA 한 덩어리 — 신 `EmptyMessage` 컴포넌트 미사용
- **왜 중요한가**: 앱 시그니처 색이 **헤더는 amber-700, 프로필은 amber-600**으로 갈라짐. 토큰 마이그레이션 빈틈.
- **액션**: 색·아이콘 size 모두 `theme` 참조로 전환 + EmptyMessage 공용화
  ```tsx
  <Heart size={20} color={theme.colors.err} />
  <FolderOpen size={20} color={theme.colors.primary} />
  <ChevronRight size={16} color={theme.colors.ink400} />
  ```

#### **V3-02** 로그인·회원가입이 v1 톤(amber-600 / rounded-lg) 그대로
- **경로**: `src/app/(auth)/login/page.tsx`, `login/page.styles.ts`
- **증상**:
  - `LogoWrapper color` = `theme.colors.primary` 참조는 OK. 단 **카카오 버튼만 solid yellow**, 그 외는 기본 `<Button>` — 시각적 대비 부족
  - `FormCard max-width: 360px` — 현재 앱의 고밀도 UI(지도·상세) 대비 카드가 작고 심심
  - `Divider "또는"` 위치에 `primaryLight` 배경 띠가 없어 구분 약함
  - 에러 메시지(`ErrorText`)가 `theme.colors.error` = `#b91c1c` 붉은색 1줄짜리 — 아이콘 X, 필드 아래 그냥 텍스트
- **제안**:
  1. 카드 `max-width: 400px`, 상단에 **브랜드 컬러 band(48px primaryLight)** 추가 — 현재 상세·바텀시트와 톤 매칭
  2. `<Input>` aria-invalid 시 red border + shake 1회
  3. 카카오 버튼 하단에 "비회원 지도 둘러보기 →" 보조 CTA — 비로그인 유입 유지

#### **V3-03** ProfileHeader에 액션·통계 0개 — "빈 랜딩"
- **경로**: `src/app/profile/ProfilePageClient.tsx:27-37`
- **증상**: 아바타 + 이름 + 이메일. 그 아래 메뉴 2개(즐겨찾기·컬렉션). 그게 전부.
- **실제 발생하는 감각**: "여기서 뭘 할 수 있지?" — 내 리뷰 수, 즐겨찾기 수, 이번 달 방문 카페 수 같은 **요약 데이터가 하나도 없음**
- **제안**: 아바타 아래 3-칸 통계(리뷰 · 즐겨찾기 · 컬렉션), 탭하면 각 섹션으로 이동
  ```
  [12]      [8]        [3]
  리뷰     즐겨찾기   컬렉션
  ```

### 🟡 Medium (5건)

#### **V3-04** Header에 `/search`·`/profile` 진입구 없음 (모바일)
- **경로**: `src/components/layout/Header.tsx`
- **증상**: Nav에 `지도 검색` 링크 1개뿐. 모바일에서는 아이콘만 보임. **검색 페이지로 가는 공식 진입점은 /map의 SearchTrigger 안에만 존재**. 지도 밖(홈·프로필) 상태에서 검색 접근 불가.
- **제안**:
  - 모바일 Header 우측에 `<Search size={18} />` 아이콘 버튼 추가 → `/search`
  - `/profile` 탭은 이미 Avatar 드롭다운에 있으니 OK

#### **V3-05** `Header`가 모든 페이지에서 항상 렌더 — `/search`·`/map` 몰입 방해
- **경로**: `src/app/layout.tsx`
- **증상**: `/search`는 자체 Header(뒤로가기+검색창)를 가짐에도 위에 글로벌 Header가 56px 더 쌓임. 실기기 세로 공간 손실.
- **검증**: `grep "<Header" src/app/layout.tsx`로 레이아웃 구조 확인 필요
- **제안**: `pathname.startsWith('/search')` OR `pathname.startsWith('/map')` 경로에서 글로벌 Header 숨김. 또는 각 page가 Header를 opt-out 하는 구조(Slot props).

#### **V3-06** InstallPrompt가 **항상 fixed bottom** — 바텀시트/MoodFilter와 겹침
- **경로**: `src/components/pwa/InstallPrompt.tsx:111-128`
- **증상**: `position: fixed; bottom: 0; z-index: theme.zIndex.modal(300)` → 바텀시트(9999)에 덮이므로 지도에서는 문제없음. 하지만 **/cafes/[id] 상세 스크롤 중 bottom CTA(리뷰 쓰기·즐겨찾기)와 충돌**할 수 있음.
- **제안**:
  - 설치 배너는 홈 · 프로필에서만 노출 (`pathname === '/' || pathname === '/profile'`)
  - 또는 bottom 오프셋을 CTA 위(`bottom: calc(72px + safe)`)로

#### **V3-07** 카카오 버튼 색 `#FEE500` + 테두리 `#e5c200` — **접근성 대비 부족**
- **경로**: `login/page.styles.ts:56-70`, `theme.ts:77`
- **증상**: 카카오 노란 위에 `kakaoText: #3C1E1E` 대비는 통과(14.9:1)지만, 버튼 아래 "또는" divider 영역이 `textMuted(#78716c)` → `primaryLight(#fef7ed)` 배경 대비 **3.2:1 (AA Large만 통과)**. 모바일에서 divider 텍스트 읽기 어려움.
- **제안**: Divider 텍스트 `ink500(#78716c)` 대신 `ink700(#44403c)` (5.3:1)

#### **V3-08** Favorites·Collections 탭 이동 시 **페이드/슬라이드 전환 없음**
- **경로**: `src/app/profile/*`
- **증상**: 프로필 → 즐겨찾기 → 컬렉션 간 네비게이션이 Next.js 기본 router.push만 호출. 전환 애니메이션 0. PWA 감각 약화.
- **제안**: Framer Motion 의존 없이, CSS `view-transition-name` (Next 15+ 지원) 적용:
  ```css
  @view-transition { navigation: auto; }
  .page { view-transition-name: page-root; }
  ```

### 🟢 Low / Polish (4건)

#### **V3-09** InstallPrompt 배너 아이콘이 `☕ emoji` — 브랜드 아이콘 아님
- **경로**: `InstallPrompt.tsx:65,91`
- **제안**: 실제 앱 아이콘 `/icons/icon-192x192.png` 48×48로 대체. 이모지는 플랫폼마다 렌더 다름.

#### **V3-10** BannerIcon `linear-gradient(135deg, #d97706, #f59e0b)` — 구 토큰 그대로
- **경로**: `InstallPrompt.tsx:148`
- **제안**: `linear-gradient(135deg, theme.colors.primary, #d97706)` 또는 단색 `primary`. v2 마이그레이션 잔여물.

#### **V3-11** FavoritesPage grid에 `gap: 16px` — MoodFilter(8px)·검색 Row(없음)와 리듬 안 맞음
- **경로**: `favorites/page.styles.ts:22`
- **제안**: 카드 gap은 `theme.space[3]`(12) or `theme.space[4]`(16) 중 일관 적용. `theme.space` 사용.

#### **V3-12** `MenuCard`(프로필) hover만 있고 **active 상태 없음**
- **경로**: `profile/page.styles.ts:42-54`
- **제안**: `&:active { transform: scale(0.99); background: ${theme.colors.ink50}; }` — 모바일 탭 피드백.

---

## PART 2 — 🎨 디자인 보완 / 업데이트 필요

### A. 프로필 계열 전면 리디자인 (1차 스코프)

현재 프로필은 **"계정 정보 + 메뉴 리스트"** 수준. 이 앱은 **"내가 좋아하는 카페를 모으는"** 성격이므로 프로필이 콘텐츠 허브여야 함.

```
┌─────────────────────────────────┐
│  ← 프로필                    ⚙  │
├─────────────────────────────────┤
│   [아바타 80px]                 │
│   username                      │
│   email@domain                  │
│                                 │
│   ┌─────┬─────┬─────┐           │  ← 신규
│   │ 12  │  8  │  3  │           │
│   │리뷰 │즐찾 │컬렉 │           │
│   └─────┴─────┴─────┘           │
│                                 │
│   ♥ 즐겨찾기 (8)           →    │
│   📁 컬렉션 (3)            →    │
│   ✍  내 리뷰 (12)          →    │  ← 신규
│   👣 방문 기록 (28)        →    │  ← 신규 (선택)
│                                 │
│   ─────────────────────         │
│   ⚙  설정 / 로그아웃       →    │
└─────────────────────────────────┘
```

**필요 API**:
- `GET /api/me/stats` → `{ reviewCount, favoriteCount, collectionCount }`
- `GET /api/me/reviews` (선택)

### B. 로그인 리디자인 (2차 스코프)

```
┌─────────────────────────────────┐
│                                 │
│    ┌───────────────┐            │
│    │               │ ← 48px band│
│    │  [☕ 로고]     │  primaryLight
│    └───────────────┘            │
│    ┌─────────────────────────┐  │
│    │  로그인                  │  │
│    │  분위기로 찾는 카페       │  │
│    │                         │  │
│    │  [카카오로 시작하기]     │  │
│    │  [이메일로 시작하기]     │  │  ← 풀어쓰기
│    │                         │  │
│    │  ─── 또는 ───            │  │
│    │                         │  │
│    │  [비로그인으로 둘러보기] │  │  ← 이탈 방지
│    └─────────────────────────┘  │
└─────────────────────────────────┘
```

**포인트**:
- 이메일 로그인 폼을 기본 숨김, "이메일로 시작" 탭으로 접근 — 주 동선이 카카오
- `max-width: 400px`, 상단 `primaryLight` band 48px
- 비로그인 CTA로 이탈 최소화

### C. 디자인 토큰 잔여물 제거 (0.5일)

`grep` 대상:
```bash
#d97706   # 구 primary-600
#f59e0b   # 구 primary-400
#ef4444   # 하드코딩 red
#9ca3af   # cool gray (warm으로 교체)
#d1d5db   # cool gray
```
교체:
- `#d97706` → `theme.colors.primary` (#b45309)
- `#ef4444` → `theme.colors.err`
- `#9ca3af` → `theme.colors.ink400`
- `#d1d5db` → `theme.colors.ink300`

**예상 파일**: `ProfilePageClient`, `favorites/page`, `InstallPrompt`, admin 계열.

---

## PART 3 — 🧭 제품/디자인 결정 필요 (QA v2 백로그 + 신규)

| # | 항목 | 결정 필요 내용 |
|---|---|---|
| D1 | **N5** Textarea iOS 16px 확대 | 16px 하한으로 올릴지(레이아웃 영향) vs font-size: max(16px, 0.95rem) 편법 |
| D2 | **N10** MoodFilterSheet height vs max-height | 고정 80dvh 유지 vs 컨텐츠 적응형 |
| D3 | **N13** 로그인 필요 toast action 버튼 | toast.error에 "로그인" 버튼 추가 여부 |
| D4 | **V3-03** 프로필 통계 | 실시간 vs 캐시(ISR 5분) |
| D5 | **V3-04** Header 모바일 검색 버튼 | 추가 vs /map 안에만 유지 |
| D6 | **V3-05** Header 경로별 숨김 | 구현 구조 (layout.tsx 분기 vs slot) |
| D7 | **V3-08** 페이지 전환 애니메이션 | view-transition 적용 범위 |
| D8 | 다크모드 | Phase에 포함 여부 (현재 토큰은 라이트만) |
| D9 | **관리자 페이지** 리디자인 | 스코프 포함 여부 |

---

## PART 4 — 📋 우선순위 Action Plan

### **Phase 3 — 1일 (품질 수렴)**
- [ ] V3-01 프로필·즐겨찾기 하드코딩 색 제거 (1h)
- [ ] V3-10 InstallPrompt 그라데이션 토큰화 (15m)
- [ ] V3-11 Favorites grid gap 토큰화 (15m)
- [ ] V3-12 MenuCard active 상태 (15m)
- [ ] V3-07 Divider 대비 개선 (15m)
- [ ] V3-06 InstallPrompt 경로별 노출 (30m)
- [ ] QA v2 N8 (autocomplete/spellcheck) — 10m
- [ ] QA v2 N15/N16 (Separator margin · OptionalText) — 30m

### **Phase 4 — 1.5일 (프로필 리디자인)**
- [ ] V3-03 프로필 통계 섹션 + API (`/api/me/stats`)
- [ ] V3-04 Header 모바일 검색 아이콘
- [ ] V3-05 Header 경로별 숨김
- [ ] Phase 3 회귀 QA

### **Phase 5 — 1일 (로그인 리디자인)**
- [ ] V3-02 로그인 카드 + 브랜드 band + 비로그인 CTA
- [ ] 회원가입 페이지 동일 톤 맞춤
- [ ] N5 (Textarea 16px) 실기기 확정 + 반영

### **Phase 6 — 선택 (페이지 전환 · 다크모드)**
- [ ] V3-08 view-transition 적용
- [ ] D8 다크모드 토큰 분기 (`theme.dark`)

**총 추정**: Phase 3-5만 = **3.5일**. Phase 6까지 = 5-6일.

---

## PART 5 — 🚦 Phase 별 완료 기준 (Definition of Done)

각 Phase 끝날 때 이 체크가 통과해야 다음으로:

### Phase 3 DoD
- `git grep "#d97706\|#ef4444\|#9ca3af\|#d1d5db" src/` → **0건**
- `tsc --noEmit` · `next build` 통과
- 프로필·즐겨찾기 페이지 Lighthouse Contrast 100
- InstallPrompt 지도에서만 표시

### Phase 4 DoD
- 프로필 통계 3개 카드 렌더, 0일 때도 깨지지 않음
- `/profile` 직접 접근 → 통계 API 호출 확인
- 모바일 Header 검색 아이콘 탭 → `/search` 이동
- `/map`·`/search`에서 글로벌 Header 미렌더

### Phase 5 DoD
- 로그인 페이지 카드 상단 primaryLight band 표시
- "비로그인으로 둘러보기" 링크 → `/map`
- aria-invalid 상태에서 Input border red
- 회원가입 페이지 동일 구조

---

## 결론

8 PR로 **"핵심 경로(지도·상세·검색)의 품질 불균형"은 해소**됐습니다.

다음 단계는 **"변방 화면(프로필·로그인)까지 디자인 시스템이 닿게 하기"** + **"경로별 레이아웃 최적화(Header 조건부)"**.

스코프 결정 포인트:
1. Phase 3만 — 품질 수렴, 1일. 추가 디자인 없이 현 상태 안정화.
2. Phase 3-4 — 프로필까지 리디자인, 2.5일. **추천**.
3. Phase 3-5 — 로그인까지. 3.5일. 신규 사용자 온보딩 개선.
4. Phase 3-6 — 전환·다크모드. 5-6일. 완성도 최대화.

어느 쪽으로 가실지 알려주시면 해당 Phase에 대한 **MD 구현 가이드**를 바로 만들어 Claude Code에 넘기실 수 있게 해드리겠습니다.
