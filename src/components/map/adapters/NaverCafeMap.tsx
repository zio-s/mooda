'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, AlertTriangle } from 'lucide-react';
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
import {
  computeClusters,
  tierForCount,
  type ClusterEntry,
} from '@/lib/map/cluster';
import type { Cafe, MapBounds } from '@/types';
import type { CafeMapAdapterProps } from './types';

const NAVER_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim() ?? '';

const PILL_MAX_LEVEL = 4;
const CLUSTER_MAX_ZOOM = 15;

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

function clusterMarkerHtml(count: number): string {
  const tier = tierForCount(count);
  return `
    <div style="
      width:${tier.size}px;height:${tier.size}px;border-radius:50%;
      background:${BRAND};color:#fff;
      text-align:center;line-height:${tier.size}px;
      font-size:${tier.font}px;font-weight:700;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      box-shadow:rgba(180,83,9,.22) 0 0 0 ${tier.spread}px,rgba(28,25,23,.22) 0 3px 12px;
      transform:translate(-50%,-50%);cursor:pointer;">
      ${count}
    </div>`;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Naver SDK는 공식 타입 미제공 */
type NaverMarker = any;
type NaverMap = any;

// 같은 건물/상권에 카페가 여러 개면 pill 이 화면상 겹쳐 클릭이 안 되는 문제
// (Kakao CafeMarkers.tsx computeCollisionGroups 와 동일 접근). Naver Projection의
// fromCoordToOffset/fromOffsetToCoord 로 실제 렌더 픽셀 좌표를 왕복 변환해
// 화면에서 겹치는 카페를 그룹핑하고, 그룹은 실제 좌표 중심에 칩으로 표시한다.
const COLLISION_PX_RADIUS = 46;
const GROUP_ITEM_HEIGHT = 30;
const GROUP_ITEM_GAP = 4;
const GROUP_POPOVER_GAP = 10;
const GROUP_ITEM_MAX = 8;

type CollisionGroup = {
  key: string;
  centerLat: number;
  centerLng: number;
  cafes: Cafe[];
};

function computeCollisionGroups(
  cafes: Cafe[],
  map: NaverMap,
  naver: typeof window.naver,
): { groups: CollisionGroup[]; groupedIds: Set<string> } {
  const projection = map.getProjection();
  const points = cafes.map((cafe) => ({
    cafe,
    point: projection.fromCoordToOffset(new naver.maps.LatLng(cafe.lat, cafe.lng)),
  }));

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

function groupChipHtml(count: number): string {
  return `
    <div style="
      display:inline-flex;align-items:center;gap:5px;
      padding:5px 12px 5px 10px;border-radius:999px;
      font-size:11.5px;font-weight:700;
      color:#ffffff;background:${BRAND};
      border:1.5px solid ${BRAND};
      box-shadow:0 12px 32px rgba(28,25,23,.12),0 2px 8px rgba(28,25,23,.06);
      white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);">
      <span style="width:7px;height:7px;border-radius:999px;background:#ffffff;flex-shrink:0;"></span>
      카페 ${count}개
    </div>`;
}

function groupItemHtml(name: string, selected: boolean): string {
  const bg = selected ? BRAND : '#ffffff';
  const fg = selected ? '#ffffff' : '#1c1917';
  return `
    <div style="
      box-sizing:border-box;padding:7px 10px;border-radius:10px;
      font-size:12px;font-weight:600;white-space:nowrap;
      max-width:170px;overflow:hidden;text-overflow:ellipsis;
      color:${fg};background:${bg};
      box-shadow:0 8px 20px rgba(28,25,23,.14);
      border:1px solid ${BRAND};
      cursor:pointer;transform:translate(-50%,-50%);">
      ${escapeHtml(name)}
    </div>`;
}

function groupOverflowHtml(count: number): string {
  return `
    <div style="
      box-sizing:border-box;padding:6px 10px;border-radius:10px;
      font-size:11px;font-weight:600;white-space:nowrap;
      color:#78716c;background:#f5f5f4;
      border:1px solid #e7e5e4;
      transform:translate(-50%,-50%);">
      외 ${count}개
    </div>`;
}

export function NaverCafeMap({ onCafeSelect, onNearbyFound, cafes }: CafeMapAdapterProps) {
  const dispatch = useAppDispatch();
  const { center, level, selectedCafeId, userLocation } = useAppSelector((s) => s.map);
  const [locating, setLocating] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchNearby] = useSearchNearbyMutation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const singleMarkersRef = useRef<Map<string, NaverMarker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, NaverMarker>>(new Map());
  const groupMarkersRef = useRef<Map<string, NaverMarker>>(new Map());
  const groupItemMarkersRef = useRef<Map<string, NaverMarker[]>>(new Map());
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const selectedIdRef = useRef(selectedCafeId);
  // SDK 로드 중 탭 전환/복귀 등으로 refresh 요청이 들어오면 mapRef 가 null
  // 이어서 no-op 됨. pendingRefreshRef 로 큐잉했다가 map init 직후 flush.
  const pendingRefreshRef = useRef(false);

  const requestRefresh = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.refresh(true);
    } else {
      pendingRefreshRef.current = true;
    }
  }, []);

  const { loading, error } = useNaverMapsLoader({
    clientId: NAVER_CLIENT_ID,
  });

  useEffect(() => {
    selectedIdRef.current = selectedCafeId;
  }, [selectedCafeId]);

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

  // ── 지도 초기화 ──────────────────────────────────────
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
    setMapReady(true);
    // SDK 초기화 이전에 들어왔던 refresh 요청을 flush.
    if (pendingRefreshRef.current) {
      pendingRefreshRef.current = false;
      map.refresh(true);
    }

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
      singleMarkersRef.current.forEach((m) => m.setMap(null));
      singleMarkersRef.current.clear();
      clusterMarkersRef.current.forEach((m) => m.setMap(null));
      clusterMarkersRef.current.clear();
      groupMarkersRef.current.forEach((m) => m.setMap(null));
      groupMarkersRef.current.clear();
      groupItemMarkersRef.current.forEach((markers) => markers.forEach((m) => m.setMap(null)));
      groupItemMarkersRef.current.clear();
      map.destroy();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [loading, error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redux center/level → Naver 동기화 ──────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps || isSyncingRef.current) return;
    map.setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
    map.setZoom(kakaoLevelToNaverZoom(level), true);
  }, [center.lat, center.lng, level]);

  // ── BUG-MAP-01: 탭/창 복귀 + BFCache + resize 대응 ────────
  // 지도 canvas 는 컨테이너 크기가 바뀌어도 자동 relayout 안 됨. 다른 탭에서
  // 돌아오거나 뒤로가기로 BFCache 복원되거나 컨테이너가 리사이즈될 때
  // requestRefresh 로 SDK 내부 상태 + 타일을 강제 재동기화 (map 이 아직
  // init 전이면 큐잉 후 init 완료 시 flush — BUG-MAP-A2).
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) return;
      requestRefresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [requestRefresh]);

  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) requestRefresh();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [requestRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // ResizeObserver 는 프레임당 여러 번 발사될 수 있음 → rAF 게이트로 throttle.
    // BUG-MAP-A3: dynamic({ ssr: false }) 마운트 직후 한 프레임 container 가
    // 0×0 일 수 있음. 그 상태로 refresh 하면 SDK canvas 가 유효하지 않은 크기로
    // 갱신될 가능성이 있어 스킵.
    let scheduled = false;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width < 10 || height < 10) return;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        requestRefresh();
      });
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, [requestRefresh]);

  // ── 마커 + 자체 클러스터 관리 ──────────────────────
  // cafes / level / selectedCafeId 변화에 반응. mapReady 게이트로 map init 이후에만 실행.
  const cafeSnapshot = useMemo(
    () =>
      cafes.map((c) => c.id).sort().join('|') + '|' + cafes.length,
    [cafes],
  );

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;
    const { naver } = window;

    const mode = resolveMode(level);
    const naverZoom = map.getZoom();
    const shouldCluster = naverZoom <= CLUSTER_MAX_ZOOM && mode !== 'pill';

    // pill 모드에서만 화면 픽셀 겹침 그룹핑 적용 (Kakao CafeMarkers.tsx 와 동일 범위)
    const { groups, groupedIds } =
      mode === 'pill'
        ? computeCollisionGroups(cafes, map, naver)
        : { groups: [] as CollisionGroup[], groupedIds: new Set<string>() };
    const singleCafes = mode === 'pill' ? cafes.filter((c) => !groupedIds.has(c.id)) : cafes;

    const entries: ClusterEntry[] = shouldCluster
      ? computeClusters(singleCafes, naverZoom)
      : singleCafes.map((cafe) => ({ kind: 'single', cafe }) as ClusterEntry);

    const nextSingleIds = new Set<string>();
    const nextClusterKeys = new Set<string>();
    for (const entry of entries) {
      if (entry.kind === 'single') nextSingleIds.add(entry.cafe.id);
      else nextClusterKeys.add(entry.key);
    }
    const nextGroupKeys = new Set(groups.map((g) => g.key));

    // 필요 없어진 single 마커 제거
    singleMarkersRef.current.forEach((marker, id) => {
      if (!nextSingleIds.has(id)) {
        marker.setMap(null);
        singleMarkersRef.current.delete(id);
      }
    });
    // 필요 없어진 cluster 마커 제거
    clusterMarkersRef.current.forEach((marker, key) => {
      if (!nextClusterKeys.has(key)) {
        marker.setMap(null);
        clusterMarkersRef.current.delete(key);
      }
    });
    // 필요 없어진 group 칩/펼침 아이템 마커 제거
    groupMarkersRef.current.forEach((marker, key) => {
      if (!nextGroupKeys.has(key)) {
        marker.setMap(null);
        groupMarkersRef.current.delete(key);
        const items = groupItemMarkersRef.current.get(key);
        if (items) {
          items.forEach((m) => m.setMap(null));
          groupItemMarkersRef.current.delete(key);
        }
        setOpenGroupKey((prev) => (prev === key ? null : prev));
      }
    });

    // single/cluster 마커 생성 or 업데이트
    for (const entry of entries) {
      if (entry.kind === 'single') {
        const cafe = entry.cafe;
        const selected = cafe.id === selectedIdRef.current;
        const content = mode === 'pill' ? pillMarkerHtml(cafe, selected) : dotMarkerHtml(selected);
        const position = new naver.maps.LatLng(cafe.lat, cafe.lng);
        const existing = singleMarkersRef.current.get(cafe.id);
        if (existing) {
          existing.setPosition(position);
          existing.setIcon({ content, anchor: new naver.maps.Point(0, 0) });
        } else {
          const marker = new naver.maps.Marker({
            position,
            map,
            icon: { content, anchor: new naver.maps.Point(0, 0) },
            title: cafe.name,
          });
          naver.maps.Event.addListener(marker, 'click', () => {
            dispatch(setSelectedCafe(cafe.id));
            onCafeSelect?.(cafe);
          });
          singleMarkersRef.current.set(cafe.id, marker);
        }
      } else {
        const position = new naver.maps.LatLng(entry.lat, entry.lng);
        const content = clusterMarkerHtml(entry.size);
        const existing = clusterMarkersRef.current.get(entry.key);
        if (existing) {
          existing.setPosition(position);
          existing.setIcon({ content, anchor: new naver.maps.Point(0, 0) });
        } else {
          const marker = new naver.maps.Marker({
            position,
            map,
            icon: { content, anchor: new naver.maps.Point(0, 0) },
            zIndex: 100,
          });
          const entryForClosure = entry; // capture
          naver.maps.Event.addListener(marker, 'click', () => {
            // 클러스터 탭 → 한 단계 줌인 + 중심 이동
            const currentZoom = map.getZoom();
            const nextZoom = Math.min(19, currentZoom + 2);
            map.setCenter(new naver.maps.LatLng(entryForClosure.lat, entryForClosure.lng));
            map.setZoom(nextZoom, true);
          });
          clusterMarkersRef.current.set(entry.key, marker);
        }
      }
    }

    // group 칩 마커 생성 or 업데이트 + 펼쳐진 그룹의 목록 아이템 마커 관리
    for (const group of groups) {
      const position = new naver.maps.LatLng(group.centerLat, group.centerLng);
      const containsSelected = group.cafes.some((c) => c.id === selectedIdRef.current);
      const isOpen = openGroupKey === group.key;
      const zIndex = isOpen ? 60 : containsSelected ? 30 : 20;
      const content = groupChipHtml(group.cafes.length);
      const existing = groupMarkersRef.current.get(group.key);
      if (existing) {
        existing.setPosition(position);
        existing.setIcon({ content, anchor: new naver.maps.Point(0, 0) });
        existing.setZIndex(zIndex);
      } else {
        const marker = new naver.maps.Marker({
          position,
          map,
          icon: { content, anchor: new naver.maps.Point(0, 0) },
          zIndex,
        });
        const key = group.key;
        naver.maps.Event.addListener(marker, 'click', () => {
          setOpenGroupKey((prev) => (prev === key ? null : key));
        });
        groupMarkersRef.current.set(group.key, marker);
      }

      const existingItems = groupItemMarkersRef.current.get(group.key);
      if (existingItems) {
        existingItems.forEach((m) => m.setMap(null));
        groupItemMarkersRef.current.delete(group.key);
      }

      if (isOpen) {
        const projection = map.getProjection();
        const chipPoint = projection.fromCoordToOffset(position);
        const visibleCafes = group.cafes.slice(0, GROUP_ITEM_MAX);
        const overflow = group.cafes.length - visibleCafes.length;
        const newItems: NaverMarker[] = [];

        visibleCafes.forEach((cafe, idx) => {
          const row = idx + 1; // 1부터 시작, 칩에 가까운 순
          const itemY =
            chipPoint.y -
            GROUP_POPOVER_GAP -
            (row - 0.5) * GROUP_ITEM_HEIGHT -
            (row - 1) * GROUP_ITEM_GAP;
          const itemLatLng = projection.fromOffsetToCoord(
            new naver.maps.Point(chipPoint.x, itemY),
          );
          const selected = cafe.id === selectedIdRef.current;
          const marker = new naver.maps.Marker({
            position: itemLatLng,
            map,
            icon: {
              content: groupItemHtml(cafe.name, selected),
              anchor: new naver.maps.Point(0, 0),
            },
            zIndex: 70,
          });
          naver.maps.Event.addListener(marker, 'click', () => {
            dispatch(setSelectedCafe(cafe.id));
            onCafeSelect?.(cafe);
            setOpenGroupKey(null);
          });
          newItems.push(marker);
        });

        if (overflow > 0) {
          const row = visibleCafes.length + 1;
          const itemY =
            chipPoint.y -
            GROUP_POPOVER_GAP -
            (row - 0.5) * GROUP_ITEM_HEIGHT -
            (row - 1) * GROUP_ITEM_GAP;
          const itemLatLng = projection.fromOffsetToCoord(
            new naver.maps.Point(chipPoint.x, itemY),
          );
          const marker = new naver.maps.Marker({
            position: itemLatLng,
            map,
            icon: {
              content: groupOverflowHtml(overflow),
              anchor: new naver.maps.Point(0, 0),
            },
            zIndex: 70,
          });
          newItems.push(marker);
        }

        groupItemMarkersRef.current.set(group.key, newItems);
      }
    }
  }, [mapReady, cafeSnapshot, level, selectedCafeId, cafes, dispatch, onCafeSelect, openGroupKey]);

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
        <AlertTriangle size={32} strokeWidth={1.5} aria-hidden />
        <p>네이버지도를 사용하려면 API 키가 필요해요.</p>
        <p style={{ fontSize: 12 }}>NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수를 확인해주세요.</p>
      </MapErrorWrapper>
    );
  }

  if (loading) return <MapSkeleton />;
  if (error) {
    return (
      <MapErrorWrapper>
        <AlertTriangle size={32} strokeWidth={1.5} aria-hidden />
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
