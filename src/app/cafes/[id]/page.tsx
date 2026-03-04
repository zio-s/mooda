import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import { CafeDetailClient } from './CafeDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await prisma.cafe.findUnique({
    where: { id },
    select: { name: true, description: true, neighborhood: true },
  });

  if (!cafe) return { title: '카페를 찾을 수 없습니다' };

  return {
    title: cafe.name,
    description: cafe.description ?? `${cafe.neighborhood ?? ''} ${cafe.name} - Mooda에서 확인하세요`,
  };
}

export default async function CafeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const [cafe, myVoteRows] = await Promise.all([
    prisma.cafe.findUnique({
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
    }),
    session?.user?.id
      ? prisma.moodVote.findMany({
          where: { userId: session.user.id, cafeId: id },
          select: { moodId: true },
        })
      : Promise.resolve([]),
  ]);

  if (!cafe) notFound();

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
