export type DisplayCurrency = 'BRL' | 'USD' | 'EUR'

const CURRENCY_PREFIX: Record<DisplayCurrency, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
}

export function formatCentsUSD(cents: number | undefined) {
  return formatCentsMoney(cents, 'USD')
}

export function formatCentsMoney(
  cents: number | undefined,
  currency: DisplayCurrency,
) {
  if (cents == null || Number.isNaN(cents)) return '—'
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency,
  })
}

export function formatCentsAxisTick(
  cents: number,
  currency: DisplayCurrency,
) {
  const prefix = CURRENCY_PREFIX[currency]
  const amount = cents / 100
  if (Math.abs(cents) >= 1_000_000) {
    return `${prefix} ${(amount / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  }
  if (Math.abs(cents) >= 1_000) {
    return `${prefix} ${(amount / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  }
  return formatCentsMoney(cents, currency)
}
