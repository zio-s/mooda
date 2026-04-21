'use client';

import {
  Clock,
  ExternalLink,
  Instagram,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { OpenBadge } from '@/components/cafe/OpenBadge';
import {
  computeOpenStatus,
  type CafeHourInput,
} from '@/lib/cafe/openStatus';
import { theme } from '@/styles/theme';
import { PATHS } from '@/constants/paths';
import type { Cafe } from '@/types';
import {
  Body,
  MetaSection,
  StatusLine,
  CafeTitle,
  MetaInline,
  MetaInlineItem,
  ActionsGrid,
  ActionCell,
  SectionTitle,
  MoodChipRow,
  MoodChip,
  MoodCount,
  InfoList,
  InfoRow,
  InfoLink,
  ReviewHeader,
  ReviewAllLink,
  EmptyLine,
  type Variant,
} from './CafeDetailBody.styles';

interface Props {
  cafe: Cafe;
  variant: Variant;
  /**
   * true 면 `리뷰 전체보기 →` 링크 숨김. 상세 페이지(`variant='page'`) 에서는
   * 같은 페이지 내부이므로 링크가 무의미.
   */
  hideReviewLink?: boolean;
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

function formatDistance(m?: number): string | null {
  if (m === undefined) return null;
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

function formatToday(cafe: Cafe): string | null {
  const day = new Date().getDay();
  const h = cafe.hours?.find((x) => x.dayOfWeek === day);
  if (!h) return null;
  if (h.isClosed) return `${WEEKDAY_KO[day]}요일 정기휴무`;
  if (h.openTime && h.closeTime) return `오늘 ${h.openTime}–${h.closeTime}`;
  return null;
}

function openDirections(cafe: Cafe): void {
  if (typeof window === 'undefined') return;
  const name = encodeURIComponent(cafe.name);
  const app = `nmap://route/public?dlat=${cafe.lat}&dlng=${cafe.lng}&dname=${name}&appname=mooda.app`;
  const web = `https://map.naver.com/p/directions/-/${cafe.lng},${cafe.lat},${name},,PLACE_POI/-/transit`;
  const hidden = document.visibilityState === 'hidden';
  let handled = hidden;
  const onVis = () => {
    if (document.visibilityState === 'hidden') handled = true;
  };
  document.addEventListener('visibilitychange', onVis, { once: true });
  window.location.href = app;
  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', onVis);
    if (!handled) window.open(web, '_blank', 'noopener');
  }, 800);
}

async function shareCafe(cafe: Cafe): Promise<void> {
  if (typeof window === 'undefined') return;
  const url = `${window.location.origin}${PATHS.CafeDetail(cafe.id)}`;
  const data = { title: cafe.name, text: `${cafe.name} · Mooda`, url };
  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    navigator.canShare?.(data)
  ) {
    try {
      await navigator.share(data);
      return;
    } catch {
      /* 사용자 취소 → 클립보드 폴백 */
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('링크를 복사했어요');
  } catch {
    toast.error('공유에 실패했어요');
  }
}

export function CafeDetailBody({ cafe, variant, hideReviewLink }: Props) {
  const openStatus = (() => {
    if (!cafe.hours || cafe.hours.length === 0) return null;
    const normalized: CafeHourInput[] = cafe.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ?? null,
      closeTime: h.closeTime ?? null,
      isClosed: h.isClosed,
    }));
    return computeOpenStatus(normalized);
  })();

  const topMoods = [...cafe.moods]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 8);

  const distance = formatDistance(cafe.distance);
  const todayLabel = formatToday(cafe);

  function handleCall() {
    if (!cafe.phone) {
      toast.info('등록된 전화번호가 없어요');
      return;
    }
    window.location.href = `tel:${cafe.phone}`;
  }

  function handleInstagram() {
    if (!cafe.instagramUrl) {
      toast.info('인스타그램 정보가 없어요');
      return;
    }
    window.open(cafe.instagramUrl, '_blank', 'noopener');
  }

  return (
    <Body $variant={variant}>
      <MetaSection>
        <StatusLine>
          {openStatus && <OpenBadge status={openStatus} size="sm" />}
          {todayLabel && <span>{todayLabel}</span>}
        </StatusLine>
        <CafeTitle>{cafe.name}</CafeTitle>
        <MetaInline>
          <MetaInlineItem>
            <Star
              size={14}
              fill={theme.colors.star}
              color={theme.colors.star}
              aria-hidden
            />
            {cafe.avgRating.toFixed(1)}
            <span style={{ color: theme.colors.ink400 }}>
              ({cafe.reviewCount})
            </span>
          </MetaInlineItem>
          {distance && <MetaInlineItem>· {distance}</MetaInlineItem>}
        </MetaInline>
      </MetaSection>

      <ActionsGrid>
        <ActionCell type="button" onClick={() => openDirections(cafe)}>
          <Navigation size={18} aria-hidden />
          길찾기
        </ActionCell>
        <ActionCell type="button" onClick={handleCall} disabled={!cafe.phone}>
          <Phone size={18} aria-hidden />
          전화
        </ActionCell>
        <ActionCell
          type="button"
          onClick={handleInstagram}
          disabled={!cafe.instagramUrl}
        >
          <Instagram size={18} aria-hidden />
          인스타
        </ActionCell>
        <ActionCell type="button" onClick={() => shareCafe(cafe)}>
          <Share2 size={18} aria-hidden />
          공유
        </ActionCell>
      </ActionsGrid>

      {topMoods.length > 0 && (
        <section>
          <SectionTitle>이 카페의 분위기</SectionTitle>
          <MoodChipRow>
            {topMoods.map((m) => (
              <MoodChip key={m.moodId} $category={m.moodCategory}>
                {m.moodLabel}
                {m.voteCount > 0 && <MoodCount>{m.voteCount}</MoodCount>}
              </MoodChip>
            ))}
          </MoodChipRow>
        </section>
      )}

      <section>
        <SectionTitle>기본 정보</SectionTitle>
        <InfoList>
          <InfoRow>
            <MapPin size={16} aria-hidden />
            <span>
              {cafe.address}
              {cafe.addressDetail ? ` ${cafe.addressDetail}` : ''}
            </span>
          </InfoRow>
          {todayLabel && (
            <InfoRow>
              <Clock size={16} aria-hidden />
              <span>{todayLabel}</span>
            </InfoRow>
          )}
          {cafe.phone && (
            <InfoRow>
              <Phone size={16} aria-hidden />
              <InfoLink href={`tel:${cafe.phone}`}>{cafe.phone}</InfoLink>
            </InfoRow>
          )}
          {cafe.instagramUrl && (
            <InfoRow>
              <Instagram size={16} aria-hidden />
              <InfoLink
                href={cafe.instagramUrl}
                target="_blank"
                rel="noopener"
              >
                인스타그램
                <ExternalLink
                  size={11}
                  style={{ marginLeft: 3 }}
                  aria-hidden
                />
              </InfoLink>
            </InfoRow>
          )}
        </InfoList>
      </section>

      <section>
        <ReviewHeader>
          <SectionTitle style={{ margin: 0 }}>
            리뷰 {cafe.reviewCount}
          </SectionTitle>
          {!hideReviewLink && (
            <ReviewAllLink href={PATHS.CafeDetail(cafe.id)}>
              전체보기 →
            </ReviewAllLink>
          )}
        </ReviewHeader>
        {cafe.reviewCount === 0 ? (
          <EmptyLine>아직 등록된 리뷰가 없어요.</EmptyLine>
        ) : (
          <EmptyLine>
            전체 리뷰 {cafe.reviewCount}개는 상세 페이지에서 볼 수 있어요.
          </EmptyLine>
        )}
      </section>

      {/* Heart 버튼은 Overlay TopNav 에 위치 (variant='overlay'). 향후
          variant='page'/'sheet' 추가 시 body 하단 Favorite 섹션 확장 가능. */}
    </Body>
  );
}
