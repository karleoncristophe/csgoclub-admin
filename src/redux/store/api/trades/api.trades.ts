import { createApi } from '@reduxjs/toolkit/query/react'
import { TRADES } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import {
  omitDataEnvironmentQueryArg,
  type WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

export type AdminTradeStatus = 'pending_withdraw' | 'withdrawn'
export type AdminTradeSource = 'case_open' | 'upgrade' | 'battle'

export type GetAdminTradesParams = WithPlatformDataEnvironment<{
  page?: number
  limit?: number
  status?: AdminTradeStatus
  source?: AdminTradeSource
  userId?: string
  search?: string
  from?: string
  to?: string
}>

export type AdminTradeUser = {
  _id: string
  name: string
  steamId?: string
  avatar?: string
  avatarMedium?: string
  avatarFull?: string
}

export type AdminTradeListItem = {
  _id: string
  userId: string
  skinName: string
  image?: string
  rarityName?: string
  rarityColor?: string
  value: number
  currency: string
  valueUsd: number
  valueBrl: number
  valueEur: number
  status: AdminTradeStatus
  source: AdminTradeSource
  caseName?: string
  caseSlug?: string
  skinsbackCustomId?: string
  withdrawnAt?: string
  createdAt?: string
  user?: AdminTradeUser
}

export type AdminTradeListSummary = {
  totalTrades: number
  withdrawnCount: number
  pendingCount: number
  totalValueUsd: number
  totalValueBrl: number
  withdrawnValueUsd: number
}

export type AdminTradeListResponse = {
  data: AdminTradeListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: AdminTradeListSummary
}

export const tradesApi = createApi({
  reducerPath: 'tradesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Trades'],
  endpoints: (builder) => ({
    getAdminTrades: builder.query<AdminTradeListResponse, GetAdminTradesParams | void>({
      query: (params) => {
        const clean = params ? omitDataEnvironmentQueryArg(params) : undefined
        return {
          url: TRADES.ROOT,
          method: 'GET',
          params: {
            ...(clean?.page != null ? { page: clean.page } : {}),
            ...(clean?.limit != null ? { limit: clean.limit } : {}),
            ...(clean?.status ? { status: clean.status } : {}),
            ...(clean?.source ? { source: clean.source } : {}),
            ...(clean?.userId ? { userId: clean.userId } : {}),
            ...(clean?.search ? { search: clean.search } : {}),
            ...(clean?.from ? { from: clean.from } : {}),
            ...(clean?.to ? { to: clean.to } : {}),
          },
        }
      },
      providesTags: ['Trades'],
    }),
  }),
})

export const { useGetAdminTradesQuery } = tradesApi
