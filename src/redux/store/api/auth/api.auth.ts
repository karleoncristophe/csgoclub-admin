import { createApi } from '@reduxjs/toolkit/query/react'
import { ME, AUTH } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type { AdminEntity, AdminSignInResponse } from '@/types/admin'

export interface SignInInput {
  email: string
  password: string
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me'],
  endpoints: (builder) => ({
    getMe: builder.query<AdminEntity, void>({
      query: () => ({ url: ME.PROFILE, method: 'GET' }),
      providesTags: ['Me'],
    }),
    signIn: builder.mutation<AdminSignInResponse, SignInInput>({
      query: (body) => ({
        url: AUTH.SIGN_IN,
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useGetMeQuery, useLazyGetMeQuery, useSignInMutation } = authApi
