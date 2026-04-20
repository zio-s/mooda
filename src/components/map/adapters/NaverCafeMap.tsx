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
 * Kakao level ↔ Naver zoom 변환. Kakao는 1(close) ~ 14(far), Naver는
 * 대략 7(far) ~ 19(close). 대략 `naverZoom = 20 − kakaoLevel`로 매핑.
 */
function kakaoLevelToNaverZoom(level: number): number {
  return Math.max(7, Math.min(19, 20 - level));
}
function naverZoomToKakaoLevel(zoom: number): number {
  return Math.max(1, Math.min(14, 20 - zoom));
}

const BRAND_HEX = '#b45309';
const MARKER_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'>
  <circle cx='11' cy='11' r='8.25' fill='${BRAND_HEX}' stroke='white' stroke-width='2.5'/>
</svg>`;

/* eslint-disable @typescript-eslint/no-explicit-any -- Naver SDK는 타입 정의를 제공하지 않아 any 사용 */
type NaverMarker = any;
type NaverMap = any;

export function NaverCafeMap({ onCafeSelect, onNearbyFound, cafes }: CafeMapAdapterProps) {
  const dispatch = useAppDispatch();
  const { center, level, selectedCafeId, userLocation } = useAppSelector((s) => s.map);
  const [locating, setLocating] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState<{ lat: number; lng: number } | null>(null);
  const [searchNearby] = useSearchNearbyMutation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<Map<string, NaverMarker>>(new Map());
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Redux → Naver 방향 sync에서 onIdle 재귀 방지 플래그
  const isSyncingRef = useRef(false);

  const { loading, error } = useNaverMapsLoader({
    clientId: NAVER_CLIENT_ID,
    submodules: [],
  });

  // ── 자동 위치 요청 ─────────────────────────────────────
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
        // 다음 tick에 플래그 해제
        Promise.resolve().then(() => {
          isSyncingRef.current = false;
        });
      }, 400);
    },
    [dispatch],
  );

  // ── 지도 초기화 ────────────────────────────────────────
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
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER,
      },
    });
    mapRef.current = map;

    const boundsListener = naver.maps.Event.addListener(map, 'idle', () => {
      emitBoundsUpdate(map);
    });
    const clickListener = naver.maps.Event.addListener(map, 'click', async (e: any) => {
      if (selectedCafeId) {
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

    // 첫 idle 호출 (bounds 초기 세팅)
    emitBoundsUpdate(map);

    return () => {
      naver.maps.Event.removeListener(boundsListener);
      naver.maps.Event.removeListener(clickListener);
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      map.destroy();
      mapRef.current = null;
    };
    // effect는 한 번만 실행 — center/level 변경은 아래 별도 useEffect에서 반영
  }, [loading, error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redux center/level → Naver 동기화 ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps || isSyncingRef.current) return;
    map.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
    map.setZoom(kakaoLevelToNaverZoom(level), true);
  }, [center.lat, center.lng, level]);

  // ── 마커 렌더링 ────────────────────────────────────────
  const cafeIds = useMemo(() => cafes.map((c) => c.id).sort().join(','), [cafes]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;
    const { naver } = window;

    const existing = markersRef.current;
    const nextIds = new Set(cafes.map((c) => c.id));

    // 사라진 마커 제거
    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    });

    // 새로 생기거나 좌표가 바뀐 마커 추가/업데이트
    for (const cafe of cafes) {
      const prev = existing.get(cafe.id);
      const selected = cafe.id === selectedCafeId;
      const iconContent = `<div style="transform:translate(-11px,-11px);${selected ? 'filter:drop-shadow(0 2px 6px rgba(180,83,9,.35));' : ''}">${MARKER_SVG}</div>`;
      if (prev) {
        prev.setPosition(new naver.maps.LatLng(cafe.lat, cafe.lng));
        prev.setIcon({ content: iconContent, anchor: new naver.maps.Point(0, 0) });
      } else {
        const marker: NaverMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(cafe.lat, cafe.lng),
          map,
          icon: {
            content: iconContent,
            anchor: new naver.maps.Point(0, 0),
          },
          title: cafe.name,
        });
        naver.maps.Event.addListener(marker, 'click', () => {
          dispatch(setSelectedCafe(cafe.id));
          onCafeSelect?.(cafe);
        });
        existing.set(cafe.id, marker);
      }
    }
  }, [cafeIds, selectedCafeId, cafes, dispatch, onCafeSelect]);

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
