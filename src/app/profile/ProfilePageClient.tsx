'use client';

import { Heart, FolderOpen, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PATHS } from '@/constants/paths';
import {
  PageContainer,
  ProfileHeader,
  ProfileName,
  ProfileEmail,
  MenuList,
  MenuCard,
  MenuLabel,
} from './page.styles';

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfilePageClient({ user }: Props) {
  return (
    <PageContainer>
      <ProfileHeader>
        <Avatar size={64}>
          <AvatarImage src={user.image ?? ''} />
          <AvatarFallback>
            {user.name?.charAt(0) ?? user.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <ProfileName>{user.name ?? '사용자'}</ProfileName>
          <ProfileEmail>{user.email}</ProfileEmail>
        </div>
      </ProfileHeader>

      <MenuList>
        <MenuCard href={PATHS.Favorites}>
          <Heart size={20} color="#ef4444" />
          <MenuLabel>즐겨찾기</MenuLabel>
          <ChevronRight size={16} color="#9ca3af" />
        </MenuCard>
        <MenuCard href={PATHS.Collections}>
          <FolderOpen size={20} color="#d97706" />
          <MenuLabel>컬렉션</MenuLabel>
          <ChevronRight size={16} color="#9ca3af" />
        </MenuCard>
      </MenuList>
    </PageContainer>
  );
}
