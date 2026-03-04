import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PATHS } from '@/constants/paths';
import { ProfilePageClient } from './ProfilePageClient';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect(PATHS.Login);

  return (
    <ProfilePageClient
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
