# Mooda - 분위기로 찾는 카페

카페 이름을 몰라도 괜찮아요. 16가지 분위기 태그로 원하는 감성의 카페를 지도에서 찾아주는 풀스택 웹 서비스입니다.

**Live**: https://mooda-zio-s-projects.vercel.app

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| ORM | Prisma 7 (PostgreSQL Adapter) |
| Database | Supabase PostgreSQL |
| State | Redux Toolkit + RTK Query |
| Auth | NextAuth.js (카카오 OAuth + Credentials) |
| Map | Kakao Maps SDK |
| Styling | styled-components (SSR) |
| Validation | Zod |
| Cache | Redis (ioredis) |

## Features

### 지도 기반 카페 탐색
- 카카오맵 SDK 기반 실시간 인터랙티브 지도
- 드래그/줌 시 해당 영역 카페 자동 검색 (디바운싱 최적화)
- 지역 바로가기 (강남, 홍대, 성수 등)

### 분위기 태그 필터링
- 16가지 감성 태그 (조용한, 로맨틱, 빈티지, 미니멀 등)
- 분위기/목적/인테리어/편의시설 등 카테고리별 분류
- 사용자 투표 기반 분위기 데이터 축적

### 카페 키워드 검색
- 카카오 로컬 API 키워드 검색
- DB 미등록 카페 선택 시 자동 등록
- Mooda 등록 여부 배지 표시

### 카페 상세 정보
- 기본 정보 (주소, 영업시간, 전화번호)
- 네이버 블로그 후기 연동
- Google Places 리뷰/사진 연동
- 분위기 투표 + 리뷰 작성
- 즐겨찾기 + 카페 컬렉션

### 대중교통 길찾기
- ODsay API 연동 경로 안내
- 현재 위치 기반 소요시간 표시

### 인증
- 카카오 소셜 로그인
- 이메일/비밀번호 로그인
- NextAuth.js 세션 관리

## Architecture

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (15개 엔드포인트)
│   │   ├── cafes/            # 카페 CRUD, 검색, 투표, 리뷰
│   │   ├── collections/      # 카페 컬렉션
│   │   ├── moods/            # 분위기 태그
│   │   ├── route/            # 대중교통 경로
│   │   └── users/            # 사용자, 즐겨찾기
│   ├── cafes/[id]/           # 카페 상세 (SSR)
│   ├── map/                  # 지도 탐색
│   └── profile/              # 프로필, 컬렉션
├── components/               # UI 컴포넌트
│   ├── cafe/                 # 카페 카드, 목록
│   ├── map/                  # 지도, 마커, 클러스터
│   ├── search/               # 키워드 검색
│   └── ui/                   # 공통 UI (Button, Sheet 등)
├── store/                    # Redux Store
│   ├── api/cafesApi.ts       # RTK Query 엔드포인트
│   └── slices/               # map, filter 슬라이스
├── lib/                      # Prisma, Redis, Kakao, Auth
└── types/                    # TypeScript 타입 정의
```

## Database Schema

Prisma ORM으로 15개 테이블 관리:

```
User ─── MoodVote ─── Mood
  │         │           │
  │      CafeMood ──────┘
  │         │
  ├── Review ├── Cafe ─── CafePhoto
  │         │         ├── CafeHour
  ├── UserFavorite     ├── NaverBlogCache
  │                    └── GooglePlaceCache
  └── Collection ─── CollectionItem
```

## API Caching Strategy

Redis 캐싱으로 API 응답 최적화 (Vercel 환경에서는 graceful no-op fallback):

| 데이터 | TTL | 무효화 조건 |
|--------|-----|------------|
| 카페 검색 | 5분 | - |
| 카페 상세 | 30분 | 투표/리뷰 작성 시 |
| 네이버 블로그 | 24시간 | - |
| Google 리뷰 | 7일 | - |
| 분위기 태그 | 1시간 | - |

## Validation

Zod 스키마로 주요 API 입력 검증:

- 로그인/회원가입 폼 (이메일 형식, 비밀번호 6자 이상)
- 카페 검색 파라미터 (좌표, 반경, 정렬)
- 리뷰 작성 (별점 1~5 범위)
- 컬렉션 생성 (이름 필수)

## Development

```bash
yarn dev              # 개발 서버 (Webpack)
yarn dev:turbo        # 개발 서버 (Turbopack)
yarn build            # 프로덕션 빌드
yarn db:studio        # Prisma Studio
yarn db:migrate       # DB 마이그레이션
```

## Environment Variables

```env
DATABASE_URL=
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
GOOGLE_PLACES_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
ODSAY_API_KEY=
AUTH_SECRET=
```
