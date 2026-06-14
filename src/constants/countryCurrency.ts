import { SkinsCurrency } from '@/constants/skinsCurrency'

export type AdminCountryOption = {
  code: string
  label: string
}

/** Países comuns no painel; moeda derivada via `currencyForCountry`. */
export const ADMIN_COUNTRY_OPTIONS: readonly AdminCountryOption[] = [
  { code: 'BR', label: 'Brasil' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'PT', label: 'Portugal' },
  { code: 'DE', label: 'Alemanha' },
  { code: 'FR', label: 'França' },
  { code: 'ES', label: 'Espanha' },
  { code: 'IT', label: 'Itália' },
  { code: 'NL', label: 'Países Baixos' },
  { code: 'BE', label: 'Bélgica' },
  { code: 'AT', label: 'Áustria' },
  { code: 'IE', label: 'Irlanda' },
  { code: 'FI', label: 'Finlândia' },
  { code: 'GR', label: 'Grécia' },
  { code: 'CA', label: 'Canadá' },
  { code: 'GB', label: 'Reino Unido' },
  { code: 'MX', label: 'México' },
  { code: 'AR', label: 'Argentina' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colômbia' },
  { code: 'AU', label: 'Austrália' },
  { code: 'JP', label: 'Japão' },
  { code: 'OTHER', label: 'Outro / não listado' },
] as const

const COUNTRY_CURRENCY_MAP: Record<string, SkinsCurrency> = {
  BR: SkinsCurrency.BRL,
  US: SkinsCurrency.USD,
  PT: SkinsCurrency.EUR,
  DE: SkinsCurrency.EUR,
  FR: SkinsCurrency.EUR,
  ES: SkinsCurrency.EUR,
  IT: SkinsCurrency.EUR,
  NL: SkinsCurrency.EUR,
  BE: SkinsCurrency.EUR,
  AT: SkinsCurrency.EUR,
  IE: SkinsCurrency.EUR,
  FI: SkinsCurrency.EUR,
  GR: SkinsCurrency.EUR,
  AD: SkinsCurrency.EUR,
  CY: SkinsCurrency.EUR,
  EE: SkinsCurrency.EUR,
  LT: SkinsCurrency.EUR,
  LU: SkinsCurrency.EUR,
  LV: SkinsCurrency.EUR,
  MT: SkinsCurrency.EUR,
  SI: SkinsCurrency.EUR,
  SK: SkinsCurrency.EUR,
}

export function currencyForCountry(countryCode: string | null | undefined): SkinsCurrency {
  if (!countryCode || countryCode === 'OTHER') return SkinsCurrency.BRL
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? SkinsCurrency.BRL
}

export function countryLabel(countryCode: string): string {
  const match = ADMIN_COUNTRY_OPTIONS.find((item) => item.code === countryCode)
  return match?.label ?? countryCode
}

export function detectBrowserCountryCode(): string {
  if (typeof window === 'undefined') return 'BR'

  try {
    const locale = navigator.language || ''
    const regionMatch = locale.match(/-([A-Za-z]{2})$/)
    if (regionMatch?.[1]) {
      const code = regionMatch[1].toUpperCase()
      if (ADMIN_COUNTRY_OPTIONS.some((item) => item.code === code)) {
        return code
      }
    }
  } catch {
    /* ignore */
  }

  return 'BR'
}

export function isSupportedCountryCode(code: string): boolean {
  return ADMIN_COUNTRY_OPTIONS.some((item) => item.code === code)
}
