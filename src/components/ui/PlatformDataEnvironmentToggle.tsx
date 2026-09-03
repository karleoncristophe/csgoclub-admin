import { Factory, FlaskConical } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { caseOpensApi } from '@/redux/store/api/case-opens/api.case-opens'
import { arenaApi } from '@/redux/store/api/arena/api.arena'
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
    dispatch(arenaApi.util.resetApiState())
    dispatch(usersApi.util.resetApiState())
  }

  const shellClass =
    variant === 'sidebar'
      ? 'w-full rounded-lg border border-border bg-surface-secondary px-3 py-3'
      : 'inline-flex rounded-xl border border-border bg-surface p-1 shadow-sm'

  const trackClass =
    variant === 'sidebar'
      ? 'grid w-full grid-cols-2 gap-1 rounded-lg border border-border bg-default p-1'
      : 'grid grid-cols-2 gap-1 rounded-lg bg-default p-1'

  const optionBase =
    'flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/30'

  const productionActive =
    'bg-surface text-foreground shadow-sm ring-1 ring-border'
  const productionIdle =
    'text-muted hover:text-foreground'

  const sandboxActive =
    'bg-warning-soft text-warning shadow-sm ring-1 ring-warning/30'
  const sandboxIdle =
    'text-muted hover:text-warning'

  return (
    <div className={shellClass}>
      {variant === 'sidebar' ? (
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
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
