'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSearchCafesQuery, useGetCafeQuery } from '@/store/api/cafesApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMoodFilter, setSelectedCafe, setUserLocation, setCenter, setLevel, setViewMode, setSort } from '@/store/slices/mapSlice';
import { useDebouncedMapBounds, useDebouncedMapCenter } from '@/hooks/useDebouncedMapBounds';
import { encodeGeohash, haversineMeters } from '@/lib/geohash';
import { CafeMapWrapper } from '@/components/map/CafeMapWrapper';
import { BottomSheet } from '@/components/map/BottomSheet';
import { ResearchAreaChip } from '@/components/map/ResearchAreaChip';
import { MapProviderToggle } from '@/components/map/MapProviderToggle';
import { VisuallyHiddenCafeList } from '@/components/map/VisuallyHiddenCafeList';
import { MoodFilterChips } from '@/components/filter/MoodFilter';
import { MoodFilterSheet } from '@/components/filter/MoodFilterSheet';
import { CafeListCard } from '@/components/cafe/CafeListCard';
import { CafeOverlayCard } from '@/components/map/CafeOverlayCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { useIsDesktop } from '@/hooks/useViewport';
import {
  AlertTriangle,
  ArrowDownUp,
  ChevronDown,
  Coffee,
  Filter,
  List,
  Map as LucideMap,
  MapPin,
} from 'lucide-react';
import type { Cafe, SearchParams } from '@/types';

// ─── 지역 바로가기 데이터 ─────────────────────────────────────────────
const AREA_PRESETS = [
  { label: '홍대/마포', lat: 37.5544, lng: 126.9176, level: 5 },
  { label: '성수/건대', lat: 37.5497, lng: 127.0461, level: 5 },
  { label: '용산/이태원', lat: 37.5349, lng: 126.9876, level: 5 },
  { label: '강남/역삼', lat: 37.5108, lng: 127.0350, level: 5 },
  { label: '종로/광화문', lat: 37.5799, lng: 126.9910, level: 5 },
  { label: '서초', lat: 37.4878, lng: 127.0314, level: 5 },
  { label: '광진', lat: 37.5405, lng: 127.0691, level: 5 },
  { label: '중구', lat: 37.5661, lng: 126.9946, level: 5 },
  { label: '서대문', lat: 37.5562, lng: 126.9365, level: 5 },
  { label: '분당/판교', lat: 37.4052, lng: 127.1239, level: 5 },
] as const;

// 드리프트 감지 임계값 — 이 거리 이상 움직이면 재검색 칩 노출
const RESEARCH_DISTANCE_METERS = 300;

import {
  MapPageWrapper,
  FilterBar,
  FilterBadge,
  ChipsScroll,
  MainArea,
  MapArea,
  ListPanel,
  ListHeader,
  ListInner,
  ListCount,
  SkeletonList,
  CardList,
  EmptyState,
  AreaSelectWrap,
  AreaSelectBtn,
  AreaDropdown,
  AreaOption,
  LoadingBar,
  Toolbar,
  Segmented,
  SegmentedBtn,
  SegmentedCount,
  SortWrap,
  SortBtn,
  SortMenu,
  SortOption,
  MapProviderToggleFloating,
} from './page.styles';

const SORT_OPTIONS: { key: 'distance' | 'rating' | 'reviews'; label: string }[] = [
  { key: 'distance', label: '거리순' },
  { key: 'rating', label: '평점순' },
  { key: 'reviews', label: '인기순' },
];

