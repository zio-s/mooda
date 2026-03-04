import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL } from '@/lib/redis';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cafeId } = await params;
    const cacheKey = `naver_blog:${cafeId}`;

    // Redis L1 캐시
    const redisCached = await redis.get(cacheKey).catch(() => null);
    if (redisCached) {
      return NextResponse.json(JSON.parse(redisCached));
    }

    // DB L2 캐시
    const dbCache = await prisma.naverBlogCache.findFirst({
      where: { cafeId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (dbCache) {
      await redis
        .setex(cacheKey, 60 * 60, JSON.stringify(dbCache.data))
        .catch(() => null);
      return NextResponse.json(dbCache.data);
    }

    // 카페 이름으로 네이버 블로그 검색
    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: { name: true, neighborhood: true },
    });

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    const query = encodeURIComponent(`${cafe.neighborhood ?? ''} ${cafe.name} 카페`);
    const res = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=5&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + CACHE_TTL.NAVER_BLOG * 1000);

    // 캐시 저장
    await prisma.naverBlogCache.create({
      data: { cafeId, data, expiresAt },
    }).catch(() => null);

    await redis
      .setex(cacheKey, CACHE_TTL.NAVER_BLOG, JSON.stringify(data))
      .catch(() => null);

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/cafes/[id]/blogs error:', error);
    return NextResponse.json({ items: [] });
  }
}
