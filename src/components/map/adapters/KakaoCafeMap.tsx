'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  Map,
  ZoomControl,
  MapTypeControl,
  useKakaoLoader,
} from 'react-kakao-maps-sdk';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCenter,
  setLevel,
  setBounds,
  setSelectedCafe,
  setUserLocation,
} from '@/store/slices/mapSlice';
import { useSearchNearbyMutation } from '@/store/api/cafesApi';
import type { Cafe, MapBounds } from '@/types';
import { MapSkeleton } from '../MapSkeleton';
import { CafeMarkers } from '../markers/CafeMarkers';
import {
  MapErrorWrapper,
  LocateBtn,
  NearbyLoadingOverlay,
} from '../CafeMap.styles';
import { Navigation, Loader2, AlertTriangle } from 'lucide-react';
import type { CafeMapAdapterProps } from './types';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';

export function KakaoCafeMap({ onCafeSelect, onNearbyFound, cafes }: CafeMapAdapterProps) {
  const dispatch = useAppDispatch();
  const {
    center,
    level,
    bounds: storedBounds,
    selectedCafeId,
    userLocation,
  } = useAppSelector((s) => s.map);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState<{ lat: number; lng: number } | null>(null);
  const [searchNearby] = useSearchNearbyMutation();

  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_APP_KEY,
    libraries: ['services', 'clusterer'],
  });

  // 최초 마운트 시 자동 위치 요청
  useEffect(() => {
    if (userLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => { /* 거부 시 무시 */ },
      { timeout: 8000, maximumAge: 60000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
    };
  }, []);

  const handleBoundsChange = useCallback(
    (map: kakao.maps.Map) => {
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

        const prev = lastBoundsRef.current;
        if (prev) {
          const prevLatRange = prev.neLat - prev.swLat;
          const prevLngRange = prev.neLng - prev.swLng;
          const centerLatDiff = Math.abs(
            (newBounds.swLat + newBounds.neLat) / 2 - (prev.swLat + prev.neLat) / 2,
          );
          const centerLngDiff = Math.abs(
            (newBounds.swLng + newBounds.neLng) / 2 - (prev.swLng + prev.neLng) / 2,
          );
          const newLatRange = newBounds.neLat - newBounds.swLat;

          const centerMoved =
            centerLatDiff > prevLatRange * 0.15 || centerLngDiff > prevLngRange * 0.15;
          const zoomChanged = Math.abs(newLatRange - prevLatRange) > prevLatRange * 0.2;

          if (!centerMoved && !zoomChanged) {
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
    [dispatch],
  );

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
    [dispatch, onCafeSelect],
  );

  const handleDeselect = useCallback(() => {
    dispatch(setSelectedCafe(null));
    onCafeSelect?.(null);
  }, [dispatch, onCafeSelect]);

  const handleMapClick = useCallback(
    async (_: kakao.maps.Map, mouseEvent: kakao.maps.event.MouseEvent) => {
      const latLng = mouseEvent.latLng;
      const clickLat = latLng.getLat();
      const clickLng = latLng.getLng();

      if (selectedCafeId) {
        handleDeselect();
        return;
      }

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
        // 검색 실패는 조용히 무시 (사용자 action 기대)
      } finally {
        setNearbyLoading(null);
      }
    },
    [selectedCafeId, handleDeselect, searchNearby, dispatch, onCafeSelect, onNearbyFound],
  );

  if (loading) return <MapSkeleton />;
  if (error) {
    return (
      <MapErrorWrapper>
        <AlertTriangle size={32} strokeWidth={1.5} aria-hidden />
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
        <ZoomControl position="RIGHT" />
        <MapTypeControl position="TOPRIGHT" />

        <CafeMarkers
          cafes={cafes}
          level={level}
          bounds={storedBounds}
          selectedCafeId={selectedCafeId}
          onMarkerClick={handleMarkerClick}
        />
      </Map>

      {nearbyLoading && (
        <NearbyLoadingOverlay>
          <Loader2 size={18} />
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
