/**
 * 인기 카페 네이버 블로그 사전 수집 (새벽 3시 Cron)
 * Usage: npx ts-node --project tsconfig.json scripts/sync-blogs.ts
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
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

async function fetchNaverBlogs(cafeName: string, neighborhood?: string | null) {
  const query = encodeURIComponent(`${neighborhood ?? ''} ${cafeName} 카페`);
  const res = await fetch(
    `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=5&sort=date`,
    {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

async function main() {
  // 리뷰 많은 인기 카페 100개
  const topCafes = await prisma.cafe.findMany({
    orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }],
    take: 100,
    select: { id: true, name: true, neighborhood: true },
  });

  console.log(`🔍 ${topCafes.length}개 카페 블로그 사전 수집 시작`);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let count = 0;
  for (const cafe of topCafes) {
    const data = await fetchNaverBlogs(cafe.name, cafe.neighborhood);
    if (!data) continue;

    await prisma.naverBlogCache.create({
      data: { cafeId: cafe.id, data, expiresAt },
    });

    count++;
    console.log(`  [${count}/${topCafes.length}] ${cafe.name}`);
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`✅ ${count}개 카페 블로그 캐시 완료`);
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
