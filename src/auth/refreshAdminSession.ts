import { AUTH } from '@/redux/constants/endpoints'
import { setCredentials, type AuthTokens } from '@/redux/store/slices/securitySlice'
import type { AppDispatch, RootState } from '@/redux/store/store'

type RefreshPayload = {
  accessToken?: string
  refreshToken?: string
}

let refreshInflight: Promise<AuthTokens | null> | null = null

function apiBase(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

export async function refreshAdminSessionOnce(
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<AuthTokens | null> {
  const base = apiBase()
  if (!base) return null

  const currentRefreshToken = getState().security.refreshToken?.trim()
  if (!currentRefreshToken) return null

  if (refreshInflight) return refreshInflight

  refreshInflight = (async () => {
    try {
      const res = await fetch(`${base}${AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      })

      if (!res.ok) return null

      const data = (await res.json()) as RefreshPayload
      const accessToken = data.accessToken?.trim()
      const refreshToken = data.refreshToken?.trim()
      if (!accessToken || !refreshToken) return null

      const tokens: AuthTokens = { accessToken, refreshToken }
      dispatch(setCredentials(tokens))
      return tokens
    } catch {
      return null
    }
  })().finally(() => {
    refreshInflight = null
  })

  return refreshInflight
}
