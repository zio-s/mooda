'use client';

import { Footprints, TrainFront, Bus, Clock, ArrowRightLeft, MapPin, Navigation } from 'lucide-react';
import type { TransitRoute, TransitSegment } from '@/types';
import {
  RouteWrap,
  RouteSummary,
  SummaryChip,
  RouteDivider,
  StepList,
  StepItem,
  StepIcon,
  StepConnector,
  StepContent,
  StepTitle,
  LineBadge,
  StepMeta,
  StepStation,
  RouteSkeleton,
  SkeletonLine,
  RouteError,
  LocationPrompt,
} from './RouteDetail.styles';

// ─── 경로 요약 (PEEK 영역에 표시) ──────────────────────────────────
interface RouteSummaryBarProps {
  route: TransitRoute | undefined;
  isLoading: boolean;
  isError: boolean;
  hasLocation: boolean;
  distance?: number;
  onRequestLocation?: () => void;
}

export function RouteSummaryBar({
  route,
  isLoading,
  isError,
  hasLocation,
  distance,
  onRequestLocation,
}: RouteSummaryBarProps) {
  if (!hasLocation) {
    return (
      <LocationPrompt onClick={onRequestLocation}>
        <Navigation size={12} />
        위치 권한을 허용하면 경로를 안내해드려요
      </LocationPrompt>
    );
  }

  if (isLoading) {
    return (
      <RouteSummary>
        <SkeletonLine $w="120px" style={{ height: 12 }} />
      </RouteSummary>
    );
  }

  if (isError || !route) {
    return (
      <RouteSummary>
        {distance !== undefined && (
          <SummaryChip>
            <MapPin size={11} />
            <strong>{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</strong>
          </SummaryChip>
        )}
      </RouteSummary>
    );
  }

  return (
    <RouteSummary>
      <SummaryChip>
        <Clock size={11} />
        <strong>{route.totalTime}분</strong>
      </SummaryChip>
      <SummaryChip>
        <ArrowRightLeft size={11} />
        환승 <strong>{route.transferCount}</strong>회
      </SummaryChip>
      {distance !== undefined && (
        <SummaryChip>
          <MapPin size={11} />
          <strong>{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</strong>
        </SummaryChip>
      )}
    </RouteSummary>
  );
}

// ─── 경로 상세 (EXPANDED 영역에 표시) ───────────────────────────────
interface RouteStepsProps {
  route: TransitRoute | undefined;
  isLoading: boolean;
  isError: boolean;
  hasLocation: boolean;
}

export function RouteSteps({ route, isLoading, isError, hasLocation }: RouteStepsProps) {
  if (!hasLocation) return null;

  if (isLoading) {
    return (
      <RouteSkeleton>
        <SkeletonLine $w="60%" />
        <SkeletonLine $w="80%" />
        <SkeletonLine $w="50%" />
      </RouteSkeleton>
    );
  }

  if (isError) {
    return (
      <RouteError>
        경로를 찾을 수 없습니다
      </RouteError>
    );
  }

  if (!route || route.segments.length === 0) return null;

  return (
    <>
      <RouteDivider />
      <RouteWrap>
        <StepList>
          {route.segments.map((seg, i) => (
            <SegmentStep
              key={i}
              segment={seg}
              isLast={i === route.segments.length - 1}
            />
          ))}
        </StepList>

        {/* 요금 */}
        <StepMeta style={{ paddingTop: 4, paddingLeft: 34 }}>
          요금 약 {route.fare.toLocaleString()}원
        </StepMeta>
      </RouteWrap>
    </>
  );
}

// ─── 개별 경로 구간 ─────────────────────────────────────────────────
function SegmentStep({ segment, isLast }: { segment: TransitSegment; isLast: boolean }) {
  if (segment.type === 'walk') {
    return (
      <StepItem>
        <StepIcon $color="#9ca3af">
          <Footprints />
        </StepIcon>
        {!isLast && <StepConnector $color="#e5e7eb" />}
        <StepContent>
          <StepTitle>도보 {segment.walkTime}분</StepTitle>
        </StepContent>
      </StepItem>
    );
  }

  if (segment.type === 'subway') {
    return (
      <StepItem>
        <StepIcon $color={segment.subwayColor}>
          <TrainFront />
        </StepIcon>
        {!isLast && <StepConnector $color={segment.subwayColor} />}
        <StepContent>
          <StepTitle>
            <LineBadge $color={segment.subwayColor!}>
              {segment.subwayLine}
            </LineBadge>
            {segment.sectionTime}분
          </StepTitle>
          <StepStation>
            {segment.startStation} → {segment.endStation}
            {segment.stationCount ? ` · ${segment.stationCount}개역` : ''}
          </StepStation>
        </StepContent>
      </StepItem>
    );
  }

  // bus
  return (
    <StepItem>
      <StepIcon $color={segment.busColor}>
        <Bus />
      </StepIcon>
      {!isLast && <StepConnector $color={segment.busColor} />}
      <StepContent>
        <StepTitle>
          <LineBadge $color={segment.busColor!}>
            {segment.busNo}
          </LineBadge>
          {segment.busType} · {segment.sectionTime}분
        </StepTitle>
        <StepStation>
          {segment.startStop} → {segment.endStop}
          {segment.stopCount ? ` · ${segment.stopCount}정거장` : ''}
        </StepStation>
      </StepContent>
    </StepItem>
  );
}
