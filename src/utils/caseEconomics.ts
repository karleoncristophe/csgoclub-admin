export type CaseValueMode = 'base' | 'with_tax'

export const DEFAULT_ITEM_PROBABILITY_TOLERANCE = 0.0001

/** Skins baratíssimas (ex.: filler csgo.net ~$0,007) ainda precisam ser > 0. */
export const MIN_CASE_ITEM_PRICE = 0.0001

export type CaseEconomyLedger = {
  totalRevenue: number
  totalPayout: number
  totalRealOpens?: number
}

export type CaseEconomicsConfig = {
  targetMarginPercent: number
  probabilityTargetPercent: number
  discountPercent: number
}

export type CaseEconomicsItem = {
  basePrice: number
  priceWithTax: number
  price: number
  probability: number
  minMarginPercent?: number
  enabled?: boolean
  skinName?: string
}

export type DropEligibilityResult = {
  instant: boolean
  cumulative: boolean
  eligible: boolean
  instantMarginPercent: number
  cumulativeMarginPercent: number
  requiredMarginPercent: number
}

export function resolveItemEconomicsValue(
  item: Pick<CaseEconomicsItem, 'basePrice' | 'priceWithTax' | 'price'>,
  valueMode: CaseValueMode,
): number {
  return valueMode === 'base' ? item.basePrice : item.priceWithTax
}

export function getEnabledDropItems<T extends CaseEconomicsItem>(items: T[]): T[] {
  return items.filter((item) => item.enabled !== false && item.probability > 0)
}

export function computeItemExpectedValue(
  item: CaseEconomicsItem,
  valueMode: CaseValueMode,
): number {
  if (item.enabled === false || item.probability <= 0) return 0
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

export function computeInstantMarginPercent(
  openPrice: number,
  itemValue: number,
): number {
  if (!Number.isFinite(openPrice) || openPrice <= 0) return 0
  return ((openPrice - itemValue) / openPrice) * 100
}

export function computeCumulativeMarginPercent(
  ledger: CaseEconomyLedger,
  openPrice: number,
  itemValue: number,
): number {
  const revenue = ledger.totalRevenue + openPrice
  if (revenue <= 0) return 0
  const payout = ledger.totalPayout + itemValue
  return ((revenue - payout) / revenue) * 100
}

export function resolveRequiredItemMarginPercent(
  item: Pick<CaseEconomicsItem, 'minMarginPercent'>,
  caseTargetMarginPercent: number,
): number {
  if (
    typeof item.minMarginPercent === 'number' &&
    Number.isFinite(item.minMarginPercent)
  ) {
    return item.minMarginPercent
  }
  return caseTargetMarginPercent
}

export function evaluateDropEligibility(input: {
  item: CaseEconomicsItem
  openPrice: number
  caseTargetMarginPercent: number
  ledger: CaseEconomyLedger
  valueMode: CaseValueMode
}): DropEligibilityResult {
  const itemValue = resolveItemEconomicsValue(input.item, input.valueMode)
  const requiredMarginPercent = resolveRequiredItemMarginPercent(
    input.item,
    input.caseTargetMarginPercent,
  )
  const instantMarginPercent = computeInstantMarginPercent(
    input.openPrice,
    itemValue,
  )
  const cumulativeMarginPercent = computeCumulativeMarginPercent(
    input.ledger,
    input.openPrice,
    itemValue,
  )
  const instant = instantMarginPercent >= requiredMarginPercent
  const cumulative = cumulativeMarginPercent >= input.caseTargetMarginPercent

  return {
    instant,
    cumulative,
    eligible: instant && cumulative,
    instantMarginPercent: roundEconomics(instantMarginPercent, 4),
    cumulativeMarginPercent: roundEconomics(cumulativeMarginPercent, 4),
    requiredMarginPercent,
  }
}

export function computeProbabilitySum(
  items: Array<Pick<CaseEconomicsItem, 'probability' | 'enabled'>>,
): number {
  return items
    .filter((item) => item.enabled !== false)
    .reduce((sum, item) => sum + item.probability, 0)
}

export function roundEconomics(value: number, decimals = 4): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeAggregatedProbabilityTolerance(
  items: Array<Pick<CaseEconomicsItem, 'probabilityTolerance' | 'enabled'>>,
): number {
  return items
    .filter((item) => item.enabled !== false)
    .reduce((sum, item) => sum + (item.probabilityTolerance ?? 0.0001), 0)
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
  items: Array<Pick<CaseEconomicsItem, 'basePrice' | 'priceWithTax' | 'enabled'>>,
): boolean {
  return items
    .filter((item) => item.enabled !== false)
    .some(
      (item) =>
        !Number.isFinite(item.basePrice) ||
        item.basePrice < MIN_CASE_ITEM_PRICE ||
        !Number.isFinite(item.priceWithTax) ||
        item.priceWithTax < MIN_CASE_ITEM_PRICE,
    )
}

export function hasNegativeMargin(
  finalPrice: number,
  totalExpectedValue: number,
): boolean {
  return finalPrice < totalExpectedValue
}

export function countEligibleDropItems(input: {
  items: CaseEconomicsItem[]
  openPrice: number
  caseTargetMarginPercent: number
  ledger: CaseEconomyLedger
  valueMode: CaseValueMode
}): number {
  return getEnabledDropItems(input.items).filter((item) =>
    evaluateDropEligibility({
      item,
      openPrice: input.openPrice,
      caseTargetMarginPercent: input.caseTargetMarginPercent,
      ledger: input.ledger,
      valueMode: input.valueMode,
    }).eligible,
  ).length
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
  targetMarginPercent = 30,
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
    minMarginPercent: targetMarginPercent,
    probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
    enabled: true,
    expectedValue: roundPrice(economicsValue * (probability / 100)),
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
    minMarginPercent?: number
    enabled?: boolean
    expectedValue?: number
  },
>(items: T[], valueMode: CaseValueMode): T[] {
  return items.map((item) => {
    const price = resolveItemEconomicsValue(item, valueMode)
    return {
      ...item,
      price,
      expectedValue: roundPrice(price * (item.probability / 100)),
    }
  })
}

export function normalizeCaseItemEconomics<
  T extends {
    price: number
    probability: number
    minMarginPercent?: number
    enabled?: boolean
  },
>(item: T, targetMarginPercent: number): T & {
  minMarginPercent: number
  enabled: boolean
  expectedValue: number
} {
  const minMarginPercent = item.minMarginPercent ?? targetMarginPercent
  const enabled = item.enabled ?? true
  return {
    ...item,
    minMarginPercent,
    enabled,
    expectedValue: roundPrice(item.price * (item.probability / 100)),
  }
}
