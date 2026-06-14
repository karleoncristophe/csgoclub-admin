export type CaseValueMode = 'base' | 'with_tax'

export type CaseEconomicsConfig = {
  targetMarginPercent: number
  probabilityTargetPercent: number
  probabilityTolerance: number
  discountPercent: number
}

export type CaseEconomicsItem = {
  basePrice: number
  priceWithTax: number
  price: number
  probability: number
}

export function resolveItemEconomicsValue(
  item: Pick<CaseEconomicsItem, 'basePrice' | 'priceWithTax' | 'price'>,
  valueMode: CaseValueMode,
): number {
  return valueMode === 'base' ? item.basePrice : item.priceWithTax
}

export function computeItemExpectedValue(
  item: CaseEconomicsItem,
  valueMode: CaseValueMode,
): number {
  const value = resolveItemEconomicsValue(item, valueMode)
  return value * (item.probability / 100)
}

export function computeTotalExpectedValue(
  items: CaseEconomicsItem[],
  valueMode: CaseValueMode,
): number {
  return items.reduce(
    (sum, item) => sum + computeItemExpectedValue(item, valueMode),
    0,
  )
}

export function computeSuggestedSalePrice(
  totalExpectedValue: number,
  targetMarginPercent: number,
): number {
  const targetMargin = targetMarginPercent / 100
  const divisor = 1 - targetMargin
  if (divisor <= 0) return totalExpectedValue
  return totalExpectedValue / divisor
}

export function computePriceAfterDiscount(
  listPrice: number,
  discountPercent: number,
): number {
  const discount = Math.min(100, Math.max(0, discountPercent)) / 100
  return listPrice * (1 - discount)
}

export function computeRealMargin(
  finalPrice: number,
  totalExpectedValue: number,
): number {
  if (!Number.isFinite(finalPrice) || finalPrice <= 0) return 0
  return (finalPrice - totalExpectedValue) / finalPrice
}

export function computeProbabilitySum(probabilities: number[]): number {
  return probabilities.reduce((sum, value) => sum + value, 0)
}

export function roundEconomics(value: number, decimals = 4): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

export function isProbabilitySumValid(
  sum: number,
  config: Pick<CaseEconomicsConfig, 'probabilityTargetPercent' | 'probabilityTolerance'>,
): boolean {
  return (
    Math.abs(sum - config.probabilityTargetPercent) <= config.probabilityTolerance
  )
}

export function getProbabilityDelta(
  sum: number,
  probabilityTargetPercent: number,
): number {
  return roundEconomics(probabilityTargetPercent - sum, 4)
}

export function hasZeroPricedItems(
  items: Array<Pick<CaseEconomicsItem, 'basePrice' | 'priceWithTax'>>,
): boolean {
  return items.some(
    (item) =>
      !Number.isFinite(item.basePrice) ||
      item.basePrice <= 0 ||
      !Number.isFinite(item.priceWithTax) ||
      item.priceWithTax <= 0,
  )
}

export function hasNegativeMargin(
  finalPrice: number,
  totalExpectedValue: number,
): boolean {
  return finalPrice < totalExpectedValue
}

export function slugifyCaseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function catalogSkinToCaseItem(
  skin: {
    name: string
    price: number
    priceWithTax: number
    taxPercent: number
    image?: string
    rarity?: { name?: string; color?: string }
  },
  valueMode: CaseValueMode,
  probability = 0,
) {
  const economicsValue = resolveItemEconomicsValue(
    {
      basePrice: skin.price,
      priceWithTax: skin.priceWithTax,
      price: skin.priceWithTax,
    },
    valueMode,
  )

  return {
    skinName: skin.name,
    image: skin.image,
    rarity: skin.rarity?.name || skin.rarity?.color ? skin.rarity : undefined,
    basePrice: skin.price,
    taxPercent: skin.taxPercent,
    priceWithTax: skin.priceWithTax,
    price: economicsValue,
    probability,
  }
}

export function remapCaseItemsForValueMode<
  T extends {
    basePrice: number
    priceWithTax: number
    price: number
    probability: number
    skinName: string
    image?: string
    taxPercent: number
  },
>(items: T[], valueMode: CaseValueMode): T[] {
  return items.map((item) => ({
    ...item,
    price: resolveItemEconomicsValue(item, valueMode),
  }))
}
