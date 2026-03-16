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
import { useSearchNearbyMutation } from '@/store/api/cafesApi';
import type { Cafe, MapBounds } from '@/types';
import { MapSkeleton } from './MapSkeleton';
import { MapErrorWrapper, LocateBtn, NearbyLoadingOverlay, SelectedMarkerWrap } from './CafeMap.styles';
import { PATHS } from '@/constants/paths';
import { Navigation, Loader2 } from 'lucide-react';

// ✅ 수정: .env.local의 NEXT_PUBLIC_KAKAO_MAP_APP_KEY와 일치
const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';

interface CafeMapProps {
  onCafeSelect?: (cafe: Cafe | null) => void;
  onNearbyFound?: (cafe: Cafe) => void;
  cafes: Cafe[];
}

export function CafeMap({ onCafeSelect, onNearbyFound, cafes }: CafeMapProps) {
  const dispatch = useAppDispatch();
  const { center, level, selectedCafeId, userLocation } = useAppSelector((s) => s.map);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [hoveredCafe, setHoveredCafe] = useState<Cafe | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState<{ lat: number; lng: number } | null>(null);
  const [searchNearby] = useSearchNearbyMutation();

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

  // ── 언마운트 시 타이머 정리 ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
    };
  }, []);

  const handleBoundsChange = useCallback(
    (map: kakao.maps.Map) => {
      // 디바운스: 드래그/줌 완료 후 400ms 뒤에 상태 업데이트 + 검색
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      boundsTimerRef.current = setTimeout(() => {
        const mapCenter = map.getCenter();
        const mapLevel = map.getLevel();
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        const newBounds: MapBounds = {
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        };

        // 이전 bounds와 비교: 의미 있는 변화가 있을 때만 검색
        const prev = lastBoundsRef.current;
        if (prev) {
          const prevLatRange = prev.neLat - prev.swLat;
          const prevLngRange = prev.neLng - prev.swLng;
          const centerLatDiff = Math.abs((newBounds.swLat + newBounds.neLat) / 2 - (prev.swLat + prev.neLat) / 2);
          const centerLngDiff = Math.abs((newBounds.swLng + newBounds.neLng) / 2 - (prev.swLng + prev.neLng) / 2);
          const newLatRange = newBounds.neLat - newBounds.swLat;

          const centerMoved = centerLatDiff > prevLatRange * 0.15 || centerLngDiff > prevLngRange * 0.15;
          const zoomChanged = Math.abs(newLatRange - prevLatRange) > prevLatRange * 0.2;

          if (!centerMoved && !zoomChanged) {
            // bounds는 안 바꾸지만 center/level은 UI용으로 업데이트
            dispatch(setCenter({ lat: mapCenter.getLat(), lng: mapCenter.getLng() }));
            dispatch(setLevel(mapLevel));
            return;
          }
        }

        lastBoundsRef.current = newBounds;
        dispatch(setCenter({ lat: mapCenter.getLat(), lng: mapCenter.getLng() }));
        dispatch(setLevel(mapLevel));
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

  // 지도 클릭 → 주변 카페 검색
  const handleMapClick = useCallback(
    async (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
      const latLng = mouseEvent.latLng;
      const clickLat = latLng.getLat();
      const clickLng = latLng.getLng();

      // 이미 선택된 카페가 있으면 먼저 해제
      if (selectedCafeId) {
        handleDeselect();
        return;
      }

      setNearbyLoading({ lat: clickLat, lng: clickLng });

      try {
        const result = await searchNearby({ lat: clickLat, lng: clickLng, radius: 50 }).unwrap();
        if (result.cafe) {
          dispatch(setSelectedCafe(result.cafe.id));
          onCafeSelect?.(result.cafe);
          onNearbyFound?.(result.cafe);
        }
      } catch {
        // 검색 실패 시 무시
      } finally {
        setNearbyLoading(null);
      }
    },
    [selectedCafeId, handleDeselect, searchNearby, dispatch, onCafeSelect, onNearbyFound]
  );

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
        onClick={handleMapClick}
      >
        {/* ── 내장 컨트롤 ── */}
        <ZoomControl position="RIGHT" />
        <MapTypeControl position="TOPRIGHT" />

        {/* ── 마커 클러스터러 (줌 아웃 시 자동 그룹핑) ── */}
        <MarkerClusterer
          averageCenter={true}
          minLevel={10}
          disableClickZoom={false}
        >
          {cafes.filter((c) => c.id !== selectedCafeId).map((cafe) => (
            <MapMarker
              key={cafe.id}
              position={{ lat: cafe.lat, lng: cafe.lng }}
              image={{
                src: '/marker-normal.svg',
                size: { width: 28, height: 36 },
              }}
              title={cafe.name}
              onClick={() => handleMarkerClick(cafe)}
              onMouseOver={() => setHoveredCafe(cafe)}
              onMouseOut={() => setHoveredCafe((prev) => prev?.id === cafe.id ? null : prev)}
            />
          ))}
        </MarkerClusterer>

        {/* ── 선택된 마커 (바운스 애니메이션) ── */}
        {selectedCafe && (
          <CustomOverlayMap
            position={{ lat: selectedCafe.lat, lng: selectedCafe.lng }}
            yAnchor={1}
            zIndex={30}
          >
            <SelectedMarkerWrap
              key={selectedCafe.id}
              onClick={() => handleMarkerClick(selectedCafe)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marker-selected.svg" alt="" width={36} height={46} />
            </SelectedMarkerWrap>
          </CustomOverlayMap>
        )}

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

        {/* ── 선택된 카페 리치 팝업 오버레이 ── */}
        {selectedCafe && (
          <CustomOverlayMap
            position={{ lat: selectedCafe.lat, lng: selectedCafe.lng }}
            yAnchor={1.35}
            clickable={true}
            zIndex={20}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '14px',
                padding: '0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                fontSize: '13px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                position: 'relative',
                cursor: 'default',
                width: '220px',
                overflow: 'hidden',
              }}
            >
              {/* 사진 영역 */}
              {selectedCafe.mainPhoto ? (
                <div style={{
                  height: '100px',
                  background: `url(${selectedCafe.mainPhoto}) center/cover no-repeat`,
                  borderRadius: '14px 14px 0 0',
                }} />
              ) : (
                <div style={{
                  height: '60px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '14px 14px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}>
                  ☕
                </div>
              )}

              {/* 닫기 버튼 */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDeselect(); }}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)', border: 'none',
                  color: '#fff', fontSize: '14px', lineHeight: 1,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>

              {/* 정보 영역 */}
              <a
                href={PATHS.CafeDetail(selectedCafe.id)}
                style={{ textDecoration: 'none', display: 'block', padding: '10px 12px 12px' }}
              >
                <div style={{
                  fontWeight: 600, color: '#111827', fontSize: '14px',
                  lineHeight: 1.3, marginBottom: '4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {selectedCafe.name}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', color: '#6b7280', marginBottom: '6px',
                }}>
                  <span style={{ color: '#fbbf24', fontSize: '13px' }}>★</span>
                  <span style={{ fontWeight: 600, color: '#92400e' }}>
                    {selectedCafe.avgRating.toFixed(1)}
                  </span>
                  <span>({selectedCafe.reviewCount})</span>
                  {selectedCafe.distance !== undefined && (
                    <>
                      <span style={{ color: '#d1d5db' }}>·</span>
                      <span>{selectedCafe.distance < 1000 ? `${selectedCafe.distance}m` : `${(selectedCafe.distance / 1000).toFixed(1)}km`}</span>
                    </>
                  )}
                </div>

                {selectedCafe.address && (
                  <div style={{
                    fontSize: '11px', color: '#9ca3af', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {selectedCafe.address}
                  </div>
                )}
              </a>

              {/* 아래 꼬리 (화살표) */}
              <div style={{
                position: 'absolute', bottom: -8, left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid white',
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
              }} />
            </div>
          </CustomOverlayMap>
        )}
      </Map>

      {/* ── 주변 카페 검색 중 로딩 ── */}
      {nearbyLoading && (
        <NearbyLoadingOverlay>
          <Loader2 size={18} />
          <span>주변 카페 검색 중...</span>
        </NearbyLoadingOverlay>
      )}

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
