import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  redis,
  invalidateCafeCaches,
  invalidateSearchCaches,
} from '@/lib/redis';
import { batchFetchDimensions } from '@/lib/image/size';
import {
  extractNaverProxyOrigin,
  isBlockedHost,
} from '@/lib/image/naver-proxy';

/**
 * ── POST /api/cafes/[id]/enrich-images ─────────────────────────────────
 *
 * 상세 페이지 진입 · 목록 background 에서 공용으로 호출하는 on-demand 사진
 * 수집 route. Naver 이미지 검색 + Google Details photos 를 cafe_photos 에
 * UPSERT 하고 Redis 캐시 무효화한다. 응답은 graceful — 외부 API 실패 시
 * `saved: 0` 반환 + 로그. UI 는 placeholder 유지.
 *
 * 흐름:
 *   1) Redis lock(SET NX + TTL) — 동일 카페 동시 요청 차단 (409)
 *   2) Redis recent — 최근 TTL 내 수집 완료면 스킵 (304)
 *   3) DB 현재 사진 수 >= TARGET 이면 스킵 (204)
 *   4) Naver 이미지 검색 → proxy-origin 추출 → blocklist · 해상도 검증 → upsert
 *   5) Google Details 응답 photos → maxwidth=1600 URL 로 upsert
 *   6) Redis cafe:<id> + search:* 무효화
 *   7) summary 응답
 *
 * 환경변수: NAVER_CLIENT_ID · NAVER_CLIENT_SECRET · GOOGLE_PLACES_API_KEY
 * ────────────────────────────────────────────────────────────────────────
 */

const TARGET_PHOTOS = 3;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const LOCK_TTL_SEC = 60;
const RECENT_TTL_SEC = 60 * 60; // 1시간
const NAVER_DISPLAY = 5;
const GOOGLE_MAX_WIDTH = 1600;

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID ?? '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET ?? '';
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';

interface NaverImageItem {
  title: string;
  link: string;
  thumbnail: string;
  sizeheight: string;
  sizewidth: string;
}

interface GooglePhotoRaw {
  photo_reference: string;
  width: number;
  height: number;
  html_attributions?: string[];
}

async function fetchNaverImages(name: string, neighborhood: string): Promise<NaverImageItem[]> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  const query = encodeURIComponent(`${neighborhood} ${name} 카페 내부`);
  const url = `https://openapi.naver.com/v1/search/image.json?query=${query}&display=${NAVER_DISPLAY}&sort=sim&filter=large`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: NaverImageItem[] };
    return json.items ?? [];
  } catch {
    return [];
  }
}

async function fetchGooglePhotos(placeId: string): Promise<GooglePhotoRaw[]> {
  if (!GOOGLE_API_KEY) return [];
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'photos');
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const json = await res.json();
    const photos = Array.isArray(json?.result?.photos) ? json.result.photos : [];
    return photos as GooglePhotoRaw[];
  } catch {
    return [];
  }
}

