import { createApi } from '@reduxjs/toolkit/query/react'
import { ARENA } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import {
  omitDataEnvironmentQueryArg,
  type WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

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

export type ArenaMatchStatus =
  | 'playing'
  | 'settling'
  | 'finished'
  | 'lost'
  | 'disconnected'

export type ArenaPaymentMethod = 'balance' | 'ticket'

export type ArenaScriptGroup = 'common' | 'rare' | 'jackpot'

export type ArenaMatchUser = {
  _id?: string
  id: string
  name: string
  steamId: string
  avatar?: string
}

export type ArenaMatchCrateRef = {
  id: string
  name: string
  slug: string
  rarity?: ArenaRarity
  imageUrl?: string
  color?: string
}

export type ArenaMatchScriptRef = {
  id: string
  name: string
  group?: ArenaScriptGroup
}

export type ArenaMatchAwarded = {
  rarity: ArenaRarity
  name: string
  image?: string
  crateId?: string
  crateSlug?: string
  crateName?: string
  unopened?: boolean
  itemRarityName?: string
  itemRarityColor?: string
  value: number
  currency: string
  valueUsd?: number
  valueBrl?: number
  valueEur?: number
  inventoryItemId?: string
}

export type ArenaMatchBox = {
  id: string
  index: number
  rarity: ArenaRarity
}

export type ArenaMatchPricingSnapshot = {
  listPriceBrl: number
  listPriceUsd: number
  listPriceEur: number
  discountPercent: number
  valueBrl: number
  valueUsd: number
  valueEur: number
}

export type ArenaMatchListItem = {
  _id: string
  id: string
  status: ArenaMatchStatus
  paymentMethod: ArenaPaymentMethod
  chargedAmount: number
  currency: string
  crateRarity?: ArenaRarity | null
  group?: ArenaScriptGroup
  user: ArenaMatchUser | null
  crate: ArenaMatchCrateRef | null
  script: ArenaMatchScriptRef | null
  awarded: ArenaMatchAwarded[]
  startedAt?: string | null
  expiresAt?: string | null
  finishedAt?: string | null
  createdAt?: string | null
}

export type ArenaMatchDetail = ArenaMatchListItem & {
  pricingSnapshot?: ArenaMatchPricingSnapshot | null
  boxes: ArenaMatchBox[]
  destroyedBoxIds: string[]
  destroyedCounts: Record<ArenaRarity, number>
  progressBefore: Record<ArenaRarity, number>
  progressAfter: Record<ArenaRarity, number>
  idempotencyKey?: string | null
  updatedAt?: string | null
}

export type ArenaMatchSummary = {
  total: number
  finished: number
  lost: number
  withPrizes: number
}

export type ArenaMatchesResponse = {
  items: ArenaMatchListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: ArenaMatchSummary
}

export type GetArenaMatchesParams = {
  page?: number
  limit?: number
  status?: ArenaMatchStatus | ''
  paymentMethod?: ArenaPaymentMethod | ''
  search?: string
  crateId?: string
}

export type ArenaCrateOpenUser = {
  _id: string
  name: string
  steamId?: string
  avatar?: string
  avatarMedium?: string
  avatarFull?: string
}

export type ArenaCrateOpenCrate = {
  _id: string
  name: string
  slug: string
  imageUrl?: string
  rarity?: string
}

export type ArenaCrateOpenListItem = {
  _id: string
  crateId: string
  userId: string
  matchId?: string
  inventoryItemId: string
  wonSkinName: string
  pricePaid: number
  itemValue: number
  currency: string
  valueUsd: number
  valueBrl: number
  valueEur: number
  isTestOpen: boolean
  wasRerolled: boolean
  originalRolledSkinName?: string
  dropResolutionMethod: 'direct' | 'reroll' | 'fallback'
  rerollAttempts: number
  disposition: 'converted'
  dispositionResolvedAt?: string
  convertedAmount?: number
  wonItemImage?: string
  wonItemRarityName?: string
  wonItemRarityColor?: string
  createdAt?: string
  crate: ArenaCrateOpenCrate
  user?: ArenaCrateOpenUser
}

export type ArenaCrateOpenDetailItem = {
  skinName: string
  image?: string
  rarityName?: string
  rarityColor?: string
  probability: number
  valueBrl?: number
  valueUsd?: number
  valueEur?: number
  isWon: boolean
}

export type ArenaCrateOpenDetail = ArenaCrateOpenListItem & {
  bankBalanceBefore: number
  bankInjection: number
  bankBalanceAfter: number
  requiredBankBalance: number
  coveredByOpenPrice: boolean
  bankField: 'bankBalanceBrl' | 'bankBalanceUsd' | 'bankBalanceEur'
  crateItems: ArenaCrateOpenDetailItem[]
}

export type ArenaCrateOpenTopWonItem = {
  openId: string
  skinName: string
  image?: string
  rarityName?: string
  rarityColor?: string
  itemValue: number
  currency: string
  crateName?: string
  userName?: string
  createdAt?: string
}

export type ArenaCrateOpensResponse = {
  data: ArenaCrateOpenListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: {
    totalOpens: number
    totalPaid: number
    totalWonValue: number
    convertedCount: number
    testOpensCount: number
    topWonItem?: ArenaCrateOpenTopWonItem | null
  }
}

export type GetArenaCrateOpensParams = WithPlatformDataEnvironment<{
  page?: number
  limit?: number
  crateId?: string
  matchId?: string
  userId?: string
  search?: string
}>

export const arenaApi = createApi({
  reducerPath: 'arenaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'ArenaCrates',
    'ArenaCrate',
    'ArenaPlayPricing',
    'ArenaMatches',
    'ArenaMatch',
    'ArenaCrateOpens',
    'ArenaCrateOpen',
  ],
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
    getArenaMatches: builder.query<ArenaMatchesResponse, GetArenaMatchesParams | void>({
      query: (args) => ({
        url: ARENA.MATCHES,
        method: 'GET',
        params: {
          page: args && 'page' in args ? args.page : 1,
          limit: args && 'limit' in args ? args.limit : 20,
          ...(args && 'status' in args && args.status ? { status: args.status } : {}),
          ...(args && 'paymentMethod' in args && args.paymentMethod
            ? { paymentMethod: args.paymentMethod }
            : {}),
          ...(args && 'search' in args && args.search ? { search: args.search } : {}),
          ...(args && 'crateId' in args && args.crateId ? { crateId: args.crateId } : {}),
        },
      }),
      transformResponse: (response: ArenaMatchesResponse) => ({
        ...response,
        items: (response.items ?? []).map((item) => {
          const raw = item as ArenaMatchListItem & { _id?: string; id?: string }
          const matchId = raw._id || raw.id || ''
          return { ...raw, _id: matchId, id: matchId }
        }),
      }),
      providesTags: ['ArenaMatches'],
    }),
    getArenaMatchById: builder.query<ArenaMatchDetail, string>({
      query: (id) => ({ url: ARENA.MATCH_BY_ID(id), method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'ArenaMatch', id }],
    }),
    getArenaCrateOpens: builder.query<
      ArenaCrateOpensResponse,
      GetArenaCrateOpensParams | void
    >({
      query: (params) => {
        const clean = params ? omitDataEnvironmentQueryArg(params) : undefined
        return {
          url: ARENA.CRATE_OPENS,
          method: 'GET',
          params: {
            ...(clean?.page != null ? { page: clean.page } : {}),
            ...(clean?.limit != null ? { limit: clean.limit } : {}),
            ...(clean?.crateId ? { crateId: clean.crateId } : {}),
            ...(clean?.matchId ? { matchId: clean.matchId } : {}),
            ...(clean?.userId ? { userId: clean.userId } : {}),
            ...(clean?.search ? { search: clean.search } : {}),
          },
        }
      },
      providesTags: ['ArenaCrateOpens'],
    }),
    getArenaCrateOpenById: builder.query<ArenaCrateOpenDetail, string>({
      query: (openId) => ({
        url: ARENA.CRATE_OPEN_BY_ID(openId),
        method: 'GET',
      }),
      providesTags: (_result, _error, openId) => [
        { type: 'ArenaCrateOpen', id: openId },
      ],
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
  useGetArenaMatchesQuery,
  useGetArenaMatchByIdQuery,
  useGetArenaCrateOpensQuery,
  useGetArenaCrateOpenByIdQuery,
} = arenaApi
