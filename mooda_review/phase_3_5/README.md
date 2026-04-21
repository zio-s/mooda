# Phase 3-5 구현 가이드 — Mooda 디자인 수렴 + 리디자인

> **대상**: Claude Code 또는 후속 개발 세션
> **전제**: 8 PR(QA v2 Phase 1) 반영 완료 상태
> **기반 리포트**: `mooda_review/08_next_iteration_v3.md`

---

## 📦 이 디렉터리 구성

```
phase_3_5/
├── README.md                  ← 지금 문서 (시작점)
├── PHASE_3_QUALITY.md         ← 1일, 토큰 잔여물 + Polish (8개 작업)
├── PHASE_4_PROFILE.md         ← 1.5일, 프로필 리디자인 + /api/me/stats
└── PHASE_5_AUTH.md            ← 1일, 로그인/회원가입 리디자인
```

**총 예상 기간**: 3.5일 (순차 진행 기준)

---

## 🚦 진행 원칙 (중요)

### 1. Phase 단위 PR로 분리
각 Phase 안에서도 논리 단위(task)별로 커밋 분리. 한 PR에 Phase 전체를 묶지 않음.

```
Phase 3 = 8 commits (작업별)
Phase 4 = 4 commits (API · 통계 UI · Header 숨김 · 검색 진입점)
Phase 5 = 3 commits (로그인 · 회원가입 · 공통 스타일)
```

### 2. 각 Phase 끝날 때 DoD 체크
각 MD 하단 **Definition of Done** 항목을 전부 확인한 뒤에만 다음 Phase로 진행.

### 3. 회귀 테스트 필수
아래 3개 경로는 Phase 전/후 둘 다 동작 확인:
- `/map` → 카페 탭 → 바텀시트 열기 → Android 뒤로가기로 닫기
- `/cafes/[id]` → 갤러리 열기 → ESC로 닫기
- `/search` → 한글 2자 이상 입력 → Enter → 상세 이동

### 4. 빌드 검증
```bash
pnpm typecheck   # tsc --noEmit
pnpm build       # next build
```
각 Phase 종료 시 둘 다 통과 필수.

---

## 🎯 Phase별 한 줄 요약

| Phase | 목적 | 체감 개선 |
|---|---|---|
| **3** | 토큰 밖 하드코딩 제거 + 작은 UX 홈 | 앱 전체 톤 통일 |
| **4** | 프로필 = "내 카페 허브" 로 승격 | 재방문 동기 부여 |
| **5** | 로그인/가입 = 첫인상 브랜드화 | 신규 전환율 |

---

## 🔗 참고 문서 (기존)

- `design_handoff_mooda/` — 초기 핸드오프 패키지 (Day 1-3)
- `mooda_review/07_comprehensive_qa_v2.md` — QA v2 (8 PR의 근거)
- `mooda_review/08_next_iteration_v3.md` — 이번 Phase들의 진단 리포트

---

## 🛑 이 가이드로 다루지 '않는' 것

- 관리자 페이지(`/admin/*`) 리디자인 — 별도 스코프
- 다크모드 — Phase 6+ 에서 다룰 것
- 백엔드 스키마 변경 — Phase 4에서 신규 API 1개(`/api/users/me/stats`)만 추가
- 국제화(i18n) — 한국어 확정

---

## 📞 막혔을 때

각 Phase MD 끝부분의 **"판단 필요 시"** 섹션을 확인. 거기 없으면 진행 멈추고 프로젝트 오너에게 질문.
