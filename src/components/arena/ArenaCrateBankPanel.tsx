import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  arenaBankBalance,
  arenaBankInjection,
  countArenaEligibleItems,
  type ArenaCrateEconomyLedger,
} from '@/utils/arenaCrateEconomics'
import type { ArenaCrateItem } from '@/redux/store/api/arena/api.arena'

type ArenaCrateBankPanelProps = {
  items: ArenaCrateItem[]
  valueBrl: number
  valueUsd: number
  valueEur: number
  ledger?: ArenaCrateEconomyLedger
  currency: SkinsCurrency
}

function BankStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <ThemeText tone="label" className="text-xs uppercase">
        {label}
      </ThemeText>
      <ThemeText tone="primary" className="mt-0.5 block text-sm font-semibold">
        {value}
      </ThemeText>
    </div>
  )
}

export function ArenaCrateBankPanel({
  items,
  valueBrl,
  valueUsd,
  valueEur,
  ledger,
  currency,
}: ArenaCrateBankPanelProps) {
  const openPrice =
    currency === SkinsCurrency.EUR
      ? valueEur
      : currency === SkinsCurrency.USD
        ? valueUsd
        : valueBrl
  const injection = arenaBankInjection(openPrice)
  const bank = arenaBankBalance(ledger, currency)
  const bankAvailable = bank + injection
  const enabledCount = items.filter(
    (item) => item.enabled !== false && Number(item.probability) > 0,
  ).length
  const eligibleCount = countArenaEligibleItems({
    items,
    openPrice,
    bankBalance: bankAvailable,
    currency,
  })

  return (
    <Surface variant="cardInset" className="!p-5">
      <ThemeText as="h3" tone="primary" className="mb-1 text-sm font-semibold">
        Banco da crate (sem margem)
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="mb-4 text-xs">
        Cada abertura injeta o VE das skins (sem margem) e o drop retira o
        prêmio. A jogada da Arena continua no preço global.
      </ThemeText>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BankStat
          label={`Banco ${currency}`}
          value={formatSkinsPrice(bank, currency)}
        />
        <BankStat
          label="Injeção (VE)"
          value={formatSkinsPrice(injection, currency)}
        />
        <BankStat
          label="Elegíveis"
          value={`${eligibleCount} / ${enabledCount}`}
        />
        <BankStat label="Aberturas" value={String(ledger?.totalOpens ?? 0)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <BankStat
          label="Banco BRL"
          value={formatSkinsPrice(ledger?.bankBalanceBrl ?? 0, SkinsCurrency.BRL)}
        />
        <BankStat
          label="Banco USD"
          value={formatSkinsPrice(ledger?.bankBalanceUsd ?? 0, SkinsCurrency.USD)}
        />
        <BankStat
          label="Banco EUR"
          value={formatSkinsPrice(ledger?.bankBalanceEur ?? 0, SkinsCurrency.EUR)}
        />
      </div>
    </Surface>
  )
}
