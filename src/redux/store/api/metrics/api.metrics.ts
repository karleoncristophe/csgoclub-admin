import { createApi } from '@reduxjs/toolkit/query/react'
import { METRICS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type {
  AdminDashboardMetricsQuery,
  AdminDashboardMetricsResponse,
  AdminOnlineMetricsResponse,
} from '@/types/adminMetrics'
import { omitDataEnvironmentQueryArg } from '@/utils/platformDataEnvironmentStorage'

export const metricsApi = createApi({
  reducerPath: 'metricsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminMetrics', 'AdminOnline'],
  endpoints: (builder) => ({
    getAdminDashboardMetrics: builder.query<
      AdminDashboardMetricsResponse,
      AdminDashboardMetricsQuery
    >({
      query: (args) => {
        const { startDate, endDate } = omitDataEnvironmentQueryArg(args)
        return {
          url: METRICS.DASHBOARD,
          method: 'GET',
          params: { startDate, endDate },
        }
      },
      providesTags: ['AdminMetrics'],
    }),
    getAdminOnlineMetrics: builder.query<AdminOnlineMetricsResponse, void>({
      query: () => ({
        url: METRICS.ONLINE,
        method: 'GET',
      }),
      providesTags: ['AdminOnline'],
    }),
  }),
})

export const {
  useGetAdminDashboardMetricsQuery,
  useGetAdminOnlineMetricsQuery,
} = metricsApi
