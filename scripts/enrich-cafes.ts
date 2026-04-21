/**
 * 카페 이미지 + 블로그 리뷰 자동 수집
 *
 * 동작:
 *   1. 네이버 이미지 검색 API → 카페 대표사진 3장 → cafe_photos 테이블 저장
 *   2. 네이버 블로그 검색 API → 블로그 후기 10건 → naver_blog_cache 테이블 저장
 *
 * 실행:
 *   DATABASE_URL="..." NAVER_CLIENT_ID="..." NAVER_CLIENT_SECRET="..." \
 *   npx tsx scripts/enrich-cafes.ts
 *
 * 옵션:
 *   --images-only   이미지만 수집
 *   --blogs-only    블로그만 수집
 *   --force         이미 수집된 카페도 재수집
 *   --limit=50      처리 카페 수 제한 (테스트용)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { batchFetchDimensions } from './lib/image-size';
import { extractNaverProxyOrigin, isBlockedHost } from './lib/naver-proxy';

const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

const DO_IMAGES = !process.argv.includes('--blogs-only');
const DO_BLOGS = !process.argv.includes('--images-only');
const FORCE = process.argv.includes('--force');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : undefined;

// 블로그 캐시 유효 기간: 7일
const BLOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 이미지 검증 임계 — UI 렌더 시 최소 품질 보장 (T-SCRIPT-05)
const MIN_IMAGE_WIDTH = 400;
const MIN_IMAGE_HEIGHT = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── 네이버 이미지 검색 ────────────────────────────────────────────────────

interface NaverImageItem {
  title: string;
  link: string;
  thumbnail: string;
  sizeheight: string;
  sizewidth: string;
}

async function fetchCafeImages(cafeName: string, neighborhood: string): Promise<NaverImageItem[]> {
  // "지역 카페명 카페 내부" — 인테리어/내부 사진 위주로 검색
  const query = encodeURIComponent(`${neighborhood} ${cafeName} 카페 내부`);
  const url = `https://openapi.naver.com/v1/search/image.json?query=${query}&display=5&sort=sim&filter=large`;

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) return [];
  const json = await res.json() as { items?: NaverImageItem[] };
  return json.items ?? [];
}

// ─── 네이버 블로그 검색 ────────────────────────────────────────────────────

interface NaverBlogItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
}

async function fetchCafeBlogs(cafeName: string, neighborhood: string): Promise<NaverBlogItem[]> {
  const query = encodeURIComponent(`${neighborhood} ${cafeName} 카페`);
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=10&sort=sim`;

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) return [];
  const json = await res.json() as { items?: NaverBlogItem[] };
  return json.items ?? [];
}

// ─── 메인 ─────────────────────────────────────────────────────────────────

async function main() {
  if (!NAVER_CLIENT_ID || NAVER_CLIENT_ID === 'your_naver_client_id') {
    console.error('❌ NAVER_CLIENT_ID 환경변수를 설정해주세요.');
    process.exit(1);
  }

  const cafes = await prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      neighborhood: true,
      district: true,
      _count: { select: { photos: true } },
    },
    orderBy: { name: 'asc' },
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(`🚀 카페 이미지 + 블로그 수집 시작`);
  console.log(`   총 ${cafes.length}개 카페`);
  console.log(`   이미지: ${DO_IMAGES ? '✅' : '⏭ 건너뜀'}  |  블로그: ${DO_BLOGS ? '✅' : '⏭ 건너뜀'}  |  강제: ${FORCE ? '✅' : '❌'}`);
  const reqPerCafe = (DO_IMAGES ? 1 : 0) + (DO_BLOGS ? 1 : 0);
  console.log(`   예상 소요: 약 ${Math.ceil(cafes.length * reqPerCafe * 0.15 / 60)}분\n`);

  let imgSaved = 0;
  let imgSkipped = 0;
  let blogSaved = 0;
  let blogSkipped = 0;

  for (let i = 0; i < cafes.length; i++) {
    const cafe = cafes[i];
    const neighborhood = cafe.neighborhood ?? cafe.district ?? '';
    const prefix = `  [${i + 1}/${cafes.length}] ${cafe.name}`;

    const parts: string[] = [];

    // ── 이미지 수집 (T-SCRIPT-05 개정) ──────────────────────────────────
    //
    // 변경 요약 vs 구 버전:
    //   1. img.link 가 search.pstatic.net 프록시(150px 썸네일) 면
    //      extractNaverProxyOrigin 으로 원본 URL 추출
    //   2. 원본 URL 병렬 HEAD + 해상도 실측 (Range 64KB) → 200 + image/* 만 통과
    //   3. MIN_IMAGE_WIDTH/HEIGHT 임계 미달 · BLOCKED_HOSTS 드롭
    //   4. createMany 대신 개별 create — width/height/fileSize/sourceType 채움
    //   5. @@unique([cafeId, url]) 충돌 은 무시 (이미 있음)
    if (DO_IMAGES) {
      const hasPhotos = cafe._count.photos > 0;

      if (hasPhotos && !FORCE) {
        imgSkipped++;
        parts.push(`📷 ${cafe._count.photos}장 이미 있음`);
      } else {
        try {
          const images = await fetchCafeImages(cafe.name, neighborhood);
          await sleep(150);

          // 1차 필터: link 가 실제 URL + blocklist 도메인 제외
          // 프록시인 경우 원본 URL 을 최종 url 로 씀 (프록시는 썸네일이므로 안 저장).
          const candidates = images
            .filter((img) => img.link && img.link.startsWith('http'))
            .map((img) => {
              const origin = extractNaverProxyOrigin(img.link) ?? img.link;
              return {
                url: origin,
                // 구 URL 이 프록시였다면 originalUrl 로 감사용 보존. 아니면 null.
                originalUrl: origin === img.link ? null : img.link,
                caption: img.title.replace(/<[^>]+>/g, '').slice(0, 100) || null,
              };
            })
            .filter((c) => !isBlockedHost(c.url));

          if (candidates.length === 0) {
            parts.push(`📷 이미지 없음 (blocklist 후)`);
          } else {
            // 2차 필터: 실제 HEAD + 해상도 — 200 OK + image/* + 최소 해상도
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
              if (d.width < MIN_IMAGE_WIDTH || d.height < MIN_IMAGE_HEIGHT) return false;
              return true;
            });

            if (validated.length === 0) {
              parts.push(`📷 검증 실패 (${candidates.length}건)`);
            } else {
              if (FORCE && hasPhotos) {
                await prisma.cafePhoto.deleteMany({ where: { cafeId: cafe.id } });
              }

              const toInsert = validated.slice(0, 3);
              let inserted = 0;
              for (let idx = 0; idx < toInsert.length; idx++) {
                const c = toInsert[idx];
                const d = dimByUrl.get(c.url)!;
                try {
                  await prisma.cafePhoto.create({
                    data: {
                      cafeId: cafe.id,
                      url: c.url,
                      originalUrl: c.originalUrl,
                      sourceType: 'naver',
                      width: d.width,
                      height: d.height,
                      fileSize: d.contentLength,
                      caption: c.caption,
                      isMain: idx === 0 && inserted === 0,
                    },
                  });
                  inserted++;
                } catch (err) {
                  // @@unique([cafeId, url]) 충돌 은 "이미 저장됨" 이니 무시
                  if (!(err instanceof Error) || !/Unique constraint/i.test(err.message)) {
                    throw err;
                  }
                }
              }
              if (inserted > 0) imgSaved++;
              parts.push(`📷 ${inserted}/${toInsert.length}장 저장 (검증 ${validated.length}/${candidates.length})`);
            }
          }
        } catch (err) {
          parts.push(`📷 오류`);
          console.error(`${prefix} 이미지 오류:`, err instanceof Error ? err.message : err);
        }
      }
    }

    // ── 블로그 수집 ──────────────────────────────────────────────────────
    if (DO_BLOGS) {
      // 아직 유효한 캐시가 없는 경우에만 수집
      const existing = FORCE
        ? null
        : await prisma.naverBlogCache.findFirst({
            where: { cafeId: cafe.id, expiresAt: { gt: new Date() } },
          });

      if (existing && !FORCE) {
        blogSkipped++;
        parts.push(`📝 블로그 캐시 있음`);
      } else {
        try {
          const blogs = await fetchCafeBlogs(cafe.name, neighborhood);
          await sleep(150);

          if (blogs.length > 0) {
            // 기존 캐시 삭제 (--force 시)
            if (FORCE) {
              await prisma.naverBlogCache.deleteMany({ where: { cafeId: cafe.id } });
            }

            await prisma.naverBlogCache.create({
              data: {
                cafeId: cafe.id,
                data: { items: blogs, total: blogs.length },
                expiresAt: new Date(Date.now() + BLOG_TTL_MS),
              },
            });

            blogSaved++;
            parts.push(`📝 블로그 ${blogs.length}건 저장`);
          } else {
            parts.push(`📝 블로그 없음`);
          }
        } catch (err) {
          parts.push(`📝 오류`);
          console.error(`${prefix} 블로그 오류:`, err instanceof Error ? err.message : err);
        }
      }
    }

    console.log(`${prefix} — ${parts.join('  ')}`);

    // 100건마다 중간 통계
    if ((i + 1) % 100 === 0) {
      console.log(`\n  ── 중간 통계 (${i + 1}/${cafes.length}) ──`);
      if (DO_IMAGES) console.log(`  이미지 저장: ${imgSaved} / 스킵: ${imgSkipped}`);
      if (DO_BLOGS) console.log(`  블로그 저장: ${blogSaved} / 스킵: ${blogSkipped}`);
      console.log();
    }
  }

  // ─── 최종 통계 ───────────────────────────────────────────────────────────
  const totalPhotos = await prisma.cafePhoto.count();
  const totalBlogs = await prisma.naverBlogCache.count();

  console.log('\n========================================');
  console.log('✅ 수집 완료!');
  if (DO_IMAGES) console.log(`  이미지 저장: ${imgSaved}개 / 스킵: ${imgSkipped}개`);
  if (DO_BLOGS) console.log(`  블로그 저장: ${blogSaved}개 / 스킵: ${blogSkipped}개`);
  console.log(`  DB 전체 사진: ${totalPhotos}장`);
  console.log(`  DB 블로그 캐시: ${totalBlogs}건`);
  console.log('========================================');
}

main()
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
