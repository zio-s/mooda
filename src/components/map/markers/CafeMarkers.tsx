'use client';

import { memo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CustomOverlayMap, MapMarker, MarkerClusterer } from 'react-kakao-maps-sdk';
import { Star } from 'lucide-react';
import { theme } from '@/styles/theme';
import type { Cafe, MapBounds } from '@/types';

/**
 * Kakao map levels go down as zoom increases:
 *  - level ≤ 3 : ~zoom ≥ 16 (street / block) → name pill
 *  - level 4-6 : ~zoom 13-15 (neighborhood) → dot
 *  - level ≥ 7 : ~zoom ≤ 12 (district+) → cluster (handled by MarkerClusterer)
 */
const PILL_MAX_LEVEL = 3;
const DOT_MAX_LEVEL = 6;
// ±10% padding beyond the visible bounds so markers don't pop in at edges
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
      <MarkerClusterer averageCenter minLevel={7} disableClickZoom={false}>
        {cafes.map((cafe) => (
          <MapMarker
            key={cafe.id}
            position={{ lat: cafe.lat, lng: cafe.lng }}
            image={{
              src: '/marker-normal.svg',
              size: { width: 28, height: 36 },
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
            yAnchor={mode === 'pill' ? 0.5 : 0.5}
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
