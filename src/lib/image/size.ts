/**
 * 이미지 해상도 측정 공용 모듈 (의존성 0)
 *
 * - JPEG/PNG/WebP/GIF magic-byte 파서
 * - Range 요청 (기본 64KB prefix) 으로 원격 이미지 해상도 측정
 * - 네트워크/타임아웃/파싱 실패 모두 error 문자열로 리턴 (throw 없음)
 *
 * 사용처: scripts/check-photos.ts, scripts/check-naver-origins.ts,
 *         scripts/fix-naver-thumbnail-urls.ts
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'unknown';

export interface ImageDim {
  width: number;
  height: number;
  format: ImageFormat;
}

export interface RemoteImageResult {
  url: string;
  status: number | 'network_error' | 'timeout';
  contentType: string | null;
  contentLength: number | null;
  width: number | null;
  height: number | null;
  format: ImageFormat;
  error?: string;
}

// ─── Parser: JPEG ───────────────────────────────────────────────────────
// SOF markers (C0-C3, C5-C7, C9-CB, CD-CF). SOI/EOI/RSTn 은 segment length 없음.
function parseJpeg(buf: Uint8Array): ImageDim | null {
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
      if (width > 0 && height > 0) return { width, height, format: 'jpeg' };
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

// ─── Parser: PNG ────────────────────────────────────────────────────────
// IHDR chunk 는 signature 직후. width/height BE 32-bit at bytes 16/20.
function parsePng(buf: Uint8Array): ImageDim | null {
  if (buf.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
  const width = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
  const height = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
  if (width <= 0 || height <= 0) return null;
  return { width, height, format: 'png' };
}

// ─── Parser: WebP ───────────────────────────────────────────────────────
// RIFF....WEBP 헤더 + VP8 / VP8L / VP8X 청크
function parseWebp(buf: Uint8Array): ImageDim | null {
  if (buf.length < 30) return null;
  if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return null;
  if (buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50) return null;
  const chunkType = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (chunkType === 'VP8 ') {
    const width = ((buf[27] << 8) | buf[26]) & 0x3fff;
    const height = ((buf[29] << 8) | buf[28]) & 0x3fff;
    if (width > 0 && height > 0) return { width, height, format: 'webp' };
  } else if (chunkType === 'VP8L') {
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 >> 6) & 0x03));
    return { width, height, format: 'webp' };
  } else if (chunkType === 'VP8X') {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height, format: 'webp' };
  }
  return null;
}

// ─── Parser: GIF ────────────────────────────────────────────────────────
function parseGif(buf: Uint8Array): ImageDim | null {
  if (buf.length < 10) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) return null;
  const width = buf[6] | (buf[7] << 8);
  const height = buf[8] | (buf[9] << 8);
  if (width <= 0 || height <= 0) return null;
  return { width, height, format: 'gif' };
}

export function parseImageSize(buf: Uint8Array): ImageDim | null {
  return parseJpeg(buf) ?? parsePng(buf) ?? parseWebp(buf) ?? parseGif(buf);
}

// ─── Remote fetch ───────────────────────────────────────────────────────
export interface FetchDimensionOpts {
  timeoutMs?: number;
  rangeBytes?: number; // 기본 64KB — 이미지 메타는 대부분 헤더 안
}

export async function fetchDimension(
  url: string,
  opts: FetchDimensionOpts = {},
): Promise<RemoteImageResult> {
  const timeoutMs = opts.timeoutMs ?? 10000;
  const rangeBytes = opts.rangeBytes ?? 65535;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Range: `bytes=0-${rangeBytes}` },
    });
    const contentType = res.headers.get('content-type');
    if (!res.ok && res.status !== 206) {
      return {
        url,
        status: res.status,
        contentType,
        contentLength: null,
        width: null,
        height: null,
        format: 'unknown',
        error: `http_${res.status}`,
      };
    }
    if (!contentType?.startsWith('image/')) {
      return {
        url,
        status: res.status,
        contentType,
        contentLength: null,
        width: null,
        height: null,
        format: 'unknown',
        error: 'not_image',
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
        url,
        status: res.status,
        contentType,
        contentLength: cl,
        width: null,
        height: null,
        format: 'unknown',
        error: 'parse_failed',
      };
    }
    return {
      url,
      status: res.status,
      contentType,
      contentLength: cl,
      ...parsed,
    };
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError';
    return {
      url,
      status: isAbort ? 'timeout' : 'network_error',
      contentType: null,
      contentLength: null,
      width: null,
      height: null,
      format: 'unknown',
      error: isAbort ? 'timeout' : 'network_error',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function batchFetchDimensions(
  urls: string[],
  concurrency = 5,
  opts: FetchDimensionOpts = {},
): Promise<RemoteImageResult[]> {
  const results: RemoteImageResult[] = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const br = await Promise.all(batch.map((u) => fetchDimension(u, opts)));
    results.push(...br);
  }
  return results;
}
