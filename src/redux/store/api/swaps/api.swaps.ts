import { createApi } from '@reduxjs/toolkit/query/react'
import { SWAPS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import {
  omitDataEnvironmentQueryArg,
  type WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

export const SWAP_STATUSES = [
  'created',
  'reserved',
  'debited',
  'pending',
  'completed',
  'failed',
] as const

export type SwapStatus = (typeof SWAP_STATUSES)[number]
export type SwapStatusFilter = SwapStatus | 'in_progress'
export type SwapCurrency = 'BRL' | 'USD' | 'EUR'

export type GetAdminSwapsParams = WithPlatformDataEnvironment<{
  page?: number
  limit?: number
  status?: SwapStatusFilter
  currency?: SwapCurrency
  userId?: string
  search?: string
  from?: string
  to?: string
}>

export type AdminSwapUser = {
  _id: string
  name: string
  steamId?: string
  avatar?: string
  avatarMedium?: string
  avatarFull?: string
}

export type AdminSwapInventoryItem = {
  id: string
  name?: string | null
  image?: string | null
  rarityName?: string | null
  rarityColor?: string | null
  value: number
  valueUsd?: number | null
  valueBrl?: number | null
  valueEur?: number | null
  currency?: string | null
  status?: string | null
}

export type AdminSwapListItem = {
  id: string
  status: SwapStatus
  currency: SwapCurrency
  targetName: string
  targetImage?: string | null
  targetRarityName?: string | null
  targetRarityColor?: string | null
  targetClassId?: string | null
  targetValue: number
  targetValueUsd?: number | null
  targetValueBrl?: number | null
  targetValueEur?: number | null
  /** Custo real do alvo na SkinsBack em USD (é o que a dash paga). */
  targetCostUsd?: number | null
  targetCostBrl?: number | null
  targetCostEur?: number | null
  /** false quando o USD foi estimado pela cotação atual (swap antigo). */
  targetCostUsdRecorded?: boolean
  rateBrl?: number | null
  rateEur?: number | null
  sourceItemsTotal: number
  sourceItemsTotalUsd?: number | null
  sourceItemsTotalBrl?: number | null
  sourceItemsTotalEur?: number | null
  balanceUsed: number
  balanceUsedUsd?: number | null
  balanceUsedBrl?: number | null
  balanceUsedEur?: number | null
  changeCredited: number
  changeCreditedUsd?: number | null
  changeCreditedBrl?: number | null
  changeCreditedEur?: number | null
  offeredTotal: number
  sourceItemCount: number
  sourceItems: AdminSwapInventoryItem[]
  receivedItem?: AdminSwapInventoryItem | null
  userId: string
  user?: AdminSwapUser
  createdAt?: string | null
  updatedAt?: string | null
}

export type AdminSwapListSummary = {
  totalSwaps: number
  completedCount: number
  failedCount: number
  inProgressCount: number
  targetValueTotal: number
  /** Somatório do custo real em USD pago à SkinsBack. */
  targetCostUsdTotal?: number
  targetCostBrlTotal?: number
  sourceItemsTotal: number
  balanceUsedTotal: number
  changeCreditedTotal: number
}

export type AdminSwapListResponse = {
  data: AdminSwapListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: AdminSwapListSummary
}

export const swapsApi = createApi({
  reducerPath: 'swapsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Swaps', 'Swap'],
  endpoints: (builder) => ({
    getAdminSwaps: builder.query<AdminSwapListResponse, GetAdminSwapsParams | void>({
      query: (params) => {
        const clean = params ? omitDataEnvironmentQueryArg(params) : undefined
        return {
          url: SWAPS.ROOT,
          method: 'GET',
          params: {
            ...(clean?.page != null ? { page: clean.page } : {}),
            ...(clean?.limit != null ? { limit: clean.limit } : {}),
            ...(clean?.status ? { status: clean.status } : {}),
            ...(clean?.currency ? { currency: clean.currency } : {}),
            ...(clean?.userId ? { userId: clean.userId } : {}),
            ...(clean?.search ? { search: clean.search } : {}),
            ...(clean?.from ? { from: clean.from } : {}),
            ...(clean?.to ? { to: clean.to } : {}),
          },
        }
      },
      providesTags: ['Swaps'],
    }),
    getAdminSwapById: builder.query<
      AdminSwapListItem,
      WithPlatformDataEnvironment<{ id: string }>
    >({
      query: ({ id }) => ({
        url: SWAPS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, arg) => [{ type: 'Swap', id: arg.id }],
    }),
  }),
})

export const { useGetAdminSwapsQuery, useGetAdminSwapByIdQuery } = swapsApi
