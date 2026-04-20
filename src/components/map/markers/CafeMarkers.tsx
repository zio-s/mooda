'use client';

import { memo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CustomOverlayMap, MapMarker, MarkerClusterer } from 'react-kakao-maps-sdk';
import { Star } from 'lucide-react';
import { theme } from '@/styles/theme';
import type { Cafe, MapBounds } from '@/types';

/**
 * Marker LOD (03_screens.md § 01 지도 · 마커)
 *
 *  Kakao level ↓ = zoom ↑.
 *  - level ≤ 4  (~zoom ≥ 16, 축척 100m 이내) : 이름 pill
 *  - level 5–7  (~zoom 13-15, 축척 250m–1km) : 도트 (22px brand + 2.5 white)
 *  - level ≥ 8  (~zoom ≤ 12, 축척 2km+)       : MarkerClusterer — halo 40 / inner 28
 */
const PILL_MAX_LEVEL = 4;
const DOT_MAX_LEVEL = 7;
// ±10% 패딩 내 마커만 렌더 (화면 밖 마커는 DOM에 두지 않음)
const BOUNDS_PADDING_RATIO = 0.1;

function withinPaddedBounds(cafe: Cafe, bounds: MapBounds | null): boolean {
  if (!bounds) return true;
  const latPad = (bounds.neLat - bounds.swLat) * BOUNDS_PADDING_RATIO;
  const lngPad = (bounds.neLng - bounds.swLng) * BOUNDS_PADDING_RATIO;
  return (
    cafe.lat >= bounds.swLat - latPad &&
    cafe.lat <= bounds.neLat + latPad &&
    cafe.lng >= bounds.swLng - lngPad &&
    cafe.lng <= bounds.neLng + lngPad
  );
}

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
  50% { transform: translateY(-5px); }
  70% { transform: translateY(-8px); }
`;

const markerBase = css`
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
`;

const NamePill = styled.div<{ $selected: boolean }>`
  ${markerBase}
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  color: ${({ $selected }) =>
    $selected ? theme.colors.white : theme.colors.ink900};
  background: ${({ $selected }) =>
    $selected ? theme.colors.primary : theme.colors.white};
  border: 1.5px solid
    ${({ $selected }) => ($selected ? theme.colors.primary : theme.colors.ink200)};
  box-shadow: ${theme.shadows.md};
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform 0.12s ease;

  ${({ $selected }) =>
    $selected &&
    css`
      transform: scale(1.05);
      animation: ${bounce} 0.6s ease-out;
    `}

  svg {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }
`;

const Dot = styled.div<{ $selected: boolean }>`
  ${markerBase}
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: ${theme.colors.primary};
  border: 2.5px solid ${theme.colors.white};
  box-shadow: ${theme.shadows.md};
  transform-origin: center;
  transition: transform 0.12s ease;

  ${({ $selected }) =>
    $selected &&
    css`
      transform: scale(1.25);
      animation: ${bounce} 0.6s ease-out;
    `}
`;

const DotStar = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: ${theme.colors.white};
  color: ${theme.colors.primary};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 10px;
    height: 10px;
  }
`;

type MarkerMode = 'pill' | 'dot' | 'cluster';

function resolveMode(level: number): MarkerMode {
  if (level <= PILL_MAX_LEVEL) return 'pill';
  if (level <= DOT_MAX_LEVEL) return 'dot';
  return 'cluster';
}

/**
 * Cluster 모드에서 Kakao MarkerClusterer는 자식 <MapMarker>만 받는다.
 * 외톨이 (묶이지 않은) 마커는 원본 이미지 그대로 보이므로, `/marker-normal.svg`
 * 대신 스펙상 "도트" 모양 SVG를 data URL로 주입해 스타일을 통일한다.
 */
const BRAND_HEX = '#b45309';
const BRAND_HEX_URL = encodeURIComponent(BRAND_HEX);
const DOT_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'><circle cx='11' cy='11' r='8.25' fill='${BRAND_HEX_URL}' stroke='white' stroke-width='2.5'/></svg>`;

