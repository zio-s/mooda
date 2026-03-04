'use client';

import { CafeCard } from '@/components/cafe/CafeCard';
import type { Cafe } from '@/types';
import {
  PageContainer,
  PageTitle,
  PageDesc,
  CafeGrid,
  EmptyText,
} from './page.styles';

interface Props {
  name: string;
  description?: string | null;
  cafes: Cafe[];
}

export function CollectionDetailClient({ name, description, cafes }: Props) {
  return (
    <PageContainer>
      <PageTitle>{name}</PageTitle>
      {description && <PageDesc>{description}</PageDesc>}

      {cafes.length === 0 ? (
        <EmptyText>컬렉션에 카페를 추가해보세요.</EmptyText>
      ) : (
        <CafeGrid>
          {cafes.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </CafeGrid>
      )}
    </PageContainer>
  );
}
