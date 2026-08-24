import { createApi } from '@reduxjs/toolkit/query/react'
import { ADMIN_ACCOUNTS } from '@/redux/constants/endpoints'
import { authApi } from '@/redux/store/api/auth/api.auth'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type { AdminEntity } from '@/types/admin'

export type AdminAccountRole = 'MASTER' | 'ADMIN'

export type CreateAdminAccountPayload = {
  name: string
  email: string
  password: string
  role?: AdminAccountRole
}

export type UpdateAdminAccountPayload = {
  id: string
  name?: string
  email?: string
  password?: string
  role?: AdminAccountRole
  active?: boolean
}

export const adminAccountsApi = createApi({
  reducerPath: 'adminAccountsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminAccounts'],
  endpoints: (builder) => ({
    getAdminAccounts: builder.query<AdminEntity[], void>({
      query: () => ({ url: ADMIN_ACCOUNTS.ROOT, method: 'GET' }),
      providesTags: ['AdminAccounts'],
    }),
    createAdminAccount: builder.mutation<AdminEntity, CreateAdminAccountPayload>({
      query: (body) => ({
        url: ADMIN_ACCOUNTS.ROOT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminAccounts'],
    }),
    updateAdminAccount: builder.mutation<AdminEntity, UpdateAdminAccountPayload>({
      query: ({ id, ...body }) => ({
        url: ADMIN_ACCOUNTS.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminAccounts'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(authApi.util.invalidateTags(['Me']))
      },
    }),
  }),
})

export const {
  useGetAdminAccountsQuery,
  useCreateAdminAccountMutation,
  useUpdateAdminAccountMutation,
} = adminAccountsApi
