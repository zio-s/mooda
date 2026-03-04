import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const voteSchema = z.object({ moodId: z.string() });

// POST → 토글 (투표/취소)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { id: cafeId } = await params;
    const { moodId } = voteSchema.parse(await request.json());
    const userId = session.user.id;

    // 기존 투표 여부 확인
    const existing = await prisma.moodVote.findUnique({
      where: { userId_cafeId_moodId: { userId, cafeId, moodId } },
    });

    if (existing) {
      // 투표 취소
      await prisma.$transaction([
        prisma.moodVote.delete({
          where: { userId_cafeId_moodId: { userId, cafeId, moodId } },
        }),
        prisma.cafeMood.update({
          where: { cafeId_moodId: { cafeId, moodId } },
          data: { voteCount: { decrement: 1 } },
        }),
      ]);

      await redis.del(`cafe:${cafeId}`).catch(() => null);
      return NextResponse.json({ voted: false });
    } else {
      // 투표 추가
      await prisma.$transaction([
        prisma.moodVote.create({ data: { userId, cafeId, moodId } }),
        prisma.cafeMood.upsert({
          where: { cafeId_moodId: { cafeId, moodId } },
          create: { cafeId, moodId, voteCount: 1 },
          update: { voteCount: { increment: 1 } },
        }),
      ]);

      await redis.del(`cafe:${cafeId}`).catch(() => null);
      return NextResponse.json({ voted: true });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('POST /api/cafes/[id]/votes error:', error);
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
  }
}
