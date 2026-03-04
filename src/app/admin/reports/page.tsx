import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { AdminReportsPageClient } from './AdminReportsPageClient';

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') redirect(PATHS.Map);

  return <AdminReportsPageClient />;
}
