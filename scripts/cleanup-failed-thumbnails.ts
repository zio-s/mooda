/**
 * 치환 실패 프록시 썸네일 레코드 정리 (T-SCRIPT-06)
 *
 * 배경:
 *   T-SCRIPT-04 fix-naver-thumbnail-urls 실행으로 3,183 건 중 2,923 건이
 *   원본 URL 로 치환됨. 나머지 260 건은 원본 HEAD 실패 (Instagram 403,
 *   siksinhot 403, cloudfront 501, 커뮤니티 403 등) 로 프록시 URL 유지 상태.
 *   사용자 UI 에는 여전히 150px 썸네일 로 노출됨 → 품질 저하.
 *
 * 동작:
 *   1. url LIKE '%search.pstatic.net%' 레코드 재조회 (현재 남은 치환 실패 건)
 *   2. blocklist 호스트 (cdninstagram / siksinhot / pinimg / 커뮤니티) 매칭 분석
 *   3. DELETE — 사용자에게 썸네일 보이는 것 자체가 문제이므로 blocklist 여부 무관 전체 제거
 *   4. isMain 재지정 — DELETE 로 isMain=true 가 사라진 카페는 남은 첫 레코드(createdAt asc) 에 부여
 *   5. Redis cafe:<id> + search:* 무효화
 *   6. 매니페스트 저장
 *
 * 실행:
 *   npx tsx scripts/cleanup-failed-thumbnails.ts           # dry-run
 *   npx tsx scripts/cleanup-failed-thumbnails.ts --apply
 *
 * 옵션:
 *   --apply       실제 DELETE 실행
 *   --no-redis    Redis 무효화 스킵
 *   --json-path   매니페스트 경로
 */

import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { extractNaverProxyOrigin, isBlockedHost } from './lib/naver-proxy';

const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');
const SKIP_REDIS = process.argv.includes('--no-redis');
const JSON_PATH_ARG = process.argv.find((a) => a.startsWith('--json-path='));

