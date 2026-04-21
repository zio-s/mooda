/**
 * 네이버 이미지 검색 프록시 URL → 원본 URL 복구 검증 (T-SCRIPT-01C)
 *
 * 배경:
 *   check-photos.ts 실측 결과 DB 저장된 이미지 중앙값이 200×150 (썸네일) 이고,
 *   URL 이 `search.pstatic.net/common/?type=b150&src=<URL-encoded 원본>` 패턴.
 *   → enrich-cafes.ts 가 네이버 API 의 `link` (프록시 썸네일) 를 그대로 저장해온 버그.
 *
 * 이 스크립트는 읽기 전용으로 다음을 증명한다:
 *   1. 프록시 URL 의 `src=` 파라미터를 decodeURIComponent 하면 원본 URL 복구 가능
 *   2. 복구한 원본 URL 이 실제로 접근 가능 (HEAD 200 OK)
 *   3. 원본이 프록시 대비 실제 고해상도 (>= 1024px 등)
 *
 * 실행:
 *   npx tsx scripts/check-naver-origins.ts
 *
 * 옵션:
 *   --sample=N         검증 샘플 수 (기본 30)
 *   --json-path=<path> JSON 리포트 경로
 *
 * 읽기 전용 — DB 수정 없음.
 */

import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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

const SAMPLE_ARG = process.argv.find((a) => a.startsWith('--sample='));
const SAMPLE_SIZE = SAMPLE_ARG ? Math.max(1, parseInt(SAMPLE_ARG.split('=')[1], 10)) : 30;
const JSON_PATH_ARG = process.argv.find((a) => a.startsWith('--json-path='));

const CONCURRENCY = 5;
const TIMEOUT_MS = 10000;
const RANGE_BYTES = 65535;

// ─── 이미지 파서 (check-photos.ts 에서 복사, T-02 진입 시 lib/ 로 통합) ──
type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'unknown';

function parseJpeg(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = (buf[i + 5] << 8) | buf[i + 6];
      const width = (buf[i + 7] << 8) | buf[i + 8];
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const segLen = (buf[i + 2] << 8) | buf[i + 3];
    if (segLen < 2) return null;
    i += 2 + segLen;
  }
  return null;
}

function parsePng(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
  const width = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const height = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseWebp(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return null;
  if (buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50) return null;
  const chunkType = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (chunkType === 'VP8 ') {
    const width = ((buf[27] << 8) | buf[26]) & 0x3fff;
    const height = ((buf[29] << 8) | buf[28]) & 0x3fff;
    if (width > 0 && height > 0) return { width, height };
  } else if (chunkType === 'VP8L') {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 >> 6) & 0x03));
    return { width, height };
  } else if (chunkType === 'VP8X') {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }
  return null;
}

function parseGif(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 10) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return null;
  const width = buf[6] | (buf[7] << 8);
  const height = buf[8] | (buf[9] << 8);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseImageSize(
  buf: Uint8Array,
): { width: number; height: number; format: ImageFormat } | null {
  const j = parseJpeg(buf); if (j) return { ...j, format: 'jpeg' };
  const p = parsePng(buf); if (p) return { ...p, format: 'png' };
  const w = parseWebp(buf); if (w) return { ...w, format: 'webp' };
  const g = parseGif(buf); if (g) return { ...g, format: 'gif' };
  return null;
}

// ─── 프록시 → 원본 추출 ─────────────────────────────────────────────────
/**
 * 네이버 검색 이미지 프록시 URL 패턴:
 *   https://search.pstatic.net/common/?type=b150&src=<URL-encoded 원본>
 *   https://search.pstatic.net/sunny/?type=b150&src=<URL-encoded 원본>
 *
 * src= 파라미터를 디코드하면 진짜 원본 URL 복구 가능.
 * type=b150 / b300 / f150 등 접두어는 프록시 변환 크기 지정.
 */
