/**
 * 카페 사진 DB 실태 진단 (T-SCRIPT-01 / T-SCRIPT-01B)
 *
 * 읽기 전용 — DB 수정 없음. 운영 DB 에 그대로 돌려도 안전.
 *
 * 실행:
 *   npx tsx scripts/check-photos.ts
 *
 * 옵션:
 *   --sample=N         HEAD + 해상도 샘플 수 (기본 50)
 *   --no-head          HEAD 검증 스킵 (빠른 실행)
 *   --no-dim           해상도 실측 스킵 (HEAD 만)
 *   --json-only        콘솔 출력 없이 JSON 리포트만 생성
 *   --json-path=<path> JSON 리포트 저장 경로 (기본 scripts/reports/check-photos-<timestamp>.json)
 *
 * 출력:
 *   1. 카페/사진 커버율 + 평균 장수
 *   2. 사진 장수별 히스토그램
 *   3. isMain 정합성 (누락/중복)
 *   4. Google placeId 매칭률
 *   5. 지역별 빈 카페 Top 10
 *   6. URL 도메인 분포 (전체)
 *   7. HEAD 검증 샘플 — 상태 코드 · Content-Type 분류
 *   8. 해상도 실측 — 의존성 0 magic-byte 파서 (JPEG/PNG/WebP/GIF)
 *   9. JSON 리포트 파일
 */

import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ─── 연결 ──────────────────────────────────────────────────────────────
const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── CLI 파라미터 ──────────────────────────────────────────────────────
const SAMPLE_ARG = process.argv.find((a) => a.startsWith('--sample='));
const HEAD_SAMPLE_SIZE = SAMPLE_ARG ? Math.max(1, parseInt(SAMPLE_ARG.split('=')[1], 10)) : 50;
const SKIP_HEAD = process.argv.includes('--no-head');
const SKIP_DIM = process.argv.includes('--no-dim');
const JSON_ONLY = process.argv.includes('--json-only');
const JSON_PATH_ARG = process.argv.find((a) => a.startsWith('--json-path='));

const HEAD_CONCURRENCY = 5;
const HEAD_TIMEOUT_MS = 5000;
const DIM_TIMEOUT_MS = 10000;
const DIM_RANGE_BYTES = 65535; // 64KB prefix — 이미지 메타는 헤더에 있음

// ─── 타입 ───────────────────────────────────────────────────────────────
interface Distribution {
  photoCount: number;
  cafes: number;
}

interface DomainCount {
  domain: string;
  count: number;
}

interface HeadResult {
  url: string;
  status: number | 'network_error' | 'timeout';
  contentType: string | null;
  ok: boolean;
}

interface HeadCheckReport {
  sampleSize: number;
  skipped: boolean;
  okImage: number;
  okNotImage: number;
  statusDistribution: Record<string, number>;
  failureSamples: Array<{ url: string; status: number | string; contentType: string | null }>;
}

type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'unknown';

interface DimResult {
  url: string;
  width: number | null;
  height: number | null;
  format: ImageFormat;
  contentLength: number | null;
  error?: string;
}

interface DimReport {
  sampleSize: number;
  skipped: boolean;
  parsed: number;
  failed: number;
  avgWidth: number;
  avgHeight: number;
  medianWidth: number;
  medianHeight: number;
  thumbnailSuspects: number; // width < 500 또는 height < 400
  highRes: number;            // width >= 1024
  formatDistribution: Record<ImageFormat, number>;
  sizeBucket: {
    under50KB: number;
    between50And200KB: number;
    between200And1MB: number;
    over1MB: number;
    unknown: number;
  };
  thumbnailSamples: Array<{ url: string; width: number; height: number; format: ImageFormat }>;
}

interface Report {
  generatedAt: string;
  params: { headSampleSize: number; skipHead: boolean };
  totals: {
    cafes: number;
    photos: number;
    cafesWithPhotos: number;
    cafesWithoutPhotos: number;
    coveragePct: number;
    avgPhotosPerCafe: number;
  };
  distribution: Distribution[];
  isMainIntegrity: {
    cafesWithoutMain: number;
    cafesWithMultipleMain: number;
  };
  googlePlaceIdMatch: {
    matched: number;
    unmatched: number;
    matchRatePct: number;
  };
  topEmptyNeighborhoods: Array<{ neighborhood: string; empty: number; total: number; emptyPct: number }>;
  urlDomainDistribution: DomainCount[];
  headCheck: HeadCheckReport;
  dimensions: DimReport;
}

