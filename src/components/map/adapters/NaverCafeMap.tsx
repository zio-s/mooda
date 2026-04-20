'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setBounds,
  setCenter,
  setLevel,
  setSelectedCafe,
  setUserLocation,
} from '@/store/slices/mapSlice';
import { useSearchNearbyMutation } from '@/store/api/cafesApi';
import { useNaverMapsLoader } from '@/hooks/useNaverMapsLoader';
import { MapSkeleton } from '../MapSkeleton';
import {
  MapErrorWrapper,
  LocateBtn,
  NearbyLoadingOverlay,
} from '../CafeMap.styles';
import type { Cafe, MapBounds } from '@/types';
import type { CafeMapAdapterProps } from './types';

const NAVER_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim() ?? '';

/**
 * LOD 경계 — Kakao 어댑터와 동일 철학.
 *  - Kakao level ≤ 4 (Naver zoom ≥ 16) : 이름 pill
 *  - 그 외 : dot 또는 cluster (MarkerClustering이 zoom 기반 자동 전환)
 */
const PILL_MAX_LEVEL = 4;
// MarkerClustering maxZoom: 이 값 이하일 때 클러스터링 활성. kakao level 5 ↔
// naver zoom 15 매핑 기준. zoom > 15면 개별 마커 그대로 노출.
const CLUSTER_MAX_ZOOM = 15;
const CLUSTER_GRID_SIZE = 140;

function kakaoLevelToNaverZoom(level: number): number {
  return Math.max(7, Math.min(19, 20 - level));
}
function naverZoomToKakaoLevel(zoom: number): number {
  return Math.max(1, Math.min(14, 20 - zoom));
}

type MarkerMode = 'pill' | 'dot';
function resolveMode(level: number): MarkerMode {
  return level <= PILL_MAX_LEVEL ? 'pill' : 'dot';
}

const BRAND = '#b45309';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

/**
 * Naver의 Marker icon.content는 DOM 삽입 기준점(position)을 기준으로 배치된다.
 * pill은 가변 너비라 `transform: translate(-50%, -50%)`로 중앙 정렬.
 */
function pillMarkerHtml(cafe: Cafe, selected: boolean): string {
  const bg = selected ? BRAND : '#ffffff';
  const fg = selected ? '#ffffff' : '#1c1917';
  const dotColor = selected ? '#ffffff' : BRAND;
  const scale = selected ? 1.05 : 1;
  return `
    <div style="
      display:inline-flex;align-items:center;gap:5px;
      padding:5px 11px 5px 9px;border-radius:999px;
      font-size:11.5px;font-weight:600;letter-spacing:-0.01em;
      color:${fg};background:${bg};
      border:1.5px solid ${BRAND};
      box-shadow:0 12px 32px rgba(28,25,23,.12),0 2px 8px rgba(28,25,23,.06);
      white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;
      cursor:pointer;transform:translate(-50%,-50%) scale(${scale});
      transition:transform 0.12s ease;">
      <span style="width:7px;height:7px;border-radius:999px;background:${dotColor};flex-shrink:0;"></span>
      ${escapeHtml(cafe.name)}
    </div>`;
}

function dotMarkerHtml(selected: boolean): string {
  const scale = selected ? 1.25 : 1;
  return `
    <div style="
      width:22px;height:22px;border-radius:999px;
      background:${BRAND};border:2.5px solid #fff;
      box-shadow:0 4px 12px rgba(28,25,23,.08),0 1px 3px rgba(28,25,23,.04);
      transform:translate(-50%,-50%) scale(${scale});
      cursor:pointer;transition:transform 0.12s ease;"></div>`;
}

function renderMarkerIcon(cafe: Cafe, mode: MarkerMode, selected: boolean): string {
  return mode === 'pill' ? pillMarkerHtml(cafe, selected) : dotMarkerHtml(selected);
}

/** Cluster 아이콘 — halo 40 + inner 28 + white count, 구간별 크기 확대. */
function clusterIconHtml(size: number, shadowSpread: number, fontSize: number): string {
  return `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${BRAND};color:#fff;
      text-align:center;line-height:${size}px;
      font-size:${fontSize}px;font-weight:700;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      box-shadow:rgba(180,83,9,.22) 0 0 0 ${shadowSpread}px,rgba(28,25,23,.22) 0 3px 12px;
      transform:translate(-50%,-50%);
      pointer-events:auto;cursor:pointer;">
      <span>0</span>
    </div>`;
}

