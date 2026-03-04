'use client';

import Image from 'next/image';
import { Heart, Star, MapPin } from 'lucide-react';
import { PATHS } from '@/constants/paths';
import type { Cafe } from '@/types';
import {
  CardWrapper,
  PhotoArea,
  PhotoPlaceholder,
  StatusBadge,
  Content,
  TitleRow,
  NameLink,
  CafeName,
  FavoriteBtn,
  MetaRow,
  MetaItem,
  MoodTags,
  MoodTag,
} from './CafeCard.styles';

interface CafeCardProps {
  cafe: Cafe;
  compact?: boolean;
  onFavorite?: (cafeId: string, isFav: boolean) => void;
  isFavorited?: boolean;
}

function formatDistance(m?: number) {
  if (m === undefined) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

export function CafeCard({ cafe, compact = false, onFavorite, isFavorited }: CafeCardProps) {
  const topMoods = [...cafe.moods]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3);

  return (
    <CardWrapper>
      <NameLink href={PATHS.CafeDetail(cafe.id)}>
        <PhotoArea $compact={compact}>
          {cafe.mainPhoto ? (
            <Image
              src={cafe.mainPhoto}
              alt={cafe.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <PhotoPlaceholder>☕</PhotoPlaceholder>
          )}
          {cafe.isOpen !== undefined && (
            <StatusBadge $open={!!cafe.isOpen}>
              {cafe.isOpen ? '영업중' : '영업종료'}
            </StatusBadge>
          )}
        </PhotoArea>
      </NameLink>

      <Content>
        <TitleRow>
          <NameLink href={PATHS.CafeDetail(cafe.id)}>
            <CafeName>{cafe.name}</CafeName>
          </NameLink>
          {onFavorite && (
            <FavoriteBtn
              onClick={(e) => {
                e.preventDefault();
                onFavorite(cafe.id, !!isFavorited);
              }}
            >
              <Heart
                size={16}
                fill={isFavorited ? '#ef4444' : 'none'}
                color={isFavorited ? '#ef4444' : 'currentColor'}
              />
            </FavoriteBtn>
          )}
        </TitleRow>

        <MetaRow>
          <MetaItem>
            <Star size={12} fill="#fbbf24" color="#fbbf24" />
            {cafe.avgRating.toFixed(1)}
            <span>({cafe.reviewCount})</span>
          </MetaItem>
          {cafe.distance !== undefined && (
            <MetaItem>
              <MapPin size={12} />
              {formatDistance(cafe.distance)}
            </MetaItem>
          )}
        </MetaRow>

        {!compact && topMoods.length > 0 && (
          <MoodTags>
            {topMoods.map((mood) => (
              <MoodTag key={mood.moodId}>{mood.moodLabel}</MoodTag>
            ))}
          </MoodTags>
        )}
      </Content>
    </CardWrapper>
  );
}
