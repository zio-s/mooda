import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL } from '@/lib/redis';
import { z } from 'zod';

const searchSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().default(2000),
  swLat: z.number().optional(),
  swLng: z.number().optional(),
  neLat: z.number().optional(),
  neLng: z.number().optional(),
  moods: z.array(z.string()).default([]),
  openNow: z.boolean().default(false),
  sort: z.enum(['distance', 'rating', 'reviews']).default('distance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = searchSchema.parse(body);

    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    const where: Record<string, unknown> = {};

    // 지도 범위 필터
    if (params.swLat && params.swLng && params.neLat && params.neLng) {
      where.lat = { gte: params.swLat, lte: params.neLat };
      where.lng = { gte: params.swLng, lte: params.neLng };
    }

    // 분위기 필터
    if (params.moods.length > 0) {
      where.moods = {
        some: {
          mood: { key: { in: params.moods } },
          voteCount: { gt: 0 },
        },
      };
    }

    const skip = (params.page - 1) * params.limit;

    const [cafes, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
        include: {
          photos: { where: { isMain: true }, take: 1 },
          moods: {
            include: { mood: true },
            orderBy: { voteCount: 'desc' },
            take: 5,
          },
        },
        skip,
        take: params.limit,
        orderBy:
          params.sort === 'rating'
            ? { avgRating: 'desc' }
            : params.sort === 'reviews'
            ? { reviewCount: 'desc' }
            : { createdAt: 'desc' },
      }),
      prisma.cafe.count({ where }),
    ]);

    // 거리 계산 (lat/lng 기준)
    const cafesWithDistance = cafes.map((cafe) => {
      let distance: number | undefined;
      if (params.lat && params.lng) {
        const R = 6371000;
        const dLat = ((cafe.lat - params.lat) * Math.PI) / 180;
        const dLng = ((cafe.lng - params.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((params.lat * Math.PI) / 180) *
            Math.cos((cafe.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      }

      return {
        ...cafe,
        mainPhoto: cafe.photos[0]?.url ?? null,
        distance,
        moods: cafe.moods.map((cm) => ({
          moodId: cm.moodId,
          moodKey: cm.mood.key,
          moodLabel: cm.mood.label,
          moodCategory: cm.mood.category,
          voteCount: cm.voteCount,
        })),
      };
    });

    if (params.sort === 'distance' && params.lat && params.lng) {
      cafesWithDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    const result = {
      cafes: cafesWithDistance,
      total,
      page: params.page,
      limit: params.limit,
    };

    await redis.setex(cacheKey, CACHE_TTL.SEARCH, JSON.stringify(result)).catch(() => null);

    // 검색 로그 (비동기, 오류 무시)
    prisma.searchLog
      .create({ data: { query: params, resultCount: total } })
      .catch(() => null);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('POST /api/cafes/search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
