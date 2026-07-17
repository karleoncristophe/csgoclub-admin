import { createApi } from '@reduxjs/toolkit/query/react'
import { CASE_OPENS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type {
  AdminCaseOpenDetail,
  AdminCaseOpenListItem,
  AdminCaseOpenListResponse,
} from '@/redux/store/api/users/api.users'

export type GetAllCaseOpensParams = {
  page?: number
  limit?: number
  disposition?: 'pending' | 'kept' | 'converted'
  isTestOpen?: boolean
  caseId?: string
  userId?: string
  search?: string
}

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
      query: (params) => ({
        url: CASE_OPENS.ROOT,
        method: 'GET',
        params: {
          ...(params?.page != null ? { page: params.page } : {}),
          ...(params?.limit != null ? { limit: params.limit } : {}),
          ...(params?.disposition ? { disposition: params.disposition } : {}),
          ...(params?.isTestOpen != null ? { isTestOpen: params.isTestOpen } : {}),
          ...(params?.caseId ? { caseId: params.caseId } : {}),
          ...(params?.userId ? { userId: params.userId } : {}),
          ...(params?.search ? { search: params.search } : {}),
        },
      }),
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
