import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().max(500).optional(),
});

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
    const body = await request.json();
    const { rating, content } = reviewSchema.parse(body);

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.upsert({
        where: { userId_cafeId: { userId: session.user!.id, cafeId } },
        create: { userId: session.user!.id, cafeId, rating, content },
        update: { rating, content },
      });

      // 평균 평점 업데이트
      const { _avg, _count } = await tx.review.aggregate({
        where: { cafeId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.cafe.update({
        where: { id: cafeId },
        data: {
          avgRating: _avg.rating ?? 0,
          reviewCount: _count,
        },
      });

      return newReview;
    });

    await redis.del(`cafe:${cafeId}`).catch(() => null);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('POST /api/cafes/[id]/reviews error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
