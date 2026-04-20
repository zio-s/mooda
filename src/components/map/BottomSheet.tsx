'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Star, MapPin, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useGetTransitRouteQuery } from '@/store/api/cafesApi';
import { RouteSummaryBar, RouteSteps } from './RouteDetail';
import { OpenBadge } from '@/components/cafe/OpenBadge';
import { computeOpenStatus, type CafeHourInput } from '@/lib/cafe/openStatus';
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
  NaverDirectionsLink,
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

  const openStatus = useMemo(() => {
    if (!c) return null;
    if (!c.hours || c.hours.length === 0) {
      if (c.isOpen === true) return 'open' as const;
      if (c.isOpen === false) return 'closed' as const;
      return null;
    }
    const normalized: CafeHourInput[] = c.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ?? null,
      closeTime: h.closeTime ?? null,
      isClosed: h.isClosed,
    }));
    return computeOpenStatus(normalized);
  }, [c]);

  // 길찾기는 네이버지도 웹으로. 모바일에선 앱 딥링크가 먼저 뜨게끔
  // handleDirections에서 처리, 여기 링크는 웹 폴백/desktop용.
  const naverLink = c
    ? `https://map.naver.com/p/directions/-/${c.lng},${c.lat},${encodeURIComponent(c.name)},,PLACE_POI/-/transit`
    : '#';

  const handleDirections = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!c) return;
    // 앱 딥링크 시도 → 실패 시 웹으로 폴백. e.preventDefault로 기본 웹 이동을 막고
    // 수동으로 순서를 제어한다.
    e.preventDefault();
    const name = encodeURIComponent(c.name);
    const appUrl = `nmap://route/public?dlat=${c.lat}&dlng=${c.lng}&dname=${name}&appname=mooda.app`;
    let handled = document.visibilityState === 'hidden';
    const onVis = () => {
      if (document.visibilityState === 'hidden') handled = true;
    };
    document.addEventListener('visibilitychange', onVis, { once: true });
    window.location.href = appUrl;
    window.setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis);
      if (!handled) window.location.href = naverLink;
    }, 800);
  }, [c, naverLink]);

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
            {openStatus && <OpenBadge status={openStatus} size="md" />}
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
            <NaverDirectionsLink
              href={naverLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDirections}
            >
              <ExternalLink size={12} />
              네이버지도 길찾기
            </NaverDirectionsLink>
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
