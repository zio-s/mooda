import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { prisma } from '@/lib/prisma';
import { AdminCafesPageClient } from './AdminCafesPageClient';

export default async function AdminCafesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') redirect(PATHS.Map);

  const cafes = await prisma.cafe.findMany({
    include: {
      _count: { select: { reviews: true, moods: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <AdminCafesPageClient cafes={cafes} />;
}
