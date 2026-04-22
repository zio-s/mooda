# On-demand 이미지 Enrichment 이행 지침서

> **작성자**: Claude Script
> **대상 작업자**: Claude Code (React · Next.js · API Route · UI 영역)
> **배경 문서**: `PHOTO_PIPELINE_GUIDE.md` · `DECISIONS.md` · `README.md`
> **선행 조건**: `PHOTO_PIPELINE_GUIDE.md` §0 읽고 시작.
> **목표**: 카페 사진 수집을 Script 배치 → **사용자 요청 기반 on-demand** 로 전환. Script 는 초기 seed 와 품질 개입 전용으로 축소.

---

## ⚠️ 글로벌 규칙 (README.md 참조, 요약)

> - 🚫 커밋 메시지 / PR 본문에 `Co-Authored-By: Claude …`, `🤖 Generated with Claude Code`, 기타 Claude · Anthropic 귀속 표기 **절대 금지**
> - 커밋 형식: `<type>(<scope>): <subject> (작업ID)` + (선택) 본문. 그 외 없음
> - `--no-verify` / hook 우회 금지

---

## 목차

0. 🧭 스코프
1. 📸 현재 구조 & 왜 바꾸는가
2. 🎯 전환 원칙
3. 🏗 아키텍처 결정
4. 🔨 이슈 목록 (T-CODE-01 ~ 08)
5. 📝 각 이슈 상세 스펙
6. 🧪 회귀 & 테스트
7. ⚙️ 선행 조건 (Claude Script 가 해야 할 것)
8. ✅ Phase 전체 DoD
9. 🗺 롤백 & 폴백

---

## 0. 🧭 스코프

### In-scope (이 Phase 에서 처리)
- `src/app/api/cafes/**/route.ts` — google-reviews · search · 신규 enrich-images
- `src/app/cafes/[id]/CafeDetailClient.tsx` — 갤러리 dedup
- `src/lib/image/` (신규) — Script lib/image-size, naver-proxy 를 app 에서도 쓸 수 있도록 재배치
- Redis 캐시 무효화 호출점

### Out-of-scope
- 디자인 토큰 · 컴포넌트 디자인 (Claude Design)
- Script 재작성 (Claude Script — 본 Phase 에서는 lib 을 공용 경로로 옮기는 정도만 조율)
- Prisma 스키마 변경 (이미 T-SCRIPT-02 에서 완료 — `CafePhoto` 확장 컬럼 존재 상태)
- PWA · 인증 · 마켓팅 컴포넌트

---

## 1. 📸 현재 구조 & 왜 바꾸는가

### Claude Script 가 T-SCRIPT-01 ~ 06 에서 달성한 것
| 지표 | Before | After |
|---|---|---|
| 평균 해상도 | 357×319 | 1358×1255 |
| 중앙값 | 200×150 | 1000×853 |
| 썸네일 비율 | 84% | 6.1% |
| 고해상도 (≥1024) | 8% | 46.9% |
| 프록시 잔존 | 3,183장 | 0장 (치환·정리 완료) |

근본 원인 규명 — `enrich-cafes.ts` 가 네이버 이미지검색 API 의 `link` 필드(프록시 150px) 를 원본으로 착각해 저장해옴. `src=` 디코드로 원본 복구, 3,183 중 2,923 치환 / 293 정리.

### 지금 남은 두 가지 구조 문제

#### 문제 1: 목록 카드 썸네일이 Google 사진 혜택 못 받음
- `GET /api/cafes/[id]/google-reviews` (`src/app/api/cafes/[id]/google-reviews/route.ts:92`) 가 Google Details API 호출 → photos 필드 반환
- 하지만 결과는 `google_place_cache.data.photos` 에만 저장. `cafe_photos` 테이블엔 안 들어감
- `CafeListCard.tsx:62` 는 `cafe.photos[0]?.url` 만 읽음 → Google 사진은 안 보임
- **사용자 체감**: 매칭된 인기 카페의 상세 진입 뒤에도 목록에서는 여전히 네이버 사진 또는 placeholder

#### 문제 2: 상세 갤러리 중복 (꿈꾸는커피 등)
- 갤러리는 `cafe.photos` + `googleData.photos` 단순 concat (`CafeDetailClient.tsx:143`)
- **Claude Script 가 T-07 시도에서 `cafe_photos` 에 sourceType='google' 266장을 저장함** → 곧 롤백 예정(§9 롤백 계획)
- 현재 API route 가 `maxwidth=600` 으로 반환, Script 가 저장한 건 `maxwidth=1600` → URL 문자열 다르고 `photo_reference` 같음 → 동일 사진 2번 표시

