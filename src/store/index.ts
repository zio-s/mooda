import { configureStore } from '@reduxjs/toolkit';
import { cafesApi } from './api/cafesApi';
import { collectionsApi } from './api/collectionsApi';
import mapReducer from './slices/mapSlice';

export const store = configureStore({
  reducer: {
    [cafesApi.reducerPath]: cafesApi.reducer,
    [collectionsApi.reducerPath]: collectionsApi.reducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cafesApi.middleware, collectionsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
