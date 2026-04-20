import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MapBounds, SearchParams } from '@/types';

export type MapProvider = 'kakao' | 'naver';

interface MapState {
  center: { lat: number; lng: number };
  level: number;
  bounds: MapBounds | null;
  selectedCafeId: string | null;
  userLocation: { lat: number; lng: number } | null;
  /**
   * UI-only: /map 화면에서 지도/목록 중 어느 뷰를 볼지. 서버 데이터 아님.
   */
  viewMode: 'map' | 'list';
  /**
   * 지도 공급자 선호도. localStorage에 persist. 기본은 'kakao'.
   */
  provider: MapProvider;
  filters: {
    moods: string[];
    openNow: boolean;
    sort: 'distance' | 'rating' | 'reviews';
  };
}

const PROVIDER_STORAGE_KEY = 'mooda:map-provider:v1';

function readStoredProvider(): MapProvider {
  if (typeof window === 'undefined') return 'kakao';
  try {
    const raw = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
    return raw === 'naver' ? 'naver' : 'kakao';
  } catch {
    return 'kakao';
  }
}

function writeStoredProvider(provider: MapProvider): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    /* quota or disabled — ignore */
  }
}

const initialState: MapState = {
  center: { lat: 37.5665, lng: 126.978 },
  level: 5,
  bounds: null,
  selectedCafeId: null,
  userLocation: null,
  viewMode: 'map',
  // SSR 초기 렌더는 'kakao'로 고정하고, 클라이언트 hydrate 직후 dispatch로 덮어씀
  // (아래 hydrateMapProvider helper 사용). — slice 초기값에 localStorage 접근하면
  // SSR/CSR 불일치로 hydration mismatch 발생.
  provider: 'kakao',
  filters: {
    moods: [],
    openNow: false,
    sort: 'distance',
  },
};

export const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCenter(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.center = action.payload;
    },
    setLevel(state, action: PayloadAction<number>) {
      state.level = action.payload;
    },
    setBounds(state, action: PayloadAction<MapBounds>) {
      state.bounds = action.payload;
    },
    setSelectedCafe(state, action: PayloadAction<string | null>) {
      state.selectedCafeId = action.payload;
    },
    setUserLocation(state, action: PayloadAction<{ lat: number; lng: number } | null>) {
      state.userLocation = action.payload;
    },
    toggleMoodFilter(state, action: PayloadAction<string>) {
      const moodKey = action.payload;
      const idx = state.filters.moods.indexOf(moodKey);
      if (idx === -1) {
        state.filters.moods.push(moodKey);
      } else {
        state.filters.moods.splice(idx, 1);
      }
    },
    clearMoodFilters(state) {
      state.filters.moods = [];
    },
    setOpenNow(state, action: PayloadAction<boolean>) {
      state.filters.openNow = action.payload;
    },
    setSort(state, action: PayloadAction<SearchParams['sort']>) {
      state.filters.sort = action.payload ?? 'distance';
    },
    setViewMode(state, action: PayloadAction<'map' | 'list'>) {
      state.viewMode = action.payload;
    },
    setMapProvider(state, action: PayloadAction<MapProvider>) {
      state.provider = action.payload;
      writeStoredProvider(action.payload);
    },
    hydrateMapProvider(state) {
      state.provider = readStoredProvider();
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setCenter,
  setLevel,
  setBounds,
  setSelectedCafe,
  setUserLocation,
  toggleMoodFilter,
  clearMoodFilters,
  setOpenNow,
  setSort,
  setViewMode,
  setMapProvider,
  hydrateMapProvider,
  resetFilters,
} = mapSlice.actions;

export default mapSlice.reducer;
