# 04. State, API, Performance

Redux/RTK Query · SSR/CSR · 에러 · 오프라인 가이드.

---

## 상태 분리 (ISSUE-13)

### 규칙
- **서버 상태 = RTK Query 전담** (cafes, nearby, reviews, votes, tags, search)
- **UI/세션 상태 = slice**
  - `mapSlice`: mapCenter, mapZoom, mapBounds, mapViewMode, selectedCafeId
  - `filterSlice`: activeTags, sortOrder, searchKeyword
  - `sheetSlice`: bottomSheetSnap ('peek' | 'half' | 'full')
  - `sessionSlice`: recentSearches (localStorage persist)

slice에 `isLoading` · `error` · 배열 캐시 **금지**.

### 마이그레이션 스텝
1. 현재 `cafeSlice` 내 서버 관련 필드 모두 제거
2. 사용처를 `useGetCafesQuery()` · `useGetNearbyCafesQuery()` 훅으로 교체
3. 선택/중심 등 UI 전용 필드만 남기기
4. `redux-persist`는 session/filter만 대상 (mapCenter는 제외 — 항상 현재 위치 기반)

---

## RTK Query 튜닝 (ISSUE-03)

### 현재 문제
bounds/center 변경마다 재페치 → 모바일 데이터 소진. 살짝만 드래그해도 새 키 → 새 요청.

### 해법
```ts
import Geohash from 'ngeohash';

export const cafeApi = createApi({
  reducerPath: 'cafeApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Cafe', 'Nearby', 'Vote'],
  endpoints: (b) => ({
    getNearbyCafes: b.query<Cafe[], { lat: number; lng: number; zoom: number; tags: string[] }>({
      query: ({ lat, lng, zoom, tags }) => ({
        url: '/cafes/nearby',
        params: {
          // 1) geohash 6자리 버킷 — 약 1.2km × 0.6km 셀로 양자화
          bucket: Geohash.encode(lat, lng, 6),
          zoom, tags: tags.join(','),
        },
      }),
      // 2) 캐시 유지 — 뒤로 올 때 재요청 방지
      keepUnusedDataFor: 120,
      providesTags: (result) => [
        'Nearby',
        ...(result?.map(c => ({ type: 'Cafe' as const, id: c.id })) ?? []),
      ],
    }),
  }),
});
```

### 자동 페치 끄기
- `useGetNearbyCafesQuery`의 `skip: true` 옵션으로 기본 OFF
- "이 지역 재검색" 버튼이 `refetch()` 트리거
- 혹은 `useLazyGetNearbyCafesQuery` 사용

### Debounce
```ts
// src/hooks/useDebouncedMapBounds.ts
export function useDebouncedMapBounds(delay = 300) {
  const bounds = useAppSelector(s => s.map.bounds);
  const [debounced, setDebounced] = useState(bounds);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(bounds), delay);
    return () => clearTimeout(t);
  }, [bounds, delay]);
  return debounced;
}
```

### 옵티미스틱 투표 (ISSUE-10)
```ts
voteMood: b.mutation<void, { cafeId: string; tagId: string }>({
  query: ({ cafeId, tagId }) => ({ url: `/cafes/${cafeId}/votes`, method: 'POST', body: { tagId } }),
  async onQueryStarted({ cafeId, tagId }, { dispatch, queryFulfilled }) {
    const patch = dispatch(
      cafeApi.util.updateQueryData('getCafe', cafeId, (draft) => {
        const t = draft.tags.find(x => x.id === tagId);
        if (t) { t.voted = true; t.count += 1; }
      })
    );
    try { await queryFulfilled; }
    catch { patch.undo(); /* trigger shake + toast */ }
  },
}),
```

---

## Kakao SDK 전역 로드 (ISSUE-04)

### `app/layout.tsx`
```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Script
          id="kakao-map-sdk"
          strategy="afterInteractive"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false&libraries=services,clusterer`}
          onLoad={() => { window.kakao.maps.load(() => {}); }}
        />
      </body>
    </html>
  );
}
```

### CafeMap.tsx
```tsx
'use client';
import dynamic from 'next/dynamic';