### 왜 on-demand 로 전환하는가
1. **무료 API 쿼터 충분** — Google $200/월 크레딧, Naver 25k/일. MVP 트래픽에 배치 필요 없음
2. **인기 카페 우선 수집** — 사용자 방문 = 가치 신호. 안 방문한 1,400 카페까지 미리 털 이유 없음
3. **수동 운영 부담 제거** — `--force` 재실행, 할당량 관리, 새 카페 추가 시 재실행 불필요
4. **이미 절반 구현돼있음** — google-reviews route 가 placeId 매칭 + Details 자동 수행 중

---

## 2. 🎯 전환 원칙

### 단일 진실원 (Single Source of Truth)
- 카페 사진의 공식 저장소는 **`cafe_photos` 테이블**
- API route 는 조회 시 fallback 으로 실시간 수집하지만 **항상 DB 에 upsert** — 다음 요청부터 캐시
- UI 는 `cafe.photos` 만 읽음. `googleData.photos` 는 **제거 또는 보조 역할** 만

### 수집 트리거 분류
| 트리거 | 수집 범위 | 비동기 여부 |
|---|---|---|
| 상세 페이지 진입 (`/cafes/[id]`) | 네이버 + Google (사진 없거나 부족한 경우만) | 동기 — 갤러리에 즉시 필요 |
| 목록 조회 (`/api/cafes/search`) | 썸네일 없는 카페 일부 (≤5) | **비동기 fire-and-forget** — 응답 지연 금지 |
| 검색어 자동완성 | ❌ — 과도한 호출 위험 | — |

### 멱등성 (Idempotency)
- 같은 카페에 대해 여러 요청이 동시 발생해도 UNIQUE 제약이 중복 삽입 방지 (`@@unique([cafeId, url])`)
- DB 에 이미 `sourceType='google'` 사진 있으면 외부 API 호출 스킵
- DB 에 이미 `sourceType='naver'` 사진 N장 이상이면 네이버 호출 스킵

### Rate Limit 보호
- 카페별 최근 수집 시각을 Redis 에 기록 (키: `enrich:cafe:${id}`, TTL 1시간) → 1시간 내 재수집 방지
- 목록 백그라운드 enrich 는 실행당 최대 5 카페
- Google OVER_QUERY_LIMIT · Naver rate exceeded 응답 시 조용히 실패, UI 는 placeholder 유지

---

## 3. 🏗 아키텍처 결정

### Lib 공용화 (T-CODE-01)
Script 가 이미 작성한 이미지 처리 로직을 app 에서도 쓸 수 있도록 경로 이동:

```
scripts/lib/image-size.ts     →  src/lib/image/size.ts
scripts/lib/naver-proxy.ts    →  src/lib/image/naver-proxy.ts
```

Script 에서는 `src/lib/image/*` 를 import 하도록 변경 (역방향 의존이 아닌 정순).

tsconfig 에 `scripts/` 가 exclude 돼있으므로 Script 가 `src/` 를 import 는 문제없음 (tsx 실행 시 path alias `@/lib/image/size` 또는 상대경로).

### 사진 수집 통합 경로
```
  상세 페이지 진입
    ↓
  GET /api/cafes/[id]  ← 기존 SSR + Redis 캐시
    ↓
  cafe.photos.length < 3?
    ↓ YES
  POST /api/cafes/[id]/enrich-images (신규)
    ↓
    1) 네이버 이미지 검색 → 원본 추출 → 검증 → cafe_photos UPSERT
    2) Google placeId 있으면 Details API → photos → cafe_photos UPSERT
    3) Redis cafe:${id} + search:* 무효화
    4) 결과 summary 반환 (저장한 사진 수)
    ↓
  UI: router.refresh() 또는 RTK Query invalidate
```

### Google photos 저장 정책
- API route `/api/cafes/[id]/google-reviews` 는 **photos 필드 반환 중단** (UI 갤러리는 `cafe.photos` 만 사용)
- Google Details API 호출 시 응답의 photos 는 **cafe_photos 에 즉시 upsert**, API 응답에는 포함하지 않음
- UI 는 더 이상 `googleData.photos` 에 의존하지 않음 → **갤러리 중복 근본 제거**

### URL 포맷 일관성
- `cafe_photos.url` 에 저장할 Google photo URL 은 `maxwidth=1600` 고정
- API KEY 는 **환경변수 치환 패턴** 사용 권장 (§T-CODE-07 보안 후속) — 현 단계에서는 기존과 동일하게 KEY 포함 URL 저장. referrer 제한으로 방어

---

## 4. 🔨 이슈 목록