const CLUSTER_TIERS = [
  { size: 28, spread: 6, font: 12 },
  { size: 32, spread: 7, font: 12 },
  { size: 40, spread: 8, font: 13 },
  { size: 48, spread: 10, font: 14 },
];

const CLUSTER_RANGES = [10, 30, 50];

/* eslint-disable @typescript-eslint/no-explicit-any -- Naver SDK는 공식 타입 미제공 */
type NaverMarker = any;
type NaverMap = any;
type NaverClusterer = any;

export function NaverCafeMap({ onCafeSelect, onNearbyFound, cafes }: CafeMapAdapterProps) {
  const dispatch = useAppDispatch();
  const { center, level, selectedCafeId, userLocation } = useAppSelector((s) => s.map);
  const [locating, setLocating] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState<{ lat: number; lng: number } | null>(null);
  const [searchNearby] = useSearchNearbyMutation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<Map<string, NaverMarker>>(new Map());
  const clusterRef = useRef<NaverClusterer | null>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const levelRef = useRef(level);
  const selectedIdRef = useRef(selectedCafeId);

  const { loading, error } = useNaverMapsLoader({
    clientId: NAVER_CLIENT_ID,
    submodules: ['marker-tools'],
  });

  // 자동 위치 요청
  useEffect(() => {
    if (userLocation || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => { /* 거부 시 무시 */ },
      { timeout: 8000, maximumAge: 60000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emitBoundsUpdate = useCallback(
    (map: NaverMap) => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      boundsTimerRef.current = setTimeout(() => {
        const c = map.getCenter();
        const z = map.getZoom();
        const b = map.getBounds();
        const newBounds: MapBounds = {
          swLat: b.getMin().y,
          swLng: b.getMin().x,
          neLat: b.getMax().y,
          neLng: b.getMax().x,
        };
        isSyncingRef.current = true;
        dispatch(setCenter({ lat: c.lat(), lng: c.lng() }));
        dispatch(setLevel(naverZoomToKakaoLevel(z)));
        dispatch(setBounds(newBounds));
        Promise.resolve().then(() => {
          isSyncingRef.current = false;
        });
      }, 400);
    },
    [dispatch],
  );

  // ── 지도 초기화 (한 번) ──────────────────────────────────
  useEffect(() => {
    if (loading || error) return;
    if (!containerRef.current) return;
    if (!window.naver?.maps) return;

    const { naver } = window;
    const initialZoom = kakaoLevelToNaverZoom(level);
    const map: NaverMap = new naver.maps.Map(containerRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: initialZoom,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.RIGHT_CENTER },
    });
    mapRef.current = map;

    const idleListener = naver.maps.Event.addListener(map, 'idle', () => {
      emitBoundsUpdate(map);
    });
    const clickListener = naver.maps.Event.addListener(map, 'click', async (e: any) => {
      if (selectedIdRef.current) {
        dispatch(setSelectedCafe(null));
        onCafeSelect?.(null);
        return;
      }
      const coord = e.coord;
      const clickLat = coord.lat();
      const clickLng = coord.lng();
      setNearbyLoading({ lat: clickLat, lng: clickLng });
      try {
        const result = await searchNearby({
          lat: clickLat,
          lng: clickLng,
          radius: 50,
        }).unwrap();
        if (result.cafe) {
          dispatch(setSelectedCafe(result.cafe.id));
          onCafeSelect?.(result.cafe);
          onNearbyFound?.(result.cafe);
        }
      } catch {
        /* ignore */
      } finally {
        setNearbyLoading(null);
      }
    });

    emitBoundsUpdate(map);

    return () => {
      naver.maps.Event.removeListener(idleListener);
      naver.maps.Event.removeListener(clickListener);
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      if (clusterRef.current) {
        clusterRef.current.setMap(null);
        clusterRef.current = null;
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      map.destroy();
      mapRef.current = null;
    };
  }, [loading, error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redux center/level → Naver map 동기화 ──────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps || isSyncingRef.current) return;
    map.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
    map.setZoom(kakaoLevelToNaverZoom(level), true);
  }, [center.lat, center.lng, level]);

  // ── 마커 + 클러스터 관리 (cafes 목록 변경 시 rebuild) ──
  const cafeKey = useMemo(
    () => cafes.map((c) => c.id).sort().join('|'),
    [cafes],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;
    const { naver } = window;

    const mode = resolveMode(levelRef.current);
    const existing = markersRef.current;
    const nextIds = new Set(cafes.map((c) => c.id));

    // 제거된 카페 마커 삭제
    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    });

    // 생성 또는 재사용
    const allMarkers: NaverMarker[] = [];
    for (const cafe of cafes) {
      const selected = cafe.id === selectedIdRef.current;
      const content = renderMarkerIcon(cafe, mode, selected);
      const position = new naver.maps.LatLng(cafe.lat, cafe.lng);

      let marker = existing.get(cafe.id);
      if (marker) {
        marker.setPosition(position);
        marker.setIcon({ content, anchor: new naver.maps.Point(0, 0) });
      } else {
        marker = new naver.maps.Marker({
          position,
          icon: { content, anchor: new naver.maps.Point(0, 0) },
          title: cafe.name,
        });
        naver.maps.Event.addListener(marker, 'click', () => {
          dispatch(setSelectedCafe(cafe.id));
          onCafeSelect?.(cafe);
        });
        existing.set(cafe.id, marker);
      }
      allMarkers.push(marker);
    }

    // 클러스터 rebuild — MarkerClustering은 내부적으로 markers 배열을 관리.
    // setMarkers 미지원 버전이 있어 매번 새로 인스턴스 생성.
    if (clusterRef.current) {
      clusterRef.current.setMap(null);
      clusterRef.current = null;
    }

    if (naver.maps.MarkerClustering) {
      clusterRef.current = new naver.maps.MarkerClustering({
        minClusterSize: 2,
        maxZoom: CLUSTER_MAX_ZOOM,
        map,
        markers: allMarkers,
        disableClickZoom: false,
        gridSize: CLUSTER_GRID_SIZE,
        icons: CLUSTER_TIERS.map((tier) => ({
          content: clusterIconHtml(tier.size, tier.spread, tier.font),
          size: new naver.maps.Size(tier.size, tier.size),
          anchor: new naver.maps.Point(tier.size / 2, tier.size / 2),
        })),
        indexGenerator: CLUSTER_RANGES,
        stylingFunction: (clusterMarker: any, count: number) => {
          const el = clusterMarker.getElement?.().querySelector?.('span');
          if (el) el.innerText = String(count);
        },
      });
    } else {
      // 클러스터러 로드 실패 시 모든 마커 직접 표시
      allMarkers.forEach((m) => m.setMap(map));
    }
  }, [cafeKey, dispatch, onCafeSelect, cafes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── level / selectedCafeId 변경 시 아이콘만 업데이트 (rebuild X) ──
  useEffect(() => {
    levelRef.current = level;
    selectedIdRef.current = selectedCafeId;
    if (!window.naver?.maps) return;
    const mode = resolveMode(level);
    markersRef.current.forEach((marker, id) => {
      const cafe = cafes.find((c) => c.id === id);
      if (!cafe) return;
      const selected = id === selectedCafeId;
      marker.setIcon({
        content: renderMarkerIcon(cafe, mode, selected),
        anchor: new window.naver.maps.Point(0, 0),
      });
    });
  }, [level, selectedCafeId, cafes]);

  const handleLocate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        dispatch(setCenter(loc));
        dispatch(setUserLocation(loc));
        dispatch(setLevel(4));
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [dispatch]);

  if (!NAVER_CLIENT_ID) {
    return (
      <MapErrorWrapper>
        <span style={{ fontSize: 32 }}>🗺️</span>
        <p>네이버지도를 사용하려면 API 키가 필요해요.</p>
        <p style={{ fontSize: 12 }}>NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수를 확인해주세요.</p>
      </MapErrorWrapper>
    );
  }

  if (loading) return <MapSkeleton />;
  if (error) {
    return (
      <MapErrorWrapper>
        <span style={{ fontSize: 32 }}>🗺️</span>
        <p>네이버지도를 불러올 수 없습니다.</p>
        <p style={{ fontSize: 12 }}>잠시 후 다시 시도해주세요.</p>
      </MapErrorWrapper>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
        role="application"
        aria-label="네이버지도 카페 지도"
      />

      {nearbyLoading && (
        <NearbyLoadingOverlay>
          <span>주변 카페 검색 중...</span>
        </NearbyLoadingOverlay>
      )}

      <LocateBtn
        onClick={handleLocate}
        $locating={locating}
        title="현재 위치로 이동"
        aria-label="현재 위치로 이동"
      >
        <Navigation size={16} />
      </LocateBtn>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
