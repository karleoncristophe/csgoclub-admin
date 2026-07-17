import { createApi } from '@reduxjs/toolkit/query/react'
import { CASE_OPENS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type {
  AdminCaseOpenDetail,
  AdminCaseOpenListItem,
  AdminCaseOpenListResponse,
} from '@/redux/store/api/users/api.users'
import {
  omitDataEnvironmentQueryArg,
  type WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

export type GetAllCaseOpensParams = WithPlatformDataEnvironment<{
  page?: number
  limit?: number
  disposition?: 'pending' | 'kept' | 'converted'
  isTestOpen?: boolean
  caseId?: string
  userId?: string
  search?: string
}>

export type AdminCaseOpenGlobalItem = AdminCaseOpenListItem & {
  user?: {
    _id: string
    name: string
    steamId?: string
    avatar?: string
    avatarMedium?: string
    avatarFull?: string
  }
}

export type AdminCaseOpenGlobalResponse = Omit<AdminCaseOpenListResponse, 'data'> & {
  data: AdminCaseOpenGlobalItem[]
}

export const caseOpensApi = createApi({
  reducerPath: 'caseOpensApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CaseOpens', 'CaseOpen'],
  endpoints: (builder) => ({
    getAllCaseOpens: builder.query<AdminCaseOpenGlobalResponse, GetAllCaseOpensParams | void>({
      query: (params) => {
        const clean = params ? omitDataEnvironmentQueryArg(params) : undefined
        return {
          url: CASE_OPENS.ROOT,
          method: 'GET',
          params: {
            ...(clean?.page != null ? { page: clean.page } : {}),
            ...(clean?.limit != null ? { limit: clean.limit } : {}),
            ...(clean?.disposition ? { disposition: clean.disposition } : {}),
            ...(clean?.caseId ? { caseId: clean.caseId } : {}),
            ...(clean?.userId ? { userId: clean.userId } : {}),
            ...(clean?.search ? { search: clean.search } : {}),
          },
        }
      },
      providesTags: ['CaseOpens'],
    }),
    getCaseOpenById: builder.query<AdminCaseOpenDetail, string>({
      query: (openId) => ({
        url: CASE_OPENS.BY_ID(openId),
        method: 'GET',
      }),
      providesTags: (_result, _error, openId) => [{ type: 'CaseOpen', id: openId }],
    }),
  }),
})

export const { useGetAllCaseOpensQuery, useGetCaseOpenByIdQuery } = caseOpensApi
