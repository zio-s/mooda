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
  try {
    return await prisma.cafe.findUnique({
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
  } catch (error) {
    console.error(`getCafe(${id}) failed:`, error instanceof Error ? error.message : error);
    throw error;
  }
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

  const [myVoteRows, favoriteRow] = await Promise.all([
    session?.user?.id
      ? prisma.moodVote.findMany({
          where: { userId: session.user.id, cafeId: id },
          select: { moodId: true },
        })
      : [],
    session?.user?.id
      ? prisma.userFavorite.findFirst({
          where: { userId: session.user.id, cafeId: id },
          select: { id: true },
        })
      : null,
  ]);

  const cafeData = {
    id: cafe.id,
    name: cafe.name,
    address: cafe.address,
    addressDetail: cafe.addressDetail ?? null,
    lat: cafe.lat,
    lng: cafe.lng,
    phone: cafe.phone ?? null,
    kakaoPlaceId: cafe.kakaoPlaceId ?? null,
    kakaoUrl: cafe.kakaoUrl ?? null,
    instagramUrl: cafe.instagramUrl ?? null,
    website: cafe.website ?? null,
    description: cafe.description ?? null,
    district: cafe.district ?? null,
    neighborhood: cafe.neighborhood ?? null,
    avgRating: cafe.avgRating,
    reviewCount: cafe.reviewCount,
    mainPhoto: cafe.photos.find((p) => p.isMain)?.url ?? cafe.photos[0]?.url ?? null,
    photos: cafe.photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption ?? null,
      isMain: p.isMain,
    })),
    hours: cafe.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ?? null,
      closeTime: h.closeTime ?? null,
      isClosed: h.isClosed,
    })),
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
    isFavorited: !!favoriteRow,
    distance: undefined,
    isOpen: undefined,
    createdAt: cafe.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: cafe.updatedAt?.toISOString() ?? new Date().toISOString(),
  };

  return <CafeDetailClient cafe={cafeData} />;
}
