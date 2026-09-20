import { createApi } from '@reduxjs/toolkit/query/react'
import { BATTLES_ADMIN } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import {
  omitDataEnvironmentQueryArg,
  type WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

export type AdminBattleBot = {
  _id: string
  name: string
  avatarUrl?: string
  balance: number
  active: boolean
  lastShownAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AdminBattleDrop = {
  roundIndex: number
  caseId: string
  skinName: string
  image: string | null
  rarityName: string | null
  rarityColor: string | null
  itemValue: number
  fairTicket: number | null
  dropResolutionMethod: string | null
}

export type AdminBattleSeat = {
  index: number
  type: string
  userId: string | null
  botId: string | null
  name: string | null
  avatarUrl: string | null
  paid: boolean
  totalValue: number
  drops: AdminBattleDrop[]
}

export type AdminBattleCase = {
  caseId: string
  slug: string
  name: string
  imageUrl: string | null
  price: number
}

export type AdminBattle = {
  id: string
  status: string
  mode: string
  visibility: string
  joinCode: string | null
  slots: number
  caseSequence: AdminBattleCase[]
  priceTotal: number
  priceUsd?: number | null
  priceBrl?: number | null
  priceEur?: number | null
  currency: string
  hostUserId: string
  seats: AdminBattleSeat[]
  currentRound: number
  winnerSeatIndex: number | null
  tieBreak: boolean
  fillWithBots: boolean
  countdownEndsAt: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string | null
}

export type AdminBattleFilters = {
  botId?: string
  caseId?: string
  status?: string
  mode?: string
  from?: string
  to?: string
}

/** Espelha `GET /admin/battles/bot-metrics` (BattleService.adminBotBattleMetrics). */
export type AdminBattleBotMetricsCurrency = {
  currency: string
  /** Prêmio perdido pelos bots, debitado do banco da caixa. */
  botPrizeLost: number
  botLossCount: number
  /** Prêmio ganho por clientes (vai para o inventário deles). */
  clientPrizeWon: number
  clientWinCount: number
  botWinCount: number
}

export type AdminBattleBotMetrics = {
  startDate: string | null
  endDate: string | null
  byCurrency: AdminBattleBotMetricsCurrency[]
}

/** @deprecated use AdminBattle — list returns full serialize */
export type AdminBattleListItem = AdminBattle

export const battlesAdminApi = createApi({
  reducerPath: 'battlesAdminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['BattleBots', 'BattlesAdmin'],
  endpoints: (builder) => ({
    getBattleBots: builder.query<AdminBattleBot[], void>({
      query: () => ({ url: BATTLES_ADMIN.BOTS, method: 'GET' }),
      providesTags: ['BattleBots'],
    }),
    createBattleBot: builder.mutation<
      AdminBattleBot,
      {
        name: string
        avatarUrl?: string
        active?: boolean
      }
    >({
      query: (body) => ({
        url: BATTLES_ADMIN.BOTS,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BattleBots'],
    }),
    updateBattleBot: builder.mutation<
      AdminBattleBot,
      { id: string; body: Partial<AdminBattleBot> }
    >({
      query: ({ id, body }) => ({
        url: BATTLES_ADMIN.BOT_BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['BattleBots'],
    }),
    deleteBattleBot: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: BATTLES_ADMIN.BOT_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['BattleBots'],
    }),
    getAdminBattles: builder.query<
      {
        data: AdminBattle[]
        total: number
        page: number
        limit: number
        totalPages: number
      },
      WithPlatformDataEnvironment<
        { page?: number; limit?: number } & AdminBattleFilters
      > | void
    >({
      query: (params) => {
        const clean = params ? omitDataEnvironmentQueryArg(params) : undefined
        return {
          url: BATTLES_ADMIN.ROOT,
          method: 'GET',
          params: {
            page: clean?.page ?? 1,
            limit: clean?.limit ?? 20,
            ...(clean?.botId ? { botId: clean.botId } : {}),
            ...(clean?.caseId ? { caseId: clean.caseId } : {}),
            ...(clean?.status ? { status: clean.status } : {}),
            ...(clean?.mode ? { mode: clean.mode } : {}),
            ...(clean?.from ? { from: clean.from } : {}),
            ...(clean?.to ? { to: clean.to } : {}),
          },
        }
      },
      providesTags: ['BattlesAdmin'],
    }),
    getAdminBattleBotMetrics: builder.query<
      AdminBattleBotMetrics,
      { start?: string; end?: string } | void
    >({
      query: (params) => ({
        url: BATTLES_ADMIN.BOT_METRICS,
        method: 'GET',
        params: {
          ...(params?.start ? { start: params.start } : {}),
          ...(params?.end ? { end: params.end } : {}),
        },
      }),
      providesTags: ['BattlesAdmin'],
    }),
    getAdminBattleById: builder.query<AdminBattle, string>({
      query: (id) => ({
        url: BATTLES_ADMIN.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'BattlesAdmin', id }],
    }),
    cancelAdminBattle: builder.mutation<AdminBattle, string>({
      query: (id) => ({
        url: BATTLES_ADMIN.CANCEL(id),
        method: 'POST',
      }),
      invalidatesTags: ['BattlesAdmin'],
    }),
  }),
})

export const {
  useGetBattleBotsQuery,
  useCreateBattleBotMutation,
  useUpdateBattleBotMutation,
  useDeleteBattleBotMutation,
  useGetAdminBattlesQuery,
  useGetAdminBattleBotMetricsQuery,
  useGetAdminBattleByIdQuery,
  useCancelAdminBattleMutation,
} = battlesAdminApi
