import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface CollectionSummary {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  _count: { items: number };
}

interface CreateCollectionInput {
  name: string;
  description?: string;
}

export const collectionsApi = createApi({
  reducerPath: 'collectionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Collection'],
  endpoints: (builder) => ({
    createCollection: builder.mutation<CollectionSummary, CreateCollectionInput>({
      query: (body) => ({
        url: '/collections',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Collection'],
    }),
  }),
});

export const { useCreateCollectionMutation } = collectionsApi;
