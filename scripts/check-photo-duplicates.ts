/**
 * cafe_photos 테이블 (cafeId, url) 중복 레코드 진단
 *
 * 목적: @@unique([cafeId, url]) 제약 추가 전 중복 존재 여부 확인.
 * 읽기 전용.
 *
 * 실행: npx tsx scripts/check-photo-duplicates.ts
 */
import 'dotenv/config';
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

async function main() {
  const duplicates = await prisma.$queryRaw<Array<{
    cafeId: string;
    url: string;
    count: number;
  }>>`
    SELECT "cafeId", url, COUNT(*)::int as count
    FROM cafe_photos
    GROUP BY "cafeId", url
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `;

  const totalGroups = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*)::int as total
    FROM (
      SELECT "cafeId", url
      FROM cafe_photos
      GROUP BY "cafeId", url
      HAVING COUNT(*) > 1
    ) t
  `;

  console.log(`\n🔍 (cafeId, url) 중복 그룹: ${totalGroups[0].total}개\n`);

  if (duplicates.length === 0) {
    console.log('✅ 중복 없음. @@unique 제약 추가 안전.');
  } else {
    console.log('⚠️ 중복 샘플 (최대 20건):');
    for (const d of duplicates) {
      console.log(`  [${d.count}회] cafe=${d.cafeId.slice(0, 10)}... url=${d.url.slice(0, 80)}`);
    }
  }
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
