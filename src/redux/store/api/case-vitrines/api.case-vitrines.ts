import { createApi } from '@reduxjs/toolkit/query/react'
import { CASE_VITRINES } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import { casesApi } from '@/redux/store/api/cases/api.cases'

export type CaseVitrine = {
  _id: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  active: boolean
  casesCount: number
  createdAt?: string
  updatedAt?: string
}

export type CaseVitrineDetail = CaseVitrine & {
  caseIds: string[]
}

export type CreateCaseVitrinePayload = {
  name: string
  description?: string
  sortOrder?: number
  active?: boolean
  caseIds?: string[]
}

export type UpdateCaseVitrinePayload = {
  id: string
  name?: string
  description?: string
  sortOrder?: number
  active?: boolean
  caseIds?: string[]
}

export const caseVitrinesApi = createApi({
  reducerPath: 'caseVitrinesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CaseVitrines', 'CaseVitrine'],
  endpoints: (builder) => ({
    getCaseVitrines: builder.query<CaseVitrine[], void>({
      query: () => ({
        url: CASE_VITRINES.ROOT,
        method: 'GET',
      }),
      providesTags: ['CaseVitrines'],
    }),
    getCaseVitrineById: builder.query<CaseVitrineDetail, string>({
      query: (id) => ({
        url: CASE_VITRINES.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'CaseVitrine', id }],
    }),
    createCaseVitrine: builder.mutation<CaseVitrineDetail, CreateCaseVitrinePayload>({
      query: (body) => ({
        url: CASE_VITRINES.ROOT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CaseVitrines'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(casesApi.util.invalidateTags(['Cases']))
      },
    }),
    updateCaseVitrine: builder.mutation<CaseVitrineDetail, UpdateCaseVitrinePayload>({
      query: ({ id, ...body }) => ({
        url: CASE_VITRINES.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'CaseVitrines',
        { type: 'CaseVitrine', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(casesApi.util.invalidateTags(['Cases', 'Case']))
      },
    }),
    deleteCaseVitrine: builder.mutation<{ success: true }, string>({
      query: (id) => ({
        url: CASE_VITRINES.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['CaseVitrines'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(casesApi.util.invalidateTags(['Cases', 'Case']))
      },
    }),
  }),
})

export const {
  useGetCaseVitrinesQuery,
  useGetCaseVitrineByIdQuery,
  useCreateCaseVitrineMutation,
  useUpdateCaseVitrineMutation,
  useDeleteCaseVitrineMutation,
} = caseVitrinesApi
