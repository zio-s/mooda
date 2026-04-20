import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  moods: z.array(z.string()).default([]),
  openNow: z.boolean().default(false),
  swLat: z.number().optional(),
  swLng: z.number().optional(),
  neLat: z.number().optional(),
  neLng: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = schema.parse(body);

    const where: Record<string, unknown> = {};

    if (
      params.swLat !== undefined &&
      params.swLng !== undefined &&
      params.neLat !== undefined &&
      params.neLng !== undefined
    ) {
      where.lat = { gte: params.swLat, lte: params.neLat };
      where.lng = { gte: params.swLng, lte: params.neLng };
    }

    if (params.openNow) {
      const koreaTime = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
      );
      const dayOfWeek = koreaTime.getDay();
      const currentTime = `${String(koreaTime.getHours()).padStart(2, '0')}:${String(koreaTime.getMinutes()).padStart(2, '0')}`;
      where.hours = {
        some: {
          dayOfWeek,
          isClosed: false,
          openTime: { lte: currentTime },
          closeTime: { gte: currentTime },
        },
      };
    }

    if (params.moods.length > 0) {
      where.moods = {
        some: {
          mood: { key: { in: params.moods } },
          voteCount: { gt: 0 },
        },
      };
    }

    const count = await prisma.cafe.count({ where });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('POST /api/cafes/count error:', error);
    return NextResponse.json({ error: 'count failed' }, { status: 500 });
  }
}
