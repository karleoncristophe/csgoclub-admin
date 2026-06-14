import { SkinsCurrency } from '@/constants/skinsCurrency'

const CURRENCY_LOCALE: Record<SkinsCurrency, string> = {
  [SkinsCurrency.BRL]: 'pt-BR',
  [SkinsCurrency.USD]: 'en-US',
  [SkinsCurrency.EUR]: 'de-DE',
}

function normalizeDigitString(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Converte texto monetário digitado para centavos.
 * Ex.: "R$ 1.234,56" -> 123456
 */
export function parseCurrencyInputToCents(value: string): number {
  const digits = normalizeDigitString(value ?? '')
  if (!digits) return 0
  return Math.max(0, Number.parseInt(digits, 10) || 0)
}

/**
 * Formata centavos para moeda com símbolo.
 * Ex.: 123456 + BRL -> "R$ 1.234,56"
 */
export function formatCentsToCurrencyInput(
  cents: number,
  currency: SkinsCurrency,
): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.trunc(cents)) : 0
  return (safe / 100).toLocaleString(CURRENCY_LOCALE[currency], {
    style: 'currency',
    currency,
  })
}

/**
 * Aplica máscara monetária em tempo real com base nos dígitos digitados.
 */
export function formatCurrencyInput(value: string, currency: SkinsCurrency): string {
  return formatCentsToCurrencyInput(parseCurrencyInputToCents(value), currency)
}

export function currencyAmountToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.max(0, Math.round(amount * 100))
}

export function centsToCurrencyAmount(cents: number): number {
  return cents / 100
}

export function formatCurrencyAmountInput(
  amount: number,
  currency: SkinsCurrency,
): string {
  return formatCentsToCurrencyInput(currencyAmountToCents(amount), currency)
}

export function parseCurrencyInputToAmount(
  value: string,
): number {
  return centsToCurrencyAmount(parseCurrencyInputToCents(value))
}