// ─── HEAD 검증 ─────────────────────────────────────────────────────────
async function headCheck(url: string): Promise<HeadResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    const contentType = res.headers.get('content-type');
    return {
      url,
      status: res.status,
      contentType,
      ok: res.ok && (contentType?.startsWith('image/') ?? false),
    };
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError';
    return {
      url,
      status: isAbort ? 'timeout' : 'network_error',
      contentType: null,
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function batchHeadCheck(urls: string[]): Promise<HeadResult[]> {
  const results: HeadResult[] = [];
  for (let i = 0; i < urls.length; i += HEAD_CONCURRENCY) {
    const batch = urls.slice(i, i + HEAD_CONCURRENCY);
    const batchResults = await Promise.all(batch.map(headCheck));
    results.push(...batchResults);
  }
  return results;
}

function pickSample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items.slice();
  const picked = new Set<number>();
  while (picked.size < n) picked.add(Math.floor(Math.random() * items.length));
  return Array.from(picked).map((i) => items[i]);
}

function categorizeStatus(r: HeadResult): string {
  if (typeof r.status === 'string') return r.status;
  if (r.status >= 500) return '5xx';
  return String(r.status);
}

// ─── 이미지 해상도 파서 (의존성 0) ────────────────────────────────────
// JPEG SOF markers (C0-C3, C5-C7, C9-CB, CD-CF) 에서 width/height 추출.
// PNG IHDR bytes 16-23. WebP VP8/VP8L/VP8X 청크. GIF logical screen descriptor.
// Range 요청 64KB 만으로 대부분 이미지 메타 확보 가능.

function parseJpeg(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF (baseline / progressive / arithmetic 등)
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
    // SOI/EOI/RSTn 은 segment length 없음
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
  // IHDR chunk: length(4) + "IHDR"(4) at bytes 8-15, width(4) bytes 16-19, height(4) bytes 20-23
  const width = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const height = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseWebp(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  // RIFF....WEBP
  if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return null;
  if (buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50) return null;
  const chunkType = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (chunkType === 'VP8 ') {
    // Simple lossy: width/height little-endian at offset 26/28 (14bit each)
    const width = ((buf[27] << 8) | buf[26]) & 0x3fff;
    const height = ((buf[29] << 8) | buf[28]) & 0x3fff;
    if (width > 0 && height > 0) return { width, height };
  } else if (chunkType === 'VP8L') {
    // Lossless: 14bit width-1, 14bit height-1 packed at offset 21-24
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 >> 6) & 0x03));
    return { width, height };
  } else if (chunkType === 'VP8X') {
    // Extended: width-1 LE 3bytes at offset 24, height-1 LE 3bytes at offset 27
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }
  return null;
}

function parseGif(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 10) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return null;
  // Logical screen descriptor: width at 6-7, height at 8-9 (little-endian)
  const width = buf[6] | (buf[7] << 8);
  const height = buf[8] | (buf[9] << 8);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseImageSize(
  buf: Uint8Array,
): { width: number; height: number; format: ImageFormat } | null {
  const jpeg = parseJpeg(buf);
  if (jpeg) return { ...jpeg, format: 'jpeg' };
  const png = parsePng(buf);
  if (png) return { ...png, format: 'png' };
  const webp = parseWebp(buf);
  if (webp) return { ...webp, format: 'webp' };
  const gif = parseGif(buf);
  if (gif) return { ...gif, format: 'gif' };
  return null;
}

