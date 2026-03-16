import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Cafe, SearchParams, SearchResult, TransitRoute, GoogleReviewsResponse } from '@/types';

export const cafesApi = createApi({
  reducerPath: 'cafesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Cafe', 'Favorite'],
  endpoints: (builder) => ({
    searchCafes: builder.query<SearchResult, SearchParams>({
      query: (params) => ({
        url: '/cafes/search',
        method: 'POST',
        body: params,
      }),
      keepUnusedDataFor: 120,
    }),

    getCafe: builder.query<Cafe, string>({
      query: (id) => `/cafes/${id}`,
      providesTags: (_, __, id) => [{ type: 'Cafe', id }],
    }),

    getCafeBlogs: builder.query<{ items: unknown[] }, string>({
      query: (id) => `/cafes/${id}/blogs`,
    }),

    getCafeGoogleReviews: builder.query<GoogleReviewsResponse, string>({
      query: (id) => `/cafes/${id}/google-reviews`,
      keepUnusedDataFor: 600, // 10분
    }),

    toggleVote: builder.mutation<{ voted: boolean }, { cafeId: string; moodId: string }>({
      query: ({ cafeId, moodId }) => ({
        url: `/cafes/${cafeId}/votes`,
        method: 'POST',
        body: { moodId },
      }),
      invalidatesTags: (_, __, { cafeId }) => [{ type: 'Cafe', id: cafeId }],
    }),

    createReview: builder.mutation<
      unknown,
      { cafeId: string; rating: number; content?: string }
    >({
      query: ({ cafeId, ...body }) => ({
        url: `/cafes/${cafeId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_, __, { cafeId }) => [{ type: 'Cafe', id: cafeId }],
    }),

    getFavorites: builder.query<Cafe[], void>({
      query: () => '/users/me/favorites',
      providesTags: ['Favorite'],
    }),

    addFavorite: builder.mutation<{ success: boolean }, string>({
      query: (cafeId) => ({
        url: '/users/me/favorites',
        method: 'POST',
        body: { cafeId },
      }),
      invalidatesTags: ['Favorite'],
    }),

    removeFavorite: builder.mutation<{ success: boolean }, string>({
      query: (cafeId) => ({
        url: `/users/me/favorites?cafeId=${cafeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorite'],
    }),

    getTransitRoute: builder.query<
      TransitRoute,
      { fromLat: number; fromLng: number; toLat: number; toLng: number }
    >({
      query: ({ fromLat, fromLng, toLat, toLng }) =>
        `/route/transit?sx=${fromLng}&sy=${fromLat}&ex=${toLng}&ey=${toLat}`,
      keepUnusedDataFor: 300, // 5분 캐시
    }),

    searchNearby: builder.mutation<
      { cafe: Cafe | null; created?: boolean },
      { lat: number; lng: number; radius?: number }
    >({
      query: ({ lat, lng, radius = 50 }) =>
        `/cafes/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    }),
  }),
});

export const {
  useSearchCafesQuery,
  useGetCafeQuery,
  useGetCafeBlogsQuery,
  useGetCafeGoogleReviewsQuery,
  useToggleVoteMutation,
  useCreateReviewMutation,
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetTransitRouteQuery,
  useSearchNearbyMutation,
} = cafesApi;
