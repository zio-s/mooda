import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis, CACHE_TTL } from '@/lib/redis';
import { auth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const cacheKey = `cafe:${id}`;
    const cached = await redis.get(cacheKey).catch(() => null);

    const [cafe, myVoteRows] = await Promise.all([
      cached
        ? Promise.resolve(null)
        : prisma.cafe.findUnique({
            where: { id },
            include: {
              photos: { orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }] },
              hours: { orderBy: { dayOfWeek: 'asc' } },
              moods: { include: { mood: true }, orderBy: { voteCount: 'desc' } },
              reviews: {
                include: { user: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          }),
      session?.user?.id
        ? prisma.moodVote.findMany({
            where: { userId: session.user.id, cafeId: id },
            select: { moodId: true },
          })
        : Promise.resolve([]),
    ]);

    const myVotes = myVoteRows.map((v) => v.moodId);

    if (cached) {
      const base = JSON.parse(cached);
      return NextResponse.json({ ...base, myVotes });
    }

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    const result = {
      ...cafe,
      mainPhoto: cafe.photos.find((p) => p.isMain)?.url ?? cafe.photos[0]?.url ?? null,
      moods: cafe.moods.map((cm) => ({
        moodId: cm.moodId,
        moodKey: cm.mood.key,
        moodLabel: cm.mood.label,
        moodCategory: cm.mood.category,
        voteCount: cm.voteCount,
      })),
    };

    await redis.setex(cacheKey, CACHE_TTL.CAFE_DETAIL, JSON.stringify(result)).catch(() => null);
    return NextResponse.json({ ...result, myVotes });
  } catch (error) {
    console.error('GET /api/cafes/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch cafe' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { id } = await params;
    await prisma.cafe.delete({ where: { id } });
    await redis.del(`cafe:${id}`).catch(() => null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cafes/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete cafe' }, { status: 500 });
  }
}
