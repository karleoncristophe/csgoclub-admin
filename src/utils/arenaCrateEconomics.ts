import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  computeBankInjection,
  computeOpensToUnlockItem,
  evaluateDropEligibility,
  roundPrice,
  type DropEligibilityResult,
} from '@/utils/caseEconomics'
import type { ArenaCrateItem } from '@/redux/store/api/arena/api.arena'

export type ArenaCrateEconomyLedger = {
  bankBalanceBrl?: number
  bankBalanceUsd?: number
  bankBalanceEur?: number
  totalOpens?: number
}

export const EMPTY_ARENA_CRATE_ECONOMY_LEDGER: ArenaCrateEconomyLedger = {
  bankBalanceBrl: 0,
  bankBalanceUsd: 0,
  bankBalanceEur: 0,
  totalOpens: 0,
}

export function arenaPrizeForCurrency(
  item: Pick<ArenaCrateItem, 'valueBrl' | 'valueUsd' | 'valueEur'>,
  currency: SkinsCurrency,
) {
  if (currency === SkinsCurrency.EUR) return Number(item.valueEur) || 0
  if (currency === SkinsCurrency.USD) return Number(item.valueUsd) || 0
  return Number(item.valueBrl) || 0
}

export function arenaBankBalance(
  ledger: ArenaCrateEconomyLedger | undefined,
  currency: SkinsCurrency,
) {
  const safe = ledger ?? EMPTY_ARENA_CRATE_ECONOMY_LEDGER
  if (currency === SkinsCurrency.EUR) return roundPrice(safe.bankBalanceEur ?? 0)
  if (currency === SkinsCurrency.USD) return roundPrice(safe.bankBalanceUsd ?? 0)
  return roundPrice(safe.bankBalanceBrl ?? 0)
}

/** Arena has no margin: injection = crate skin EV. */
export function arenaBankInjection(openPrice: number) {
  return computeBankInjection(openPrice, 0)
}

export function computeArenaCrateValues(items: ArenaCrateItem[]) {
  const enabled = items.filter(
    (item) => item.enabled !== false && Number(item.probability) > 0,
  )
  const ev = (pick: (item: ArenaCrateItem) => number) =>
    roundPrice(
      enabled.reduce(
        (sum, item) => sum + pick(item) * (Number(item.probability) || 0) / 100,
        0,
      ),
    )
  return {
    valueBrl: ev((item) => Number(item.valueBrl) || 0),
    valueUsd: ev((item) => Number(item.valueUsd) || 0),
    valueEur: ev((item) => Number(item.valueEur) || 0),
  }
}

export function evaluateArenaDropEligibility(input: {
  item: ArenaCrateItem
  openPrice: number
  bankBalance: number
  currency: SkinsCurrency
}): DropEligibilityResult {
  const prize = arenaPrizeForCurrency(input.item, input.currency)
  return evaluateDropEligibility({
    item: {
      basePrice: prize,
      priceWithTax: prize,
      price: prize,
      probability: input.item.probability,
      enabled: input.item.enabled,
    },
    openPrice: input.openPrice,
    bankBalance: input.bankBalance,
    valueMode: 'with_tax',
  })
}

export function countArenaEligibleItems(input: {
  items: ArenaCrateItem[]
  openPrice: number
  bankBalance: number
  currency: SkinsCurrency
}) {
  return input.items.filter((item) => {
    if (item.enabled === false || Number(item.probability) <= 0) return false
    return evaluateArenaDropEligibility({
      item,
      openPrice: input.openPrice,
      bankBalance: input.bankBalance,
      currency: input.currency,
    }).eligible
  }).length
}

export function arenaOpensToUnlock(input: {
  itemValue: number
  openPrice: number
}) {
  return computeOpensToUnlockItem({
    itemValue: input.itemValue,
    openPrice: input.openPrice,
    targetMarginPercent: 0,
  })
}

export function formatArenaBank(amount: number, currency: SkinsCurrency) {
  return formatSkinsPrice(amount, currency)
}
