import { createApi } from '@reduxjs/toolkit/query/react'
import { ARENA } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export const ARENA_RARITIES = [
  'common',
  'rare',
  'super_rare',
  'epic',
  'insane',
] as const

export type ArenaRarity = (typeof ARENA_RARITIES)[number]

export type ArenaCrateItemRarity = {
  name?: string
  color?: string
}

export type ArenaCrateItem = {
  skinName: string
  image?: string
  rarity?: ArenaCrateItemRarity
  probability: number
  enabled: boolean
  valueBrl?: number
  valueUsd?: number
  valueEur?: number
}

export type ArenaCrate = {
  _id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  rarity: ArenaRarity
  value: number
  valueBrl?: number
  valueUsd?: number
  valueEur?: number
  color?: string
  items: ArenaCrateItem[]
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateArenaCratePayload = {
  name: string
  description?: string
  imageUrl?: string
  rarity: ArenaRarity
  value?: number
  valueBrl?: number
  valueUsd?: number
  valueEur?: number
  color?: string
  items?: ArenaCrateItem[]
  active?: boolean
}

export type UpdateArenaCratePayload = Partial<CreateArenaCratePayload>

export const arenaApi = createApi({
  reducerPath: 'arenaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ArenaCrates', 'ArenaCrate'],
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getArenaCrates: builder.query<ArenaCrate[], void>({
      query: () => ({ url: ARENA.CRATES, method: 'GET' }),
      providesTags: ['ArenaCrates'],
    }),
    getArenaCrateById: builder.query<ArenaCrate, string>({
      query: (id) => ({ url: ARENA.CRATE_BY_ID(id), method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'ArenaCrate', id }],
    }),
    createArenaCrate: builder.mutation<ArenaCrate, CreateArenaCratePayload>({
      query: (body) => ({ url: ARENA.CRATES, method: 'POST', body }),
      invalidatesTags: ['ArenaCrates'],
    }),
    updateArenaCrate: builder.mutation<
      ArenaCrate,
      { id: string; body: UpdateArenaCratePayload }
    >({
      query: ({ id, body }) => ({
        url: ARENA.CRATE_BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'ArenaCrates',
        { type: 'ArenaCrate', id },
      ],
    }),
    deleteArenaCrate: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: ARENA.CRATE_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['ArenaCrates'],
    }),
  }),
})

export const {
  useGetArenaCratesQuery,
  useGetArenaCrateByIdQuery,
  useCreateArenaCrateMutation,
  useUpdateArenaCrateMutation,
  useDeleteArenaCrateMutation,
} = arenaApi
