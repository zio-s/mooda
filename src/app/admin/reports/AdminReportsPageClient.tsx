'use client';

import { PageContainer, PageTitle, EmptyText } from './page.styles';

export function AdminReportsPageClient() {
  return (
    <PageContainer>
      <PageTitle>신고 관리</PageTitle>
      <EmptyText>신고된 콘텐츠가 없습니다.</EmptyText>
    </PageContainer>
  );
}
