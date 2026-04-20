/* Mooda service worker — 04_state_and_api.md § 오프라인
 * Workbox 대신 필요 전략만 직접 구현: deps 없음, 번들 크기 0.
 *
 * 전략
 *  · Static  (script/style/font/image, /_next/static/*) : StaleWhileRevalidate
 *  · API    (/api/cafes/*, non-detail)                  : NetworkFirst 3s + 24h TTL
 *  · Detail (/api/cafes/{id}, /cafes/{id})              : CacheFirst 7d, 50 entries
 *  · Nav    (기타 HTML)                                  : NetworkFirst + offline fallback
 */

const VERSION = 'mooda-v3';
const CACHE = {
  precache: `${VERSION}-precache`,
  static: `${VERSION}-static`,
  api: `${VERSION}-api`,
  detail: `${VERSION}-detail`,
  pages: `${VERSION}-pages`,
};

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const DETAIL_MAX_ENTRIES = 50;
const DETAIL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const API_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const API_NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE.precache).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const valid = new Set(Object.values(CACHE));
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !valid.has(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function canCacheRequest(request) {
  if (!request.url.startsWith('http')) return false;
  if (request.method !== 'GET') return false;
  return true;
}

function isStaticAsset(url, request) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.pathname.startsWith('/icons/')) return true;
  if (['style', 'script', 'font', 'image'].includes(request.destination)) return true;
  return /\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname);
}

function isCafeDetailApi(url) {
  return /^\/api\/cafes\/[^/]+$/.test(url.pathname);
}

function isCafeApi(url) {
  return url.pathname.startsWith('/api/cafes/') && !isCafeDetailApi(url);
}

function isCafeDetailNav(url, request) {
  return request.mode === 'navigate' && /^\/cafes\/[^/]+/.test(url.pathname);
}

// ─── Strategies ──────────────────────────────────────────────────

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise) || Response.error();
}

async function networkFirstWithTimeout(request, cacheName, { timeoutMs, maxAgeMs }) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(t);
    if (response && response.ok) {
      cache.put(request, tagResponse(response.clone())).catch(() => {});
    }
    return response;
  } catch {
    clearTimeout(t);
    const cached = await cache.match(request);
    if (cached && !isCachedTooOld(cached, maxAgeMs)) return cached;
    if (cached) return cached; // stale 이라도 반환 — 오프라인 fallback
    return Response.error();
  }
}

async function cacheFirstWithExpiration(request, cacheName, { maxAgeMs, maxEntries }) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && !isCachedTooOld(cached, maxAgeMs)) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, tagResponse(response.clone())).catch(() => {});
      enforceEntryLimit(cache, maxEntries).catch(() => {});
    }
    return response;
  } catch {
    if (cached) return cached; // 만료됐어도 네트워크 안 되면 stale 반환
    return Response.error();
  }
}

// ── 만료/개수 관리 유틸 ────────────────────────────────────────────

function tagResponse(response) {
  // Response 헤더에 저장 시각을 찍어 나중에 만료 판단. 원본 헤더는 유지.
  const headers = new Headers(response.headers);
  headers.set('x-mooda-cached-at', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isCachedTooOld(response, maxAgeMs) {
  const ts = Number(response.headers.get('x-mooda-cached-at'));
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts > maxAgeMs;
}

async function enforceEntryLimit(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // 오래된 항목부터 삭제. cached-at이 없으면 가장 낮은 우선순위로 취급.
  const entries = await Promise.all(
    keys.map(async (req) => {
      const resp = await cache.match(req);
      const ts = Number(resp && resp.headers.get('x-mooda-cached-at')) || 0;
      return { req, ts };
    }),
  );
  entries.sort((a, b) => a.ts - b.ts);
  const toDelete = entries.slice(0, entries.length - maxEntries);
  await Promise.all(toDelete.map(({ req }) => cache.delete(req)));
}

// ─── Fetch 라우팅 ───────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!canCacheRequest(request)) return;

  const url = new URL(request.url);

  // 1) 카페 상세 API — 최근 본 카페 7일 캐시
  if (isCafeDetailApi(url)) {
    event.respondWith(
      cacheFirstWithExpiration(request, CACHE.detail, {
        maxAgeMs: DETAIL_MAX_AGE_MS,
        maxEntries: DETAIL_MAX_ENTRIES,
      }),
    );
    return;
  }

  // 2) 그 외 카페 API — 최신 우선 (3s timeout, 24h stale fallback)
  if (isCafeApi(url)) {
    event.respondWith(
      networkFirstWithTimeout(request, CACHE.api, {
        timeoutMs: API_NETWORK_TIMEOUT_MS,
        maxAgeMs: API_MAX_AGE_MS,
      }),
    );
    return;
  }

  // 3) 정적 리소스 — SWR
  if (isStaticAsset(url, request)) {
    event.respondWith(staleWhileRevalidate(request, CACHE.static));
    return;
  }

  // 4) 카페 상세 페이지 네비게이션 — 캐시 우선 (오프라인에서도 열람)
  if (isCafeDetailNav(url, request)) {
    event.respondWith(
      cacheFirstWithExpiration(request, CACHE.pages, {
        maxAgeMs: DETAIL_MAX_AGE_MS,
        maxEntries: DETAIL_MAX_ENTRIES,
      }),
    );
    return;
  }

  // 5) 일반 네비게이션 — 네트워크 우선, 실패 시 /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(CACHE.pages).then((cache) => cache.put(request, tagResponse(response.clone()))).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline');
          if (offline) return offline;
          return Response.error();
        }),
    );
    return;
  }

  // 6) 그 외 — 네트워크, 캐시 fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request) || Response.error()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