| ID | 제목 | 파일 | 예상 | 선후 |
|---|---|---|---|---|
| **T-CODE-01** | Image lib 을 src/lib/image 로 이동 | 신규 + scripts 상호참조 | 30m | — |
| **T-CODE-02** | enrich-images API route 신설 | `src/app/api/cafes/[id]/enrich-images/route.ts` | 2h | T-CODE-01 |
| **T-CODE-03** | google-reviews route 가 cafe_photos 에 upsert + photos 응답 제거 | `src/app/api/cafes/[id]/google-reviews/route.ts` | 45m | T-CODE-01 |
| **T-CODE-04** | CafeDetail 페이지에서 enrich-images 자동 호출 | `src/app/cafes/[id]/page.tsx` + Client | 45m | T-CODE-02 · 03 |
| **T-CODE-05** | 갤러리에서 googleData.photos 의존 제거 | `src/app/cafes/[id]/CafeDetailClient.tsx` | 30m | T-CODE-03 |
| **T-CODE-06** | cafes/search 목록에 백그라운드 enrichment | `src/app/api/cafes/search/route.ts` | 1.5h | T-CODE-02 |
| **T-CODE-07** | Photo URL API KEY 보안 (프록시 route) | `src/app/api/photo/[ref]/route.ts` (신규) | 1.5h | 독립 |
| **T-CODE-08** | Redis 캐시 무효화 helper 통합 | `src/lib/redis.ts` 확장 | 30m | — |

**총 8시간** (순차적 실행 기준). 병렬화 가능 부분은 T-CODE-07 · 08 이 다른 이슈와 독립.

**커밋 단위**: 이슈 1개 = 커밋 1개. 가능하면 T-CODE-01~05 는 단일 PR, T-CODE-06~08 은 후속 PR.

---

## 5. 📝 각 이슈 상세 스펙

---

### T-CODE-01. Image lib 을 `src/lib/image` 로 이동 (30m)

**목적**: Script 영역의 이미지 처리 lib 을 app 에서도 재사용 가능하게. Script 는 거꾸로 src 를 참조.

**파일 이동**:
```
scripts/lib/image-size.ts  →  src/lib/image/size.ts
scripts/lib/naver-proxy.ts →  src/lib/image/naver-proxy.ts
```

**영향받는 Script 파일** (import 경로 변경):
- `scripts/check-photos.ts`
- `scripts/check-naver-origins.ts`
- `scripts/fix-naver-thumbnail-urls.ts`
- `scripts/cleanup-failed-thumbnails.ts`
- `scripts/enrich-cafes.ts`

**변경 방식**: 상대 경로 유지 — `./lib/image-size` → `../src/lib/image/size`. 또는 tsconfig path 에 `@/lib/image/*` 를 `src/lib/image/*` 로 매핑 (이미 `@/*` alias 있음). app 내부에서는 `@/lib/image/size` 로 import.

**DoD**:
- [ ] 파일 이동 + import 경로 일괄 변경
- [ ] `npm run build` 통과
- [ ] `npx tsx scripts/check-photos.ts --sample=5` 여전히 동작
- [ ] api route · 컴포넌트에서 `@/lib/image/size` import 가능

**커밋**: `refactor(lib): image-size · naver-proxy 를 src/lib/image 로 이동 (T-CODE-01)`

---

### T-CODE-02. `POST /api/cafes/[id]/enrich-images` API route 신설 (2h)

**목적**: 카페 한 곳의 사진을 외부 API 에서 수집 → 검증 → `cafe_photos` 에 저장. 상세 페이지 진입·목록 백그라운드에서 공용으로 사용.

**파일**: `src/app/api/cafes/[id]/enrich-images/route.ts` (신규)

**요청**: `POST /api/cafes/[id]/enrich-images`

**내부 흐름**:
```
1. cafeId 유효성 + 카페 존재 확인
2. Redis lock 체크 (enrich:lock:${cafeId}, TTL 60s)
   - lock 있으면 409 Conflict 반환 (이미 진행 중)
3. Redis recent 체크 (enrich:recent:${cafeId}, TTL 1h)
   - recent 있으면 304 Not Modified (최근 수집 완료)
4. 현재 cafe_photos 개수 조회
   - >= TARGET_PHOTOS(3) 면 스킵, 204 반환
5. lock 설정 + enrich 실행:
   a) 네이버 이미지 검색 + 원본 추출 (사진 부족 시)
      - 쿼리: "${neighborhood} ${cafeName} 카페 내부"
      - extractNaverProxyOrigin → 원본 URL
      - isBlockedHost 필터
      - batchFetchDimensions 검증 (>= 400x300)
      - @@unique([cafeId, url]) 충돌 무시하고 create
      - sourceType='naver'
   b) Google placeId 있으면 Details API → photos
      - maxwidth=1600
      - sourceType='google'
      - attribution 저장
6. recent 설정 (1h TTL) + lock 해제
7. Redis cafe:${cafeId} + search:* 무효화
8. summary 반환: { saved: N, sources: {naver, google}, cafe: updated_cafe }
```

**핵심 의존**:
- `@/lib/image/size` (T-CODE-01) — `batchFetchDimensions`
- `@/lib/image/naver-proxy` — `extractNaverProxyOrigin`, `isBlockedHost`
- `@/lib/prisma`
- `@/lib/redis`
- `@/lib/auth` (optional — admin 강제 재수집은 role 체크)

