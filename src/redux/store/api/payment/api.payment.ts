import { createApi } from '@reduxjs/toolkit/query/react'
import { PAYMENT } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type PaymentProviderStatus = 'ACTIVE' | 'INACTIVE'

export type PaymentProviderCatalogItem = {
  value: string
  label: string
  description: string
  methods: string[]
  fields: { key: string; type: string; label: string; optional?: boolean }[]
}

export type PaymentProviderSecrets = {
  hasEmail?: boolean
  emailMasked?: string
  hasPassword?: boolean
  passwordMasked?: string
  hasAppId?: boolean
  appIdMasked?: string
  apiBaseUrl?: string
}

export type PaymentProviderCredential = {
  provider: string
  status: PaymentProviderStatus
  label?: string
  cashbackPercent?: number
  cashbackMaxUsd?: number
  cashbackMaxBrl?: number
  cashbackMaxEur?: number
  catalog: PaymentProviderCatalogItem
  configured: boolean
  xgate?: PaymentProviderSecrets
  woovi?: PaymentProviderSecrets
  webhookPath: string
  updatedAt?: string
  updatedBy?: string
}

export type UpsertPaymentProviderBody = {
  status?: PaymentProviderStatus
  label?: string
  cashbackPercent?: number
  cashbackMaxUsd?: number | null
  cashbackMaxBrl?: number | null
  cashbackMaxEur?: number | null
  xgate?: {
    email?: string
    password?: string
    apiBaseUrl?: string
  }
  woovi?: {
    appId?: string
    apiBaseUrl?: string
  }
}

export type AdminPaymentDepositStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'

export type AdminPaymentDeposit = {
  id: string
  provider: string
  method: string
  status: AdminPaymentDepositStatus | string
  symbol?: string
  network?: string
  address?: string
  expectedUsdAmount?: number
  expectedBrlAmount?: number
  usdAmount?: number
  brlAmount?: number
  cryptoAmount?: number
  walletAmount?: number
  walletCurrency?: string
  couponCode?: string
  couponOwner?: {
    userId: string
    name?: string
    avatar?: string
  }
  cashbackPercent?: number
  creditSource?: 'webhook' | 'admin'
  approveNote?: string
  approvedAt?: string
  createdAt?: string
  paidAt?: string
  creditedAt?: string
  canApprove?: boolean
  user?: {
    id: string
    name?: string
    steamId?: string
    avatar?: string
  }
}

export type AdminDepositMoneyTotals = {
  paidCount: number
  volumeBrl: number
  volumeUsd: number
}

export type AdminPaymentDepositList = {
  data: AdminPaymentDeposit[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: {
    pending: number
    processing: number
    paid: number
    failed: number
    cancelled: number
  }
  totals: AdminDepositMoneyTotals
}

export type ListPaymentDepositsQuery = {
  page?: number
  limit?: number
  status?: AdminPaymentDepositStatus | ''
  provider?: string
  method?: string
  search?: string
  couponCode?: string
  from?: string
  to?: string
  userId?: string
}

export type ApprovePaymentDepositBody = {
  force?: boolean
  amount?: number
  note?: string
  password?: string
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PaymentProviders', 'PaymentDeposits'],
  endpoints: (builder) => ({
    getPaymentProviders: builder.query<PaymentProviderCredential[], void>({
      query: () => ({ url: PAYMENT.PROVIDERS, method: 'GET' }),
      providesTags: ['PaymentProviders'],
    }),
    upsertPaymentProvider: builder.mutation<
      PaymentProviderCredential,
      { provider: string; body: UpsertPaymentProviderBody }
    >({
      query: ({ provider, body }) => ({
        url: PAYMENT.PROVIDER(provider),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PaymentProviders'],
    }),
    getPaymentDeposits: builder.query<AdminPaymentDepositList, ListPaymentDepositsQuery>({
      query: (params) => ({
        url: PAYMENT.DEPOSITS,
        method: 'GET',
        params: {
          page: params.page,
          limit: params.limit,
          ...(params.status ? { status: params.status } : {}),
          ...(params.provider ? { provider: params.provider } : {}),
          ...(params.method ? { method: params.method } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.couponCode ? { couponCode: params.couponCode } : {}),
          ...(params.from ? { from: params.from } : {}),
          ...(params.to ? { to: params.to } : {}),
          ...(params.userId ? { userId: params.userId } : {}),
        },
      }),
      providesTags: ['PaymentDeposits'],
    }),
    approvePaymentDeposit: builder.mutation<
      AdminPaymentDeposit,
      { id: string; body: ApprovePaymentDepositBody }
    >({
      query: ({ id, body }) => ({
        url: PAYMENT.DEPOSIT_APPROVE(id),
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentDeposits'],
    }),
  }),
})

export const {
  useGetPaymentProvidersQuery,
  useUpsertPaymentProviderMutation,
  useGetPaymentDepositsQuery,
  useApprovePaymentDepositMutation,
} = paymentApi
