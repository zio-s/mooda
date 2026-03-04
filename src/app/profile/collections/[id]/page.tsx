import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { prisma } from '@/lib/prisma';
import { CollectionDetailClient } from './CollectionDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect(PATHS.Login);

  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          cafe: {
            include: {
              photos: { where: { isMain: true }, take: 1 },
              moods: { include: { mood: true }, take: 3 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!collection) notFound();

  const cafes = collection.items.map((item) => ({
    ...item.cafe,
    mainPhoto: item.cafe.photos[0]?.url ?? null,
    photos: item.cafe.photos,
    moods: item.cafe.moods.map((cm) => ({
      moodId: cm.moodId,
      moodKey: cm.mood.key,
      moodLabel: cm.mood.label,
      moodCategory: cm.mood.category,
      voteCount: cm.voteCount,
    })),
    hours: [],
    reviews: [],
    isFavorited: false,
    distance: undefined,
    isOpen: undefined,
  }));

  return (
    <CollectionDetailClient
      name={collection.name}
      description={collection.description}
      cafes={cafes}
    />
  );
}