**에러 응답**:
- `409 {lockedBy: "other request"}` — 진행 중
- `304` — 최근 수집됨
- `204` — 이미 충분한 사진 있음 (수집 안 함)
- `200 { saved, sources, ... }` — 수집 완료
- `404` — 카페 없음
- `500` — 내부 오류 (외부 API 장애는 500 대신 200 + saved=0 으로 graceful)

**구현 스켈레톤**:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { batchFetchDimensions } from '@/lib/image/size';
import { extractNaverProxyOrigin, isBlockedHost } from '@/lib/image/naver-proxy';

const TARGET_PHOTOS = 3;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const LOCK_TTL = 60;
const RECENT_TTL = 60 * 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ... 5단계 흐름 구현
}
```

**DoD**:
- [ ] route 파일 존재, TypeScript 통과
- [ ] `curl -X POST /api/cafes/<id>/enrich-images` 응답 정상
- [ ] cafe_photos 에 sourceType='naver' / 'google' 레코드 생성
- [ ] Redis lock/recent 키 확인
- [ ] 동일 카페 동시 요청 시 409 또는 모두 204
- [ ] 외부 API 장애 시 200 + saved=0, 5xx 반환 X
- [ ] 단위 테스트 없어도 됨 — 수동 smoke 로 대체

**커밋**: `feat(api): cafe 이미지 on-demand 수집 route 신설 (T-CODE-02)`

---

### T-CODE-03. google-reviews route 가 cafe_photos upsert + photos 응답 제거 (45m)

**목적**: photos 를 google_place_cache 단독 저장 → cafe_photos 로 통합. API 응답에서 photos 제거로 갤러리 중복 원천 차단.

**파일**: `src/app/api/cafes/[id]/google-reviews/route.ts`

**변경 1 — fetchPlaceDetails 응답 파싱 시 photos 를 cafe_photos 에 upsert** (line 30 근처 `parseResult` 전후):
```ts
async function upsertGooglePhotos(
  cafeId: string,
  photos: Array<{ url: string; width: number; height: number; attributions: string[]; photo_reference: string }>
) {
  const hasMain = await prisma.cafePhoto.findFirst({
    where: { cafeId, isMain: true },
    select: { id: true },
  });
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    try {
      await prisma.cafePhoto.create({
        data: {
          cafeId,
          url: p.url,
          originalUrl: p.photo_reference,
          sourceType: 'google',
          width: p.width,
          height: p.height,
          attribution: p.attributions[0]?.replace(/<[^>]+>/g, '') ?? null,
          isMain: !hasMain && i === 0,
        },
      });
    } catch (e) {
      if (!(e instanceof Error) || !/Unique constraint/i.test(e.message)) throw e;
    }
  }
}
```

**변경 2 — buildPhotoUrl maxwidth 를 1600 으로 상향** (line 27):
```ts
function buildPhotoUrl(ref: string, maxWidth = 1600) { /* ... */ }
```

**변경 3 — parseResult 결과에서 photos 필드 응답 제거**:
```ts
return {
  reviews: sortedReviews,
  // photos: photoUrls,   ← 제거
  googleRating: result.rating ?? undefined,
  googleTotalRatings: result.user_ratings_total ?? undefined,
};
```

**변경 4 — Details fetch 성공 직후 upsertGooglePhotos 호출**:
```ts
const data = await fetchPlaceDetails(placeId);
if (data) {
  // photos 를 cafe_photos 에 저장 (응답에는 포함 안 함)
  if (Array.isArray((data as any)._rawPhotos)) {
    await upsertGooglePhotos(cafeId, (data as any)._rawPhotos);
  }
  await redis.del(`cafe:${cafeId}`).catch(() => null);
}
```

**변경 5 — Redis `cafe:${cafeId}` 무효화** — cafe_photos 바뀌면 SSR 캐시도 만료.

**DoD**:
- [ ] photos 필드 API 응답에서 제거 (UI 테스트에서 googleData.photos === undefined 확인)
- [ ] Google Details 응답의 photos 가 cafe_photos 에 sourceType='google' 로 저장
- [ ] @@unique([cafeId, url]) 로 중복 방지
- [ ] Redis cafe:<id> 무효화
- [ ] 꿈꾸는커피 상세 — 갤러리 중복 해소 수동 확인

**커밋**: `refactor(api): google-reviews 의 photos 를 cafe_photos 로 통합 (T-CODE-03)`

---

### T-CODE-04. CafeDetail 페이지에서 enrich-images 자동 호출 (45m)

**목적**: 상세 페이지 진입 시 사진이 부족한 카페는 enrich-images 를 자동 트리거. 다음 렌더에 반영.

**파일**: `src/app/cafes/[id]/page.tsx` · `src/app/cafes/[id]/CafeDetailClient.tsx`

**구현 방식 옵션**:

**A. 서버 컴포넌트에서 호출 (권장)** — `page.tsx`:
```ts
// getCafe(id) 결과 반환 직전에 삽입
if (cafe.photos.length < 3) {
  // fire-and-forget: await 안 함 → 첫 로드 지연 없음
  fetch(`${process.env.NEXTAUTH_URL}/api/cafes/${id}/enrich-images`, {
    method: 'POST',
  }).catch(() => null);
}
```
장점: fetch 성공·실패 여부와 무관하게 첫 페이지 로드 빠름. 두 번째 진입 때 반영됨.
단점: 첫 진입 사용자는 placeholder 또는 빈약한 갤러리 경험.

**B. 클라이언트 컴포넌트에서 useEffect + router.refresh()**:
```ts
// CafeDetailClient.tsx
useEffect(() => {
  if (cafe.photos.length < 3) {
    fetch(`/api/cafes/${cafe.id}/enrich-images`, { method: 'POST' })
      .then((r) => r.ok && r.status !== 204 ? r.json() : null)
      .then((res) => {
        if (res?.saved > 0) router.refresh();
      })
      .catch(() => null);
  }
}, [cafe.id, cafe.photos.length, router]);
```
장점: 수집 완료 후 즉시 갱신됨 (2-3초 후 사진 나타남).
단점: 첫 렌더 → fetch → refresh 3단계 UX. 로딩 상태 노출 주의.

**권장**: **B (useEffect + refresh)** — 사용자 경험 개선 효과 더 큼. 로딩 상태는 갤러리 섹션에 skeleton 유지.

**DoD**:
- [ ] 첫 상세 진입 시 enrich-images 호출 (네트워크 탭에서 확인)
- [ ] 수집 완료 시 gallery 에 사진 반영 (router.refresh())
- [ ] 이미 사진 3장+ 인 카페는 호출 안 함 (조건부 trigger)
- [ ] 404/500 응답 시 에러 UI 노출 X (silent fail)

**커밋**: `feat(cafe-detail): 진입 시 사진 부족하면 enrich-images 자동 호출 (T-CODE-04)`

---

### T-CODE-05. 갤러리에서 googleData.photos 의존 제거 (30m)

**목적**: T-CODE-03 이후 API 응답에서 photos 필드 사라짐. UI 도 일치시켜 코드 정리 + 향후 오용 방지.

**파일**: `src/app/cafes/[id]/CafeDetailClient.tsx`

**변경 (line 143 근처)**:
```ts
// BEFORE
const allPhotos = useMemo(() => [
  ...cafe.photos.map((p) => p.url),
  ...(googleData?.photos?.map((p) => p.url) ?? []),
], [cafe.photos, googleData?.photos]);