interface ProxyRow {
  id: string;
  cafeId: string;
  url: string;
  isMain: boolean;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수가 없습니다.');
    process.exit(1);
  }

  console.log(`\n${APPLY ? '🔧 APPLY (실제 DELETE)' : '🧪 DRY-RUN'}\n`);

  // 1. 치환 실패 프록시 레코드 조회
  const rows: ProxyRow[] = await prisma.cafePhoto.findMany({
    where: { url: { contains: 'search.pstatic.net' } },
    select: { id: true, cafeId: true, url: true, isMain: true },
  });

  if (rows.length === 0) {
    console.log('✅ 프록시 레코드 0 건 — 정리 대상 없음.');
    return;
  }

  console.log(`📊 치환 실패 프록시 URL: ${rows.length} 건`);

  // 2. 원본 URL 추출 + blocklist 분석
  const originAnalysis: Record<string, number> = {}; // 호스트 → 개수
  let blockedCount = 0;
  let nonBlockedCount = 0;
  for (const r of rows) {
    const origin = extractNaverProxyOrigin(r.url);
    if (origin) {
      try {
        const host = new URL(origin).hostname;
        originAnalysis[host] = (originAnalysis[host] ?? 0) + 1;
      } catch {
        originAnalysis['(invalid)'] = (originAnalysis['(invalid)'] ?? 0) + 1;
      }
      if (isBlockedHost(origin)) blockedCount++;
      else nonBlockedCount++;
    }
  }

  const topOrigins = Object.entries(originAnalysis)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log(`\n🌐 실패 건의 원본 호스트 분포 (Top 10):`);
  for (const [host, count] of topOrigins) {
    const blocked = isBlockedHost(host) ? ' 🚫 blocklist' : '';
    console.log(`  ${host.padEnd(40)} ${String(count).padStart(4)}건${blocked}`);
  }
  console.log(`\n  blocklist 매칭 : ${blockedCount}건`);
  console.log(`  blocklist 외   : ${nonBlockedCount}건 (hotlink 403/501 등 일시적 실패 포함)`);

  // 3. isMain 재지정 계획 — DELETE 할 rows 중 isMain=true 인 카페
  const cafesLosingMain = new Set<string>();
  for (const r of rows) {
    if (r.isMain) cafesLosingMain.add(r.cafeId);
  }

  console.log(`\n🔑 isMain 재지정 필요 카페: ${cafesLosingMain.size} 개`);

  // 각 카페에서 DELETE 대상 외 남을 레코드 후보 조회
  const reassignPlan: Array<{ cafeId: string; newMainId: string | null }> = [];
  for (const cafeId of cafesLosingMain) {
    const deleteIds = rows.filter((r) => r.cafeId === cafeId).map((r) => r.id);
    const remaining = await prisma.cafePhoto.findFirst({
      where: {
        cafeId,
        id: { notIn: deleteIds },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    reassignPlan.push({ cafeId, newMainId: remaining?.id ?? null });
  }

  const willHaveNewMain = reassignPlan.filter((p) => p.newMainId !== null).length;
  const willBecomeEmpty = reassignPlan.filter((p) => p.newMainId === null).length;
  console.log(`  새 isMain 지정 가능: ${willHaveNewMain}개`);
  console.log(`  사진 0장 될 카페 : ${willBecomeEmpty}개 (이 카페는 placeholder 표시됨)`);

  console.log(`\n📋 실행 계획:`);
  console.log(`  DELETE       : ${rows.length}건`);
  console.log(`  isMain 재지정 : ${willHaveNewMain}건`);
  console.log(`  영향 카페     : ${new Set(rows.map((r) => r.cafeId)).size}개`);

  // 4. 매니페스트 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultPath = join('scripts', 'reports', `cleanup-thumbnails-${timestamp}.json`);
  const jsonPath = JSON_PATH_ARG ? JSON_PATH_ARG.split('=')[1] : defaultPath;
  await mkdir(dirname(jsonPath), { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    summary: {
      deleteCount: rows.length,
      affectedCafes: new Set(rows.map((r) => r.cafeId)).size,
      reassignCount: willHaveNewMain,
      emptyAfterCount: willBecomeEmpty,
      blockedOriginCount: blockedCount,
      nonBlockedOriginCount: nonBlockedCount,
    },
    originDistribution: topOrigins.map(([host, count]) => ({
      host,
      count,
      blocked: isBlockedHost(host),
    })),
    deletedRows: rows.map((r) => ({
      id: r.id,
      cafeId: r.cafeId,
      url: r.url,
      isMain: r.isMain,
      origin: extractNaverProxyOrigin(r.url),
    })),
    reassignments: reassignPlan,
  };
  await writeFile(jsonPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n📝 매니페스트: ${jsonPath}`);

  if (!APPLY) {
    console.log(`\n🧪 DRY-RUN 완료. 실제 적용은 --apply 추가.`);
    return;
  }

  // 5. APPLY — 트랜잭션
  console.log(`\n🔧 APPLY 시작...`);

  const affectedCafeIds = new Set<string>(rows.map((r) => r.cafeId));

  // isMain 재지정 먼저 — DELETE 이후 부여하면 중간 상태에서 UNIQUE 충돌 위험은 없지만
  // 안전하게 순서: reassign → delete.
  // 단, reassign 시 아직 삭제 안된 "구 isMain" 과 "새 isMain" 이 공존 → isMain 2개가 됨.
  // → 먼저 기존 isMain=true 모두 false 로 flip 하고 새 isMain 지정, 그 다음 DELETE.
  await prisma.$transaction(async (tx) => {
    // 5a. 삭제 대상의 isMain=true 를 먼저 false 로 (임시 상태, 곧 지워질 레코드)
    const deleteIds = rows.map((r) => r.id);
    if (deleteIds.length > 0) {
      await tx.cafePhoto.updateMany({
        where: { id: { in: deleteIds }, isMain: true },
        data: { isMain: false },
      });
    }

    // 5b. 남을 레코드에 새 isMain 지정
    for (const p of reassignPlan) {
      if (p.newMainId) {
        await tx.cafePhoto.update({
          where: { id: p.newMainId },
          data: { isMain: true },
        });
      }
    }

    // 5c. DELETE — 100 개씩 배치
    const BATCH = 100;
    for (let i = 0; i < deleteIds.length; i += BATCH) {
      const batch = deleteIds.slice(i, i + BATCH);
      await tx.cafePhoto.deleteMany({ where: { id: { in: batch } } });
    }
  });

  console.log(`✅ DELETE 완료 — ${rows.length}건 / 영향 카페 ${affectedCafeIds.size}개`);

  // 6. Redis 무효화
  if (!SKIP_REDIS && (process.env.REDIS_HOST || process.env.REDIS_URL)) {
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      const cafeKeys = Array.from(affectedCafeIds).map((id) => `cafe:${id}`);
      if (cafeKeys.length > 0) {
        const pipeline = redis.pipeline();
        for (const k of cafeKeys) pipeline.del(k);
        await pipeline.exec();
      }

      let searchInvalidated = 0;
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', 'search:*', 'COUNT', '500');
        cursor = next;
        if (keys.length > 0) {
          await redis.del(...keys);
          searchInvalidated += keys.length;
        }
      } while (cursor !== '0');

      await redis.quit();
      console.log(`🧹 Redis 무효화 — cafe:${cafeKeys.length}개 / search:${searchInvalidated}개`);
    } catch (err) {
      console.warn(`⚠️  Redis 무효화 실패 (무시): ${(err as Error).message}`);
    }
  } else {
    console.log(`⏭  Redis 무효화 스킵 (${SKIP_REDIS ? '--no-redis' : 'REDIS_HOST/URL 미설정'})`);
  }

  console.log(`\n✅ 전체 완료. 매니페스트: ${jsonPath}`);
}

main()
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
