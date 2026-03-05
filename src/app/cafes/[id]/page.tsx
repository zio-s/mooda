import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { cache } from 'react';
import type { Metadata } from 'next';
import { CafeDetailClient } from './CafeDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

// React cache로 같은 요청 내에서 DB 중복 조회 방지
const getCafe = cache(async (id: string) => {
  return prisma.cafe.findUnique({
    where: { id },
    include: {
      photos: { orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }] },
      hours: { orderBy: { dayOfWeek: 'asc' } },
      moods: { include: { mood: true }, orderBy: { voteCount: 'desc' } },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await getCafe(id);

  if (!cafe) return { title: '카페를 찾을 수 없습니다' };

  return {
    title: cafe.name,
    description: cafe.description ?? `${cafe.neighborhood ?? ''} ${cafe.name} - Mooda에서 확인하세요`,
  };
}

export default async function CafeDetailPage({ params }: Props) {
  const { id } = await params;
  const [cafe, session] = await Promise.all([
    getCafe(id),
    auth(),
  ]);

  if (!cafe) notFound();

  const myVoteRows = session?.user?.id
    ? await prisma.moodVote.findMany({
        where: { userId: session.user.id, cafeId: id },
        select: { moodId: true },
      })
    : [];

  const cafeData = {
    ...cafe,
    mainPhoto: cafe.photos.find((p) => p.isMain)?.url ?? cafe.photos[0]?.url ?? null,
    photos: cafe.photos,
    hours: cafe.hours,
    moods: cafe.moods.map((cm) => ({
      moodId: cm.moodId,
      moodKey: cm.mood.key,
      moodLabel: cm.mood.label,
      moodCategory: cm.mood.category,
      voteCount: cm.voteCount,
    })),
    reviews: cafe.reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name ?? '익명',
      userImage: r.user.image ?? undefined,
      rating: r.rating,
      content: r.content ?? undefined,
      createdAt: r.createdAt.toISOString(),
    })),
    myVotes: myVoteRows.map((v) => v.moodId),
    isFavorited: false,
    distance: undefined,
    isOpen: undefined,
    createdAt: cafe.createdAt.toISOString(),
    updatedAt: cafe.updatedAt.toISOString(),
  };

  return <CafeDetailClient cafe={cafeData} />;
}