// AFTER
const allPhotos = useMemo(() =>
  cafe.photos.map((p) => p.url),
  [cafe.photos],
);
```

**부수 변경**:
- `useGetCafeGoogleReviewsQuery` 의 반환 타입에서 photos 제거 — `src/store/api/cafesApi.ts` 해당 타입 정의 업데이트
- `GoogleReviewsResponse` 등의 타입에서 photos 필드 제거

**DoD**:
- [ ] 갤러리 렌더 동일 (사진 개수 · 순서)
- [ ] TypeScript 통과
- [ ] 꿈꾸는커피 상세 — 사진 중복 없음 확인

**커밋**: `refactor(cafe-detail): 갤러리에서 googleData.photos 의존 제거 (T-CODE-05)`

---

### T-CODE-06. cafes/search 목록에 백그라운드 enrichment (1.5h)

**목적**: 지도 목록 로드 시 썸네일 없는 카페를 fire-and-forget 으로 enrich-images 호출. 다음 로드부터 썸네일 나타남.

**파일**: `src/app/api/cafes/search/route.ts`

**변경 위치**: 응답 직전, `NextResponse.json(result)` 호출 전후.

**구현 스켈레톤**:
```ts
// 응답 반환 직전에 백그라운드 작업 큐잉
const needsEnrichment = cafesWithDistance
  .filter((c) => !c.mainPhoto && c.photos.length === 0)
  .slice(0, 5); // 실행당 최대 5 카페

// fire-and-forget. 응답은 즉시 반환.
if (needsEnrichment.length > 0) {
  Promise.all(
    needsEnrichment.map((c) =>
      fetch(`${process.env.NEXTAUTH_URL}/api/cafes/${c.id}/enrich-images`, {
        method: 'POST',
      }).catch(() => null),
    ),
  ).catch(() => null);
}

