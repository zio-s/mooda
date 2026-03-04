import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { prisma } from '@/lib/prisma';
import { AdminPageClient } from './AdminPageClient';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') redirect(PATHS.Map);

  const [cafeCount, reviewCount, userCount, searchCount] = await Promise.all([
    prisma.cafe.count(),
    prisma.review.count(),
    prisma.user.count(),
    prisma.searchLog.count(),
  ]);

  return (
    <AdminPageClient
      cafeCount={cafeCount}
      reviewCount={reviewCount}
      userCount={userCount}
      searchCount={searchCount}
    />
  );
}
