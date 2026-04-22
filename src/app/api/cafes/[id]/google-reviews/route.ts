import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL, invalidateCafeCaches } from '@/lib/redis';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

// T-CODE-03: photo URL maxwidth 를 1600 으로 상향 + photos 는 응답에서 제거.
// UI 갤러리는 cafe_photos 테이블만 읽음 — Google photos 는 여기서 DB 에 upsert.
const GOOGLE_PHOTO_MAX_WIDTH = 1600;

// ── Find Place From Text → placeId 매칭 ──────────────────────────────────
async function findGooglePlaceId(name: string, lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', name);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id');
  url.searchParams.set('locationbias', `circle:500@${lat},${lng}`);
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  const candidates = json.candidates ?? [];
  return candidates.length > 0 ? candidates[0].place_id : null;
}

function buildPhotoUrl(ref: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${GOOGLE_PHOTO_MAX_WIDTH}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`;
}

interface GooglePhotoRaw {
  photo_reference: string;
  width: number;
  height: number;
  html_attributions?: string[];
}

/**
 * Google Details 응답의 photos 를 cafe_photos 테이블에 upsert.
 * UI 는 cafe.photos 만 읽으므로 여기서 저장해두면 다음 렌더에서 동일 URL 로 표시.
 * @@unique([cafeId, url]) 충돌은 이미 저장됨으로 간주하고 무시.
 */
async function upsertGooglePhotos(
  cafeId: string,
  photos: GooglePhotoRaw[],
): Promise<number> {
  if (photos.length === 0) return 0;
  const hasMain = await prisma.cafePhoto.findFirst({
    where: { cafeId, isMain: true },
    select: { id: true },
  });
  let saved = 0;
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (!p.photo_reference) continue;
    try {
      await prisma.cafePhoto.create({
        data: {
          cafeId,
          url: buildPhotoUrl(p.photo_reference),
          originalUrl: p.photo_reference,
          sourceType: 'google',
          width: p.width,
          height: p.height,
          attribution: p.html_attributions?.[0]?.replace(/<[^>]+>/g, '') ?? null,
          isMain: !hasMain && i === 0 && saved === 0,
        },
      });
      saved++;
    } catch (err) {
      if (!(err instanceof Error) || !/Unique constraint/i.test(err.message)) {
        throw err;
      }
    }
  }
  return saved;
}

interface DetailsView {
  reviews: Array<{
    authorName: string;
    authorPhoto: string | undefined;
    rating: number;
    text: string;
    relativeTime: string;
    time: number;
    language: string;
  }>;
  googleRating?: number;
  googleTotalRatings?: number;
}

function parseResult(result: Record<string, unknown>): {
  view: DetailsView;
  rawPhotos: GooglePhotoRaw[];
} {
  const reviews = Array.isArray(result.reviews) ? result.reviews : [];
  const photos = Array.isArray(result.photos) ? result.photos : [];

  const sortedReviews = reviews
    .filter((r: Record<string, unknown>) => r.language === 'ko')
    .map((r: Record<string, unknown>) => ({
      authorName: (r.author_name as string) ?? '',
      authorPhoto: (r.profile_photo_url as string) ?? undefined,
      rating: (r.rating as number) ?? 0,
      text: (r.text as string) ?? '',
      relativeTime: (r.relative_time_description as string) ?? '',
      time: (r.time as number) ?? 0,
      language: (r.language as string) ?? 'ko',
    }))
    .sort((a: { time: number }, b: { time: number }) => b.time - a.time);

  // photos 는 응답에서 제거 — cafe_photos 테이블에만 저장.
  const rawPhotos = (photos as Record<string, unknown>[]).slice(0, 10).map((p) => ({
    photo_reference: p.photo_reference as string,
    width: (p.width as number) ?? 0,
    height: (p.height as number) ?? 0,
    html_attributions: Array.isArray(p.html_attributions)
      ? (p.html_attributions as string[])
      : [],
  }));

  return {
    view: {
      reviews: sortedReviews,
      googleRating: result.rating as number | undefined,
      googleTotalRatings: result.user_ratings_total as number | undefined,
    },
    rawPhotos,
  };
}

async function fetchPlaceDetails(placeId: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'reviews,rating,user_ratings_total,photos');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  return json.result ? parseResult(json.result) : null;
}

// ── 캐시 저장 헬퍼 ─────────────────────────────────────────────────────
async function saveCache(cafeId: string, cacheKey: string, data: Record<string, unknown>) {
  const expiresAt = new Date(Date.now() + CACHE_TTL.GOOGLE_REVIEW * 1000);
  await prisma.googlePlaceCache.create({
    data: { cafeId, data: data as any, expiresAt },
  }).catch(() => null);
  await redis
    .setex(cacheKey, CACHE_TTL.GOOGLE_REVIEW, JSON.stringify(data))
    .catch(() => null);
}

// ── GET Handler ─────────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cafeId } = await params;
    const cacheKey = `google_review:${cafeId}`;

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ reviews: [] });
    }

    // Redis L1 캐시
    const redisCached = await redis.get(cacheKey).catch(() => null);
    if (redisCached) {
      return NextResponse.json(JSON.parse(redisCached));
    }

    // DB L2 캐시
    const dbCache = await prisma.googlePlaceCache.findFirst({
      where: { cafeId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (dbCache) {
      await redis
        .setex(cacheKey, 60 * 60, JSON.stringify(dbCache.data))
        .catch(() => null);
      return NextResponse.json(dbCache.data);
    }

    // 카페 정보 조회
    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: { googlePlaceId: true, name: true, lat: true, lng: true },
    });

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    let placeId = cafe.googlePlaceId;

    // googlePlaceId 없으면 실시간 매칭 시도
    if (!placeId) {
      placeId = await findGooglePlaceId(cafe.name, cafe.lat, cafe.lng);

      if (placeId) {
        // 매칭된 placeId DB에 저장 (다음부터는 바로 사용)
        await prisma.cafe.update({
          where: { id: cafeId },
          data: { googlePlaceId: placeId },
        }).catch(() => null);
      } else {
        // 매칭 실패 → 빈 결과 캐싱 (반복 호출 방지, 24시간)
        const emptyData = { reviews: [] };
        const emptyExpires = new Date(Date.now() + 60 * 60 * 24 * 1000);
        await prisma.googlePlaceCache.create({
          data: { cafeId, data: emptyData as any, expiresAt: emptyExpires },
        }).catch(() => null);
        await redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(emptyData)).catch(() => null);
        return NextResponse.json(emptyData);
      }
    }

    // Place Details API → 리뷰 + photos (photos 는 cafe_photos 로 upsert)
    const details = await fetchPlaceDetails(placeId);

    if (!details) {
      return NextResponse.json({ reviews: [] });
    }

    const { view, rawPhotos } = details;

    // T-CODE-03: photos 는 응답에 포함하지 않고 cafe_photos 에 저장.
    // UI 갤러리는 cafe.photos 만 읽음 → 중복 노출 원천 차단.
    if (rawPhotos.length > 0) {
      const savedCount = await upsertGooglePhotos(cafeId, rawPhotos);
      if (savedCount > 0) {
        await invalidateCafeCaches(cafeId);
      }
    }

    // 캐시 저장 (7일) — view 만 (photos 없음)
    await saveCache(cafeId, cacheKey, view as unknown as Record<string, unknown>);

    return NextResponse.json(view);
  } catch (error) {
    console.error('GET /api/cafes/[id]/google-reviews error:', error);
    return NextResponse.json({ reviews: [] });
  }
}