export function MapClient() {
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { filters, viewMode, selectedCafeId } = useAppSelector((s) => s.map);
  const isDesktop = useIsDesktop();
  const debouncedBounds = useDebouncedMapBounds(300);
  const { center: debouncedCenter, level: debouncedLevel } = useDebouncedMapCenter(300);
  const showList = viewMode === 'list';

  const [nearbyCafe, setNearbyCafe] = useState<Cafe | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // "commitedParams"만 RTK Query에 전달 — 매 드래그마다 새 요청을 쏘지 않음.
  const [committedParams, setCommittedParams] = useState<SearchParams | null>(null);
  // 커밋 시점의 zoom을 따로 기록해두고 현재 zoom과 비교해 드리프트를 감지.
  const [committedLevel, setCommittedLevel] = useState<number | null>(null);

  const commit = useCallback(
    (params: SearchParams, level: number) => {
      setCommittedParams(params);
      setCommittedLevel(level);
    },
    [],
  );

  // 현재 debounced 상태로부터 재계산한 파라미터. bounds가 없으면 null.
  const pendingParams: SearchParams | null = useMemo(() => {
    if (!debouncedBounds) return null;
    return {
      lat: debouncedCenter.lat,
      lng: debouncedCenter.lng,
      ...debouncedBounds,
      moods: filters.moods,
      openNow: filters.openNow,
      sort: filters.sort,
    };
  }, [
    debouncedCenter.lat,
    debouncedCenter.lng,
    debouncedBounds,
    filters.moods,
    filters.openNow,
    filters.sort,
  ]);

  // 최초 bounds가 잡히면 한 번 자동 커밋 — 지도 첫 로드 후 결과가 비지 않도록.
  useEffect(() => {
    if (committedParams || !pendingParams) return;
    commit(pendingParams, debouncedLevel);
  }, [committedParams, pendingParams, commit, debouncedLevel]);

  // 필터 변경은 즉시 커밋 — 기대 UX.
  const filtersKey = useMemo(
    () => `${filters.moods.join(',')}|${filters.openNow}|${filters.sort ?? ''}`,
    [filters.moods, filters.openNow, filters.sort],
  );
  const lastFiltersKeyRef = useRef(filtersKey);
  useEffect(() => {
    if (lastFiltersKeyRef.current === filtersKey) return;
    lastFiltersKeyRef.current = filtersKey;
    if (pendingParams) commit(pendingParams, debouncedLevel);
  }, [filtersKey, pendingParams, commit, debouncedLevel]);

  const { data, isLoading, isFetching, isError } = useSearchCafesQuery(
    committedParams as SearchParams,
    { skip: !committedParams },
  );
  const searchCafes = useMemo(() => data?.cafes ?? [], [data?.cafes]);

  // 주변 검색으로 찾은 카페가 검색 결과에 없으면 추가
  const cafes = useMemo(() => {
    if (!nearbyCafe) return searchCafes;
    const exists = searchCafes.some((c) => c.id === nearbyCafe.id);
    if (exists) return searchCafes;
    return [...searchCafes, nearbyCafe];
  }, [searchCafes, nearbyCafe]);

  // 드리프트 감지 — 커밋된 중심에서 300m 이상 벗어났거나 geohash 버킷이
  // 바뀌면 칩 노출. SearchParams.lat/lng는 선택 필드라 방어적으로 읽는다.
  const committedLat = committedParams?.lat;
  const committedLng = committedParams?.lng;
  const committedBucket =
    committedLat !== undefined && committedLng !== undefined
      ? encodeGeohash(committedLat, committedLng, 6)
      : null;
  const currentBucket = encodeGeohash(debouncedCenter.lat, debouncedCenter.lng, 6);
  const drift =
    committedLat !== undefined && committedLng !== undefined
      ? haversineMeters({ lat: committedLat, lng: committedLng }, debouncedCenter)
      : 0;
  const bucketChanged =
    committedBucket !== null && committedBucket !== currentBucket;
  const driftFarEnough = drift >= RESEARCH_DISTANCE_METERS;
  const zoomChanged =
    committedLevel !== null && committedLevel !== debouncedLevel;
  const showResearchChip =
    Boolean(committedParams) &&
    Boolean(pendingParams) &&
    (driftFarEnough || bucketChanged || zoomChanged);

  const handleResearchArea = useCallback(() => {
    if (!pendingParams) return;
    commit(pendingParams, debouncedLevel);
  }, [pendingParams, commit, debouncedLevel]);

  // 드롭다운 외부 클릭 시 닫기 (지역 · 정렬)
  useEffect(() => {
    if (!areaOpen && !sortOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (areaOpen && areaRef.current && !areaRef.current.contains(target)) {
        setAreaOpen(false);
      }
      if (sortOpen && sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [areaOpen, sortOpen]);

  // 주변 카페 검색 결과 처리 — Redux selectedCafeId 는 이미 어댑터가 dispatch.
  // 여기서는 searchCafes 에 없는 경우를 대비해 nearbyCafe 에 보관해서 `cafes`
  // 배열에 편입시킨다.
  const handleNearbyFound = useCallback((cafe: Cafe) => {
    setNearbyCafe(cafe);
  }, []);

  // Overlay/BottomSheet 닫기: Redux 만 업데이트. URL sync effect 가 ?cafe= 제거.
  const handleCafeClose = useCallback(() => {
    setNearbyCafe(null);
    dispatch(setSelectedCafe(null));
  }, [dispatch]);

  // 위치 권한 요청 (바텀시트에서 호출)
  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => { /* 거부 시 무시 */ },
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [dispatch]);

  // 지역 바로가기 — 중심 이동 + 즉시 커밋 (사용자의 명시 트리거)
  const handleAreaSelect = useCallback((idx: number) => {
    const area = AREA_PRESETS[idx];
    dispatch(setCenter({ lat: area.lat, lng: area.lng }));
    dispatch(setLevel(area.level));
    setSelectedArea(idx);
    setAreaOpen(false);
  }, [dispatch]);

  // URL 파라미터로 초기 필터 설정
  useEffect(() => {
    const moodParam = searchParamsHook.get('moods');
    if (moodParam) {
      moodParam.split(',').forEach((key) => dispatch(toggleMoodFilter(key)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // T7-B8 URL ↔ Redux 양방향 sync (`?cafe=<id>`)
  //  - URL 쪽 값이 바뀌면 Redux 반영 (딥링크/뒤로가기 지원)
  //  - Redux 쪽 선택이 바뀌면 URL 갱신 (replace — 히스토리 누적 방지)
  //  - 값이 같으면 업데이트 스킵 → 순환 방지
  const cafeIdFromUrl = searchParamsHook.get('cafe');
  useEffect(() => {
    if (cafeIdFromUrl && cafeIdFromUrl !== selectedCafeId) {
      dispatch(setSelectedCafe(cafeIdFromUrl));
    } else if (!cafeIdFromUrl && selectedCafeId) {
      dispatch(setSelectedCafe(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeIdFromUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = new URLSearchParams(window.location.search);
    if (selectedCafeId) {
      if (current.get('cafe') !== selectedCafeId) {
        current.set('cafe', selectedCafeId);
        router.replace(`/map?${current.toString()}`, { scroll: false });
      }
    } else if (current.has('cafe')) {
      current.delete('cafe');
      const qs = current.toString();
      router.replace(qs ? `/map?${qs}` : '/map', { scroll: false });
    }
  }, [selectedCafeId, router]);

  // 딥링크(`?cafe=xxx`) 로 직접 진입 시 검색 결과 `cafes` 에 없을 수 있음 →
  // fallback 쿼리로 cafe 객체 확보. Redux 에 selectedCafeId 가 있고 cafes 에
  // 없을 때만 활성화.
  const inListCafe = useMemo(
    () => (selectedCafeId ? cafes.find((c) => c.id === selectedCafeId) ?? null : null),
    [selectedCafeId, cafes],
  );
  const shouldFallbackFetch = Boolean(selectedCafeId) && !inListCafe;
  const { data: fallbackCafe } = useGetCafeQuery(selectedCafeId ?? '', {
    skip: !shouldFallbackFetch,
  });
  const selectedCafeObj: Cafe | null = inListCafe ?? fallbackCafe ?? null;

  return (
    <MapPageWrapper>
      {/* 상단 필터 바 */}
      <FilterBar>
        <Button variant="outline" size="sm" onClick={() => setFilterSheetOpen(true)}>
          <Filter size={16} />
          분위기 필터
          {filters.moods.length > 0 && (
            <FilterBadge>{filters.moods.length}</FilterBadge>
          )}
        </Button>
        <MoodFilterSheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen} />

        {/* 선택된 분위기 칩이 있을 때는 SearchTrigger를 아이콘 버튼으로 축소 →
            좁은 뷰포트(iPhone SE 375px)에서 필터바 요소 경쟁 해결. */}
        <SearchTrigger compact={filters.moods.length > 0} />

        {filters.moods.length > 0 && (
          <ChipsScroll>
            <MoodFilterChips />
          </ChipsScroll>
        )}

        <AreaSelectWrap ref={areaRef}>
          <AreaSelectBtn onClick={() => setAreaOpen(!areaOpen)}>
            <MapPin size={14} />
            {selectedArea !== null ? AREA_PRESETS[selectedArea].label : '지역 이동'}
            <ChevronDown size={12} style={{ transform: areaOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </AreaSelectBtn>
          <AreaDropdown $open={areaOpen}>
            {AREA_PRESETS.map((area, i) => (
              <AreaOption
                key={area.label}
                $active={selectedArea === i}
                onClick={() => handleAreaSelect(i)}
              >
                {area.label}
              </AreaOption>
            ))}
          </AreaDropdown>
        </AreaSelectWrap>

      </FilterBar>

      {/* Segmented(지도/목록) + 정렬 — T7-B4: PC 에서는 Toolbar 전체 미렌더.
          Sort 는 ListPanel 헤더로 이관, Provider 토글은 MapArea 우하단 floating. */}
      {!isDesktop && (
        <Toolbar>
          <Segmented role="tablist" aria-label="보기 전환">
            <SegmentedBtn
              role="tab"
              aria-selected={viewMode === 'map'}
              $active={viewMode === 'map'}
              onClick={() => dispatch(setViewMode('map'))}
            >
              <LucideMap aria-hidden />
              지도
            </SegmentedBtn>
            <SegmentedBtn
              role="tab"
              aria-selected={viewMode === 'list'}
              $active={viewMode === 'list'}
              onClick={() => dispatch(setViewMode('list'))}
            >
              <List aria-hidden />
              목록
              {cafes.length > 0 && <SegmentedCount>{cafes.length}</SegmentedCount>}
            </SegmentedBtn>
          </Segmented>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapProviderToggle />
            <SortWrap ref={sortRef}>
              <SortBtn type="button" onClick={() => setSortOpen((v) => !v)}>
                <ArrowDownUp aria-hidden />
                {SORT_OPTIONS.find((o) => o.key === filters.sort)?.label ?? '거리순'}
                <ChevronDown size={12} />
              </SortBtn>
              <SortMenu $open={sortOpen} role="menu">
                {SORT_OPTIONS.map((option) => (
                  <li key={option.key}>
                    <SortOption
                      role="menuitemradio"
                      aria-checked={filters.sort === option.key}
                      $active={filters.sort === option.key}
                      onClick={() => {
                        dispatch(setSort(option.key));
                        setSortOpen(false);
                      }}
                    >
                      {option.label}
                    </SortOption>
                  </li>
                ))}
              </SortMenu>
            </SortWrap>
          </div>
        </Toolbar>
      )}

      {/* 메인 영역 */}
      <MainArea>
        {/* 로딩 프로그레스 바 */}
        {isFetching && <LoadingBar />}

        {/* 지도 */}
        <MapArea $hidden={showList}>
          {/* 어댑터 내부에서 Redux setSelectedCafe(id) 를 dispatch 하므로 여기서
              onCafeSelect 는 nearbyCafe 경로만 신호받는다 (실제 선택 state 는 Redux). */}
          <CafeMapWrapper cafes={cafes} onCafeSelect={() => {}} onNearbyFound={handleNearbyFound} />
          {/* 스크린리더 접근성 — 지도 상 시각 마커와 동일 정보를 리스트로 병행 제공 */}
          <VisuallyHiddenCafeList cafes={cafes} />
          <ResearchAreaChip
            visible={showResearchChip && !showList}
            loading={isFetching}
            onClick={handleResearchArea}
          />
          {/* T7-B4: PC 에서만 MapProviderToggle 을 MapArea 우하단 floating.
              Tablet/Mobile 은 Toolbar 내부 instance (위) 가 담당. */}
          {isDesktop && (
            <MapProviderToggleFloating>
              <MapProviderToggle />
            </MapProviderToggleFloating>
          )}

          {/* T7-B6/B8: PC 전용 Overlay — selectedCafeObj 있을 때만 렌더. */}
          {isDesktop && selectedCafeObj && (
            <CafeOverlayCard cafe={selectedCafeObj} onClose={handleCafeClose} />
          )}
        </MapArea>

        {/* 카페 목록 패널 */}
        <ListPanel $visible={showList}>
          <ListHeader>
            <ListCount>
              {isLoading ? '검색 중...' : isError ? '검색 실패' : isFetching ? `카페 ${cafes.length}개 (업데이트 중...)` : `카페 ${cafes.length}개`}
            </ListCount>
            {/* T7-B4: PC 에서 Sort 드롭다운을 ListHeader 로 이관 (Toolbar 제거 대응). */}
            {isDesktop && (
              <SortWrap ref={sortRef}>
                <SortBtn type="button" onClick={() => setSortOpen((v) => !v)}>
                  <ArrowDownUp aria-hidden />
                  {SORT_OPTIONS.find((o) => o.key === filters.sort)?.label ?? '거리순'}
                  <ChevronDown size={12} />
                </SortBtn>
                <SortMenu $open={sortOpen} role="menu">
                  {SORT_OPTIONS.map((option) => (
                    <li key={option.key}>
                      <SortOption
                        role="menuitemradio"
                        aria-checked={filters.sort === option.key}
                        $active={filters.sort === option.key}
                        onClick={() => {
                          dispatch(setSort(option.key));
                          setSortOpen(false);
                        }}
                      >
                        {option.label}
                      </SortOption>
                    </li>
                  ))}
                </SortMenu>
              </SortWrap>
            )}
          </ListHeader>
          <ListInner>
            {isLoading ? (
              <SkeletonList>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} style={{ height: 160, borderRadius: 8 }} />
                ))}
              </SkeletonList>
            ) : isError ? (
              <EmptyState>
                <div>
                  <AlertTriangle size={32} strokeWidth={1.5} aria-hidden />
                </div>
                <p>카페 검색에 실패했습니다.<br />잠시 후 다시 시도해주세요.</p>
              </EmptyState>
            ) : cafes.length === 0 ? (
              <EmptyState>
                <div>
                  <Coffee size={32} strokeWidth={1.5} aria-hidden />
                </div>
                <p>지도를 이동하거나<br />필터를 변경해보세요</p>
              </EmptyState>
            ) : (
              <CardList>
                {cafes.map((cafe) => (
                  <CafeListCard key={cafe.id} cafe={cafe} />
                ))}
              </CardList>
            )}
          </ListInner>
        </ListPanel>

        {/* 바텀시트 — 비-PC (Tablet/Mobile) 에서만 렌더. PC 는 CafeOverlayCard 사용. */}
        {!isDesktop && (
          <BottomSheet
            cafe={showList ? null : selectedCafeObj}
            onClose={handleCafeClose}
            onRequestLocation={handleRequestLocation}
          />
        )}
      </MainArea>
    </MapPageWrapper>
  );
}
