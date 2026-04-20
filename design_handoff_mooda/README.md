# Handoff: Mooda Mobile Web / PWA 개선

이 폴더는 **Mooda 디자인 리뷰**의 결과를 실제 Next.js 코드베이스(`mooda/`)에 적용하기 위한 핸드오프 패키지입니다.  
Claude Code(또는 다른 개발자/에이전트)가 이 문서 하나만 읽고도 작업을 시작할 수 있도록 구성했습니다.

---

## 0. 시작하기 전에 — 중요

이 패키지 안의 `mockups/*.html`은 **디자인 레퍼런스**입니다. 바로 배포용으로 붙여넣는 코드가 아니라, "이렇게 생기고 이렇게 동작해야 한다"를 보여주는 프로토타입입니다.  
당신의 일은 이 HTML들을 **Mooda의 실제 환경(Next.js 16 App Router · TypeScript · styled-components · RTK Query · shadcn)에 맞게 다시 구현**하는 것입니다. 인라인 스타일·플레이스홀더 SVG를 그대로 포팅하지 말고, 기존 `theme.ts`·styled-components·shadcn 패턴을 사용하세요.

## 1. Fidelity

**High-fidelity (hifi)** 입니다. 색상·타이포·스페이싱·라디우스·그림자 값이 확정돼 있으므로 픽셀 수준으로 재현하세요. 다만 **구현 수단**(인라인 → styled-components, 플레이스홀더 SVG → 실제 lucide-react 아이콘, 가상 지도 → 실제 Kakao SDK)은 기존 코드베이스 규칙을 따릅니다.

## 2. Scope 요약

다섯 개 핵심 화면 + 토큰/상태관리 리팩토링. 우선순위·인력은 `IMPLEMENTATION_PLAN.md` 참고.

| # | 영역 | 주요 변경 |
|---|---|---|
| 01 | 디자인 토큰 (`theme.ts`) | warm gray 전환, semantic 컬러 추가, shadows 4-tier |
| 02 | 검색 | 인풋 → full-screen 전환, Mooda 등록 카페 vs Kakao Local 분리 |
| 03 | 지도 | 마커 LOD, 탭 시 bottom-sheet peek, "이 지역 재검색" |
| 04 | 필터 | bottom sheet + 카테고리 탭 + 실시간 매칭 카운트 |
| 05 | 카페 상세 | 히어로 placeholder, 4-칸 quick action, 분위기 투표 카드 |
| 06 | 목록 뷰 | /map 내 segmented control로 지도/목록 전환 |
| 07 | RTK/SSR | 서버상태 vs UI상태 분리, Kakao SDK 전역 로드, safe-area |

## 3. 이 패키지 구성

```
design_handoff_mooda/
├── README.md                    ← 지금 이 파일. 모든 문서 인덱스
├── IMPLEMENTATION_PLAN.md       ← Week별 체크리스트. 여기서 시작
├── ISSUES.md                    ← 27개 이슈 전체 목록 (우선순위·파일경로)
├── 01_tokens.md                 ← theme.ts 수정안 (복붙 가능)
├── 02_components.md             ← 신규/수정 컴포넌트 스펙 전체
├── 03_screens.md                ← 5개 화면 구현 가이드
├── 04_state_and_api.md          ← Redux/RTK Query/에러/오프라인
├── mockups/
│   ├── index.html               ← 원본 디자인 리뷰 (브라우저로 열어 참고)
│   ├── screens.jsx              ← 5개 화면 React 소스
│   ├── styles.css               ← 리뷰 페이지 스타일
│   └── ios-frame.jsx            ← 디바이스 프레임 (무시 가능)
```

## 4. 권장 읽기 순서

1. **`IMPLEMENTATION_PLAN.md`** — 큰 그림과 주차별 할 일
2. **`mockups/index.html`을 브라우저로 열기** — 실제 디자인 눈으로 확인
3. **`01_tokens.md`** — 먼저 토큰부터 교체 (이후 작업이 쉬워짐)
4. **`02_components.md`** → 공통 컴포넌트(OpenBadge, BottomSheet, ErrorState) 구현
5. **`03_screens.md`** — 화면 단위로 진행
6. **`04_state_and_api.md`** — 상태관리·성능 리팩토링
7. **`ISSUES.md`** — 하나씩 체크하며 PR close

## 5. 브랜드/디자인 원칙

- **톤 유지 · 점진 개선** — 현재 amber 팔레트를 유지하고 채도만 살짝 낮춤. 새 브랜드 컬러 도입 금지.
- **네이티브 앱 감성** — PWA로 설치해 쓰는 사용자가 "이거 웹사이트 맞네"라고 느끼지 않게. iOS HIG(터치 44+, safe-area, 16px 인풋)을 충실히.
- **네이버지도 UX 참고, 카카오맵 SDK 유지** — 단기에는 카카오맵 위에 네이버지도식 오버레이/바텀시트/마커를 얹는다. Naver Map 이식은 Month 2.
- **정보 위계** — 한 카드에 같은 톤 amber 배지 5개 금지. solid는 상위 2개까지.

## 6. 타깃 환경

확인된 스택 (mooda/package.json · tsconfig · next.config 기준):
- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- styled-components v6 + shadcn/ui(Radix + Tailwind)
- Redux Toolkit + RTK Query
- Prisma 7, PostgreSQL
- Kakao Map JavaScript SDK

모바일 웹 우선(PWA installable). 데스크톱은 "깨지지만 않게" 수준으로 유지.

## 7. 질문 생기면

- 색이 불확실하면 → `01_tokens.md` 기준 사용
- 컴포넌트 구조가 애매하면 → `mockups/screens.jsx` 해당 화면 함수 참고
- 이슈 범위가 커 보이면 → `IMPLEMENTATION_PLAN.md`에서 주차 단위로 쪼갰으니 그 단위대로 PR
- 무엇부터 시작할지 모르겠으면 → **`IMPLEMENTATION_PLAN.md` Week 1**부터