function buildGooglePhotoUrl(ref: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${GOOGLE_MAX_WIDTH}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: cafeId } = await params;

  const cafe = await prisma.cafe.findUnique({
    where: { id: cafeId },
    select: {
      id: true,
      name: true,
      neighborhood: true,
      district: true,
      googlePlaceId: true,
      _count: { select: { photos: true } },
    },
  });
  if (!cafe) {
    return NextResponse.json({ error: 'cafe not found' }, { status: 404 });
  }

  // 이미 충분하면 외부 호출 없이 스킵
  if (cafe._count.photos >= TARGET_PHOTOS) {
    return new NextResponse(null, { status: 204 });
  }

  const lockKey = `enrich:lock:${cafeId}`;
  const recentKey = `enrich:recent:${cafeId}`;

  // 최근 수집 체크
  const recent = await redis.get(recentKey).catch(() => null);
  if (recent) {
    return new NextResponse(null, { status: 304 });
  }

  // Lock 획득 — SET NX EX. noopRedis 환경에서는 set 이 'OK' 를 반환하므로 항상 진입
  // (로컬 단일 프로세스 전제), 분산 락이 필요한 프로덕션 환경은 REDIS_* 설정 필요.
  const locked = await redis
    .set(lockKey, '1', 'EX', LOCK_TTL_SEC, 'NX')
    .catch(() => null);
  if (locked !== 'OK' && process.env.REDIS_HOST) {
    return NextResponse.json(
      { error: 'another enrichment in progress' },
      { status: 409 },
    );
  }

  let savedNaver = 0;
  let savedGoogle = 0;

  try {
    const neighborhood = cafe.neighborhood ?? cafe.district ?? '';

    // ── (a) Naver 이미지 ──────────────────────────────────────────────
    const naverItems = await fetchNaverImages(cafe.name, neighborhood);
    const candidates = naverItems
      .filter((img) => img.link && img.link.startsWith('http'))
      .map((img) => {
        const origin = extractNaverProxyOrigin(img.link) ?? img.link;
        return {
          url: origin,
          originalUrl: origin === img.link ? null : img.link,
          caption: img.title.replace(/<[^>]+>/g, '').slice(0, 100) || null,
        };
      })
      .filter((c) => !isBlockedHost(c.url));

    if (candidates.length > 0) {
      const dims = await batchFetchDimensions(
        candidates.map((c) => c.url),
        5,
        { timeoutMs: 8000 },
      );
      const dimByUrl = new Map(dims.map((d) => [d.url, d]));

      const validated = candidates.filter((c) => {
        const d = dimByUrl.get(c.url);
        if (!d || typeof d.status !== 'number') return false;
        if (d.status < 200 || d.status >= 400) return false;
        if (!d.width || !d.height) return false;
        if (d.width < MIN_WIDTH || d.height < MIN_HEIGHT) return false;
        return true;
      });

      const hasMain = await prisma.cafePhoto.findFirst({
        where: { cafeId, isMain: true },
        select: { id: true },
      });

      const toInsert = validated.slice(0, TARGET_PHOTOS);
      for (let i = 0; i < toInsert.length; i++) {
        const c = toInsert[i];
        const d = dimByUrl.get(c.url)!;
        try {
          await prisma.cafePhoto.create({
            data: {
              cafeId,
              url: c.url,
              originalUrl: c.originalUrl,
              sourceType: 'naver',
              width: d.width,
              height: d.height,
              fileSize: d.contentLength,
              caption: c.caption,
              isMain: !hasMain && i === 0,
            },
          });
          savedNaver++;
        } catch (err) {
          // @@unique([cafeId, url]) 충돌은 이미 있음 — 무시
          if (!(err instanceof Error) || !/Unique constraint/i.test(err.message)) {
            throw err;
          }
        }
      }
    }

    // ── (b) Google Places photos ─────────────────────────────────────
    if (cafe.googlePlaceId && GOOGLE_API_KEY) {
      const googlePhotos = await fetchGooglePhotos(cafe.googlePlaceId);
      const hasMainNow = savedNaver > 0
        ? true
        : Boolean(
            await prisma.cafePhoto.findFirst({
              where: { cafeId, isMain: true },
              select: { id: true },
            }),
          );

      for (let i = 0; i < googlePhotos.length; i++) {
        const p = googlePhotos[i];
        if (!p.photo_reference) continue;
        const url = buildGooglePhotoUrl(p.photo_reference);
        try {
          await prisma.cafePhoto.create({
            data: {
              cafeId,
              url,
              originalUrl: p.photo_reference,
              sourceType: 'google',
              width: p.width,
              height: p.height,
              attribution: p.html_attributions?.[0]?.replace(/<[^>]+>/g, '') ?? null,
              isMain: !hasMainNow && i === 0,
            },
          });
          savedGoogle++;
        } catch (err) {
          if (!(err instanceof Error) || !/Unique constraint/i.test(err.message)) {
            throw err;
          }
        }
      }
    }

    const totalSaved = savedNaver + savedGoogle;

    // 최근 수집 기록 — 다음 TTL 내에는 재호출해도 304
    if (totalSaved > 0 || cafe.googlePlaceId) {
      await redis
        .setex(recentKey, RECENT_TTL_SEC, String(Date.now()))
        .catch(() => null);
    }

    // 캐시 무효화 — cafe:<id> 만. search:* 는 목록이 사진을 직접 참조하지
    // 않는 설계가 기본이지만, 썸네일 노출 경로가 있다면 invalidateSearchCaches 호출.
    await invalidateCafeCaches(cafeId);
    if (totalSaved > 0) {
      await invalidateSearchCaches();
    }

    return NextResponse.json({
      saved: totalSaved,
      sources: { naver: savedNaver, google: savedGoogle },
    });
  } catch (err) {
    console.error('POST /api/cafes/[id]/enrich-images error:', err);
    // graceful — UI 는 placeholder 유지. 5xx 대신 200 + saved=0
    return NextResponse.json({
      saved: 0,
      sources: { naver: savedNaver, google: savedGoogle },
      error: 'partial failure',
    });
  } finally {
    await redis.del(lockKey).catch(() => null);
  }
}
