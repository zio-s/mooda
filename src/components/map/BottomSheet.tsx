'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, MapPin, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useGetTransitRouteQuery } from '@/store/api/cafesApi';
import { RouteSummaryBar, RouteSteps } from './RouteDetail';
import type { Cafe } from '@/types';
import {
  Overlay,
  SheetWrap,
  HandleBar,
  InfoSection,
  TopRow,
  CafeName,
  CloseBtn,
  MetaRow,
  MetaItem,
  MoodChips,
  MoodChip,
  Actions,
  DetailLink,
  ExpandedSection,
  RouteSection,
  KakaoLink,
  ToggleBtn,
} from './BottomSheet.styles';
import { PATHS } from '@/constants/paths';

function formatDistance(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

interface BottomSheetProps {
  cafe: Cafe | null;
  onClose: () => void;
  onRequestLocation?: () => void;
}

export function BottomSheet({ cafe, onClose, onRequestLocation }: BottomSheetProps) {
  const [showRoute, setShowRoute] = useState(false);
  const [visible, setVisible] = useState(false);
  const [displayCafe, setDisplayCafe] = useState<Cafe | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLocation = useAppSelector((s) => s.map.userLocation);

  // 닫기 타이머 정리 헬퍼
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // cafe prop 변경에 반응
  useEffect(() => {
    if (cafe) {
      // 새 카페 → 대기 중인 닫기 취소, 표시
      clearCloseTimer();
      setDisplayCafe(cafe);
      setShowRoute(false);
      // CSS transition 트리거를 위해 다음 프레임에서 visible 설정
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // 카페 없음 → 슬라이드 아웃 후 데이터 클리어
      setVisible(false);
      const timer = setTimeout(() => setDisplayCafe(null), 400);
      return () => clearTimeout(timer);
    }
  }, [cafe, clearCloseTimer]);

  // unmount 시 타이머 정리
  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  // 경로 조회
  const { data: route, isLoading: routeLoading, isError: routeError } = useGetTransitRouteQuery(
    {
      fromLat: userLocation?.lat ?? 0,
      fromLng: userLocation?.lng ?? 0,
      toLat: displayCafe?.lat ?? 0,
      toLng: displayCafe?.lng ?? 0,
    },
    { skip: !displayCafe || !userLocation },
  );

  // X 버튼 / 오버레이 클릭 → 닫기
  const handleClose = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setVisible(false);
    setShowRoute(false);
    // 애니메이션 완료 후 부모에 알림
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 350);
  }, [onClose, clearCloseTimer]);

  const c = displayCafe;

  const topMoods = c?.moods
    ? [...c.moods].sort((a, b) => b.voteCount - a.voteCount).slice(0, 3)
    : [];

  const kakaoLink = c
    ? `https://map.kakao.com/link/to/${encodeURIComponent(c.name)},${c.lat},${c.lng}`
    : '#';

  const hasRoute = route || routeLoading;

  if (!c && !visible) return null;

  return (
    <>
      {visible && <Overlay onClick={handleClose} />}

      <SheetWrap $visible={visible}>
        <HandleBar />

        <InfoSection>
          <TopRow>
            <CafeName>{c?.name || '카페'}</CafeName>
            <CloseBtn onClick={handleClose} aria-label="닫기" type="button">
              <X size={16} />
            </CloseBtn>
          </TopRow>

          <MetaRow>
            <MetaItem>
              <Star size={12} fill="#fbbf24" color="#fbbf24" />
              {c?.avgRating != null ? c.avgRating.toFixed(1) : '–'}
              <span>({c?.reviewCount ?? 0})</span>
            </MetaItem>
            {c?.distance != null && (
              <MetaItem>
                <MapPin size={12} />
                {formatDistance(c.distance)}
              </MetaItem>
            )}
          </MetaRow>

          <RouteSummaryBar
            route={route}
            isLoading={routeLoading}
            isError={routeError}
            hasLocation={!!userLocation}
            distance={c?.distance}
            onRequestLocation={onRequestLocation}
          />

          {topMoods.length > 0 && (
            <MoodChips>
              {topMoods.map((m) => (
                <MoodChip key={m.moodId}>{m.moodLabel}</MoodChip>
              ))}
            </MoodChips>
          )}

          <Actions>
            {c?.id && (
              <DetailLink href={PATHS.CafeDetail(c.id)}>
                상세 보기
              </DetailLink>
            )}
            <KakaoLink href={kakaoLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={12} />
              카카오맵
            </KakaoLink>
            {hasRoute && (
              <ToggleBtn type="button" onClick={() => setShowRoute(!showRoute)}>
                경로 상세
                {showRoute ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </ToggleBtn>
            )}
          </Actions>
        </InfoSection>

        {showRoute && (
          <ExpandedSection>
            <RouteSection>
              <RouteSteps
                route={route}
                isLoading={routeLoading}
                isError={routeError}
                hasLocation={!!userLocation}
              />
            </RouteSection>
          </ExpandedSection>
        )}
      </SheetWrap>
    </>
  );
}
