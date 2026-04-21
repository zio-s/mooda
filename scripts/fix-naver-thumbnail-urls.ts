/**
 * 네이버 프록시 썸네일 URL → 원본 고해상도 URL 치환 (T-SCRIPT-02B)
 *
 * 배경:
 *   check-photos.ts / check-naver-origins.ts 로 증명됨 —
 *   enrich-cafes.ts 가 네이버 API 응답의 `link` (프록시 썸네일) 를 그대로
 *   cafe_photos.url 에 저장해옴. 중앙값 200×150 / 파일 <50KB 84%.
 *
 *   프록시 URL 패턴:
 *     https://search.pstatic.net/common/?type=b150&src=<URL-encoded 원본>
 *     https://search.pstatic.net/sunny/?type=b150&src=<URL-encoded 원본>
 *
 *   `src=` 파라미터만 decodeURIComponent 하면 원본 URL 복구. 원본 HEAD 86.7%
 *   성공 (Instagram/커뮤니티 4건만 403 실패).
 *
 * 동작:
 *   1. url LIKE '%search.pstatic.net%' 인 cafe_photos 전체 조회
 *   2. src= 파싱 → 원본 URL 복구
 *   3. 같은 카페의 다른 레코드와 원본 URL 충돌 사전 체크
 *   4. 원본 URL 병렬 HEAD + 해상도 실측
 *   5. 성공 건 UPDATE:
 *        url         = 원본
 *        originalUrl = 기존 프록시 URL (롤백용)
 *        sourceType  = 'naver'
 *        width/height/fileSize = 실측값
 *   6. conflict 건 DELETE (같은 카페에 원본 이미 있음)
 *   7. failure 건 그대로 유지 (T-05 blocklist 로 별도 처리)
 *   8. Redis cafe:<id> / search:* 무효화
 *   9. JSON 롤백 매니페스트 저장
 *
 * 실행:
 *   npx tsx scripts/fix-naver-thumbnail-urls.ts                  # dry-run (기본)
 *   npx tsx scripts/fix-naver-thumbnail-urls.ts --apply          # 실제 적용
 *   npx tsx scripts/fix-naver-thumbnail-urls.ts --limit=50 --apply
 *
 * 옵션:
 *   --apply            실제 DB 적용 (기본 dry-run)
 *   --limit=N          처리 레코드 수 제한
 *   --concurrency=N    원본 HEAD 병렬도 (기본 8)
 *   --batch-size=N     DB 트랜잭션 배치 크기 (기본 100)
 *   --no-redis         Redis 무효화 스킵 (Redis 미설정이면 자동 스킵)
 *   --json-path=<p>    롤백 매니페스트 경로 (기본 scripts/reports/fix-naver-<ts>.json)
 */

import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { batchFetchDimensions, type RemoteImageResult } from './lib/image-size';

// ─── 연결 ──────────────────────────────────────────────────────────────
const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── CLI ────────────────────────────────────────────────────────────────
const APPLY = process.argv.includes('--apply');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined;
const CONC_ARG = process.argv.find((a) => a.startsWith('--concurrency='));
const CONCURRENCY = CONC_ARG ? parseInt(CONC_ARG.split('=')[1], 10) : 8;
const BATCH_ARG = process.argv.find((a) => a.startsWith('--batch-size='));
const BATCH_SIZE = BATCH_ARG ? parseInt(BATCH_ARG.split('=')[1], 10) : 100;
const SKIP_REDIS = process.argv.includes('--no-redis');
const JSON_PATH_ARG = process.argv.find((a) => a.startsWith('--json-path='));

// ─── 프록시 → 원본 추출 ─────────────────────────────────────────────────
function extractOrigin(proxyUrl: string): string | null {
  try {
    const u = new URL(proxyUrl);
    if (u.hostname !== 'search.pstatic.net') return null;
    const src = u.searchParams.get('src');
    if (!src) return null;
    try {
      const decoded = decodeURIComponent(src);
      // 이중 인코딩 대비 (% 문자가 또 있으면 한 번 더)
      if (decoded !== src && /%[0-9A-Fa-f]{2}/.test(decoded)) {
        return decodeURIComponent(decoded);
      }
      return decoded;
    } catch {
      return src;
    }
  } catch {
    return null;
  }
}

