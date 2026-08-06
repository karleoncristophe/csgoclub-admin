export type CaseValueMode = 'base' | 'with_tax'

export const DEFAULT_ITEM_PROBABILITY_TOLERANCE = 0.0001

/** Skins baratíssimas (ex.: filler csgo.net ~$0,007) ainda precisam ser > 0. */
export const MIN_CASE_ITEM_PRICE = 0.0001

export type CaseEconomyLedger = {
  totalRevenue: number
  totalPayout: number
  totalRealOpens?: number
  /** Saldo do banco virtual da caixa. */
  bankBalance?: number
}

export const EMPTY_CASE_ECONOMY_LEDGER: CaseEconomyLedger = {
  totalRevenue: 0,
  totalPayout: 0,
  totalRealOpens: 0,
  bankBalance: 0,
}

export type CaseEconomicsConfig = {
  targetMarginPercent: number
  probabilityTargetPercent: number
  probabilityTolerance?: number
  discountPercent: number
}

export type CaseEconomicsItem = {
  basePrice: number
  priceWithTax: number
  price: number
  probability: number
  probabilityTolerance?: number
  enabled?: boolean
  skinName?: string
}

export type DropEligibilityResult = {
  eligible: boolean
  /** Item custa até o preço da abertura, então a própria abertura o paga. */
  coveredByOpenPrice: boolean
  /** Saldo mínimo exigido no banco (0 quando coberto pela abertura). */
  requiredBankBalance: number
  /** Saldo avaliado, já incluindo a injeção da abertura atual. */
  bankBalance: number
  /** Quanto falta acumular no banco para liberar o item. */
  bankShortfall: number
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

/** Preço de tabela = VE × (1 + margem%). Ex.: VE 10 e margem 20% → 12. */
export function computeSuggestedSalePrice(
  totalExpectedValue: number,
  targetMarginPercent: number,
): number {
  const targetMargin = Math.max(0, targetMarginPercent) / 100
  return totalExpectedValue * (1 + targetMargin)
}

export function computePriceAfterDiscount(
  listPrice: number,
  discountPercent: number,
): number {
  const discount = Math.min(100, Math.max(0, discountPercent)) / 100
  return listPrice * (1 - discount)
}

/**
 * Margem real em cima do VE: (preço − VE) / VE.
 * Com preço = VE × (1 + margem) e sem desconto, bate a margem alvo.
 */
export function computeRealMargin(
  finalPrice: number,
  totalExpectedValue: number,
): number {
  if (!Number.isFinite(finalPrice) || !Number.isFinite(totalExpectedValue)) {
    return 0
  }
  if (totalExpectedValue <= 0) return 0
  return (finalPrice - totalExpectedValue) / totalExpectedValue
}

/** Tolerância para comparar saldo com preço sem ruído de ponto flutuante. */
const BANK_EPSILON = 1e-9

/**
 * Valor Esperado injetado no banco por abertura.
 * Com preço = VE × (1 + margem), o VE equivalente é preço ÷ (1 + margem).
 */
export function computeBankInjection(
  openPrice: number,
  targetMarginPercent: number,
): number {
  if (!Number.isFinite(openPrice) || openPrice <= 0) return 0
  const margin = Math.max(0, targetMarginPercent) / 100
  return roundPrice(openPrice / (1 + margin))
}

export function evaluateDropEligibility(input: {
  item: CaseEconomicsItem
  openPrice: number
  bankBalance: number
  valueMode: CaseValueMode
}): DropEligibilityResult {
  const itemValue = roundPrice(
    resolveItemEconomicsValue(input.item, input.valueMode),
  )
  const openPrice = roundPrice(input.openPrice)
  const bankBalance = roundPrice(input.bankBalance)

  const coveredByOpenPrice = itemValue <= openPrice + BANK_EPSILON
  const requiredBankBalance = coveredByOpenPrice ? 0 : itemValue
  const eligible =
    coveredByOpenPrice || bankBalance + BANK_EPSILON >= requiredBankBalance

  return {
    eligible,
    coveredByOpenPrice,
    requiredBankBalance,
    bankBalance,
    bankShortfall: eligible ? 0 : roundPrice(requiredBankBalance - bankBalance),
  }
}

/**
 * Quantas aberturas o banco precisa acumular, do zero, para liberar o item.
 */
export function computeOpensToUnlockItem(input: {
  itemValue: number
  openPrice: number
  targetMarginPercent: number
}): number {
  if (input.itemValue <= input.openPrice + BANK_EPSILON) return 0

  const injection = computeBankInjection(
    input.openPrice,
    input.targetMarginPercent,
  )
  if (injection <= 0) return Number.POSITIVE_INFINITY

  return Math.ceil(roundPrice(input.itemValue) / injection)
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

/**
 * Saldo que o banco precisa alcançar para o item mais caro ficar elegível.
 */
export function computeBankTargetForFullPool(
  items: CaseEconomicsItem[],
  valueMode: CaseValueMode,
): number {
  const enabled = getEnabledDropItems(items)
  if (enabled.length === 0) return 0

  return roundPrice(
    Math.max(
      ...enabled.map((item) => resolveItemEconomicsValue(item, valueMode)),
    ),
  )
}

/**
 * Preço de tabela é sempre VE × (1 + margem). Itens acima do preço não puxam o
 * preço para cima: eles são liberados pelo banco virtual conforme ele acumula.
 */
export function resolveFairCaseListPrice(input: {
  items: CaseEconomicsItem[]
  valueMode: CaseValueMode
  targetMarginPercent: number
}): number {
  const expectedValue = computeTotalExpectedValue(input.items, input.valueMode)
  return roundPrice(
    computeSuggestedSalePrice(expectedValue, input.targetMarginPercent),
  )
}

export function describeDropEligibility(eligibility: DropEligibilityResult): string {
  if (eligibility.eligible) return 'Sim'
  return 'Não (banco)'
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
    Math.abs(sum - config.probabilityTargetPercent) <=
    (config.probabilityTolerance ?? 0)
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
  bankBalance: number
  valueMode: CaseValueMode
}): number {
  return getEnabledDropItems(input.items).filter((item) =>
    evaluateDropEligibility({
      item,
      openPrice: input.openPrice,
      bankBalance: input.bankBalance,
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
    enabled?: boolean
  },
>(item: T): T & {
  enabled: boolean
  expectedValue: number
} {
  return {
    ...item,
    enabled: item.enabled ?? true,
    expectedValue: roundPrice(item.price * (item.probability / 100)),
  }
}
