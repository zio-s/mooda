import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * 현재 로그인 유저의 카운트 통계 — 프로필 허브에서 쓰임.
 *
 * Response: { reviewCount, favoriteCount, collectionCount }
 * Cache: private, 5분 CDN + SWR 10분. 내부 state 변경(리뷰/즐찾/컬렉션 mutate)
 *        시에는 RTK Query tag invalidation으로 빠른 재페치.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [reviewCount, favoriteCount, collectionCount] = await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.userFavorite.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
    ]);

    return NextResponse.json(
      { reviewCount, favoriteCount, collectionCount },
      {
        headers: {
          'Cache-Control':
            'private, max-age=0, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('GET /api/users/me/stats error:', error);
    return NextResponse.json({ error: 'stats failed' }, { status: 500 });
  }
}
