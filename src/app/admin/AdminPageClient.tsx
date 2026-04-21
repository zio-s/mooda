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

// 관리자 대시보드 카테고리별 색상. cafe만 brand와 맞추고 나머지는 통계 시각화
// 구분용 별도 hue (의도적 하드코딩).
const STAT_COLORS = {
  cafe: '#b45309',   // = theme.colors.primary
  review: '#eab308', // amber-500 (리뷰)
  user: '#3b82f6',   // blue-500 (유저)
  search: '#a855f7', // purple-500 (검색)
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
