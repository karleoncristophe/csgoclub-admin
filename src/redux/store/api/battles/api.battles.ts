import { createApi } from '@reduxjs/toolkit/query/react'
import { BATTLES_ADMIN } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type AdminBattleBot = {
  _id: string
  name: string
  avatarUrl?: string
  aggression: number
  active: boolean
  weight: number
  createdAt?: string
  updatedAt?: string
}

export type AdminBattleListItem = {
  id: string
  status: string
  mode: string
  slots: number
  priceTotal: number
  currency: string
  currentRound: number
  winnerSeatIndex: number | null
  createdAt: string | null
  seats: Array<{
    index: number
    type: string
    name: string | null
    totalValue: number
  }>
}

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
        aggression?: number
        weight?: number
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
    getAdminBattles: builder.query<AdminBattleListItem[], number | void>({
      query: (limit = 50) => ({
        url: `${BATTLES_ADMIN.ROOT}?limit=${limit ?? 50}`,
        method: 'GET',
      }),
      providesTags: ['BattlesAdmin'],
    }),
    cancelAdminBattle: builder.mutation<AdminBattleListItem, string>({
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
  useCancelAdminBattleMutation,
} = battlesAdminApi
