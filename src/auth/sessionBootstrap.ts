import { ME } from '@/redux/constants/endpoints'
import { signOut } from '@/redux/store/slices/securitySlice'
import { removeMe } from '@/redux/store/slices/meSlice'
import type { AppDispatch } from '@/redux/store/store'
import { store } from '@/redux/store/store'
import { refreshAdminSessionOnce } from '@/auth/refreshAdminSession'

function apiBase(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

let bootstrapInflight: Promise<void> | null = null

export function runSessionBootstrap(dispatch: AppDispatch): Promise<void> {
  if (bootstrapInflight) return bootstrapInflight
  bootstrapInflight = bootstrapAdminSession(dispatch).finally(() => {
    bootstrapInflight = null
  })
  return bootstrapInflight
}

async function bootstrapAdminSession(dispatch: AppDispatch): Promise<void> {
  const base = apiBase()
  if (!base) return

  const { accessToken, refreshToken } = store.getState().security
  const access = accessToken?.trim() ?? ''
  const refresh = refreshToken?.trim() ?? ''

  const tryRefresh = async (): Promise<boolean> =>
    Boolean(
      await refreshAdminSessionOnce(dispatch, () => store.getState()),
    )

  try {
    if (access) {
      const meRes = await fetch(`${base}${ME.PROFILE}`, {
        headers: {
          Authorization: `Bearer ${access}`,
          Accept: 'application/json',
        },
      })
      if (meRes.ok) return
      if (meRes.status === 401) {
        const ok = await tryRefresh()
        if (!ok) {
          dispatch(signOut())
          dispatch(removeMe())
        }
        return
      }
      return
    }

    if (refresh) {
      const ok = await tryRefresh()
      if (!ok) {
        dispatch(signOut())
        dispatch(removeMe())
      }
    }
  } catch {
    // Rede indisponível: mantém cookies para o usuário tentar de novo no app.
  }
}
