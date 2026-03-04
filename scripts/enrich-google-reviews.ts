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

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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

async function findGooglePlaceId(cafeName: string, lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', cafeName);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id,name,formatted_address');
  url.searchParams.set('locationbias', `circle:500@${lat},${lng}`);
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  const candidates = json.candidates ?? [];
  return candidates.length > 0 ? candidates[0].place_id : null;
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

async function fetchGoogleReviews(placeId: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'reviews,rating,user_ratings_total');
  url.searchParams.set('language', 'ko');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
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

  for (let i = 0; i < cafes.length; i++) {
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
          const placeId = await findGooglePlaceId(cafe.name, cafe.lat, cafe.lng);
          apiCalls++;
          await sleep(150);

          if (placeId) {
            await prisma.cafe.update({
              where: { id: cafe.id },
              data: { googlePlaceId: placeId },
            });
            cafe.googlePlaceId = placeId;
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

          if (data && data.reviews.length > 0) {
            // 기존 캐시 삭제
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
