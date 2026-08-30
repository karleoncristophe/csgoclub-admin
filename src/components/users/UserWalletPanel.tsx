import { useState } from 'react'
import { Coins, Gift } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { SKINS_CURRENCY_OPTIONS, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  type UserAdminDetail,
} from '@/redux/store/api/users/api.users'
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
  accent = false,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className={accent ? userBalanceTileClass.accent : userBalanceTileClass.default}>
      <ThemeText as="p" tone="label" className="text-xs uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText
        as="p"
        tone="primary"
        className={`mt-2 text-xl font-bold ${accent ? 'dark:text-brand-100' : ''}`}
      >
        {value}
      </ThemeText>
      {hint ? (
        <ThemeText as="p" tone="faint" className="mt-1 text-xs">
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
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusCurrency, setBonusCurrency] = useState<SkinsCurrency>(
    user.walletCurrency,
  )
  const [updateUser, updateState] = useUpdateUserMutation()
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

  const wallets = user.wallets

  return (
    <Surface variant="card" className="!p-5">
      <SectionTitle className="mb-2 flex items-center gap-2">
        <Coins className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        Carteira
      </SectionTitle>
      <ThemeText as="p" tone="secondary" className="mb-5 text-sm">
        Três carteiras independentes. A moeda ativa do perfil escolhe qual o
        jogador usa — o saldo não é convertido.
        {isInfluencer
          ? ' Bônus entra só na moeda que você selecionar abaixo.'
          : ''}
      </ThemeText>

      <div className="space-y-3">
        {SKINS_CURRENCY_OPTIONS.map((option) => {
          const slice = wallets?.[option.value]
          const isActive = user.walletCurrency === option.value
          const balance = slice?.balance ?? (isActive ? user.balance : 0)
          const bonus = slice?.bonusBalance ?? (isActive ? user.bonusBalance : 0)
          const total =
            slice?.totalSpendable ?? (isActive ? user.totalSpendable : balance + bonus)

          return (
            <div
              key={option.value}
              className={`rounded-2xl border p-4 ${
                isActive
                  ? 'border-brand-300 bg-brand-50/40 dark:border-brand-400/40 dark:bg-brand-500/10'
                  : 'border-border/80'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <ThemeText tone="primary" className="text-sm font-semibold">
                  {option.label}
                </ThemeText>
                {isActive ? (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-medium text-white">
                    Ativa
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <BalanceTile
                  label="Saldo real"
                  value={formatMoney(balance, option.value)}
                  hint="Sacável"
                />
                <BalanceTile
                  label="Saldo bônus"
                  value={formatMoney(bonus, option.value)}
                  hint="Não sacável"
                  accent
                />
                <BalanceTile
                  label="Total"
                  value={formatMoney(total, option.value)}
                  hint="Real + bônus"
                />
              </div>
            </div>
          )
        })}
      </div>

      {isInfluencer ? (
        <div className="mt-6 rounded-xl border border-border p-3/80 dark:bg-zinc-900/40">
          <div className="mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <ThemeText as="p" tone="primary" className="text-sm font-medium">
              Adicionar saldo bônus
            </ThemeText>
          </div>
          <ThemeText as="p" tone="secondary" className="mb-3 text-xs">
            O valor entra só na carteira escolhida. Não converte para as outras
            moedas e não pode ser sacado.
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
