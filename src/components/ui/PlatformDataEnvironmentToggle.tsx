import { Factory, FlaskConical } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { caseOpensApi } from '@/redux/store/api/case-opens/api.case-opens'
import { metricsApi } from '@/redux/store/api/metrics/api.metrics'
import { usersApi } from '@/redux/store/api/users/api.users'
import { setPlatformDataEnvironment } from '@/redux/store/slices/platformDataEnvironmentSlice'
import type { RootState } from '@/redux/store/store'
import type { PlatformDataEnvironment } from '@/utils/platformDataEnvironmentStorage'

type PlatformDataEnvironmentToggleProps = {
  variant?: 'default' | 'sidebar'
}

export function PlatformDataEnvironmentToggle({
  variant = 'default',
}: PlatformDataEnvironmentToggleProps) {
  const dispatch = useDispatch()
  const value = useSelector((state: RootState) => state.platformDataEnvironment.value)
  const isSandbox = value === 'SANDBOX'

  const setEnvironment = (next: PlatformDataEnvironment) => {
    if (next === value) return
    dispatch(setPlatformDataEnvironment(next))
    dispatch(metricsApi.util.resetApiState())
    dispatch(caseOpensApi.util.resetApiState())
    dispatch(usersApi.util.resetApiState())
  }

  const shellClass =
    variant === 'sidebar'
      ? 'w-full rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/50'
      : 'inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'

  const trackClass =
    variant === 'sidebar'
      ? 'grid w-full grid-cols-2 gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/90 p-1 dark:border-zinc-700 dark:bg-zinc-800/80'
      : 'grid grid-cols-2 gap-1 rounded-lg bg-zinc-100/90 p-1 dark:bg-zinc-800/80'

  const optionBase =
    'flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30'

  const productionActive =
    'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700'
  const productionIdle =
    'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'

  const sandboxActive =
    'bg-amber-100 text-amber-950 shadow-sm ring-1 ring-amber-300/70 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-500/40'
  const sandboxIdle =
    'text-zinc-500 hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-300'

  return (
    <div className={shellClass}>
      {variant === 'sidebar' ? (
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Visão dos dados
        </p>
      ) : null}

      <div
        role="group"
        aria-label="Visão dos dados"
        className={trackClass}
      >
        <button
          type="button"
          role="radio"
          aria-checked={!isSandbox}
          onClick={() => setEnvironment('PRODUCTION')}
          className={`${optionBase} ${!isSandbox ? productionActive : productionIdle}`}
        >
          <Factory className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Produção</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isSandbox}
          onClick={() => setEnvironment('SANDBOX')}
          className={`${optionBase} ${isSandbox ? sandboxActive : sandboxIdle}`}
        >
          <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Influencer</span>
        </button>
      </div>
    </div>
  )
}

export function PlatformDataEnvironmentBanner() {
  const value = useSelector((state: RootState) => state.platformDataEnvironment.value)
  if (value !== 'SANDBOX') return null

  return (
    <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      Visão <strong>Influencer</strong> ativa — métricas, usuários e aberturas
      mostram só fluxos de teste. Nada se mistura com a produção.
    </div>
  )
}
