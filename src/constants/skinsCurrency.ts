export enum SkinsCurrency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
}

export const SKINS_CURRENCY_OPTIONS = [
  { value: SkinsCurrency.BRL, label: 'Real (BRL)' },
  { value: SkinsCurrency.USD, label: 'Dólar (USD)' },
  { value: SkinsCurrency.EUR, label: 'Euro (EUR)' },
] as const

const CURRENCY_LOCALE: Record<SkinsCurrency, string> = {
  [SkinsCurrency.BRL]: 'pt-BR',
  [SkinsCurrency.USD]: 'en-US',
  [SkinsCurrency.EUR]: 'de-DE',
}

export function formatSkinsPrice(value: number, currency: SkinsCurrency | string) {
  const code = (currency || SkinsCurrency.BRL).toUpperCase() as SkinsCurrency
  const locale = CURRENCY_LOCALE[code] ?? 'pt-BR'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(value)
}

export function normalizeSkinsCurrency(value?: string | null): SkinsCurrency {
  const code = value?.trim().toUpperCase()
  if (code === SkinsCurrency.USD) return SkinsCurrency.USD
  if (code === SkinsCurrency.EUR) return SkinsCurrency.EUR
  return SkinsCurrency.BRL
}