async function fetchDimension(url: string): Promise<DimResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Range: `bytes=0-${DIM_RANGE_BYTES}` },
    });
    if (!res.ok && res.status !== 206) {
      return { url, width: null, height: null, format: 'unknown', contentLength: null, error: `http_${res.status}` };
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return { url, width: null, height: null, format: 'unknown', contentLength: null, error: 'not_image' };
    }
    // Content-Range 헤더로 전체 크기 확보 (206 Partial 일 때)
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
      return { url, width: null, height: null, format: 'unknown', contentLength: cl, error: 'parse_failed' };
    }
    return { url, ...parsed, contentLength: cl };
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError';
    return {
      url,
      width: null,
      height: null,
      format: 'unknown',
      contentLength: null,
      error: isAbort ? 'timeout' : 'network_error',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function batchFetchDimensions(urls: string[]): Promise<DimResult[]> {
  const results: DimResult[] = [];
  for (let i = 0; i < urls.length; i += HEAD_CONCURRENCY) {
    const batch = urls.slice(i, i + HEAD_CONCURRENCY);
    const batchResults = await Promise.all(batch.map(fetchDimension));
    results.push(...batchResults);
  }
  return results;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// ─── 메인 ───────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수가 없습니다. (.env 파일 확인)');
    process.exit(1);
  }

  // 1. 기본 카운트
  const [totalCafes, totalPhotos, cafesWithPhotos, googleMatched] = await Promise.all([
    prisma.cafe.count(),
    prisma.cafePhoto.count(),
    prisma.cafe.count({ where: { photos: { some: {} } } }),
    prisma.cafe.count({ where: { googlePlaceId: { not: null } } }),
  ]);

  const cafesWithoutPhotos = totalCafes - cafesWithPhotos;
  const coveragePct = totalCafes === 0 ? 0 : (cafesWithPhotos / totalCafes) * 100;
  const avgPhotosPerCafe = totalCafes === 0 ? 0 : totalPhotos / totalCafes;
  const googleMatchRatePct = totalCafes === 0 ? 0 : (googleMatched / totalCafes) * 100;

  // 2. 사진 장수별 히스토그램
  const distributionRaw = await prisma.$queryRaw<Array<{ photo_count: number; cafes: number }>>`
    SELECT photo_count, COUNT(*)::int as cafes
    FROM (
      SELECT c.id, COUNT(p.id)::int as photo_count
      FROM cafes c
      LEFT JOIN cafe_photos p ON p."cafeId" = c.id
      GROUP BY c.id
    ) t
    GROUP BY photo_count
    ORDER BY photo_count ASC
  `;
  const distribution: Distribution[] = distributionRaw.map((d) => ({
    photoCount: d.photo_count,
    cafes: d.cafes,
  }));

  // 3. isMain 정합성 — 사진 있는 카페에서만 집계
  const mainIntegrityRaw = await prisma.$queryRaw<Array<{ main_count: number; cafes: number }>>`
    SELECT main_count, COUNT(*)::int as cafes
    FROM (
      SELECT c.id, SUM(CASE WHEN p."isMain" THEN 1 ELSE 0 END)::int as main_count
      FROM cafes c
      INNER JOIN cafe_photos p ON p."cafeId" = c.id
      GROUP BY c.id
    ) t
    GROUP BY main_count
    ORDER BY main_count ASC
  `;
  let cafesWithoutMain = 0;
  let cafesWithMultipleMain = 0;
  for (const row of mainIntegrityRaw) {
    if (row.main_count === 0) cafesWithoutMain += row.cafes;
    else if (row.main_count >= 2) cafesWithMultipleMain += row.cafes;
  }

  // 4. 지역별 빈 카페 Top 10
  const emptyByNeighborhoodRaw = await prisma.$queryRaw<Array<{
    neighborhood: string | null;
    empty: number;
    total: number;
  }>>`
    SELECT
      x.neighborhood,
      COUNT(CASE WHEN x.photo_count = 0 THEN 1 END)::int as empty,
      COUNT(*)::int as total
    FROM (
      SELECT c.id, c.neighborhood, COUNT(p.id)::int as photo_count
      FROM cafes c
      LEFT JOIN cafe_photos p ON p."cafeId" = c.id
      GROUP BY c.id, c.neighborhood
    ) x
    WHERE x.neighborhood IS NOT NULL
    GROUP BY x.neighborhood
    HAVING COUNT(CASE WHEN x.photo_count = 0 THEN 1 END) > 0
    ORDER BY empty DESC
    LIMIT 10
  `;
  const topEmptyNeighborhoods = emptyByNeighborhoodRaw.map((r) => ({
    neighborhood: r.neighborhood ?? '(unknown)',
    empty: r.empty,
    total: r.total,
    emptyPct: r.total === 0 ? 0 : Math.round((r.empty / r.total) * 1000) / 10,
  }));

  // 5. URL 도메인 분포 (전체)
  const allUrlRows = await prisma.cafePhoto.findMany({ select: { url: true } });
  const domainCount: Record<string, number> = {};
  for (const { url } of allUrlRows) {
    try {
      const host = new URL(url).hostname;
      domainCount[host] = (domainCount[host] ?? 0) + 1;
    } catch {
      domainCount['(invalid)'] = (domainCount['(invalid)'] ?? 0) + 1;
    }
  }
  const urlDomainDistribution: DomainCount[] = Object.entries(domainCount)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  // 6. HEAD 검증
  let headCheckReport: HeadCheckReport = {
    sampleSize: 0,
    skipped: true,
    okImage: 0,
    okNotImage: 0,
    statusDistribution: {},
    failureSamples: [],
  };

  if (!SKIP_HEAD && allUrlRows.length > 0) {
    const sampleUrls = pickSample(
      allUrlRows.map((r) => r.url),
      HEAD_SAMPLE_SIZE,
    );
    const results = await batchHeadCheck(sampleUrls);

    const statusDistribution: Record<string, number> = {};
    const failures: HeadResult[] = [];
    let okImage = 0;
    let okNotImage = 0;

    for (const r of results) {
      const category = categorizeStatus(r);
      statusDistribution[category] = (statusDistribution[category] ?? 0) + 1;
      if (r.ok) {
        okImage++;
      } else if (typeof r.status === 'number' && r.status >= 200 && r.status < 300) {
        okNotImage++;
        failures.push(r);
      } else {
        failures.push(r);
      }
    }

    headCheckReport = {
      sampleSize: sampleUrls.length,
      skipped: false,
      okImage,
      okNotImage,
      statusDistribution,
      failureSamples: failures.slice(0, 20).map((f) => ({
        url: f.url,
        status: f.status,
        contentType: f.contentType,
      })),
    };
  }

  // 7. 해상도 실측 — 가이드 가설 "썸네일이 저장됐을 가능성" 검증용
  let dimReport: DimReport = {
    sampleSize: 0,
    skipped: true,
    parsed: 0,
    failed: 0,
    avgWidth: 0,
    avgHeight: 0,
    medianWidth: 0,
    medianHeight: 0,
    thumbnailSuspects: 0,
    highRes: 0,
    formatDistribution: { jpeg: 0, png: 0, webp: 0, gif: 0, unknown: 0 },
    sizeBucket: { under50KB: 0, between50And200KB: 0, between200And1MB: 0, over1MB: 0, unknown: 0 },
    thumbnailSamples: [],
  };

  if (!SKIP_DIM && !SKIP_HEAD && allUrlRows.length > 0) {
    const sampleUrls = pickSample(
      allUrlRows.map((r) => r.url),
      HEAD_SAMPLE_SIZE,
    );
    const dimResults = await batchFetchDimensions(sampleUrls);

    const widths: number[] = [];
    const heights: number[] = [];
    let parsed = 0;
    let failed = 0;
    const formatDist: Record<ImageFormat, number> = { jpeg: 0, png: 0, webp: 0, gif: 0, unknown: 0 };
    const sizeBucket = { under50KB: 0, between50And200KB: 0, between200And1MB: 0, over1MB: 0, unknown: 0 };
    const thumbnailSamples: DimResult[] = [];

    for (const r of dimResults) {
      formatDist[r.format] = (formatDist[r.format] ?? 0) + 1;
      if (r.contentLength === null) sizeBucket.unknown++;
      else if (r.contentLength < 50 * 1024) sizeBucket.under50KB++;
      else if (r.contentLength < 200 * 1024) sizeBucket.between50And200KB++;
      else if (r.contentLength < 1024 * 1024) sizeBucket.between200And1MB++;
      else sizeBucket.over1MB++;

      if (r.width !== null && r.height !== null) {
        parsed++;
        widths.push(r.width);
        heights.push(r.height);
        if (r.width < 500 || r.height < 400) thumbnailSamples.push(r);
      } else {
        failed++;
      }
    }

    const avg = (arr: number[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const thumbnailCount = widths.filter((w, i) => w < 500 || heights[i] < 400).length;
    const highResCount = widths.filter((w) => w >= 1024).length;

    dimReport = {
      sampleSize: sampleUrls.length,
      skipped: false,
      parsed,
      failed,
      avgWidth: avg(widths),
      avgHeight: avg(heights),
      medianWidth: Math.round(median(widths)),
      medianHeight: Math.round(median(heights)),
      thumbnailSuspects: thumbnailCount,
      highRes: highResCount,
      formatDistribution: formatDist,
      sizeBucket,
      thumbnailSamples: thumbnailSamples.slice(0, 10).map((s) => ({
        url: s.url,
        width: s.width!,
        height: s.height!,
        format: s.format,
      })),
    };
  }

  // ─── 리포트 ───────────────────────────────────────────────────────────
  const report: Report = {
    generatedAt: new Date().toISOString(),
    params: { headSampleSize: HEAD_SAMPLE_SIZE, skipHead: SKIP_HEAD },
    totals: {
      cafes: totalCafes,
      photos: totalPhotos,
      cafesWithPhotos,
      cafesWithoutPhotos,
      coveragePct: Math.round(coveragePct * 100) / 100,
      avgPhotosPerCafe: Math.round(avgPhotosPerCafe * 100) / 100,
    },
    distribution,
    isMainIntegrity: { cafesWithoutMain, cafesWithMultipleMain },
    googlePlaceIdMatch: {
      matched: googleMatched,
      unmatched: totalCafes - googleMatched,
      matchRatePct: Math.round(googleMatchRatePct * 100) / 100,
    },
    topEmptyNeighborhoods,
    urlDomainDistribution,
    headCheck: headCheckReport,
    dimensions: dimReport,
  };

  // ─── 콘솔 출력 ────────────────────────────────────────────────────────
  if (!JSON_ONLY) {
    const t = report.totals;
    const integrityBadge = (n: number) => (n > 0 ? '⚠️' : '✅');

    console.log(`
╔══════════════════════════════════════════════════════╗
║ 📸 Mooda 카페 사진 DB 실태 진단                      ║
╠══════════════════════════════════════════════════════╣
║ 총 카페 수           : ${String(t.cafes).padStart(8)}개
║ 사진 있는 카페        : ${String(t.cafesWithPhotos).padStart(8)}개  (${t.coveragePct}%)
║ 사진 0장 카페        : ${String(t.cafesWithoutPhotos).padStart(8)}개
║ 전체 사진 레코드      : ${String(t.photos).padStart(8)}장
║ 카페당 평균           : ${String(t.avgPhotosPerCafe).padStart(8)}장
╚══════════════════════════════════════════════════════╝

📊 사진 장수별 카페 분포:
${report.distribution.map((d) => `  ${String(d.photoCount).padStart(3)}장: ${d.cafes}개`).join('\n')}

🔧 isMain 데이터 정합성 ${integrityBadge(report.isMainIntegrity.cafesWithoutMain + report.isMainIntegrity.cafesWithMultipleMain)}:
  isMain 누락 (사진 있으나 대표 없음)  : ${report.isMainIntegrity.cafesWithoutMain}개
  isMain 중복 (2장 이상 대표)         : ${report.isMainIntegrity.cafesWithMultipleMain}개

🔗 Google placeId 매칭:
  매칭됨  : ${report.googlePlaceIdMatch.matched}개 (${report.googlePlaceIdMatch.matchRatePct}%)
  미매칭 : ${report.googlePlaceIdMatch.unmatched}개

🏙 지역별 빈 카페 Top 10:
${
  report.topEmptyNeighborhoods.length === 0
    ? '  (빈 카페 있는 지역 없음)'
    : report.topEmptyNeighborhoods
        .map((n) => `  ${n.neighborhood.padEnd(12)} ${String(n.empty).padStart(4)}/${String(n.total).padStart(4)}개 빈 (${n.emptyPct}%)`)
        .join('\n')
}

🌐 URL 도메인 분포 (전체 ${t.photos}장, Top 15):
${
  report.urlDomainDistribution.length === 0
    ? '  (사진 없음)'
    : report.urlDomainDistribution
        .slice(0, 15)
        .map((d) => `  ${d.domain.padEnd(38)} ${String(d.count).padStart(6)}장`)
        .join('\n')
}

🧪 HEAD 검증 ${report.headCheck.skipped ? '(--no-head 로 스킵)' : `(sample=${report.headCheck.sampleSize})`}:`);

    if (!report.headCheck.skipped) {
      const okPct = report.headCheck.sampleSize === 0
        ? 0
        : Math.round((report.headCheck.okImage / report.headCheck.sampleSize) * 1000) / 10;
      console.log(`  ✅ 200 OK + image/*        : ${report.headCheck.okImage}개 (${okPct}%)
  ⚠️  200 OK but not image   : ${report.headCheck.okNotImage}개
  📉 상태 코드 분포          : ${JSON.stringify(report.headCheck.statusDistribution)}`);

      if (report.headCheck.failureSamples.length > 0) {
        console.log(`  실패 샘플 (최대 20):`);
        for (const f of report.headCheck.failureSamples) {
          console.log(`    [${f.status}] ${f.contentType ? `(${f.contentType}) ` : ''}${f.url.slice(0, 100)}`);
        }
      }
    }

    // 해상도 실측 출력
    const d = report.dimensions;
    if (d.skipped) {
      console.log(`\n📐 해상도 실측 (스킵됨)`);
    } else {
      const thumbPct = d.parsed === 0 ? 0 : Math.round((d.thumbnailSuspects / d.parsed) * 1000) / 10;
      const highResPct = d.parsed === 0 ? 0 : Math.round((d.highRes / d.parsed) * 1000) / 10;
      const thumbBadge = thumbPct > 30 ? '🔴' : thumbPct > 10 ? '⚠️' : '✅';
      console.log(`
📐 해상도 실측 (sample=${d.sampleSize}, parsed=${d.parsed}, failed=${d.failed}):
  평균 폭×높이          : ${d.avgWidth} × ${d.avgHeight}
  중앙값 폭×높이         : ${d.medianWidth} × ${d.medianHeight}
  ${thumbBadge} 썸네일 의심 (w<500 또는 h<400) : ${d.thumbnailSuspects}개 (${thumbPct}%)
  ✨ 고해상도 (w≥1024)                        : ${d.highRes}개 (${highResPct}%)
  포맷 분포             : ${JSON.stringify(d.formatDistribution)}
  파일 크기 분포         : <50KB=${d.sizeBucket.under50KB} / 50-200KB=${d.sizeBucket.between50And200KB} / 200KB-1MB=${d.sizeBucket.between200And1MB} / >1MB=${d.sizeBucket.over1MB} / unknown=${d.sizeBucket.unknown}`);

      if (d.thumbnailSamples.length > 0) {
        console.log(`  썸네일 의심 샘플 (최대 10):`);
        for (const s of d.thumbnailSamples) {
          console.log(`    [${s.format} ${s.width}×${s.height}] ${s.url.slice(0, 100)}`);
        }
      }
    }
  }

  // ─── JSON 리포트 저장 ──────────────────────────────────────────────────
  const timestamp = report.generatedAt.replace(/[:.]/g, '-');
  const defaultPath = join('scripts', 'reports', `check-photos-${timestamp}.json`);
  const jsonPath = JSON_PATH_ARG ? JSON_PATH_ARG.split('=')[1] : defaultPath;
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  if (JSON_ONLY) {
    console.log(jsonPath);
  } else {
    console.log(`\n📝 JSON 리포트: ${jsonPath}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
