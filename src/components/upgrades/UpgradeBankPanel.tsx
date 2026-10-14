import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import {
  useAdjustAdminUpgradeBankMutation,
  useGetAdminUpgradeBankQuery,
} from '@/redux/store/api/upgrades/api.upgrades'
import { getErrorMessage } from '@/utils/getErrorMessage'

export function UpgradeBankPanel() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { data: bank, isLoading } = useGetAdminUpgradeBankQuery({
    dataEnvironment,
  })
  const [adjustBank, { isLoading: adjusting }] =
    useAdjustAdminUpgradeBankMutation()
  const [mode, setMode] = useState<'credit' | 'debit'>('credit')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function handleAdjust() {
    const value = Number(String(amount).replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Informe um valor maior que zero.')
      setOk(null)
      return
    }
    setError(null)
    setOk(null)
    try {
      const result = await adjustBank({
        amount: value,
        mode,
        dataEnvironment,
      }).unwrap()
      const deltaLabel = formatSkinsPrice(value, 'BRL')
      setOk(
        mode === 'debit'
          ? `−${deltaLabel} retirados do banco. Saldo agora ${formatSkinsPrice(result.balance, 'BRL')}.`
          : `+${deltaLabel} no banco. Saldo agora ${formatSkinsPrice(result.balance, 'BRL')}.`,
      )
      setAmount('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Surface variant="settingsPanel" className="!p-5 space-y-4">
      <div>
        <SectionTitle className="mb-1">Banco do Upgrade</SectionTitle>
        <ThemeText tone="secondary" className="text-sm">
          Banco único em BRL, separado por ambiente (
          {isSandbox ? 'Influencer / teste' : 'Produção'}). Stakes e prêmios em
          USD/EUR são convertidos para reais antes de entrar ou sair do banco.
        </ThemeText>
      </div>

      <div className="rounded-xl border border-border bg-surface-secondary p-3 sm:max-w-xs">
        <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
          Saldo agora · BRL
        </ThemeText>
        <ThemeText
          as="p"
          tone="primary"
          className="mt-2 text-xl font-bold tabular-nums sm:text-2xl"
        >
          {isLoading
            ? '…'
            : formatSkinsPrice(bank?.balance ?? 0, 'BRL')}
        </ThemeText>
      </div>

      <div className="space-y-3">
        <SegmentedTabs
          ariaLabel="Tipo de ajuste do banco do Upgrade"
          value={mode}
          onChange={(value) => {
            setMode(value as 'credit' | 'debit')
            setError(null)
            setOk(null)
          }}
          items={[
            { id: 'credit', label: 'Adicionar' },
            { id: 'debit', label: 'Retirar' },
          ]}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[10rem] flex-1 sm:max-w-xs">
            <Input
              label={mode === 'debit' ? 'Retirar do banco' : 'Adicionar ao banco'}
              name="upgrade-bank-amount"
              type="number"
              min={0.01}
              step="0.01"
              inputMode="decimal"
              placeholder="500"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setError(null)
                setOk(null)
              }}
              disabled={adjusting}
            />
          </div>
          <Button
            type="button"
            variant={mode === 'debit' ? 'secondary' : 'primary'}
            disabled={adjusting || !amount.trim()}
            isLoading={adjusting}
            onClick={() => void handleAdjust()}
          >
            {mode === 'debit' ? 'Retirar do banco' : 'Creditar banco'}
          </Button>
        </div>
      </div>

      {ok ? (
        <ThemeText as="p" className="text-sm text-emerald-700 dark:text-emerald-300">
          {ok}
        </ThemeText>
      ) : null}
      {error ? (
        <ThemeText as="p" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </ThemeText>
      ) : null}
    </Surface>
  )
}
