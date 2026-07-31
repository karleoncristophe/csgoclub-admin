import { createApi } from '@reduxjs/toolkit/query/react'
import type { SkinsCurrency } from '@/constants/skinsCurrency'
import { AI_ASSISTANT } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type { CaseDropItemRarity } from '@/redux/store/api/cases/api.cases'
import type { CaseValueMode } from '@/utils/caseEconomics'

export type AiAssistantStatus = {
  enabled: boolean
  model: string | null
}

export type AiChatRole = 'user' | 'assistant'

export type AiChatMessage = {
  role: AiChatRole
  content: string
}

export type AiCaseDraftItem = {
  skinName: string
  image?: string
  rarity?: CaseDropItemRarity
  basePrice: number
  taxPercent: number
  priceWithTax: number
  price: number
  probability: number
  expectedValue: number
}

export type AiCaseDraft = {
  name?: string
  description?: string
  currency: SkinsCurrency
  valueMode: CaseValueMode
  targetMarginPercent: number
  probabilityTargetPercent: number
  discountPercent: number
  items: AiCaseDraftItem[]
  expectedValue: number
  probabilitySum: number
  suggestedListPrice: number
  suggestedFinalPrice: number
  warnings: string[]
}

export type AiCaseAssistantContext = {
  name?: string
  currency?: SkinsCurrency
  valueMode?: CaseValueMode
  targetMarginPercent?: number
  probabilityTargetPercent?: number
  discountPercent?: number
  itemNames?: string[]
}

export type AiCaseAssistantRequest = {
  messages: AiChatMessage[]
  context?: AiCaseAssistantContext
}

export type AiCaseAssistantReply = {
  assistantMessage: string
  draft: AiCaseDraft | null
  toolTrace: Array<{ name: string; summary: string }>
}

export const aiAssistantApi = createApi({
  reducerPath: 'aiAssistantApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getAiAssistantStatus: builder.query<AiAssistantStatus, void>({
      query: () => ({
        url: AI_ASSISTANT.STATUS,
        method: 'GET',
      }),
    }),
    sendCaseAssistantMessage: builder.mutation<
      AiCaseAssistantReply,
      AiCaseAssistantRequest
    >({
      query: (body) => ({
        url: AI_ASSISTANT.CASE_ASSISTANT,
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetAiAssistantStatusQuery,
  useSendCaseAssistantMessageMutation,
} = aiAssistantApi
