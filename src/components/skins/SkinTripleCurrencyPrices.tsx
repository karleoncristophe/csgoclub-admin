import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import { ThemeText } from '@/components/ui/ThemeText'

type SkinTripleCurrencyPricesProps = {
  valueBrl?: number
  valueUsd?: number
  valueEur?: number
  compact?: boolean
}

function formatOrDash(value: number | undefined, currency: SkinsCurrency) {
  if (value == null || !Number.isFinite(value) || value <= 0) return '—'
  return formatSkinsPrice(value, currency)
}

export function SkinTripleCurrencyPrices({
  valueBrl,
  valueUsd,
  valueEur,
  compact = false,
}: SkinTripleCurrencyPricesProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'BRL', value: formatOrDash(valueBrl, SkinsCurrency.BRL) },
    { label: 'USD', value: formatOrDash(valueUsd, SkinsCurrency.USD) },
    { label: 'EUR', value: formatOrDash(valueEur, SkinsCurrency.EUR) },
  ]

  if (compact) {
    return (
      <ThemeText tone="label" className="mt-1 block text-[11px] leading-4">
        {rows.map((row) => row.value).join(' · ')}
      </ThemeText>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline gap-2">
          <ThemeText tone="faint" className="w-8 text-[10px] uppercase tracking-wide">
            {row.label}
          </ThemeText>
          <ThemeText tone="primary" className="text-sm font-medium tabular-nums">
            {row.value}
          </ThemeText>
        </div>
      ))}
    </div>
  )
}
