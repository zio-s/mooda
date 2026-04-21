'use client';

import Image from 'next/image';
import { Coffee, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedCafe } from '@/store/slices/mapSlice';
import { OpenBadge } from '@/components/cafe/OpenBadge';
import {
  computeOpenStatus,
  type CafeHourInput,
} from '@/lib/cafe/openStatus';
import { CATEGORY_META } from '@/constants/moods';
import { theme } from '@/styles/theme';
import type { Cafe } from '@/types';
import {
  Wrapper,
  Thumb,
  ThumbPlaceholder,
  Content,
  TitleRow,
  CafeName,
  MetaRow,
  MetaItem,
  MoodRow,
  MoodTag,
} from './CafeListCard.styles';

interface CafeListCardProps {
  cafe: Cafe;
}

function formatDistance(m?: number): string | null {
  if (m === undefined) return null;
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

export function CafeListCard({ cafe }: CafeListCardProps) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.map.selectedCafeId);
  const isSelected = selectedId === cafe.id;

  const topMoods = [...cafe.moods]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3);

  // CafeCard 와 동일 패턴 — CafeHour(optional openTime) → CafeHourInput 정규화
  const openStatus = (() => {
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
  })();

  const mainPhoto = cafe.mainPhoto ?? cafe.photos?.[0]?.url ?? null;
  const distanceLabel = formatDistance(cafe.distance);

  return (
    <Wrapper
      type="button"
      $selected={isSelected}
      aria-pressed={isSelected}
      aria-label={`${cafe.name} 선택`}
      onClick={() => dispatch(setSelectedCafe(cafe.id))}
    >
      <Thumb>
        {mainPhoto ? (
          <Image src={mainPhoto} alt="" fill sizes="64px" />
        ) : (
          <ThumbPlaceholder aria-hidden>
            <Coffee size={22} strokeWidth={1.5} />
          </ThumbPlaceholder>
        )}
      </Thumb>
      <Content>
        <TitleRow>
          <CafeName>{cafe.name}</CafeName>
        </TitleRow>
        <MetaRow>
          <MetaItem>
            <Star
              size={12}
              fill={theme.colors.star}
              color={theme.colors.star}
              aria-hidden
            />
            {cafe.avgRating.toFixed(1)} ({cafe.reviewCount})
          </MetaItem>
          {distanceLabel && <MetaItem>· {distanceLabel}</MetaItem>}
          {openStatus && <OpenBadge status={openStatus} size="sm" />}
        </MetaRow>
        {topMoods.length > 0 && (
          <MoodRow>
            {topMoods.map((m) => (
              <MoodTag key={m.moodId} $category={m.moodCategory}>
                {m.moodLabel}
              </MoodTag>
            ))}
          </MoodRow>
        )}
      </Content>
    </Wrapper>
  );
}
