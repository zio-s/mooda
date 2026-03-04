'use client';

import { Coffee, Star, Search, Users } from 'lucide-react';
import { PATHS } from '@/constants/paths';
import {
  PageContainer,
  PageTitle,
  StatsGrid,
  StatCard,
  StatHeader,
  StatValue,
  AdminLinks,
  AdminLink,
} from './page.styles';

interface Props {
  cafeCount: number;
  reviewCount: number;
  userCount: number;
  searchCount: number;
}

const STAT_COLORS = {
  cafe: '#d97706',
  review: '#eab308',
  user: '#3b82f6',
  search: '#a855f7',
};

export function AdminPageClient({ cafeCount, reviewCount, userCount, searchCount }: Props) {
  const stats = [
    { label: '카페', value: cafeCount.toLocaleString(), Icon: Coffee, color: STAT_COLORS.cafe },
    { label: '리뷰', value: reviewCount.toLocaleString(), Icon: Star, color: STAT_COLORS.review },
    { label: '회원', value: userCount.toLocaleString(), Icon: Users, color: STAT_COLORS.user },
    { label: '검색', value: searchCount.toLocaleString(), Icon: Search, color: STAT_COLORS.search },
  ];

  return (
    <PageContainer>
      <PageTitle>관리자 대시보드</PageTitle>

      <StatsGrid>
        {stats.map((stat) => (
          <StatCard key={stat.label}>
            <StatHeader>
              <stat.Icon size={16} color={stat.color} />
              {stat.label}
            </StatHeader>
            <StatValue>{stat.value}</StatValue>
          </StatCard>
        ))}
      </StatsGrid>

      <AdminLinks>
        <AdminLink href={PATHS.AdminCafes}>카페 관리 →</AdminLink>
        <AdminLink href={PATHS.AdminReports}>신고 관리 →</AdminLink>
      </AdminLinks>
    </PageContainer>
  );
}