// ssr:false 로 서버에서는 아예 생성 안 함
export const CafeMap = dynamic(() => import('./CafeMapImpl'), { ssr: false, loading: () => <MapSkeleton/> });
```

### 리스너 정리
```ts
useEffect(() => {
  if (!mapRef.current) return;
  const h = kakao.maps.event.addListener(mapRef.current, 'bounds_changed', onChange);
  return () => kakao.maps.event.removeListener(mapRef.current, 'bounds_changed', h);
}, [onChange]);
```

### 맵 인스턴스 유지
- `/map` → `/cafes/[id]`로 이동 시 맵이 언마운트되지 않게 — parallel route 또는 `<div hidden={path !== '/map'}>` 패턴
- 가장 간단: `/cafes/[id]`를 intercepting route `@modal`로 띄우고, 맵은 뒤에 계속 유지

---

## 에러 · 로딩 · 스켈레톤 (ISSUE-11, 12)

### RTK Query global error
```ts
// src/store/errorMiddleware.ts
export const errorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const status = action.payload?.status;
    if (status === 401) dispatch(sessionExpired());
    else if (status >= 500) toast.error('서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
  }
  return next(action);
};
```

### 위치별 error UI
| 위치 | 컴포넌트 | 메시지 |
|---|---|---|
| 지도 nearby 실패 | `<ErrorState variant="banner" onRetry/>` | "주변 카페를 불러오지 못했어요" |
| 상세 fetch 실패 | `<ErrorState variant="block" onRetry/>` | "이 카페 정보를 불러올 수 없어요" |
| 투표 실패 | 인라인 shake + toast | "투표에 실패했어요. 다시 눌러주세요" |
| 네트워크 없음 | 전역 배너 | "오프라인 상태 · 저장된 카페만 볼 수 있어요" |

### 스켈레톤 loading.tsx
- `app/cafes/[id]/loading.tsx`
- `app/map/loading.tsx`
- `app/search/loading.tsx`
- 모든 히어로/카드 영역은 `Skeleton` 컴포넌트로 정확한 사이즈 블록

---

## PWA 오프라인 (ISSUE-26)

### Workbox 전략
```js
// public/sw.js (혹은 next-pwa 사용 시 workbox config)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST);

// 정적 (fonts, icons, js, css)
registerRoute(({ request }) => ['style','script','font','image'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'static-v1' }));

// API — nearby/search
registerRoute(({ url }) => url.pathname.startsWith('/api/cafes/'),
  new NetworkFirst({
    cacheName: 'cafe-api-v1',
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 })],
  }));

// 카페 상세 — 최근 본 카페
registerRoute(({ url }) => /^\/api\/cafes\/[^/]+$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'cafe-detail-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60*60*24*7 })],
  }));
```

### 오프라인 fallback
- `app/offline/page.tsx` — 저장한(heart 된) 카페 로컬스토리지 목록 보여주기
- SW 업데이트 토스트 구현 (`controllerchange` 리스너)

---

## SSR/CSR 경계

### 권장 구성
- **Server Component**: `/cafes/[id]/page.tsx` — Prisma로 기본 정보 fetch, Metadata 생성 (OG, title)
- **Client Component**: 맵, 투표, 바텀시트, 인터랙션
- 데이터는 RSC로 받아 `<CafeClient initialData={...} />`로 내려주고, 클라이언트에서 RTK Query `initialData` 주입

```tsx
// page.tsx (Server)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id }, include: { tags: true } });
  return <CafeClient id={id} initialData={cafe} />;
}
```

```tsx
// CafeClient.tsx (Client)
'use client';
export function CafeClient({ id, initialData }: { id: string; initialData: Cafe }) {
  const { data } = useGetCafeQuery(id, { /* initialData via skipToken or prefetch */ });
  // ...
}
```

### 주의
- Prisma는 Server에서만. `src/lib/db.ts`에 `'server-only'` 가드.
- 클라이언트에 민감한 env는 내리지 말 것. `NEXT_PUBLIC_*`만.
- `'use client'` 컴포넌트 안에서는 RSC `async` 금지.

---

## 성능 체크리스트

- [ ] Next.js image optimization (`next/image`) — 카페 사진 `sizes` 적절히
- [ ] 폰트: `next/font` 사용, Pretendard Variable subsets
- [ ] 번들: `@next/bundle-analyzer`로 확인, vendor 분리
- [ ] 지도 렌더 FPS: 화면 외 마커는 생성하지 않음
- [ ] React re-render: `selectCafeById` 메모화, `useMemo` 필터 계산
- [ ] Turbopack + Next.js 16 기본 설정 유지
