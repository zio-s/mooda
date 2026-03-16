'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchCafesQuery } from '@/store/api/cafesApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMoodFilter, setSelectedCafe as deselectCafe, setUserLocation, setCenter, setLevel } from '@/store/slices/mapSlice';
import { CafeMapWrapper } from '@/components/map/CafeMapWrapper';
import { BottomSheet } from '@/components/map/BottomSheet';
import { MoodFilter, MoodFilterChips } from '@/components/filter/MoodFilter';
import { CafeCard } from '@/components/cafe/CafeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CafeSearch } from '@/components/search/CafeSearch';
import { Filter, List, MapPin, ChevronDown } from 'lucide-react';
import type { Cafe } from '@/types';

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
} from './page.styles';

export function MapClient() {
  const searchParamsHook = useSearchParams();
  const dispatch = useAppDispatch();
  const { filters, bounds, center } = useAppSelector((s) => s.map);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [nearbyCafe, setNearbyCafe] = useState<Cafe | null>(null);
  const [showList, setShowList] = useState(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  // 검색 파라미터 메모이제이션
  const searchParams = useMemo(() => {
    if (!bounds) return null;
    return {
      lat: center.lat,
      lng: center.lng,
      ...bounds,
      moods: filters.moods,
      openNow: filters.openNow,
      sort: filters.sort,
    };
  }, [center.lat, center.lng, bounds, filters.moods, filters.openNow, filters.sort]);

  // RTK Query: 이전 데이터를 유지하면서 background refetch
  const { data, isLoading, isFetching, isError } = useSearchCafesQuery(searchParams!, {
    skip: !searchParams,
  });

  const searchCafes = data?.cafes ?? [];

  // 주변 검색으로 찾은 카페가 검색 결과에 없으면 추가
  const cafes = useMemo(() => {
    if (!nearbyCafe) return searchCafes;
    const exists = searchCafes.some((c) => c.id === nearbyCafe.id);
    if (exists) return searchCafes;
    return [...searchCafes, nearbyCafe];
  }, [searchCafes, nearbyCafe]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!areaOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) {
        setAreaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [areaOpen]);

  // 주변 카페 검색 결과 처리
  const handleNearbyFound = useCallback((cafe: Cafe) => {
    setNearbyCafe(cafe);
    setSelectedCafe(cafe);
  }, []);

  // 바텀시트 닫기: 로컬 상태 + Redux 마커 deselect
  const handleBottomSheetClose = useCallback(() => {
    setSelectedCafe(null);
    setNearbyCafe(null);
    dispatch(deselectCafe(null));
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

  // 카페 검색 결과 선택
  const handleSearchSelect = useCallback((result: { cafeId: string; lat: number; lng: number; name: string }) => {
    dispatch(setCenter({ lat: result.lat, lng: result.lng }));
    dispatch(setLevel(3)); // 가까이 줌
    setShowList(false);
    // cafeId가 있으면 마커 선택 상태로 전환
    if (result.cafeId) {
      dispatch(deselectCafe(result.cafeId));
    }
  }, [dispatch]);

  // 지역 바로가기
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

  return (
    <MapPageWrapper>
      {/* 상단 필터 바 */}
      <FilterBar>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter size={16} />
              분위기 필터
              {filters.moods.length > 0 && (
                <FilterBadge>{filters.moods.length}</FilterBadge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>분위기 필터</SheetTitle>
            </SheetHeader>
            <MoodFilter />
          </SheetContent>
        </Sheet>

        <CafeSearch onSelect={handleSearchSelect} />

        <ChipsScroll>
          <MoodFilterChips />
        </ChipsScroll>

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

        <Button variant="outline" size="sm" onClick={() => setShowList(!showList)}>
          {showList ? (
            <><MapPin size={16} /> 지도</>
          ) : (
            <><List size={16} /> 목록</>
          )}
        </Button>
      </FilterBar>

      {/* 메인 영역 */}
      <MainArea>
        {/* 로딩 프로그레스 바 */}
        {isFetching && <LoadingBar />}

        {/* 지도 */}
        <MapArea $hidden={showList}>
          <CafeMapWrapper cafes={cafes} onCafeSelect={setSelectedCafe} onNearbyFound={handleNearbyFound} />
        </MapArea>

        {/* 카페 목록 패널 */}
        <ListPanel $visible={showList}>
          <ListHeader>
            <ListCount>
              {isLoading ? '검색 중...' : isError ? '검색 실패' : isFetching ? `카페 ${cafes.length}개 (업데이트 중...)` : `카페 ${cafes.length}개`}
            </ListCount>
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
                <div style={{ fontSize: 36 }}>😵</div>
                <p>카페 검색에 실패했습니다.<br />잠시 후 다시 시도해주세요.</p>
              </EmptyState>
            ) : cafes.length === 0 ? (
              <EmptyState>
                <div style={{ fontSize: 36 }}>☕</div>
                <p>지도를 이동하거나<br />필터를 변경해보세요</p>
              </EmptyState>
            ) : (
              <CardList>
                {cafes.map((cafe) => (
                  <CafeCard key={cafe.id} cafe={cafe} />
                ))}
              </CardList>
            )}
          </ListInner>
        </ListPanel>

        {/* 바텀시트 — 모바일에서 카페 선택 시 표시 */}
        <BottomSheet
          cafe={showList ? null : selectedCafe}
          onClose={handleBottomSheetClose}
          onRequestLocation={handleRequestLocation}
        />
      </MainArea>
    </MapPageWrapper>
  );
}
