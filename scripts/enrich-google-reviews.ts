/**
 * Google Places 리뷰 수집 스크립트
 *
 * Phase 1: Find Place From Text API → googlePlaceId 매칭
 * Phase 2: Place Details API → reviews, rating 수집
 *
 * 실행:
 *   DATABASE_URL="..." GOOGLE_PLACES_API_KEY="..." \
 *   npx tsx scripts/enrich-google-reviews.ts
 *
 * 옵션:
 *   --match-only    placeId 매칭만 (리뷰 수집 안 함)
 *   --reviews-only  placeId 있는 카페만 리뷰 수집
 *   --force         이미 수집된 카페도 재수집
 *   --limit=50      처리 카페 수 제한 (테스트용)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

const MATCH_ONLY = process.argv.includes('--match-only');
const REVIEWS_ONLY = process.argv.includes('--reviews-only');
const FORCE = process.argv.includes('--force');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : undefined;

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Phase 1: Find Place ─────────────────────────────────────────────────

interface FindPlaceResult {
  placeId: string | null;
  status: string;
}

async function findGooglePlaceId(cafeName: string, lat: number, lng: number, neighborhood?: string | null): Promise<FindPlaceResult> {
  // 지역명 포함하여 검색 정확도 향상
  const input = neighborhood ? `${neighborhood} ${cafeName}` : cafeName;
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', input);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id,name,formatted_address');
  url.searchParams.set('locationbias', `circle:2000@${lat},${lng}`);
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return { placeId: null, status: `HTTP_${res.status}` };

  const json = await res.json();
  const status = json.status ?? 'UNKNOWN';

  // 할당량 초과 또는 API 거부 시 상태 반환
  if (status === 'OVER_QUERY_LIMIT' || status === 'REQUEST_DENIED') {
    return { placeId: null, status };
  }

  const candidates = json.candidates ?? [];
  return { placeId: candidates.length > 0 ? candidates[0].place_id : null, status };
}

// ─── Phase 2: Place Details ──────────────────────────────────────────────

interface GoogleReviewRaw {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  relative_time_description: string;
  time: number;
  language?: string;
}

interface FetchReviewsResult {
  reviews: Array<{
    authorName: string;
    authorPhoto?: string;
    rating: number;
    text: string;
    relativeTime: string;
    time: number;
    language: string;
  }>;
  googleRating?: number;
  googleTotalRatings?: number;
  status: string;
}

async function fetchGoogleReviews(placeId: string): Promise<FetchReviewsResult | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'reviews,rating,user_ratings_total');
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  const status = json.status ?? 'UNKNOWN';

  if (status === 'OVER_QUERY_LIMIT' || status === 'REQUEST_DENIED') {
    return { reviews: [], status, googleRating: undefined, googleTotalRatings: undefined };
  }

  const result = json.result ?? {};

  return {
    reviews: (result.reviews ?? []).map((r: GoogleReviewRaw) => ({
      authorName: r.author_name ?? '',
      authorPhoto: r.profile_photo_url ?? undefined,
      rating: r.rating ?? 0,
      text: r.text ?? '',
      relativeTime: r.relative_time_description ?? '',
      time: r.time ?? 0,
      language: r.language ?? 'ko',
    })),
    googleRating: result.rating ?? undefined,
    googleTotalRatings: result.user_ratings_total ?? undefined,
    status,
  };
}

// ─── 메인 ────────────────────────────────────────────────────────────────

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY 환경변수를 설정해주세요.');
    process.exit(1);
  }

  const cafes = await prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      neighborhood: true,
      district: true,
      googlePlaceId: true,
    },
    orderBy: { reviewCount: 'desc' },
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(`🚀 Google Places 리뷰 수집 시작`);
  console.log(`   총 ${cafes.length}개 카페`);
  console.log(`   매칭: ${REVIEWS_ONLY ? '⏭ 건너뜀' : '✅'}  |  리뷰: ${MATCH_ONLY ? '⏭ 건너뜀' : '✅'}  |  강제: ${FORCE ? '✅' : '❌'}`);

  let matched = 0;
  let matchSkipped = 0;
  let reviewSaved = 0;
  let reviewSkipped = 0;
  let apiCalls = 0;
  let quotaExceeded = false;

  for (let i = 0; i < cafes.length && !quotaExceeded; i++) {
    const cafe = cafes[i];
    const prefix = `  [${i + 1}/${cafes.length}] ${cafe.name}`;
    const parts: string[] = [];

    // ── Phase 1: placeId 매칭 ──────────────────────────────────────────
    if (!REVIEWS_ONLY) {
      if (cafe.googlePlaceId && !FORCE) {
        matchSkipped++;
        parts.push(`🔗 placeId 있음`);
      } else {
        try {
          const result = await findGooglePlaceId(cafe.name, cafe.lat, cafe.lng, cafe.neighborhood);
          apiCalls++;
          await sleep(150);

          if (result.status === 'OVER_QUERY_LIMIT') {
            console.error(`\n🚨 Google API 일일 할당량 초과! 내일 다시 실행해주세요.`);
            console.log(`   현재까지 매칭 성공: ${matched}개 / API 호출: ${apiCalls}건`);
            quotaExceeded = true; break;
          }
          if (result.status === 'REQUEST_DENIED') {
            console.error(`\n🚨 Google API 요청 거부! API 키와 billing 설정을 확인해주세요.`);
            quotaExceeded = true; break;
          }

          if (result.placeId) {
            await prisma.cafe.update({
              where: { id: cafe.id },
              data: { googlePlaceId: result.placeId },
            });
            cafe.googlePlaceId = result.placeId;
            matched++;
            parts.push(`🔗 매칭 성공`);
          } else {
            parts.push(`🔗 매칭 실패`);
          }
        } catch (err) {
          parts.push(`🔗 오류`);
          console.error(`${prefix} 매칭 오류:`, err instanceof Error ? err.message : err);
        }
      }
    }

    // ── Phase 2: 리뷰 수집 ─────────────────────────────────────────────
    if (!MATCH_ONLY && cafe.googlePlaceId) {
      // 유효한 캐시 확인
      const existing = FORCE
        ? null
        : await prisma.googlePlaceCache.findFirst({
            where: { cafeId: cafe.id, expiresAt: { gt: new Date() } },
          });

      if (existing) {
        reviewSkipped++;
        parts.push(`📝 캐시 유효`);
      } else {
        try {
          const data = await fetchGoogleReviews(cafe.googlePlaceId);
          apiCalls++;
          await sleep(150);

          if (data?.status === 'OVER_QUERY_LIMIT') {
            console.error(`\n🚨 Google API 일일 할당량 초과! 내일 다시 실행해주세요.`);
            console.log(`   현재까지 리뷰 저장: ${reviewSaved}개 / API 호출: ${apiCalls}건`);
            quotaExceeded = true; break;
          }
          if (data?.status === 'REQUEST_DENIED') {
            console.error(`\n🚨 Google API 요청 거부! API 키와 billing 설정을 확인해주세요.`);
            quotaExceeded = true; break;
          }

          if (data && data.reviews.length > 0) {
            if (FORCE) {
              await prisma.googlePlaceCache.deleteMany({ where: { cafeId: cafe.id } });
            }

            await prisma.googlePlaceCache.create({
              data: {
                cafeId: cafe.id,
                data: data as unknown as Record<string, unknown>,
                expiresAt: new Date(Date.now() + CACHE_TTL_MS),
              },
            });

            reviewSaved++;
            parts.push(`📝 리뷰 ${data.reviews.length}건 (⭐${data.googleRating ?? '-'})`);
          } else {
            parts.push(`📝 리뷰 없음`);
          }
        } catch (err) {
          parts.push(`📝 오류`);
          console.error(`${prefix} 리뷰 오류:`, err instanceof Error ? err.message : err);
        }
      }
    }

    console.log(`${prefix} — ${parts.join('  ')}`);

    // 50건마다 중간 통계
    if ((i + 1) % 50 === 0) {
      console.log(`\n  ── 중간 통계 (${i + 1}/${cafes.length}) | API 호출: ${apiCalls}건 ──`);
      if (!REVIEWS_ONLY) console.log(`  매칭 성공: ${matched} / 스킵: ${matchSkipped}`);
      if (!MATCH_ONLY) console.log(`  리뷰 저장: ${reviewSaved} / 스킵: ${reviewSkipped}`);
      console.log();
    }
  }

  // ─── 최종 통계 ─────────────────────────────────────────────────────────
  const totalCached = await prisma.googlePlaceCache.count();
  const totalMatched = await prisma.cafe.count({ where: { googlePlaceId: { not: null } } });

  console.log('\n========================================');
  console.log('✅ Google Places 수집 완료!');
  console.log(`  API 호출: ${apiCalls}건`);
  if (!REVIEWS_ONLY) console.log(`  매칭 성공: ${matched}개 / 스킵: ${matchSkipped}개`);
  if (!MATCH_ONLY) console.log(`  리뷰 저장: ${reviewSaved}개 / 스킵: ${reviewSkipped}개`);
  console.log(`  DB 전체 placeId 매칭: ${totalMatched}개`);
  console.log(`  DB 전체 캐시: ${totalCached}건`);
  console.log('========================================');
}

main()
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