/**
 * Kakao MarkerClusterer styles — halo 40 / inner 28 / white 12/700.
 * box-shadow의 spread 6px로 halo를 단일 엘리먼트에 담는다(28 + 6*2 = 40).
 * 카페 수 구간마다 살짝 크기를 키워 밀도 표현.
 */
const CLUSTER_STYLES = [
  {
    width: '28px',
    height: '28px',
    background: BRAND_HEX,
    color: '#ffffff',
    borderRadius: '50%',
    textAlign: 'center' as const,
    lineHeight: '28px',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: 'rgba(180,83,9,0.22) 0 0 0 6px, rgba(28,25,23,0.18) 0 2px 8px',
    border: '0',
  },
  {
    width: '32px',
    height: '32px',
    background: BRAND_HEX,
    color: '#ffffff',
    borderRadius: '50%',
    textAlign: 'center' as const,
    lineHeight: '32px',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: 'rgba(180,83,9,0.22) 0 0 0 7px, rgba(28,25,23,0.2) 0 2px 10px',
    border: '0',
  },
  {
    width: '40px',
    height: '40px',
    background: BRAND_HEX,
    color: '#ffffff',
    borderRadius: '50%',
    textAlign: 'center' as const,
    lineHeight: '40px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: 'rgba(180,83,9,0.22) 0 0 0 8px, rgba(28,25,23,0.22) 0 3px 12px',
    border: '0',
  },
  {
    width: '48px',
    height: '48px',
    background: BRAND_HEX,
    color: '#ffffff',
    borderRadius: '50%',
    textAlign: 'center' as const,
    lineHeight: '48px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: 'rgba(180,83,9,0.22) 0 0 0 10px, rgba(28,25,23,0.25) 0 4px 14px',
    border: '0',
  },
];

const CLUSTER_RANGES = [10, 30, 50];

type Props = {
  cafes: Cafe[];
  level: number;
  bounds: MapBounds | null;
  selectedCafeId: string | null;
  onMarkerClick: (cafe: Cafe) => void;
};

function CafeMarkersImpl({ cafes, level, bounds, selectedCafeId, onMarkerClick }: Props) {
  const mode = resolveMode(level);

  if (mode === 'cluster') {
    return (
      <MarkerClusterer
        averageCenter
        minLevel={DOT_MAX_LEVEL + 1}
        minClusterSize={2}
        gridSize={60}
        calculator={CLUSTER_RANGES}
        styles={CLUSTER_STYLES}
        disableClickZoom={false}
      >
        {cafes.map((cafe) => (
          <MapMarker
            key={cafe.id}
            position={{ lat: cafe.lat, lng: cafe.lng }}
            image={{
              src: DOT_SVG,
              size: { width: 22, height: 22 },
              options: { offset: { x: 11, y: 11 } },
            }}
            title={cafe.name}
            onClick={() => onMarkerClick(cafe)}
          />
        ))}
      </MarkerClusterer>
    );
  }

  const visibleCafes = cafes.filter((c) => withinPaddedBounds(c, bounds));

  return (
    <>
      {visibleCafes.map((cafe) => {
        const selected = cafe.id === selectedCafeId;
        return (
          <CustomOverlayMap
            key={cafe.id}
            position={{ lat: cafe.lat, lng: cafe.lng }}
            yAnchor={0.5}
            zIndex={selected ? 30 : 10}
            clickable
          >
            {mode === 'pill' ? (
              <NamePill
                $selected={selected}
                onClick={() => onMarkerClick(cafe)}
                role="button"
                aria-label={`${cafe.name} 선택`}
              >
                {selected && <Star aria-hidden fill="currentColor" />}
                {cafe.name}
              </NamePill>
            ) : (
              <Dot
                $selected={selected}
                onClick={() => onMarkerClick(cafe)}
                role="button"
                aria-label={`${cafe.name} 선택`}
              >
                {selected && (
                  <DotStar aria-hidden>
                    <Star fill="currentColor" />
                  </DotStar>
                )}
              </Dot>
            )}
          </CustomOverlayMap>
        );
      })}
    </>
  );
}

export const CafeMarkers = memo(CafeMarkersImpl);
