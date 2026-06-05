import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import Cookies from 'js-cookie'
import type { AdminAuthTokens } from '@/types/admin'

export type { AdminAuthTokens as AuthTokens }

export type SecurityState = AdminAuthTokens

const getInitialToken = (key: string): string => {
  try {
    return Cookies.get(key) ?? ''
  } catch {
    return ''
  }
}

const initialState: SecurityState = {
  accessToken: getInitialToken(
    import.meta.env.VITE_ACCESS_TOKEN_KEY ?? 'admin_access_token',
  ),
  refreshToken: getInitialToken(
    import.meta.env.VITE_REFRESH_TOKEN_KEY ?? 'admin_refresh_token',
  ),
}

const cookieOptions: Cookies.CookieAttributes = {
  path: '/',
  sameSite: 'strict',
  secure: import.meta.env.PROD,
}

export const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<AdminAuthTokens>) => {
      state.accessToken = payload.accessToken
      state.refreshToken = payload.refreshToken
      const accessKey =
        import.meta.env.VITE_ACCESS_TOKEN_KEY ?? 'admin_access_token'
      const refreshKey =
        import.meta.env.VITE_REFRESH_TOKEN_KEY ?? 'admin_refresh_token'
      Cookies.set(accessKey, payload.accessToken, cookieOptions)
      Cookies.set(refreshKey, payload.refreshToken, cookieOptions)
    },
    signOut: (state) => {
      state.accessToken = ''
      state.refreshToken = ''
      Cookies.remove(
        import.meta.env.VITE_ACCESS_TOKEN_KEY ?? 'admin_access_token',
        { path: '/' },
      )
      Cookies.remove(
        import.meta.env.VITE_REFRESH_TOKEN_KEY ?? 'admin_refresh_token',
        { path: '/' },
      )
    },
  },
})

export const { setCredentials, signOut } = securitySlice.actions
export default securitySlice.reducer