await redis.setex(cacheKey, CACHE_TTL.SEARCH, JSON.stringify(result)).catch(() => null);
return NextResponse.json(result);
```

**주의사항**:
- `Promise.all` 은 await 하지 않음 (fire-and-forget)
- NextResponse 반환 후 vercel serverless 환경에서 작업 완료 전 종료될 수 있음 — Edge runtime 아닌 경우 보통 괜찮지만, **Vercel Function 의 `waitUntil` 사용 권장** (Node runtime 에서는 `after` 헬퍼 or 직접 setImmediate)
- 현재 코드 패턴 유지하며 최소 침습. 정확한 Vercel 비동기 패턴은 내부 관례 따르기

**DoD**:
- [ ] 목록 API 응답 지연 증가 없음 (<50ms delta)
- [ ] 백그라운드 호출 후 cafe_photos 에 레코드 증가 확인
- [ ] Redis lock 으로 동일 카페 반복 호출 방지
- [ ] 5개 초과 카페는 enrich 하지 않음 (rate limit 보호)

**커밋**: `feat(api): 카페 목록 응답 후 썸네일 없는 카페 백그라운드 enrich (T-CODE-06)`

---

### T-CODE-07. Photo URL 에서 API KEY 노출 방어 (1.5h, 독립 · 후순위 가능)

**목적**: 현재 `cafe_photos.url` 에 Google API KEY 포함된 URL 저장 중 → 프론트 응답 + DB 에 KEY 노출. referrer 제한으로 방어되지만 근본 해결은 프록시 패턴.

**파일**: `src/app/api/photo/[ref]/route.ts` (신규)

**구현**:
```ts
// GET /api/photo/<photo_reference>
// 서버에서 Google photo API 호출 후 이미지 스트림 또는 302 redirect 반환.
// 클라이언트에는 KEY 노출 안 됨.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const apiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${ref}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

  const res = await fetch(apiUrl, { redirect: 'manual' });
  const location = res.headers.get('location');
  if (location) {
    return NextResponse.redirect(location, 302);
  }
  // 일부 경우 직접 이미지 바이너리 반환
  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=604800', // 7일
    },
  });
}
```

**DB URL 패턴 변경**:
- 저장: `/api/photo/<photo_reference>` (상대 URL)
- 또는 전체: `https://mooda.app/api/photo/<photo_reference>`

**기존 저장된 URL 마이그레이션**:
- Claude Script 협조 필요 — 기존 `sourceType='google'` 레코드의 `url` 을 `/api/photo/<originalUrl>` 형태로 일괄 UPDATE
- 또는 T-CODE-03 시점에 이 URL 패턴으로 저장하기 시작, 기존 레코드는 별도 정리 스크립트 요청

**우선순위**: **Low** — referrer 제한이 이미 적용돼있다면 실질 위험 낮음. T-CODE-01~06 완료 후 보안 감사 시 처리.

**DoD**:
- [ ] /api/photo/<ref> 접근 시 이미지 렌더
- [ ] next.config.ts 의 remotePatterns 에 photo proxy URL 허용
- [ ] 기존 `sourceType='google'` 레코드 URL 마이그레이션 완료 또는 migration 스크립트 준비
- [ ] Cache-Control 헤더 동작 (브라우저 캐시)

**커밋**: `feat(api): Google photo 프록시 route 로 API KEY 노출 방어 (T-CODE-07)`

---

### T-CODE-08. Redis 캐시 무효화 helper 통합 (30m)

**목적**: `cafe:${id}` + `search:*` 무효화 패턴이 enrich-images · google-reviews · cleanup 스크립트 · 치환 스크립트 등에 반복 → 공용 helper 로.

**파일**: `src/lib/redis.ts` 확장 (기존 `redis` · `CACHE_TTL` 아래에 추가)

**추가 함수**:
```ts
export async function invalidateCafeCaches(cafeIds: string[] | string) {
  const ids = Array.isArray(cafeIds) ? cafeIds : [cafeIds];
  if (ids.length === 0) return;

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.del(`cafe:${id}`);
  await pipeline.exec().catch(() => null);
}

export async function invalidateSearchCaches() {
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', 'search:*', 'COUNT', '500');
    cursor = next;
    if (keys.length > 0) await redis.del(...keys).catch(() => null);
  } while (cursor !== '0');
}
```

**사용처 업데이트**:
- `src/app/api/cafes/[id]/google-reviews/route.ts`
- `src/app/api/cafes/[id]/enrich-images/route.ts` (T-CODE-02)
- `src/app/api/cafes/search/route.ts` (필요 시)
- Script 쪽 `fix-naver-thumbnail-urls.ts` · `cleanup-failed-thumbnails.ts` — 인라인 Redis 로직을 lib 호출로 교체 (Claude Script 에 별도 요청 가능)

**DoD**:
- [ ] 함수 2개 export
- [ ] 기존 인라인 invalidation 로직을 API route 에서 호출로 교체
- [ ] Redis 미설정 환경에서도 에러 없이 통과 (기존 noopRedis 패턴 유지)

**커밋**: `refactor(lib): Redis 캐시 무효화 helper 추가 (T-CODE-08)`

---

## 6. 🧪 회귀 & 테스트

