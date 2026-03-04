'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAnimation, type PanInfo } from 'framer-motion';
import { Star, MapPin, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useGetTransitRouteQuery } from '@/store/api/cafesApi';
import { RouteSummaryBar, RouteSteps } from './RouteDetail';
import type { Cafe } from '@/types';
import {
  SheetWrap,
  DragHandle,
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
} from './BottomSheet.styles';
import { PATHS } from '@/constants/paths';

// ─── 상수 ────────────────────────────────────────────────────────────
const HIDDEN_Y = 500;
const SPRING = { type: 'spring' as const, damping: 32, stiffness: 320 };

function formatDistance(m?: number) {
  if (m === undefined) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

// ─── Props ──────────────────────────────────────────────────────────
interface BottomSheetProps {
  cafe: Cafe | null;
  onClose: () => void;
  onRequestLocation?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────
export function BottomSheet({ cafe, onClose, onRequestLocation }: BottomSheetProps) {
  const controls = useAnimation();
  const [expanded, setExpanded] = useState(true);
  const infoRef = useRef<HTMLDivElement>(null);

  const userLocation = useAppSelector((s) => s.map.userLocation);

  // 경로 조회 (카페 선택 + 현위치 있을 때만)
  const { data: route, isLoading: routeLoading, isError: routeError } = useGetTransitRouteQuery(
    {
      fromLat: userLocation?.lat ?? 0,
      fromLng: userLocation?.lng ?? 0,
      toLat: cafe?.lat ?? 0,
      toLng: cafe?.lng ?? 0,
    },
    { skip: !cafe || !userLocation },
  );

  // ── cafe 변경 시 시트 표시/숨김 ────────────────────────────────────
  useEffect(() => {
    if (cafe) {
      setExpanded(true);
      controls.start({ y: 0, transition: SPRING });
    } else {
      setExpanded(true);
      controls.start({ y: HIDDEN_Y, transition: SPRING });
    }
  }, [cafe, controls]);

  // ── 닫기 ─────────────────────────────────────────────────────────
  const handleClose = useCallback(async () => {
    await controls.start({ y: HIDDEN_Y, transition: SPRING });
    setExpanded(false);
    onClose();
  }, [controls, onClose]);

  // ── 드래그 종료 스냅 로직 ─────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      const { velocity, offset } = info;

      if (velocity.y > 400 || offset.y > 80) {
        await handleClose();
        return;
      }

      // 원래 위치로 복귀
      controls.start({ y: 0, transition: SPRING });
    },
    [controls, handleClose],
  );

  // ── 확장 토글 ─────────────────────────────────────────────────────
  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // ── 데이터 ────────────────────────────────────────────────────────
  const topMoods = [...(cafe?.moods ?? [])]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3);

  // 카카오맵 딥링크
  const kakaoLink = cafe
    ? `https://map.kakao.com/link/to/${encodeURIComponent(cafe.name)},${cafe.lat},${cafe.lng}`
    : '#';

  // ─────────────────────────────────────────────────────────────────
  return (
    <SheetWrap
      animate={controls}
      initial={{ y: HIDDEN_Y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: HIDDEN_Y }}
      dragElastic={{ top: 0.05, bottom: 0 }}
      onDragEnd={handleDragEnd}
    >
      {/* ── 드래그 핸들 ───────────────────────────────────────────── */}
      <DragHandle>
        <HandleBar />
      </DragHandle>

      {/* ── 정보 영역 ────────────────────────────────────────────── */}
      <InfoSection ref={infoRef}>
        <TopRow>
          <CafeName>{cafe?.name ?? ''}</CafeName>
          <CloseBtn
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            aria-label="닫기"
          >
            <X size={16} />
          </CloseBtn>
        </TopRow>

        <MetaRow>
          <MetaItem>
            <Star size={12} fill="#fbbf24" color="#fbbf24" />
            {cafe?.avgRating.toFixed(1) ?? '–'}
            <span>({cafe?.reviewCount ?? 0})</span>
          </MetaItem>
          {cafe?.distance !== undefined && (
            <MetaItem>
              <MapPin size={12} />
              {formatDistance(cafe.distance)}
            </MetaItem>
          )}
        </MetaRow>

        {/* 경로 요약 (시간, 환승, 거리) */}
        <RouteSummaryBar
          route={route}
          isLoading={routeLoading}
          isError={routeError}
          hasLocation={!!userLocation}
          distance={cafe?.distance}
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
          {cafe && (
            <DetailLink href={PATHS.CafeDetail(cafe.id)}>
              상세 보기
            </DetailLink>
          )}
          <KakaoLink href={kakaoLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} />
            카카오맵
          </KakaoLink>
          {(route || routeLoading) && (
            <button
              onClick={handleToggleExpand}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '6px 10px', border: 'none', borderRadius: 8,
                background: '#f3f4f6', color: '#374151',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {expanded ? '경로 접기' : '경로 상세'}
              {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          )}
        </Actions>
      </InfoSection>

      {/* ── 경로 상세 (확장 시 표시) ──────────────────────────────── */}
      {expanded && (
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
  );
}
