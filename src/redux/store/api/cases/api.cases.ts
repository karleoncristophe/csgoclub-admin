import { createApi } from '@reduxjs/toolkit/query/react'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import { CASES } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type { CaseValueMode } from '@/utils/caseEconomics'

export type CaseDropItemRarity = {
  name?: string
  color?: string
}

export type CaseEconomyLedger = {
  totalRevenue: number
  totalPayout: number
  totalRealOpens: number
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
  minMarginPercent: number
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
  active?: boolean
}

export type UpdateCasePayload = Partial<CreateCasePayload>

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
    createCase: builder.mutation<LootCase, CreateCasePayload>({
      query: (body) => ({ url: CASES.ROOT, method: 'POST', body }),
      invalidatesTags: ['Cases'],
    }),
    updateCase: builder.mutation<LootCase, { id: string; body: UpdateCasePayload }>({
      query: ({ id, body }) => ({
        url: CASES.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['Cases', { type: 'Case', id }],
    }),
  }),
})

export const {
  useGetCasesQuery,
  useGetCaseByIdQuery,
  useCreateCaseMutation,
  useUpdateCaseMutation,
} = casesApi
