import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Coins, Gift, Lock, LockOpen, Shield } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { SKINS_CURRENCY_OPTIONS, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useGetUserByIdQuery,
  useSettleUserRolloverMutation,
  useUpdateUserMutation,
  type UserAdminDetail,
} from '@/redux/store/api/users/api.users'
import type { RootState } from '@/redux/store/store'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { userBalanceTileClass } from './userPanelClasses'

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function BalanceTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'locked' | 'free'
}) {
  const valueClass =
    tone === 'locked'
      ? 'text-amber-700 dark:text-amber-300'
      : tone === 'free'
        ? 'text-emerald-700 dark:text-emerald-300'
        : ''
  return (
    <div className={userBalanceTileClass.default}>
      <ThemeText as="p" tone="label" className="text-[10px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText
        as="p"
        tone="primary"
        className={`mt-0.5 text-sm font-bold tabular-nums ${valueClass}`}
      >
        {value}
      </ThemeText>
      {hint ? (
        <ThemeText as="p" tone="faint" className="mt-0.5 text-[11px]">
          {hint}
        </ThemeText>
      ) : null}
    </div>
  )
}

type UserWalletPanelProps = {
  user: UserAdminDetail
}

export function UserWalletPanel({ user }: UserWalletPanelProps) {
  const isInfluencer =
    user.userType === 'influencer' || Boolean(user.isTestAffiliate)
  const isMaster = useSelector((state: RootState) => state.me.role === 'MASTER')
  const { confirm } = useConfirm()
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusCurrency, setBonusCurrency] = useState<SkinsCurrency>(
    user.walletCurrency,
  )
  const [settleReason, setSettleReason] = useState('')
  const [updateUser, updateState] = useUpdateUserMutation()
  const [settleRollover, settleState] = useSettleUserRolloverMutation()
  const { refetch } = useGetUserByIdQuery(user._id)

  const handleAddBonus = async () => {
    const amount = Number(bonusAmount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return

    try {
      await updateUser({
        id: user._id,
        addBonusBalance: amount,
        addBonusCurrency: bonusCurrency,
      }).unwrap()
      setBonusAmount('')
      refetch()
    } catch {
      // mutation state
    }
  }

  const handleSettleRollover = async (currency: SkinsCurrency) => {
    const slice = user.wallets?.[currency]
    const rollover = slice?.rolloverBalance ?? (currency === user.walletCurrency ? user.rolloverBalance ?? 0 : 0)
    const locked = slice?.lockedBalance ?? (currency === user.walletCurrency ? user.lockedBalance ?? 0 : 0)
    const accepted = await confirm({
      title: `Quitar rollover em ${currency}?`,
      description: `Isso libera ${formatMoney(locked, currency)} presos sem exigir que o jogador gaste ${formatMoney(rollover, currency)} em jogo. O saldo real não muda. A ação fica no extrato e não pode ser desfeita.`,
      confirmLabel: 'Quitar rollover',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
      warning: 'Só use em suporte (chargeback, erro operacional, acordo).',
      subjectLabel: 'Usuário',
      subjectName: user.name,
    })
    if (!accepted) return

    try {
      const reason = settleReason.trim()
      await settleRollover({
        id: user._id,
        currency,
        ...(reason ? { reason } : {}),
      }).unwrap()
      setSettleReason('')
      refetch()
    } catch {
      // mutation state
    }
  }

  const wallets = user.wallets

  const activeSlice = wallets?.[user.walletCurrency]
  const activeRollover =
    activeSlice?.rolloverBalance ?? user.rolloverBalance ?? 0
  const activeLocked = activeSlice?.lockedBalance ?? user.lockedBalance ?? 0
  const hasPendingRollover = !isInfluencer && activeRollover > 0

  return (
    <Surface variant="settingsPanel" className="!p-4">
      <SectionTitle className="mb-1 flex items-center gap-2 text-base">
        <Coins className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        Carteira
      </SectionTitle>
      <ThemeText as="p" tone="faint" className="mb-3 text-xs">
        Três carteiras independentes — a moeda ativa define qual o jogador usa.
        {isInfluencer
          ? ' Influencer não passa por rollover: swap usa real + bônus.'
          : ' Depósitos ficam presos até serem utilizados 1x em jogo; só o saldo liberado vira skin no swap.'}
      </ThemeText>

      {hasPendingRollover ? (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            <span className="font-semibold">Rollover pendente na carteira ativa:</span>{' '}
            {formatMoney(activeLocked, user.walletCurrency)} presos · faltam{' '}
            {formatMoney(activeRollover, user.walletCurrency)} em caixas, upgrade, battles ou
            arena para liberar. Swap não conta como jogo.
          </p>
        </div>
      ) : null}
      {!isInfluencer && !hasPendingRollover ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
          <LockOpen className="h-3.5 w-3.5 shrink-0" />
          <p>Sem rollover pendente na carteira ativa — todo o saldo real está liberado para swap.</p>
        </div>
      ) : null}

      <div className="space-y-2">
        {SKINS_CURRENCY_OPTIONS.map((option) => {
          const slice = wallets?.[option.value]
          const isActive = user.walletCurrency === option.value
          const balance = slice?.balance ?? (isActive ? user.balance : 0)
          const bonus = slice?.bonusBalance ?? (isActive ? user.bonusBalance : 0)
          const total =
            slice?.totalSpendable ?? (isActive ? user.totalSpendable : balance + bonus)
          const rollover = slice?.rolloverBalance ?? (isActive ? user.rolloverBalance ?? 0 : 0)
          const locked = isInfluencer
            ? 0
            : slice?.lockedBalance ?? (isActive ? user.lockedBalance ?? 0 : 0)
          const withdrawable = isInfluencer
            ? total
            : slice?.withdrawableBalance ??
              (isActive ? user.withdrawableBalance : Math.max(0, balance - locked))
          const canSettle = isMaster && (rollover > 0 || locked > 0)

          return (
            <div
              key={option.value}
              className="rounded-xl border border-separator bg-surface p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <ThemeText tone="primary" className="text-sm font-semibold">
                  {option.label}
                </ThemeText>
                <div className="flex items-center gap-1.5">
                  {!isInfluencer && rollover > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
                      <Lock className="h-3 w-3" />
                      Rollover
                    </span>
                  ) : null}
                  {isActive ? (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      Ativa
                    </span>
                  ) : null}
                  {canSettle ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={settleState.isLoading}
                      onClick={() => handleSettleRollover(option.value)}
                    >
                      <LockOpen className="h-3.5 w-3.5" />
                      Quitar
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <BalanceTile
                  label="Saldo real"
                  value={formatMoney(balance, option.value)}
                  hint="Depósitos + prêmios"
                />
                <BalanceTile
                  label="Saldo bônus"
                  value={formatMoney(bonus, option.value)}
                  hint="Não sacável"
                />
                <BalanceTile
                  label="Total jogável"
                  value={formatMoney(total, option.value)}
                  hint="Real + bônus"
                />
                <BalanceTile
                  label="Liberado p/ swap"
                  value={formatMoney(withdrawable, option.value)}
                  hint={isInfluencer ? 'Influencer: real + bônus' : 'Real − preso'}
                  tone="free"
                />
                <BalanceTile
                  label="Preso"
                  value={formatMoney(locked, option.value)}
                  hint={isInfluencer ? 'Não se aplica' : 'Até quitar o rollover'}
                  tone={locked > 0 ? 'locked' : 'default'}
                />
                <BalanceTile
                  label="Falta jogar"
                  value={formatMoney(isInfluencer ? 0 : rollover, option.value)}
                  hint={isInfluencer ? 'Não se aplica' : 'Rollover 1x do depósito'}
                  tone={!isInfluencer && rollover > 0 ? 'locked' : 'default'}
                />
              </div>
            </div>
          )
        })}
      </div>

      {isMaster &&
      SKINS_CURRENCY_OPTIONS.some((option) => {
        const slice = wallets?.[option.value]
        const rollover =
          slice?.rolloverBalance ??
          (option.value === user.walletCurrency ? user.rolloverBalance ?? 0 : 0)
        const locked =
          slice?.lockedBalance ??
          (option.value === user.walletCurrency ? user.lockedBalance ?? 0 : 0)
        return rollover > 0 || locked > 0
      }) ? (
        <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50/80 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-800 dark:text-amber-200" />
            <ThemeText as="p" tone="primary" className="text-sm font-medium">
              Quitação de rollover (master)
            </ThemeText>
          </div>
          <ThemeText as="p" tone="faint" className="mb-3 text-xs">
            Libera o saldo preso sem o jogador gastar o depósito. Use o botão Quitar na
            carteira. Motivo opcional entra no extrato.
          </ThemeText>
          <Input
            label="Motivo (opcional)"
            name="settleReason"
            maxLength={280}
            placeholder="Ex.: ticket #42, chargeback, erro operacional"
            value={settleReason}
            onChange={(event) => setSettleReason(event.target.value)}
          />
          {settleState.error ? (
            <p className={`${surfaceClass('errorBanner')} mt-3`}>
              {getErrorMessage(settleState.error)}
            </p>
          ) : null}
        </div>
      ) : null}

      {isInfluencer ? (
        <div className="mt-4 rounded-xl border border-separator bg-surface-secondary p-3">
          <div className="mb-2 flex items-center gap-2">
            <Gift className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <ThemeText as="p" tone="primary" className="text-sm font-medium">
              Adicionar saldo bônus
            </ThemeText>
          </div>
          <ThemeText as="p" tone="faint" className="mb-3 text-xs">
            Entra só na carteira escolhida. Não converte e não pode ser sacado.
          </ThemeText>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Valor"
                name="bonusAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="100.00"
                value={bonusAmount}
                onChange={(event) => setBonusAmount(event.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <Select
                label="Moeda"
                name="bonusCurrency"
                value={bonusCurrency}
                onChange={(event) =>
                  setBonusCurrency(event.target.value as SkinsCurrency)
                }
              >
                {SKINS_CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              disabled={updateState.isLoading || !bonusAmount}
              onClick={handleAddBonus}
            >
              Creditar bônus
            </Button>
          </div>
          {updateState.error ? (
            <p className={`${surfaceClass('errorBanner')} mt-4`}>
              {getErrorMessage(updateState.error)}
            </p>
          ) : null}
        </div>
      ) : null}
    </Surface>
  )
}
