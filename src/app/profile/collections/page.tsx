import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { prisma } from '@/lib/prisma';
import { CollectionsPageClient } from './CollectionsPageClient';

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(PATHS.Login);

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return <CollectionsPageClient collections={collections} />;
}