function extractOriginFromProxy(proxyUrl: string): string | null {
  try {
    const url = new URL(proxyUrl);
    if (url.hostname !== 'search.pstatic.net') return null;
    const src = url.searchParams.get('src');
    if (!src) return null;
    // src 는 이미 decodeURIComponent 된 상태로 URL 객체가 돌려줌
    // 하지만 가끔 이중 인코딩 대비해 한 번 더 확인
    try {
      const decoded = decodeURIComponent(src);
      // 이중 인코딩된 경우 decoded 에 %xx 가 다시 있음
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

// ─── fetch 해상도 ───────────────────────────────────────────────────────
interface DimResult {
  url: string;
  status: number | 'network_error' | 'timeout';
  contentType: string | null;
  contentLength: number | null;
  width: number | null;
  height: number | null;
  format: ImageFormat;
  error?: string;
}

async function fetchDimension(url: string): Promise<DimResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Range: `bytes=0-${RANGE_BYTES}` },
    });
    const contentType = res.headers.get('content-type');
    if (!res.ok && res.status !== 206) {
      return {
        url, status: res.status, contentType, contentLength: null,
        width: null, height: null, format: 'unknown', error: `http_${res.status}`,
      };
    }
    if (!contentType?.startsWith('image/')) {
      return {
        url, status: res.status, contentType, contentLength: null,
        width: null, height: null, format: 'unknown', error: 'not_image',
      };
    }
    const rangeHeader = res.headers.get('content-range');
    const totalLength = rangeHeader?.match(/\/(\d+)$/)?.[1];
    const cl = totalLength
      ? parseInt(totalLength, 10)
      : res.headers.get('content-length')
        ? parseInt(res.headers.get('content-length')!, 10)
        : null;

    const buffer = new Uint8Array(await res.arrayBuffer());
    const parsed = parseImageSize(buffer);
    if (!parsed) {
      return {
        url, status: res.status, contentType, contentLength: cl,
        width: null, height: null, format: 'unknown', error: 'parse_failed',
      };
    }
    return {
      url, status: res.status, contentType, contentLength: cl,
      ...parsed,
    };
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError';
    return {
      url,
      status: isAbort ? 'timeout' : 'network_error',
      contentType: null, contentLength: null,
      width: null, height: null, format: 'unknown',
      error: isAbort ? 'timeout' : 'network_error',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function batchFetch(urls: string[]): Promise<DimResult[]> {
  const results: DimResult[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const br = await Promise.all(batch.map(fetchDimension));
    results.push(...br);
  }
  return results;
}

function pickSample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items.slice();
  const picked = new Set<number>();
  while (picked.size < n) picked.add(Math.floor(Math.random() * items.length));
  return Array.from(picked).map((i) => items[i]);
}

// ─── 메인 ───────────────────────────────────────────────────────────────
interface Comparison {
  proxy: DimResult;
  origin: DimResult | null;
  originUrl: string | null;
  improvement: {
    widthDelta: number | null;
    heightDelta: number | null;
    sizeDelta: number | null;  // bytes
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수가 없습니다.');
    process.exit(1);
  }

  // 1. search.pstatic.net 도메인인 URL 모두 조회 후 샘플 추출
  const allProxyRows = await prisma.cafePhoto.findMany({
    where: { url: { contains: 'search.pstatic.net' } },
    select: { url: true },
  });

  console.log(`🔍 search.pstatic.net 프록시 URL 총 ${allProxyRows.length}건 발견`);
  console.log(`   샘플 ${SAMPLE_SIZE}건 검증 시작...\n`);

  const sampleUrls = pickSample(allProxyRows.map((r) => r.url), SAMPLE_SIZE);

  // 2. 프록시 해상도 측정
  const proxyResults = await batchFetch(sampleUrls);

  // 3. 원본 추출 + 해상도 측정
  const comparisons: Comparison[] = [];
  const extractable = sampleUrls.map((u) => ({ proxyUrl: u, originUrl: extractOriginFromProxy(u) }));
  const extractableCount = extractable.filter((e) => e.originUrl !== null).length;

  console.log(`  프록시 → 원본 추출 성공: ${extractableCount}/${sampleUrls.length}\n`);

  const originUrls = extractable.map((e) => e.originUrl).filter((u): u is string => u !== null);
  const originResults = originUrls.length > 0 ? await batchFetch(originUrls) : [];
  const originByUrl = new Map(originResults.map((r) => [r.url, r]));

  for (const sample of extractable) {
    const proxy = proxyResults.find((p) => p.url === sample.proxyUrl)!;
    const origin = sample.originUrl ? (originByUrl.get(sample.originUrl) ?? null) : null;
    comparisons.push({
      proxy,
      origin,
      originUrl: sample.originUrl,
      improvement: {
        widthDelta: origin?.width && proxy.width ? origin.width - proxy.width : null,
        heightDelta: origin?.height && proxy.height ? origin.height - proxy.height : null,
        sizeDelta: origin?.contentLength && proxy.contentLength
          ? origin.contentLength - proxy.contentLength : null,
      },
    });
  }

  // 4. 통계
  const originOk = comparisons.filter((c) =>
    c.origin && typeof c.origin.status === 'number' && c.origin.status < 400 && c.origin.width
  ).length;
  const originNg = comparisons.filter((c) => c.origin && !(
    typeof c.origin.status === 'number' && c.origin.status < 400 && c.origin.width
  )).length;
  const originSkipped = comparisons.filter((c) => !c.origin).length;

