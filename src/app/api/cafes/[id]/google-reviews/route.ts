import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL } from '@/lib/redis';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

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

// ── Place Details → reviews, rating, photos ─────────────────────────────
function buildPhotoUrl(ref: string, maxWidth = 600) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`;
}

function parseResult(result: Record<string, unknown>) {
  const reviews = Array.isArray(result.reviews) ? result.reviews : [];
  const photos = Array.isArray(result.photos) ? result.photos : [];

  // 한국어 리뷰만 + 최신순 정렬
  const sortedReviews = reviews
    .filter((r: Record<string, unknown>) => r.language === 'ko')
    .map((r: Record<string, unknown>) => ({
      authorName: r.author_name ?? '',
      authorPhoto: r.profile_photo_url ?? undefined,
      rating: r.rating ?? 0,
      text: r.text ?? '',
      relativeTime: r.relative_time_description ?? '',
      time: (r.time as number) ?? 0,
      language: r.language ?? 'ko',
    }))
    .sort((a: { time: number }, b: { time: number }) => b.time - a.time);

  const photoUrls = photos
    .slice(0, 10)
    .map((p: Record<string, unknown>) => ({
      url: buildPhotoUrl(p.photo_reference as string),
      width: p.width as number,
      height: p.height as number,
      attributions: Array.isArray(p.html_attributions) ? p.html_attributions : [],
    }));

  return {
    reviews: sortedReviews,
    photos: photoUrls,
    googleRating: result.rating ?? undefined,
    googleTotalRatings: result.user_ratings_total ?? undefined,
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

    // Place Details API → 리뷰 가져오기
    const data = await fetchPlaceDetails(placeId);

    if (!data) {
      return NextResponse.json({ reviews: [] });
    }

    // 캐시 저장 (7일)
    await saveCache(cafeId, cacheKey, data as unknown as Record<string, unknown>);

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/cafes/[id]/google-reviews error:', error);
    return NextResponse.json({ reviews: [] });
  }
}
