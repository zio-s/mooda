'use client';

import { memo, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CustomOverlayMap, MapMarker, MarkerClusterer, useMap } from 'react-kakao-maps-sdk';
import { Star } from 'lucide-react';
import { theme } from '@/styles/theme';
import type { Cafe, MapBounds } from '@/types';

/**
 * Marker LOD (03_screens.md § 01 지도 · 마커)
 *
 *  Kakao level ↓ = zoom ↑. 2단계 체계(pill ↔ cluster)로 운영.
 *  - level ≤ 4  (~zoom ≥ 16, 축척 100m 이내) : 이름 pill
 *  - level ≥ 5  (~zoom ≤ 15, 축척 250m+)    : MarkerClusterer — halo 40 / inner 28
 *
 *  중간 "도트" 모드는 도심 밀도가 높아 여전히 겹침이 발생하므로 제거하고
 *  클러스터 분기로 흡수. 개별 단위 구별이 필요하면 level 4(≈zoom 16)까지
 *  줌인하면 pill로 전환된다.
 */
const PILL_MAX_LEVEL = 4;
const DOT_MAX_LEVEL = 2; // dot 모드 제거(pill ↔ cluster).
// Kakao MarkerClusterer의 grid 픽셀 반경. 넓을수록 더 확실히 묶임. 140은
// level 5(250m 스케일)에서 ~140m, level 7(1km)에서 ~1.4km 반경으로 병합 →
// 도심 밀집 지역에서도 시각적 겹침 없이 클러스터 배지로 정돈.
const CLUSTER_GRID_SIZE = 200;
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

// 같은 건물(또는 같은 상가/단지의 여러 유닛)에 입점한 카페들은 pill이 화면
// 상에서 서로 겹쳐 클릭하기 어려워진다. 좌표를 고정 격자(m 단위)로 스냅하는
// 방식은 실패했다 — 큰 상업단지에서는 카페마다 좌표가 조금씩 달라 같은 칸에
// 안 묶이는데도 화면 픽셀상으론 여전히 겹쳐 보임.
//
// 겹치는 pill을 세로로 강제로 벌리는 방식도 시도했으나 폐기 — 2번째부터는
// 실제 좌표가 아닌 곳에 이름표만 떠서 위치 왜곡이 생기고(가로수길처럼
// 20~50m씩 떨어진 카페를 억지로 한 줄로 쌓으면 "다 한 자리에 있다"는 잘못된
// 인상을 줌), 몇 개 이상 겹치면 그마저도 다시 겹침.
//
// 대신 지도 투영으로 각 카페의 실제 렌더 픽셀 좌표를 구해서, 픽셀 거리가
// 가까운(=화면에서 겹치는) 카페들을 그룹으로 묶고, 그 그룹의 실제 좌표
// 중심점에 "카페 N개" 칩 하나만 그린다. 탭하면 그룹 내 카페 목록이 뜬다 —
// 실제 카페 좌표는 왜곡하지 않으면서 클릭 가능성을 보장.
const COLLISION_PX_RADIUS = 46;

type CollisionGroup = {
  key: string;
  centerLat: number;
  centerLng: number;
  cafes: Cafe[];
};

function computeCollisionGroups(
  cafes: Cafe[],
  map: kakao.maps.Map,
): { groups: CollisionGroup[]; groupedIds: Set<string> } {
  const projection = map.getProjection();
  const points = cafes.map((cafe) => ({
    cafe,
    point: projection.containerPointFromCoords(
      new kakao.maps.LatLng(cafe.lat, cafe.lng),
    ),
  }));

  // Union-Find — 픽셀 반경 내에 있는 카페들을 하나의 그룹으로 합친다.
  const parent = new Map<string, string>(points.map((p) => [p.cafe.id, p.cafe.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].point.x - points[j].point.x;
      const dy = points[i].point.y - points[j].point.y;
      if (Math.sqrt(dx * dx + dy * dy) < COLLISION_PX_RADIUS) {
        union(points[i].cafe.id, points[j].cafe.id);
      }
    }
  }

  const byRoot = new Map<string, Cafe[]>();
  for (const { cafe } of points) {
    const root = find(cafe.id);
    const bucket = byRoot.get(root);
    if (bucket) bucket.push(cafe);
    else byRoot.set(root, [cafe]);
  }

  const groups: CollisionGroup[] = [];
  const groupedIds = new Set<string>();
  for (const [root, groupCafes] of byRoot) {
    if (groupCafes.length < 2) continue;
    groupCafes.sort((a, b) => a.id.localeCompare(b.id)); // 렌더마다 순서 고정
    for (const c of groupCafes) groupedIds.add(c.id);
    groups.push({
      key: root,
      centerLat: groupCafes.reduce((sum, c) => sum + c.lat, 0) / groupCafes.length,
      centerLng: groupCafes.reduce((sum, c) => sum + c.lng, 0) / groupCafes.length,
      cafes: groupCafes,
    });
  }
  return { groups, groupedIds };
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
  gap: 5px;
  padding: 5px 11px 5px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ $selected }) =>
    $selected ? theme.colors.white : theme.colors.ink900};
  background: ${({ $selected }) =>
    $selected ? theme.colors.primary : theme.colors.white};
  /* Kakao 지도 기본 POI 레이블과 구별되도록 brand border 상시 + 강조된 shadow. */
  border: 1.5px solid ${theme.colors.primary};
  box-shadow: ${theme.shadows.lg};
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

