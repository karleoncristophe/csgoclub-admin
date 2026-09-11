export const SKIN_WEAR_CODES = ['FN', 'MW', 'FT', 'WW', 'BS'] as const

export type SkinWearCode = (typeof SKIN_WEAR_CODES)[number]

export const SKIN_WEARS: readonly {
  code: SkinWearCode
  name: string
  shortLabel: string
  color: string
}[] = [
  { code: 'FN', name: 'Factory New', shortLabel: 'FN', color: '#3b82f6' },
  { code: 'MW', name: 'Minimal Wear', shortLabel: 'MW', color: '#22c55e' },
  { code: 'FT', name: 'Field-Tested', shortLabel: 'FT', color: '#eab308' },
  { code: 'WW', name: 'Well-Worn', shortLabel: 'WW', color: '#f97316' },
  { code: 'BS', name: 'Battle-Scarred', shortLabel: 'BS', color: '#ef4444' },
]

export function parseWearCodes(value: string): SkinWearCode[] {
  const selected = new Set(
    value
      .split(',')
      .map((token) => token.trim().toUpperCase())
      .filter((token): token is SkinWearCode =>
        (SKIN_WEAR_CODES as readonly string[]).includes(token),
      ),
  )
  return SKIN_WEAR_CODES.filter((code) => selected.has(code))
}

export function serializeWearCodes(wears: readonly SkinWearCode[]): string {
  return SKIN_WEAR_CODES.filter((code) => wears.includes(code)).join(',')
}

export function parseOptionalPrice(value: string): number | undefined {
  if (!value) return undefined
  const amount = Number(value.replace(',', '.'))
  if (!Number.isFinite(amount) || amount < 0) return undefined
  return amount
}

export function toggleWearCode(
  wears: readonly SkinWearCode[],
  code: SkinWearCode,
): SkinWearCode[] {
  return wears.includes(code)
    ? wears.filter((wear) => wear !== code)
    : [...wears, code]
}
