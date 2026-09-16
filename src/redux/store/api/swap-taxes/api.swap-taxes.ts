import { createApi } from '@reduxjs/toolkit/query/react'
import { SWAP_TAXES } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type SwapTaxCategory = {
  _id: string
  name: string
  swapTaxPercent: number
}

export const swapTaxesApi = createApi({
  reducerPath: 'swapTaxesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SwapTaxes'],
  endpoints: (builder) => ({
    getSwapTaxes: builder.query<SwapTaxCategory[], void>({
      query: () => ({
        url: SWAP_TAXES.ROOT,
        method: 'GET',
      }),
      providesTags: ['SwapTaxes'],
    }),
    updateSwapTax: builder.mutation<
      SwapTaxCategory,
      { id: string; swapTaxPercent: number }
    >({
      query: ({ id, swapTaxPercent }) => ({
        url: SWAP_TAXES.BY_ID(id),
        method: 'PATCH',
        body: { swapTaxPercent },
      }),
      invalidatesTags: ['SwapTaxes'],
    }),
  }),
})

export const { useGetSwapTaxesQuery, useUpdateSwapTaxMutation } = swapTaxesApi
