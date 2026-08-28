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
  color?: string
  items: ArenaCrateItem[]
  economyLedger?: {
    bankBalanceBrl?: number
    bankBalanceUsd?: number
    bankBalanceEur?: number
    totalOpens?: number
  }
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateArenaCratePayload = {
  name: string
  description?: string
  imageUrl?: string
  rarity: ArenaRarity
  color?: string
  items?: ArenaCrateItem[]
  active?: boolean
}

export type UpdateArenaCratePayload = Partial<CreateArenaCratePayload>

export type ArenaPlayPricing = {
  listPriceBrl: number
  listPriceUsd: number
  listPriceEur: number
  discountPercent: number
  valueBrl: number
  valueUsd: number
  valueEur: number
  updatedAt?: string
  updatedBy?: string
}

export type ArenaPlayPricingHistoryItem = {
  id: string
  changedAt?: string
  changedBy?: string
  from: Omit<ArenaPlayPricing, 'updatedAt' | 'updatedBy'>
  to: Omit<ArenaPlayPricing, 'updatedAt' | 'updatedBy'>
  reason?: string
}

export type ArenaPlayPricingHistoryResponse = {
  items: ArenaPlayPricingHistoryItem[]
  total: number
  page: number
  limit: number
}

export type UpdateArenaPlayPricingPayload = {
  listPriceBrl: number
  listPriceUsd: number
  listPriceEur: number
  discountPercent: number
}

export const arenaApi = createApi({
  reducerPath: 'arenaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ArenaCrates', 'ArenaCrate', 'ArenaPlayPricing'],
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
    getArenaPlayPricing: builder.query<ArenaPlayPricing, void>({
      query: () => ({ url: ARENA.PRICING, method: 'GET' }),
      providesTags: ['ArenaPlayPricing'],
    }),
    updateArenaPlayPricing: builder.mutation<
      ArenaPlayPricing,
      UpdateArenaPlayPricingPayload
    >({
      query: (body) => ({ url: ARENA.PRICING, method: 'PATCH', body }),
      invalidatesTags: ['ArenaPlayPricing', 'ArenaCrates', 'ArenaCrate'],
    }),
    getArenaPlayPricingHistory: builder.query<
      ArenaPlayPricingHistoryResponse,
      { page?: number; limit?: number } | void
    >({
      query: (args) => ({
        url: ARENA.PRICING_HISTORY,
        method: 'GET',
        params: {
          page: args && 'page' in args ? args.page : 1,
          limit: args && 'limit' in args ? args.limit : 8,
        },
      }),
      providesTags: ['ArenaPlayPricing'],
    }),
  }),
})

export const {
  useGetArenaCratesQuery,
  useGetArenaCrateByIdQuery,
  useCreateArenaCrateMutation,
  useUpdateArenaCrateMutation,
  useDeleteArenaCrateMutation,
  useGetArenaPlayPricingQuery,
  useUpdateArenaPlayPricingMutation,
  useGetArenaPlayPricingHistoryQuery,
} = arenaApi
