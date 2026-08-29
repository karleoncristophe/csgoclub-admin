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

export type PaymentProviderCredential = {
  provider: string
  status: PaymentProviderStatus
  label?: string
  catalog: PaymentProviderCatalogItem
  configured: boolean
  xgate?: {
    hasEmail: boolean
    emailMasked?: string
    hasPassword: boolean
    passwordMasked?: string
    apiBaseUrl?: string
  }
  webhookPath: string
  updatedAt?: string
  updatedBy?: string
}

export type UpsertPaymentProviderBody = {
  status?: PaymentProviderStatus
  label?: string
  xgate?: {
    email?: string
    password?: string
    apiBaseUrl?: string
  }
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PaymentProviders'],
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
  }),
})

export const {
  useGetPaymentProvidersQuery,
  useUpsertPaymentProviderMutation,
} = paymentApi
