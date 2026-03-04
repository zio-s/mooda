import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MapBounds, SearchParams } from '@/types';

interface MapState {
  center: { lat: number; lng: number };
  level: number;
  bounds: MapBounds | null;
  selectedCafeId: string | null;
  userLocation: { lat: number; lng: number } | null;
  filters: {
    moods: string[];
    openNow: boolean;
    sort: 'distance' | 'rating' | 'reviews';
  };
}

const initialState: MapState = {
  center: { lat: 37.5665, lng: 126.978 },
  level: 5,
  bounds: null,
  selectedCafeId: null,
  userLocation: null,
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
  resetFilters,
} = mapSlice.actions;

export default mapSlice.reducer;
