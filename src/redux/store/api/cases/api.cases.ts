import { createApi } from '@reduxjs/toolkit/query/react'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import { CASES } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import { caseVitrinesApi } from '@/redux/store/api/case-vitrines/api.case-vitrines'
import type { CaseEconomyLedger, CaseValueMode } from '@/utils/caseEconomics'
import type {
  PlatformDataEnvironment,
  WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

export type { CaseEconomyLedger }

export type CaseDropItemRarity = {
  name?: string
  color?: string
}

export type CaseDropItem = {
  skinName: string
  image?: string
  rarity?: CaseDropItemRarity
  basePrice: number
  taxPercent: number
  priceWithTax: number
  price: number
  probability: number
  probabilityTolerance: number
  enabled: boolean
  expectedValue?: number
}

export type CaseDropItemPayload = Omit<CaseDropItem, 'expectedValue'>

export type LootCase = {
  _id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  currency: SkinsCurrency
  valueMode: CaseValueMode
  listPrice: number
  price: number
  targetMarginPercent: number
  probabilityTargetPercent: number
  probabilityTolerance: number
  discountPercent: number
  expectedValue: number
  suggestedPrice: number
  realMarginPercent: number
  probabilitySum: number
  items: CaseDropItem[]
  economyLedger?: CaseEconomyLedger
  testEconomyLedger?: CaseEconomyLedger
  economyPoolId?: string
  sharedCaseIds?: string[]
  vitrineId?: string
  active: boolean
  totalOpens: number
  totalTestOpens: number
  createdAt?: string
  updatedAt?: string
}

export type CreateCasePayload = {
  name: string
  description?: string
  imageUrl?: string
  currency: SkinsCurrency
  valueMode: CaseValueMode
  targetMarginPercent?: number
  probabilityTargetPercent?: number
  probabilityTolerance?: number
  discountPercent?: number
  items: CaseDropItemPayload[]
  sharedCaseIds?: string[]
  vitrineId?: string | null
  active?: boolean
}

export type UpdateCasePayload = Partial<CreateCasePayload>

export type AdminCaseDetailsCase = {
  _id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  currency: SkinsCurrency
  valueMode: CaseValueMode
  active: boolean
  price: number
  listPrice: number
  discountPercent: number
  targetMarginPercent: number
  expectedValue: number
  suggestedPrice: number
  realMarginPercent: number
  probabilitySum: number
  probabilityTargetPercent: number
  itemsCount: number
  enabledItemsCount: number
  vitrineId?: string
  sharedCaseIds: string[]
  createdAt?: string
  updatedAt?: string
}

export type AdminCaseNextUnlock = {
  skinName: string
  itemValue: number
  requiredBankBalance: number
  bankShortfall: number
  opensToUnlock: number | null
}

export type AdminCaseBank = {
  balance: number
  injectionPerOpen: number
  eligibleItemsCount: number
  enabledItemsCount: number
  targetForFullPool: number
  shortfallForFullPool: number
  opensToFullPool: number | null
  nextUnlock: AdminCaseNextUnlock | null
}

export type AdminCaseFinancials = {
  totalOpens: number
  totalRevenue: number
  totalPayout: number
  profit: number
  marginPercent: number
  averagePayoutPerOpen: number
  biggestPayout: number
  pendingCount: number
  keptCount: number
  convertedCount: number
  directCount: number
  rerollCount: number
  fallbackCount: number
  firstOpenAt?: string
  lastOpenAt?: string
}

export type AdminCaseItemStats = {
  skinName: string
  image?: string
  rarityName?: string
  rarityColor?: string
  price: number
  basePrice: number
  priceWithTax: number
  probability: number
  enabled: boolean
  expectedValue: number
  eligible: boolean
  coveredByOpenPrice: boolean
  requiredBankBalance: number
  bankShortfall: number
  opensToUnlock: number | null
  timesWon: number
  totalPaidOut: number
  actualDropPercent: number
  lastWonAt?: string
}

export type AdminCaseDailyPoint = {
  date: string
  opens: number
  revenue: number
  payout: number
}

export type AdminCaseDetails = {
  environment: PlatformDataEnvironment
  case: AdminCaseDetailsCase
  bank: AdminCaseBank
  financials: AdminCaseFinancials
  ledger: CaseEconomyLedger
  items: AdminCaseItemStats[]
  daily: AdminCaseDailyPoint[]
}

export type GetCaseDetailsParams = WithPlatformDataEnvironment<{ id: string }>

export const casesApi = createApi({
  reducerPath: 'casesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Cases', 'Case'],
  endpoints: (builder) => ({
    getCases: builder.query<LootCase[], void>({
      query: () => ({ url: CASES.ROOT, method: 'GET' }),
      providesTags: ['Cases'],
    }),
    getCaseById: builder.query<LootCase, string>({
      query: (id) => ({ url: CASES.BY_ID(id), method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Case', id }],
    }),
    getCaseDetails: builder.query<AdminCaseDetails, GetCaseDetailsParams>({
      query: ({ id }) => ({ url: CASES.DETAILS(id), method: 'GET' }),
      providesTags: (_result, _error, { id }) => [{ type: 'Case', id }],
    }),
    createCase: builder.mutation<LootCase, CreateCasePayload>({
      query: (body) => ({ url: CASES.ROOT, method: 'POST', body }),
      invalidatesTags: ['Cases'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(caseVitrinesApi.util.invalidateTags(['CaseVitrines']))
      },
    }),
    updateCase: builder.mutation<LootCase, { id: string; body: UpdateCasePayload }>({
      query: ({ id, body }) => ({
        url: CASES.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Cases', { type: 'Case', id }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(caseVitrinesApi.util.invalidateTags(['CaseVitrines']))
      },
    }),
    deleteCase: builder.mutation<{ success: true }, string>({
      query: (id) => ({
        url: CASES.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Cases'],
    }),
    duplicateCase: builder.mutation<LootCase, string>({
      query: (id) => ({
        url: CASES.DUPLICATE(id),
        method: 'POST',
      }),
      invalidatesTags: ['Cases'],
    }),
  }),
})

export const {
  useGetCasesQuery,
  useGetCaseByIdQuery,
  useGetCaseDetailsQuery,
  useCreateCaseMutation,
  useUpdateCaseMutation,
  useDeleteCaseMutation,
  useDuplicateCaseMutation,
} = casesApi