/**
 * Pill 좌측 brand prefix dot — "이 핀은 Kakao POI가 아니라 Mooda가 추천한
 * 카페"라는 신호를 시각적으로 선언. 선택 상태에서는 pill 본체가 brand bg로
 * 채워지므로 dot은 반대로 white 로 반전.
 */
const PillLeadDot = styled.span<{ $selected: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ $selected }) => ($selected ? theme.colors.white : theme.colors.primary)};
`;

/**
 * 겹치는 카페 그룹을 대표하는 칩 — 그룹의 실제 좌표 중심점에 그려진다
 * (개별 카페 좌표를 왜곡하지 않음). 탭하면 GroupPopover로 목록이 뜬다.
 */
const GroupChip = styled.div`
  ${markerBase}
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px 5px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  color: ${theme.colors.white};
  background: ${theme.colors.primary};
  border: 1.5px solid ${theme.colors.primary};
  box-shadow: ${theme.shadows.lg};
  white-space: nowrap;
`;

const GroupPopover = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px;
  background: ${theme.colors.white};
  border-radius: 14px;
  box-shadow: ${theme.shadows.lg};
  border: 1.5px solid ${theme.colors.primary};
  min-width: 170px;
  max-height: 260px;
  overflow-y: auto;
`;

const GroupPopoverItem = styled.button<{ $selected: boolean }>`
  ${markerBase}
  display: block;
  width: 100%;
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ $selected }) => ($selected ? theme.colors.white : theme.colors.ink900)};
  background: ${({ $selected }) => ($selected ? theme.colors.primary : 'transparent')};

  &:hover {
    background: ${({ $selected }) => ($selected ? theme.colors.primary : theme.colors.ink100)};
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

type GroupChipProps = {
  group: CollisionGroup;
  selectedCafeId: string | null;
  isOpen: boolean;
  onToggle: (key: string) => void;
  onSelect: (cafe: Cafe) => void;
};

function CollisionGroupChip({ group, selectedCafeId, isOpen, onToggle, onSelect }: GroupChipProps) {
  const containsSelected = group.cafes.some((c) => c.id === selectedCafeId);

  return (
    <CustomOverlayMap
      position={{ lat: group.centerLat, lng: group.centerLng }}
      yAnchor={0.5}
      zIndex={isOpen ? 50 : containsSelected ? 30 : 10}
      clickable
    >
      <div style={{ position: 'relative' }}>
        {isOpen && (
          // 트랙패드/휠로 목록을 스크롤할 때 이벤트가 지도까지 버블링되면
          // Kakao 지도의 휠 줌이 같이 발동한다(리스트 스크롤 + 지도 줌인/아웃
          // 동시 발생). wheel 이벤트를 여기서 막아 지도로 전파되지 않게 한다.
          <GroupPopover onWheel={(e) => e.stopPropagation()}>
            {group.cafes.map((cafe) => (
              <GroupPopoverItem
                key={cafe.id}
                type="button"
                $selected={cafe.id === selectedCafeId}
                onClick={() => {
                  onToggle(group.key);
                  onSelect(cafe);
                }}
              >
                {cafe.name}
              </GroupPopoverItem>
            ))}
          </GroupPopover>
        )}
        <GroupChip
          role="button"
          aria-expanded={isOpen}
          aria-label={`카페 ${group.cafes.length}개 — ${group.cafes.map((c) => c.name).join(', ')}`}
          onClick={() => onToggle(group.key)}
        >
          <PillLeadDot $selected aria-hidden />
          카페 {group.cafes.length}개
        </GroupChip>
      </div>
    </CustomOverlayMap>
  );
}

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
  const map = useMap();
  const mode = resolveMode(level);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const toggleGroup = (key: string) => setOpenGroupKey((prev) => (prev === key ? null : key));

  if (mode === 'cluster') {
    return (
      <MarkerClusterer
        averageCenter
        minLevel={DOT_MAX_LEVEL + 1}
        minClusterSize={2}
        gridSize={CLUSTER_GRID_SIZE}
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
  const { groups, groupedIds } =
    mode === 'pill'
      ? computeCollisionGroups(visibleCafes, map)
      : { groups: [], groupedIds: new Set<string>() };
  const singleCafes = visibleCafes.filter((c) => !groupedIds.has(c.id));

  return (
    <>
      {singleCafes.map((cafe) => {
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
                {selected ? (
                  <Star aria-hidden fill="currentColor" />
                ) : (
                  <PillLeadDot $selected={selected} aria-hidden />
                )}
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

      {groups.map((group) => (
        <CollisionGroupChip
          key={group.key}
          group={group}
          selectedCafeId={selectedCafeId}
          isOpen={openGroupKey === group.key}
          onToggle={toggleGroup}
          onSelect={onMarkerClick}
        />
      ))}
    </>
  );
}

export const CafeMarkers = memo(CafeMarkersImpl);
