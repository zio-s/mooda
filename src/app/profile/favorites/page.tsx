'use client';

import { useGetFavoritesQuery, useRemoveFavoriteMutation } from '@/store/api/cafesApi';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import {
  PageContainer,
  PageTitle,
  CafeGrid,
  EmptyState,
} from './page.styles';

export default function FavoritesPage() {
  const { data: cafes, isLoading } = useGetFavoritesQuery();
  const [removeFavorite] = useRemoveFavoriteMutation();

  async function handleUnfavorite(cafeId: string) {
    await removeFavorite(cafeId);
    toast.success('즐겨찾기에서 제거했습니다');
  }

  return (
    <PageContainer>
      <PageTitle>즐겨찾기</PageTitle>

      {isLoading ? (
        <CafeGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 208, borderRadius: 8 }} />
          ))}
        </CafeGrid>
      ) : !cafes?.length ? (
        <EmptyState>
          <Heart size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <p>즐겨찾기한 카페가 없습니다.</p>
        </EmptyState>
      ) : (
        <CafeGrid>
          {cafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              isFavorited
              onFavorite={handleUnfavorite}
            />
          ))}
        </CafeGrid>
      )}
    </PageContainer>
  );
}
