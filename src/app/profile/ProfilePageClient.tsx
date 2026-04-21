'use client';

import { Heart, FolderOpen, ChevronRight, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMyStatsQuery } from '@/store/api/cafesApi';
import { PATHS } from '@/constants/paths';
import { theme } from '@/styles/theme';
import {
  PageContainer,
  ProfileHeader,
  ProfileIdentity,
  ProfileName,
  ProfileEmail,
  StatsRow,
  StatCard,
  StatCardLink,
  StatValue,
  StatLabel,
  MenuList,
  MenuCard,
  MenuIconBox,
  MenuLabel,
  MenuCount,
  Divider,
  DangerButton,
} from './page.styles';

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function StatValueDisplay({
  value,
  isLoading,
}: {
  value: number | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton style={{ width: 28, height: 22, borderRadius: 6 }} />;
  }
  return <StatValue>{value ?? 0}</StatValue>;
}

export function ProfilePageClient({ user }: Props) {
  const { data: stats, isLoading } = useGetMyStatsQuery();

  return (
    <PageContainer>
      <ProfileHeader>
        <Avatar size={72}>
          <AvatarImage src={user.image ?? ''} />
          <AvatarFallback>
            {user.name?.charAt(0) ?? user.email?.charAt(0) ?? 'M'}
          </AvatarFallback>
        </Avatar>
        <ProfileIdentity>
          <ProfileName>{user.name ?? '사용자'}</ProfileName>
          {user.email && <ProfileEmail>{user.email}</ProfileEmail>}
        </ProfileIdentity>
      </ProfileHeader>

      <StatsRow>
        <StatCardLink href={PATHS.Favorites} aria-label="즐겨찾기 목록 열기">
          <StatValueDisplay value={stats?.favoriteCount} isLoading={isLoading} />
          <StatLabel>즐겨찾기</StatLabel>
        </StatCardLink>
        <StatCardLink href={PATHS.Collections} aria-label="컬렉션 목록 열기">
          <StatValueDisplay value={stats?.collectionCount} isLoading={isLoading} />
          <StatLabel>컬렉션</StatLabel>
        </StatCardLink>
        <StatCard aria-label="내 리뷰 수">
          <StatValueDisplay value={stats?.reviewCount} isLoading={isLoading} />
          <StatLabel>내 리뷰</StatLabel>
        </StatCard>
      </StatsRow>

      <MenuList>
        <MenuCard href={PATHS.Favorites}>
          <MenuIconBox $variant="err" aria-hidden>
            <Heart size={18} />
          </MenuIconBox>
          <MenuLabel>즐겨찾기</MenuLabel>
          <MenuCount>{stats?.favoriteCount ?? 0}</MenuCount>
          <ChevronRight size={16} color={theme.colors.ink400} aria-hidden />
        </MenuCard>
        <MenuCard href={PATHS.Collections}>
          <MenuIconBox $variant="primary" aria-hidden>
            <FolderOpen size={18} />
          </MenuIconBox>
          <MenuLabel>컬렉션</MenuLabel>
          <MenuCount>{stats?.collectionCount ?? 0}</MenuCount>
          <ChevronRight size={16} color={theme.colors.ink400} aria-hidden />
        </MenuCard>
      </MenuList>

      <Divider />

      <DangerButton type="button" onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut size={16} aria-hidden />
        로그아웃
      </DangerButton>
    </PageContainer>
  );
}
