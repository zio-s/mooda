const CACHE_NAME = 'mooda-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 설치: 정적 리소스 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function canCacheRequest(request) {
  // http/https 외 스킴(chrome-extension:, data:, blob: 등)은 Cache API에
  // 저장할 수 없다 — 저장 시 TypeError 발생.
  if (!request.url.startsWith('http')) return false;
  // 비멱등 메서드도 캐싱 대상 아님.
  if (request.method !== 'GET') return false;
  return true;
}

// 요청: Network First (API), Cache First (정적 리소스)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!canCacheRequest(request)) {
    // 기본 네트워크 처리를 브라우저에 위임.
    return;
  }

  const url = new URL(request.url);

  // API 요청은 항상 네트워크 우선
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // 네비게이션 요청 (HTML 페이지): Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 정적 리소스: Cache First
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        });
      })
    );
    return;
  }

  // 그 외: Network First
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// 컨트롤러에게 "즉시 업데이트" 메시지 수신 시 skipWaiting.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
