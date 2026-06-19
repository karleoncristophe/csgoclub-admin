import { useState } from 'react'
import { Coins, Gift } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
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
  const [bonusAmount, setBonusAmount] = useState('')
  const [updateUser, updateState] = useUpdateUserMutation()
  const { refetch } = useGetUserByIdQuery(user._id)

  const handleAddBonus = async () => {
    const amount = Number(bonusAmount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return

    try {
      await updateUser({ id: user._id, addBonusBalance: amount }).unwrap()
      setBonusAmount('')
      refetch()
    } catch {
      // mutation state
    }
  }

  return (
    <Surface variant="card" className="!p-6">
      <SectionTitle className="mb-2 flex items-center gap-2">
        <Coins className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        Carteira
      </SectionTitle>
      <ThemeText as="p" tone="secondary" className="mb-5 text-sm">
        Saldo real para depósitos e saques. Saldo bônus é fake para influencers — pode abrir
        caixas, mas não pode ser sacado.
      </ThemeText>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceTile
          label="Saldo real"
          value={formatMoney(user.balance, user.walletCurrency)}
          hint="Sacável"
        />
        <BalanceTile
          label="Saldo bônus"
          value={formatMoney(user.bonusBalance, user.walletCurrency)}
          hint="Não sacável (influencer)"
          accent
        />
        <BalanceTile
          label="Total para caixas"
          value={formatMoney(user.totalSpendable, user.walletCurrency)}
          hint="Real + bônus"
        />
        <BalanceTile
          label="Sacável"
          value={formatMoney(user.withdrawableBalance, user.walletCurrency)}
          hint="Apenas saldo real"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700/80 dark:bg-zinc-900/40">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <ThemeText as="p" tone="primary" className="text-sm font-medium">
            Adicionar saldo bônus (influencer)
          </ThemeText>
        </div>
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
    </Surface>
  )
}
