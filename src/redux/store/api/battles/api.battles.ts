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
    getAdminBattles: builder.query<AdminBattle[], number | void>({
      query: (limit = 50) => ({
        url: `${BATTLES_ADMIN.ROOT}?limit=${limit ?? 50}`,
        method: 'GET',
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
  useGetAdminBattleByIdQuery,
  useCancelAdminBattleMutation,
} = battlesAdminApi