  const improvedWidths = comparisons
    .filter((c) => c.origin?.width && c.proxy.width)
    .map((c) => c.origin!.width! - c.proxy.width!);
  const improvedSizes = comparisons
    .filter((c) => c.origin?.contentLength && c.proxy.contentLength)
    .map((c) => c.origin!.contentLength! - c.proxy.contentLength!);

  const avgWidthDelta = improvedWidths.length === 0
    ? 0
    : Math.round(improvedWidths.reduce((s, v) => s + v, 0) / improvedWidths.length);
  const avgSizeDelta = improvedSizes.length === 0
    ? 0
    : Math.round(improvedSizes.reduce((s, v) => s + v, 0) / improvedSizes.length);

  const highResOrigins = comparisons.filter((c) => (c.origin?.width ?? 0) >= 1024).length;
  const highResProxies = comparisons.filter((c) => (c.proxy.width ?? 0) >= 1024).length;

  // 5. 출력
  console.log(`╔══════════════════════════════════════════════════════════════╗
║ 🔍 네이버 프록시 URL → 원본 복구 검증                        ║
╠══════════════════════════════════════════════════════════════╣
║ DB 내 프록시 URL 총  : ${String(allProxyRows.length).padStart(6)}건
║ 샘플 검증 수         : ${String(SAMPLE_SIZE).padStart(6)}건
║ 원본 추출 성공       : ${String(extractableCount).padStart(6)}건  (${((extractableCount / SAMPLE_SIZE) * 100).toFixed(1)}%)
║ 원본 URL 접근 성공   : ${String(originOk).padStart(6)}건  (${((originOk / SAMPLE_SIZE) * 100).toFixed(1)}%)
║ 원본 URL 실패        : ${String(originNg).padStart(6)}건
║ 원본 추출 불가       : ${String(originSkipped).padStart(6)}건
╚══════════════════════════════════════════════════════════════╝

📊 해상도/크기 평균 증분 (원본 vs 프록시):
  평균 폭 증가       : +${avgWidthDelta}px
  평균 파일 크기 증가 : +${Math.round(avgSizeDelta / 1024)}KB
  고해상도 (w≥1024) — 프록시: ${highResProxies}/${SAMPLE_SIZE} → 원본: ${highResOrigins}/${SAMPLE_SIZE}

📋 샘플 비교 (최대 10건):`);

  const samples = comparisons.slice(0, 10);
  for (const c of samples) {
    const proxyDim = c.proxy.width && c.proxy.height ? `${c.proxy.width}×${c.proxy.height}` : '?×?';
    const originDim = c.origin?.width && c.origin.height ? `${c.origin.width}×${c.origin.height}` : '—';
    const proxyStatus = c.proxy.status;
    const originStatus = c.origin?.status ?? '—';
    const proxySizeKB = c.proxy.contentLength ? `${Math.round(c.proxy.contentLength / 1024)}KB` : '?';
    const originSizeKB = c.origin?.contentLength ? `${Math.round(c.origin.contentLength / 1024)}KB` : '—';

    console.log(`\n  프록시 [${proxyStatus}] ${proxyDim} ${proxySizeKB}`);
    console.log(`    ${c.proxy.url.slice(0, 120)}`);
    console.log(`  원본    [${originStatus}] ${originDim} ${originSizeKB}`);
    console.log(`    ${c.originUrl?.slice(0, 120) ?? '(추출 실패)'}`);
  }

  // 6. JSON 리포트
  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      proxyUrlsInDB: allProxyRows.length,
      sampleSize: SAMPLE_SIZE,
      extractableCount,
      originOk,
      originNg,
      originSkipped,
    },
    improvement: {
      avgWidthDelta,
      avgSizeDeltaBytes: avgSizeDelta,
      highResProxyCount: highResProxies,
      highResOriginCount: highResOrigins,
    },
    comparisons: comparisons.map((c) => ({
      proxy: { url: c.proxy.url, status: c.proxy.status, width: c.proxy.width, height: c.proxy.height, contentLength: c.proxy.contentLength, format: c.proxy.format },
      origin: c.origin ? { url: c.originUrl, status: c.origin.status, width: c.origin.width, height: c.origin.height, contentLength: c.origin.contentLength, format: c.origin.format, error: c.origin.error } : null,
      improvement: c.improvement,
    })),
  };

  const timestamp = report.generatedAt.replace(/[:.]/g, '-');
  const defaultPath = join('scripts', 'reports', `check-naver-origins-${timestamp}.json`);
  const jsonPath = JSON_PATH_ARG ? JSON_PATH_ARG.split('=')[1] : defaultPath;
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n📝 JSON 리포트: ${jsonPath}`);
}

main()
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
