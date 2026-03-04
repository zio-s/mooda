import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
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
