import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// Redis 환경변수가 설정되어 있는지 확인
function isRedisConfigured(): boolean {
  const host = process.env.REDIS_HOST || '';
  const url = process.env.REDIS_URL || '';

  // 환경변수 자체가 없으면 미설정
  if (!host && !url) return false;

  // localhost Redis는 production에서 사용 불가
  if (process.env.NODE_ENV === 'production') {
    if (host === 'localhost' || host === '127.0.0.1') return false;
    if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  }

  return true;
}

// No-op Redis 클라이언트 (Redis 미설정 시 즉시 반환)
const noopRedis = {
  get: async () => null,
  setex: async () => 'OK' as const,
  set: async () => 'OK' as const,
  del: async () => 0,
  on: () => noopRedis,
} as unknown as Redis;

function createRedisClient(): Redis {
  if (!isRedisConfigured()) {
    return noopRedis;
  }

  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 3000, // 3초 내 연결 안 되면 포기
    maxRetriesPerRequest: 1, // 요청당 재시도 1회만
    retryStrategy: (times) => {
      if (times > 1) return null; // 1회 재시도 후 포기
      return 200;
    },
    lazyConnect: true, // 실제 사용 시까지 연결 지연
  });

  let connectionFailed = false;

  client.on('error', () => {
    if (!connectionFailed) {
      connectionFailed = true;
      console.warn('[Redis] Connection failed — using no-op fallback');
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export const CACHE_TTL = {
  SEARCH: 60 * 5,          // 5분
  CAFE_DETAIL: 60 * 30,    // 30분
  NAVER_BLOG: 60 * 60 * 24, // 24시간
  MOODS: 60 * 60,          // 1시간
  GOOGLE_REVIEW: 60 * 60 * 24 * 7, // 7일
} as const;
