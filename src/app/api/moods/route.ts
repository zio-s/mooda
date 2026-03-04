import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL } from '@/lib/redis';

export async function GET() {
  try {
    const cacheKey = 'moods:all';
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    const moods = await prisma.mood.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    await redis.setex(cacheKey, CACHE_TTL.MOODS, JSON.stringify(moods)).catch(() => null);
    return NextResponse.json(moods);
  } catch (error) {
    console.error('GET /api/moods error:', error);
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
}
