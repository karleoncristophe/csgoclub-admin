import { useState } from 'react'
import { Factory, FlaskConical, RotateCcw } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { arenaApi } from '@/redux/store/api/arena/api.arena'
import { battlesAdminApi } from '@/redux/store/api/battles/api.battles'
import { caseOpensApi } from '@/redux/store/api/case-opens/api.case-opens'
import { casesApi } from '@/redux/store/api/cases/api.cases'
import { useResetGameplayMutation } from '@/redux/store/api/gameplay/api.gameplay'
import { metricsApi } from '@/redux/store/api/metrics/api.metrics'
import { swapsApi } from '@/redux/store/api/swaps/api.swaps'
import { tradesApi } from '@/redux/store/api/trades/api.trades'
import { upgradesAdminApi } from '@/redux/store/api/upgrades/api.upgrades'
import { usersApi } from '@/redux/store/api/users/api.users'
import { setPlatformDataEnvironment } from '@/redux/store/slices/platformDataEnvironmentSlice'
import type { RootState } from '@/redux/store/store'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { PlatformDataEnvironment } from '@/utils/platformDataEnvironmentStorage'

type PlatformDataEnvironmentToggleProps = {
  variant?: 'default' | 'sidebar'
  showReset?: boolean
}

function resetGameplayCaches(dispatch: ReturnType<typeof useDispatch>) {
  dispatch(metricsApi.util.resetApiState())
  dispatch(caseOpensApi.util.resetApiState())
  dispatch(arenaApi.util.resetApiState())
  dispatch(usersApi.util.resetApiState())
  dispatch(swapsApi.util.resetApiState())
  dispatch(tradesApi.util.resetApiState())
  dispatch(battlesAdminApi.util.resetApiState())
  dispatch(upgradesAdminApi.util.resetApiState())
  dispatch(casesApi.util.resetApiState())
}

export function PlatformDataEnvironmentToggle({
  variant = 'default',
  showReset = variant === 'sidebar',
}: PlatformDataEnvironmentToggleProps) {
  const dispatch = useDispatch()
  const { confirm } = useConfirm()
  const value = useSelector((state: RootState) => state.platformDataEnvironment.value)
  const role = useSelector((state: RootState) => state.me.role)
  const isSandbox = value === 'SANDBOX'
  const isMaster = role === 'MASTER'
  const canReset = isSandbox || isMaster
  const [resetGameplay, resetState] = useResetGameplayMutation()
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSummary, setResetSummary] = useState<string | null>(null)

  const setEnvironment = (next: PlatformDataEnvironment) => {
    if (next === value) return
    dispatch(setPlatformDataEnvironment(next))
    resetGameplayCaches(dispatch)
    setResetError(null)
    setResetSummary(null)
  }

  const handleReset = async () => {
    if (!canReset) return
    setResetError(null)
    setResetSummary(null)

    const scopeLabel = isSandbox ? 'Influencer' : 'Produção'
    const confirmed = await confirm({
      title: `Resetar testes ${scopeLabel}`,
      description: isSandbox
        ? 'Apaga inventário, aberturas, elegibilidade, upgrade, swap, battles e arena dos influencers. Zera o banco de teste. Não remove caixas, categorias, vitrines, banners, cupons, depósitos nem contas.'
        : 'Apaga inventário, aberturas, elegibilidade, upgrade, swap, battles e arena dos usuários normais. Zera o banco de produção. Não remove caixas, categorias, vitrines, banners, cupons, depósitos nem contas.',
      subjectLabel: 'Ambiente',
      subjectName: scopeLabel,
      confirmLabel: 'Resetar tudo',
      confirmVariant: 'danger',
      warning: isSandbox
        ? 'Os bancos de produção e de influencer são independentes. Este reset não mexe no user normal.'
        : 'Ação irreversível na visão de Produção. Só o MASTER pode executar.',
    })
    if (!confirmed) return

    try {
      const result = await resetGameplay().unwrap()
      resetGameplayCaches(dispatch)
      const { deleted, usersAffected } = result
      setResetSummary(
        `${usersAffected} usuários · ${deleted.caseOpens} aberturas · ${deleted.inventoryItems} itens · ${deleted.swaps} swaps · ${deleted.upgradePlays} upgrades`,
      )
    } catch (err) {
      setResetError(getErrorMessage(err))
    }
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

      {showReset && canReset ? (
        <div className={variant === 'sidebar' ? 'mt-2.5' : 'mt-1 px-1 pb-1'}>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={resetState.isLoading}
            className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {resetState.isLoading
              ? 'Limpando…'
              : `Resetar testes ${isSandbox ? 'Influencer' : 'Produção'}`}
          </button>
          {resetError ? (
            <p className="mt-1.5 text-[11px] leading-snug text-danger">{resetError}</p>
          ) : null}
          {resetSummary ? (
            <p className="mt-1.5 text-[11px] leading-snug text-muted">{resetSummary}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
