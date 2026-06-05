import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AUTH } from '@/redux/constants/endpoints'
import { signOut } from '@/redux/store/slices/securitySlice'
import { removeMe } from '@/redux/store/slices/meSlice'
import type { AppDispatch, RootState } from '@/redux/store/store'
import { refreshAdminSessionOnce } from '@/auth/refreshAdminSession'

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).security.accessToken
    if (token) {
      headers.set('accept', 'application/json')
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

function isRefreshRequest(args: string | FetchArgs) {
  if (typeof args === 'string') return args === AUTH.REFRESH
  return args.url === AUTH.REFRESH
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401 && !isRefreshRequest(args)) {
    const tokens = await refreshAdminSessionOnce(
      api.dispatch as AppDispatch,
      api.getState as () => RootState,
    )
    if (!tokens) {
      api.dispatch(signOut())
      api.dispatch(removeMe())
      return result
    }

    result = await baseQuery(args, api, extraOptions)
  }

  return result
}
