import { createApi } from '@reduxjs/toolkit/query/react'
import { METRICS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type {
  AdminDashboardMetricsQuery,
  AdminDashboardMetricsResponse,
} from '@/types/adminMetrics'

export const metricsApi = createApi({
  reducerPath: 'metricsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminMetrics'],
  endpoints: (builder) => ({
    getAdminDashboardMetrics: builder.query<
      AdminDashboardMetricsResponse,
      AdminDashboardMetricsQuery
    >({
      query: ({ startDate, endDate }) => ({
        url: METRICS.DASHBOARD,
        method: 'GET',
        params: { startDate, endDate },
      }),
      providesTags: ['AdminMetrics'],
    }),
  }),
})

export const { useGetAdminDashboardMetricsQuery } = metricsApi