// ─── 타입 ──────────────────────────────────────────────────────────────
interface ProxyRow {
  id: string;
  cafeId: string;
  url: string;
  isMain: boolean;
}

interface UpdatePlan {
  id: string;
  cafeId: string;
  oldUrl: string;
  newUrl: string;
  isMain: boolean;
  dim: RemoteImageResult;
}

interface ConflictPlan {
  id: string;
  cafeId: string;
  proxyUrl: string;
  originUrl: string;
  isMain: boolean;
  conflictWith: string; // 이미 존재하는 원본 레코드 id
}

interface FailurePlan {
  id: string;
  cafeId: string;
  url: string;
  originUrl: string;
  error: string;
  status: number | string;
}

interface Plan {
  updates: UpdatePlan[];
  conflicts: ConflictPlan[];
  failures: FailurePlan[];
  extractFailed: Array<{ id: string; url: string }>;
}

// ─── 메인 ───────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수가 없습니다.');
    process.exit(1);
  }

  const mode = APPLY ? '🔧 APPLY (실제 DB 변경)' : '🧪 DRY-RUN (읽기 전용)';
  console.log(`\n${mode}\n`);

  // 1. 프록시 URL 레코드 전체 조회
  const rows: ProxyRow[] = await prisma.cafePhoto.findMany({
    where: { url: { contains: 'search.pstatic.net' } },
    select: { id: true, cafeId: true, url: true, isMain: true },
    orderBy: [{ cafeId: 'asc' }, { createdAt: 'asc' }],
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(`📊 프록시 URL 레코드: ${rows.length}건${LIMIT ? ` (limit=${LIMIT})` : ''}`);

  // 2. 원본 추출
  type Extracted = ProxyRow & { originUrl: string | null };
  const extracted: Extracted[] = rows.map((r) => ({ ...r, originUrl: extractOrigin(r.url) }));
  const extractOk = extracted.filter((e) => e.originUrl !== null);
  const extractFailed = extracted.filter((e) => e.originUrl === null);

  console.log(`  원본 추출 성공: ${extractOk.length}/${rows.length}`);
  if (extractFailed.length > 0) {
    console.log(`  원본 추출 실패: ${extractFailed.length} (src= 파라미터 없음)`);
  }

  // 3. conflict 사전 체크 — 같은 카페에 원본 URL 이 이미 있는지
  // 카페별로 그룹핑 후 한 번에 쿼리
  const byCafe = new Map<string, Extracted[]>();
  for (const e of extractOk) {
    if (!byCafe.has(e.cafeId)) byCafe.set(e.cafeId, []);
    byCafe.get(e.cafeId)!.push(e);
  }

  console.log(`  카페 수: ${byCafe.size}개`);
  console.log(`\n🔍 conflict 사전 체크 (카페별 원본 URL 존재 여부)...`);

  // 모든 원본 URL 후보를 (cafeId, originUrl) 튜플로 모아 일괄 쿼리
  const candidates = extractOk.map((e) => ({ cafeId: e.cafeId, originUrl: e.originUrl! }));
  const existingOrigins = new Map<string, string>(); // "cafeId::originUrl" → existing photo id
  const CHUNK = 500;
  for (let i = 0; i < candidates.length; i += CHUNK) {
    const chunk = candidates.slice(i, i + CHUNK);
    // cafeId 와 url 을 OR 조건으로 묶어서 쿼리 — Prisma 는 튜플 IN 지원 제한
    const existing = await prisma.cafePhoto.findMany({
      where: {
        OR: chunk.map((c) => ({ cafeId: c.cafeId, url: c.originUrl })),
      },
      select: { id: true, cafeId: true, url: true },
    });
    for (const e of existing) {
      existingOrigins.set(`${e.cafeId}::${e.url}`, e.id);
    }
  }

  const conflictCandidates: Extracted[] = [];
  const nonConflict: Extracted[] = [];
  for (const e of extractOk) {
    const key = `${e.cafeId}::${e.originUrl}`;
    if (existingOrigins.has(key)) conflictCandidates.push(e);
    else nonConflict.push(e);
  }
  console.log(`  conflict (원본 이미 존재):  ${conflictCandidates.length}건 → DELETE 대상`);
  console.log(`  신규 치환 후보:          ${nonConflict.length}건 → HEAD 검증 필요`);

  // 4. HEAD + 해상도 검증 (non-conflict 만)
  console.log(`\n🌐 원본 URL 해상도 측정 (concurrency=${CONCURRENCY})...`);
  const startFetch = Date.now();
  const originUrls = nonConflict.map((e) => e.originUrl!);
  const dimResults = await batchFetchDimensions(originUrls, CONCURRENCY, { timeoutMs: 10000 });
  const fetchDurSec = ((Date.now() - startFetch) / 1000).toFixed(1);
  console.log(`  완료: ${dimResults.length}건 / ${fetchDurSec}s`);

  // dim 결과를 URL 키로 인덱싱
  const dimByUrl = new Map<string, RemoteImageResult>();
  for (const d of dimResults) dimByUrl.set(d.url, d);

  // 5. 계획 수립
  const plan: Plan = {
    updates: [],
    conflicts: conflictCandidates.map((c) => ({
      id: c.id,
      cafeId: c.cafeId,
      proxyUrl: c.url,
      originUrl: c.originUrl!,
      isMain: c.isMain,
      conflictWith: existingOrigins.get(`${c.cafeId}::${c.originUrl}`)!,
    })),
    failures: [],
    extractFailed: extractFailed.map((e) => ({ id: e.id, url: e.url })),
  };

  for (const e of nonConflict) {
    const dim = dimByUrl.get(e.originUrl!)!;
    const isSuccess =
      typeof dim.status === 'number' &&
      dim.status >= 200 && dim.status < 400 &&
      dim.width !== null && dim.height !== null;

    if (isSuccess) {
      plan.updates.push({
        id: e.id,
        cafeId: e.cafeId,
        oldUrl: e.url,
        newUrl: e.originUrl!,
        isMain: e.isMain,
        dim,
      });
    } else {
      plan.failures.push({
        id: e.id,
        cafeId: e.cafeId,
        url: e.url,
        originUrl: e.originUrl!,
        error: dim.error ?? 'unknown',
        status: dim.status,
      });
    }
  }

  // 6. 계획 출력
  const avgWidth = plan.updates.length === 0
    ? 0
    : Math.round(plan.updates.reduce((s, u) => s + (u.dim.width ?? 0), 0) / plan.updates.length);
  const avgSizeKB = plan.updates.length === 0
    ? 0
    : Math.round(plan.updates.reduce((s, u) => s + (u.dim.contentLength ?? 0), 0) / plan.updates.length / 1024);

  console.log(`
╔══════════════════════════════════════════════════════════╗
║ 치환 계획 요약                                           ║
╠══════════════════════════════════════════════════════════╣
║ 총 프록시 URL:         ${String(rows.length).padStart(6)}건
║ ✅ UPDATE 예정:        ${String(plan.updates.length).padStart(6)}건 (평균 ${avgWidth}px / ${avgSizeKB}KB)
║ 🗑  DELETE 예정:        ${String(plan.conflicts.length).padStart(6)}건 (원본 이미 존재)
║ ⚠️  유지 (원본 실패):   ${String(plan.failures.length).padStart(6)}건 (403/404/timeout — T-05 blocklist 대상)
║ 🚫 추출 불가:          ${String(plan.extractFailed.length).padStart(6)}건 (src= 파라미터 없음)
╚══════════════════════════════════════════════════════════╝`);

  if (plan.failures.length > 0 && plan.failures.length <= 20) {
    console.log(`\n실패 샘플:`);
    for (const f of plan.failures.slice(0, 10)) {
      console.log(`  [${f.status}] ${f.originUrl.slice(0, 100)}`);
    }
  } else if (plan.failures.length > 20) {
    console.log(`\n실패 상위 10건 샘플:`);
    for (const f of plan.failures.slice(0, 10)) {
      console.log(`  [${f.status}] ${f.originUrl.slice(0, 100)}`);
    }
  }

  // 7. 롤백 매니페스트 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultJsonPath = join('scripts', 'reports', `fix-naver-${timestamp}.json`);
  const jsonPath = JSON_PATH_ARG ? JSON_PATH_ARG.split('=')[1] : defaultJsonPath;
  await mkdir(dirname(jsonPath), { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    params: { limit: LIMIT ?? null, concurrency: CONCURRENCY, batchSize: BATCH_SIZE },
    summary: {
      proxyRows: rows.length,
      updates: plan.updates.length,
      conflicts: plan.conflicts.length,
      failures: plan.failures.length,
      extractFailed: plan.extractFailed.length,
      avgWidth,
      avgSizeKB,
    },
    updates: plan.updates.map((u) => ({
      id: u.id,
      cafeId: u.cafeId,
      oldUrl: u.oldUrl,
      newUrl: u.newUrl,
      width: u.dim.width,
      height: u.dim.height,
      fileSize: u.dim.contentLength,
      isMain: u.isMain,
    })),
    conflicts: plan.conflicts,
    failures: plan.failures,
    extractFailed: plan.extractFailed,
  };
  await writeFile(jsonPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n📝 매니페스트: ${jsonPath}`);

  // 8. dry-run 이면 여기서 종료
  if (!APPLY) {
    console.log(`\n🧪 DRY-RUN 완료. 실제 적용하려면 --apply 추가.`);
    return;
  }

  // 9. APPLY — 트랜잭션 배치
  console.log(`\n🔧 APPLY 시작...`);

  const affectedCafeIds = new Set<string>();
  let updatedCount = 0;
  let deletedCount = 0;

  // UPDATE 배치
  for (let i = 0; i < plan.updates.length; i += BATCH_SIZE) {
    const batch = plan.updates.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((u) =>
        prisma.cafePhoto.update({
          where: { id: u.id },
          data: {
            url: u.newUrl,
            originalUrl: u.oldUrl,
            sourceType: 'naver',
            width: u.dim.width,
            height: u.dim.height,
            fileSize: u.dim.contentLength,
          },
        }),
      ),
    );
    for (const u of batch) affectedCafeIds.add(u.cafeId);
    updatedCount += batch.length;
    process.stdout.write(`\r  UPDATE 진행: ${updatedCount}/${plan.updates.length}`);
  }
  if (plan.updates.length > 0) console.log();

  // DELETE 배치 (conflicts)
  // ⚠️ isMain=true 프록시 레코드 삭제 전 — 같은 카페에 원본 레코드 중 isMain 이 있는지 확인.
  // 원본 레코드가 isMain=false 인데 프록시가 isMain=true 였다면, 삭제 후 isMain 없어짐.
  // → 삭제 전 원본 레코드에 isMain 부여.
  for (const c of plan.conflicts) {
    if (c.isMain) {
      await prisma.cafePhoto.update({
        where: { id: c.conflictWith },
        data: { isMain: true },
      });
    }
  }

  for (let i = 0; i < plan.conflicts.length; i += BATCH_SIZE) {
    const batch = plan.conflicts.slice(i, i + BATCH_SIZE);
    await prisma.cafePhoto.deleteMany({
      where: { id: { in: batch.map((c) => c.id) } },
    });
    for (const c of batch) affectedCafeIds.add(c.cafeId);
    deletedCount += batch.length;
    process.stdout.write(`\r  DELETE 진행: ${deletedCount}/${plan.conflicts.length}`);
  }
  if (plan.conflicts.length > 0) console.log();

  console.log(`\n✅ DB 반영 완료 — UPDATE ${updatedCount} / DELETE ${deletedCount}`);

  // 10. Redis 무효화
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
      let cafeInvalidated = 0;
      if (cafeKeys.length > 0) {
        // pipeline 으로 일괄 삭제
        const pipeline = redis.pipeline();
        for (const k of cafeKeys) pipeline.del(k);
        await pipeline.exec();
        cafeInvalidated = cafeKeys.length;
      }

      // 검색 캐시 — SCAN 으로 키 찾은 후 DEL
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
      console.log(`🧹 Redis 무효화 — cafe:${cafeInvalidated}개 / search:${searchInvalidated}개`);
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