### 수동 smoke (Phase 완료 시)
- [ ] 지도 목록 로드 — 응답 시간 before/after 비교, 지연 없음
- [ ] 상세 페이지 진입 (사진 있는 카페) — 갤러리 정상 렌더, 중복 없음
- [ ] 상세 페이지 진입 (사진 없는 카페) — 첫 진입 placeholder, 잠시 후 사진 나타남 (router.refresh)
- [ ] 꿈꾸는커피 상세 — 중복 사라짐 확인 (가장 중요)
- [ ] 네트워크 탭에서 enrich-images POST 확인
- [ ] 동일 카페 상세 여러 탭 동시 오픈 — 409 또는 정상 처리
- [ ] cafe_photos 테이블 — sourceType 분포 확인 (naver / google 비율)

### 비용 / 쿼터 모니터링
- Google Places Console — Details API 호출 수 추이
- Naver 개발자센터 — 이미지검색 일일 사용량
- 24시간 / 일주일 운영 후 비용 그래프 확인. 예상치보다 급증 시 Rate limit 조정

### Redis 캐시 히트율
- `redis-cli info stats` 또는 managed Redis 대시보드에서 hit/miss 비율 확인
- 무효화 빈도가 높으면 캐시 TTL 재조정

---

## 7. ⚙️ 선행 조건 (Claude Script 영역 — 착수 전 요청)

**이 Phase 착수 전에 Claude Script 에게 다음을 요청**:

### Script-ROLLBACK-01: T-07 Google photos 롤백
- Script 가 T-07 시도에서 `cafe_photos` 에 sourceType='google' 레코드 **266장** 저장함 (로컬 DB)
- T-CODE-03 에서 google-reviews route 가 photos 를 upsert 하도록 바뀌므로, 기존 266장은 **URL 포맷이 다름** (maxwidth=1600 vs 새로 저장될 1600 — 일치하지만 일부는 maxwidth=600 으로 예전 테스트 데이터 섞여있을 가능성)
- **선행 요청**: `cafe_photos` 에서 `sourceType='google'` 전체 DELETE + Redis 무효화. 이후 T-CODE-03 이 재수집.
- 또는 유지하되 T-CODE-03 가 upsert 시 @@unique 충돌 무시. **현실적 선택**.

→ **권장**: 유지. @@unique([cafeId, url]) 가 같은 URL 중복 저장 방지, 새 maxwidth 와 저장된 maxwidth 가 동일하면 자연스럽게 skip.

### Script-LIB-01: lib 경로 이동에 협조
- T-CODE-01 에서 `scripts/lib/image-size.ts` · `naver-proxy.ts` 를 `src/lib/image/` 로 이동
- Script 6개 파일의 import 경로 변경 — Claude Code 가 수정 후 Claude Script 에 통지
- 또는 Claude Code 가 직접 scripts/ 도 수정 (본 Phase 에서는 허용 — 파일 이동의 부수 효과)

---

## 8. ✅ Phase 전체 DoD

### 기능
- [ ] T-CODE-01 ~ 06 모두 커밋 랜딩 (T-CODE-07 · 08 선택)
- [ ] 꿈꾸는커피 상세 — 갤러리 중복 해소
- [ ] 사진 없는 카페 상세 진입 → 2-3초 후 사진 나타남
- [ ] 지도 목록에서 썸네일 없던 카페가 재로드 시 점진적으로 나타남

### 빌드 & 타입
- [ ] `npm run build` 통과
- [ ] `prisma generate` 통과
- [ ] Script 쪽도 `npx tsx scripts/check-photos.ts` 정상 동작

### 성능
- [ ] 목록 API 응답 시간 <300ms (기존 대비 +50ms 이하)
- [ ] 상세 API (SSR) 응답 시간 <500ms
- [ ] enrich-images route 자체 응답 <3s (외부 API 포함)

### 비용
- [ ] 24시간 운영 후 Google Places API 사용량 < $5
- [ ] Naver 일일 할당량 < 5,000 건
- [ ] 비정상 폭주 없음 (Rate limit 보호 기능 동작)

---

## 9. 🗺 롤백 & 폴백

### T-CODE-02 (enrich-images) 문제 시
- route 파일 삭제 → 404 반환 → 호출부 (T-CODE-04 · 06) 가 silent fail
- UX 는 현 상태 유지 (사진 부족 카페 placeholder)

### T-CODE-03 (google-reviews photos 통합) 문제 시
- photos 응답 복원: `parseResult` 에서 photos 필드 재포함
- upsertGooglePhotos 제거
- 기존 저장된 sourceType='google' 레코드는 cleanup-failed-thumbnails.ts 유사 패턴으로 DELETE (Claude Script 협조)

### T-CODE-06 (백그라운드 enrichment) 문제 시
- `needsEnrichment` 배열 `.slice(0, 0)` 으로 단축 → 실질 비활성화
- 또는 feature flag 로 토글 (환경변수 `ENABLE_BACKGROUND_ENRICH=false`)

### 외부 API 장애 시
- enrich-images route 는 graceful 하게 `saved=0` 반환 + 에러 로그
- UI 는 placeholder 유지, 사용자에게 에러 노출 X

---

## 10. 📞 막혔을 때

