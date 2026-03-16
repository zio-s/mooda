'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Heart, Star, MapPin } from 'lucide-react';
import { PATHS } from '@/constants/paths';
import type { Cafe } from '@/types';
import {
  CardWrapper,
  PhotoArea,
  PhotoCarousel,
  PhotoSlide,
  PhotoDots,
  PhotoDot,
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

  const photos = cafe.photos?.length > 0 ? cafe.photos : [];
  const hasMultiplePhotos = photos.length > 1;
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveSlide(idx);
  }, []);

  return (
    <CardWrapper>
      <NameLink href={PATHS.CafeDetail(cafe.id)}>
        <PhotoArea $compact={compact}>
          {photos.length > 0 ? (
            hasMultiplePhotos ? (
              <>
                <PhotoCarousel ref={scrollRef} onScroll={handleScroll}>
                  {photos.map((photo, i) => (
                    <PhotoSlide key={photo.id}>
                      <Image
                        src={photo.url}
                        alt={`${cafe.name} ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </PhotoSlide>
                  ))}
                </PhotoCarousel>
                <PhotoDots>
                  {photos.map((_, i) => (
                    <PhotoDot key={i} $active={i === activeSlide} />
                  ))}
                </PhotoDots>
              </>
            ) : (
              <Image
                src={photos[0].url}
                alt={cafe.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            )
          ) : cafe.mainPhoto ? (
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
