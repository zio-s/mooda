'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Heart, Star, MapPin } from 'lucide-react';
import { PATHS } from '@/constants/paths';
import { OpenBadge } from '@/components/cafe/OpenBadge';
import { computeOpenStatus, type CafeHourInput } from '@/lib/cafe/openStatus';
import type { Cafe } from '@/types';
import {
  CardLink,
  CardWrapper,
  PhotoArea,
  PhotoCarousel,
  PhotoSlide,
  PhotoDots,
  PhotoDot,
  PhotoCountPill,
  PhotoPlaceholder,
  BadgeAnchor,
  Content,
  TitleRow,
  CafeName,
  FavoriteBtn,
  MetaRow,
  MetaItem,
  MoodTags,
  MoodTag,
} from './CafeCard.styles';

const DOT_MAX = 3;

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

  const openStatus = useMemo(() => {
    if (!cafe.hours || cafe.hours.length === 0) {
      if (cafe.isOpen === true) return 'open' as const;
      if (cafe.isOpen === false) return 'closed' as const;
      return null;
    }
    const normalized: CafeHourInput[] = cafe.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ?? null,
      closeTime: h.closeTime ?? null,
      isClosed: h.isClosed,
    }));
    return computeOpenStatus(normalized);
  }, [cafe.hours, cafe.isOpen]);

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

  // PhotoCarousel 스와이프와 CardLink 탭 충돌 해소. PhotoCarousel 위에서
  // touchstart→touchmove 거리 10px 초과면 swipedRef=true로 표시, 직후
  // CardLink click이 발사되면 preventDefault로 네비게이션 차단.
  const swipedRef = useRef(false);
  const touchStartXRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? 0;
    swipedRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const x = e.touches[0]?.clientX ?? touchStartXRef.current;
    if (Math.abs(x - touchStartXRef.current) > 10) {
      swipedRef.current = true;
    }
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (swipedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      swipedRef.current = false;
    }
  }, []);

  return (
    <CardLink
      href={PATHS.CafeDetail(cafe.id)}
      aria-label={`${cafe.name} 상세 페이지로 이동`}
      onClick={handleCardClick}
    >
      <CardWrapper>
        <PhotoArea $compact={compact}>
          {photos.length > 0 ? (
            hasMultiplePhotos ? (
              <>
                <PhotoCarousel
                  ref={scrollRef}
                  onScroll={handleScroll}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
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
                {photos.length <= DOT_MAX ? (
                  <PhotoDots>
                    {photos.map((_, i) => (
                      <PhotoDot key={i} $active={i === activeSlide} />
                    ))}
                  </PhotoDots>
                ) : (
                  <PhotoCountPill aria-label={`사진 ${activeSlide + 1} / ${photos.length}`}>
                    {activeSlide + 1} / {photos.length}
                  </PhotoCountPill>
                )}
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
          {openStatus && (
            <BadgeAnchor>
              <OpenBadge status={openStatus} size="sm" />
            </BadgeAnchor>
          )}
        </PhotoArea>

        <Content>
          <TitleRow>
            <CafeName>{cafe.name}</CafeName>
            {onFavorite && (
              <FavoriteBtn
                type="button"
                aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                onClick={(e) => {
                  // 카드 전체가 링크이므로 ♥ 버튼은 상세 이동을 막고 자기 로직만.
                  e.preventDefault();
                  e.stopPropagation();
                  onFavorite(cafe.id, !!isFavorited);
                }}
              >
                <Heart
                  size={16}
                  fill={isFavorited ? '#ef4444' : 'none'}
                  color={isFavorited ? '#ef4444' : 'currentColor'}
                  aria-hidden
                />
              </FavoriteBtn>
            )}
          </TitleRow>

          <MetaRow>
            <MetaItem>
              <Star size={12} fill="#fbbf24" color="#fbbf24" aria-hidden />
              {cafe.avgRating.toFixed(1)}
              <span>({cafe.reviewCount})</span>
            </MetaItem>
            {cafe.distance !== undefined && (
              <MetaItem>
                <MapPin size={12} aria-hidden />
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
    </CardLink>
  );
}