- `PHOTO_PIPELINE_GUIDE.md §13` 결정 대기 항목 발견 시 → 진행 중단, PR 에 `❓` 표시
- lib 경로 이동 후 Script 회귀 발생 → Claude Script 에 핑 (`mooda_review/script_view/` 에 이슈 추가)
- Redis / Google / Naver 쿼터 초과 감지 → rate limit 조정 또는 임시 백그라운드 중단

---

## 📝 완료 기록

### T-CODE-01 — lib 이동 (2026-04-22, 커밋 `fdb4a20`)
- `scripts/lib/image-size.ts` → `src/lib/image/size.ts`
- `scripts/lib/naver-proxy.ts` → `src/lib/image/naver-proxy.ts`
- 5개 script 의 import 경로 `./lib/image-size` · `./lib/naver-proxy` → `../src/lib/image/size` · `../src/lib/image/naver-proxy`
- 병렬 세션의 `./lib/env` 변경은 `git apply --3way` 로 WIP 보존 — 내 커밋에는 섞지 않음
- `pnpm exec tsc --noEmit` + `pnpm build` 통과

### T-CODE-08 — Redis 캐시 무효화 helper (2026-04-22, 커밋 `ead440d`)
- `invalidateCafeCaches(cafeIds)` + `invalidateSearchCaches()` export
- `noopRedis` 에 `pipeline` · `scan` stub 추가 — Redis 미설정 환경에서도 무해하게 no-op
- SCAN MATCH `search:*` COUNT 500 — prod Redis 에서도 블로킹 없음

### T-CODE-02 — enrich-images route (2026-04-22, 커밋 `da69846`)
- `POST /api/cafes/[id]/enrich-images` 신설
- Redis lock(SET NX EX 60s) + recent(1h TTL) + DB photo count ≥ 3 guard
- Naver 이미지 → proxy-origin 추출 → blocklist · 해상도(≥400×300) 검증 → upsert (sourceType=naver)
- Google Details photos → maxwidth=1600 URL → upsert (sourceType=google)
- `invalidateCafeCaches` + 조건부 `invalidateSearchCaches`
- graceful — 외부 API 장애 시 `saved:0` 반환, 5xx 대신 200
- 응답 코드: 204(충분) · 304(최근) · 409(lock) · 404(없음) · 200(성공/부분실패)

### T-CODE-03 — google-reviews photos 통합 (2026-04-22, 커밋 `17b6d81`)
- `buildPhotoUrl` maxwidth 600 → 1600 상향
- `parseResult` 가 `{ view, rawPhotos }` 구조로 반환 — view 는 응답용 (photos 없음), rawPhotos 는 DB upsert 용
- `upsertGooglePhotos(cafeId, rawPhotos)` helper 추가 — `@@unique([cafeId, url])` 충돌 무시
- GET 핸들러가 upsert 후 `invalidateCafeCaches`
- 캐시 저장은 view 만 (photos 없음) → UI 가 `googleData.photos` 참조해도 undefined

### T-CODE-05 — 갤러리 googleData.photos 의존 제거 (2026-04-22, 커밋 `90f01a5`)
- `CafeDetailClient` `allPhotos` = `cafe.photos` 단일 소스
- `GoogleReviewsResponse` 타입에서 `photos` 필드 제거, `GooglePhoto` 인터페이스 삭제
- 꿈꾸는커피 dedup 검증 대기 — T-CODE-03 + 05 조합으로 중복 원천 차단

### T-CODE-04 — 상세 진입 시 auto-enrich (2026-04-22, 커밋 `42fa7f2`)
- `CafeDetailClient` useEffect — `cafe.photos.length < 3` 이면 `POST /api/cafes/<id>/enrich-images`
- 응답 `saved > 0` → `router.refresh()` → 갤러리 반영
- cancel flag 로 언마운트 경쟁 방어. 서버 쪽 Redis recent TTL 이 StrictMode 이중 발화 흡수

### T-CODE-06 — 목록 background enrich (2026-04-22, 커밋 `a7c7131`)
- `cafes/search` route 가 `next/server` `after()` 로 response flush 후 백그라운드 실행
- 썸네일 없는 카페(`!mainPhoto && photos.length === 0`) 최대 5곳 선정 → `/api/cafes/<id>/enrich-images` fire-and-forget
- enrich-images 자체 lock/recent 가 중복 호출 방어

### T-CODE-07 — photo proxy route (⏸ 보류)
- doc §5 우선순위 "Low" + referrer 제한 이미 적용됨
- Phase 종료 후 보안 감사 시 착수 권장

---

**Phase 종료 조건**:
- §8 전체 DoD 체크리스트 전부 통과
- §6 회귀 smoke 전부 통과
- 24시간 운영 후 비용·성능 지표 확인
- `README.md` "📊 현재 상태" 표 갱신
- `mooda_review/plan_append.md` 에 `L. Script Pipeline` 의 "on-demand 이행" 항목 append
