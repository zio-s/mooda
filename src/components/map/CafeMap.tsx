'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  Map,
  MapMarker,
  CustomOverlayMap,
  MarkerClusterer,
  ZoomControl,
  MapTypeControl,
  useKakaoLoader,
} from 'react-kakao-maps-sdk';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCenter, setLevel, setBounds, setSelectedCafe, setUserLocation } from '@/store/slices/mapSlice';
import type { Cafe, MapBounds } from '@/types';
import { MapSkeleton } from './MapSkeleton';
import { MapErrorWrapper, LocateBtn } from './CafeMap.styles';
import { PATHS } from '@/constants/paths';
import { Navigation } from 'lucide-react';

// ✅ 수정: .env.local의 NEXT_PUBLIC_KAKAO_MAP_APP_KEY와 일치
const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';

interface CafeMapProps {
  onCafeSelect?: (cafe: Cafe | null) => void;
  cafes: Cafe[];
}

export function CafeMap({ onCafeSelect, cafes }: CafeMapProps) {
  const dispatch = useAppDispatch();
  const { center, level, selectedCafeId, userLocation } = useAppSelector((s) => s.map);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [hoveredCafe, setHoveredCafe] = useState<Cafe | null>(null);

  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_APP_KEY,
    libraries: ['services', 'clusterer'],
  });

  const selectedCafe = cafes.find((c) => c.id === selectedCafeId) ?? null;

  // ── 최초 마운트 시 자동 위치 요청 (경로 안내용) ────────────────────
  useEffect(() => {
    if (userLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => { /* 거부 시 무시 — 버튼 클릭으로 재시도 가능 */ },
      { timeout: 8000, maximumAge: 60000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBoundsChange = useCallback(
    (map: kakao.maps.Map) => {
      const mapCenter = map.getCenter();
      dispatch(setCenter({ lat: mapCenter.getLat(), lng: mapCenter.getLng() }));
      dispatch(setLevel(map.getLevel()));

      // 디바운스: 지도 조작이 끝난 후 400ms 뒤에 검색
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      boundsTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        const newBounds: MapBounds = {
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        };

        // 이전 bounds와 비교: 중심이 10% 이상 이동했거나 줌 레벨이 바뀐 경우에만 재검색
        const prev = lastBoundsRef.current;
        if (prev) {
          const prevLatRange = prev.neLat - prev.swLat;
          const prevLngRange = prev.neLng - prev.swLng;
          const centerLatDiff = Math.abs((newBounds.swLat + newBounds.neLat) / 2 - (prev.swLat + prev.neLat) / 2);
          const centerLngDiff = Math.abs((newBounds.swLng + newBounds.neLng) / 2 - (prev.swLng + prev.neLng) / 2);
          const newLatRange = newBounds.neLat - newBounds.swLat;

          const centerMoved = centerLatDiff > prevLatRange * 0.1 || centerLngDiff > prevLngRange * 0.1;
          const zoomChanged = Math.abs(newLatRange - prevLatRange) > prevLatRange * 0.2;

          if (!centerMoved && !zoomChanged) return;
        }

        lastBoundsRef.current = newBounds;
        dispatch(setBounds(newBounds));
      }, 400);
    },
    [dispatch]
  );

  // 현재 위치로 이동
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
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

  const handleMarkerClick = useCallback(
    (cafe: Cafe) => {
      dispatch(setSelectedCafe(cafe.id));
      onCafeSelect?.(cafe);
    },
    [dispatch, onCafeSelect]
  );

  const handleDeselect = useCallback(() => {
    dispatch(setSelectedCafe(null));
    onCafeSelect?.(null);
  }, [dispatch, onCafeSelect]);

  if (loading) return <MapSkeleton />;
  if (error) {
    return (
      <MapErrorWrapper>
        <span style={{ fontSize: 32 }}>🗺️</span>
        <p>지도를 불러올 수 없습니다.</p>
        <p style={{ fontSize: 12 }}>카카오 API 키를 확인해주세요.</p>
      </MapErrorWrapper>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Map
        center={center}
        level={level}
        style={{ height: '100%', width: '100%' }}
        onCreate={handleBoundsChange}
        onBoundsChanged={handleBoundsChange}
        onZoomChanged={handleBoundsChange}
        onClick={handleDeselect}
      >
        {/* ── 내장 컨트롤 ── */}
        <ZoomControl position="RIGHT" />
        <MapTypeControl position="TOPRIGHT" />

        {/* ── 마커 클러스터러 (줌 아웃 시 자동 그룹핑) ── */}
        <MarkerClusterer
          averageCenter={true}
          minLevel={10}        // level 10 이상(많이 줌 아웃)에서 클러스터링
          disableClickZoom={false}
        >
          {cafes.map((cafe) => (
            <MapMarker
              key={cafe.id}
              position={{ lat: cafe.lat, lng: cafe.lng }}
              image={{
                src: selectedCafeId === cafe.id
                  ? '/marker-selected.svg'
                  : '/marker-normal.svg',
                size: selectedCafeId === cafe.id
                  ? { width: 36, height: 46 }
                  : { width: 28, height: 36 },
              }}
              title={cafe.name}
              onClick={() => handleMarkerClick(cafe)}
              onMouseOver={() => setHoveredCafe(cafe)}
              onMouseOut={() => setHoveredCafe((prev) => prev?.id === cafe.id ? null : prev)}
            />
          ))}
        </MarkerClusterer>

        {/* ── 호버 툴팁 (선택되지 않은 마커) ── */}
        {hoveredCafe && hoveredCafe.id !== selectedCafeId && (
          <CustomOverlayMap
            position={{ lat: hoveredCafe.lat, lng: hoveredCafe.lng }}
            yAnchor={2.6}
            zIndex={15}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {hoveredCafe.name}
            </div>
          </CustomOverlayMap>
        )}

        {/* ── 선택된 카페 팝업 오버레이 ── */}
        {selectedCafe && (
          <CustomOverlayMap
            position={{ lat: selectedCafe.lat, lng: selectedCafe.lng }}
            yAnchor={3.2}   // 마커 위에 띄우기
            clickable={true}
            zIndex={20}
          >
            {/* 인라인 스타일 필수: CustomOverlay는 React 트리 외부에 렌더링됨 */}
            <div
              style={{
                background: 'white',
                border: '2px solid #d97706',
                borderRadius: '10px',
                padding: '8px 12px 8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                position: 'relative',
                cursor: 'default',
              }}
            >
              {/* 아래 꼬리 (화살표) */}
              <div style={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #d97706',
              }} />
              <div style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid white',
              }} />

              {/* 별점 */}
              <span style={{ color: '#fbbf24', fontSize: '14px', lineHeight: 1 }}>★</span>
              <span style={{ fontWeight: 700, color: '#92400e', fontSize: '12px' }}>
                {selectedCafe.avgRating.toFixed(1)}
              </span>

              {/* 구분선 */}
              <span style={{ width: 1, height: 14, background: '#e5e7eb', display: 'inline-block', flexShrink: 0 }} />

              {/* 카페명 (클릭 시 상세 이동) */}
              <a
                href={PATHS.CafeDetail(selectedCafe.id)}
                style={{
                  fontWeight: 600,
                  color: '#1c0a00',
                  textDecoration: 'none',
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {selectedCafe.name}
              </a>

              {/* 닫기 */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDeselect(); }}
                style={{
                  background: 'none', border: 'none', padding: '0 0 0 2px',
                  cursor: 'pointer', color: '#9ca3af', fontSize: '16px',
                  lineHeight: 1, flexShrink: 0, fontFamily: 'inherit',
                }}
              >
                ×
              </button>
            </div>
          </CustomOverlayMap>
        )}
      </Map>

      {/* ── 현재 위치 버튼 (지도 위에 절대 위치) ── */}
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
