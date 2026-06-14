import type { CaseDropItem, LootCase } from '@/redux/store/api/cases/api.cases'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
} from '@/utils/caseEconomics'
import type { CaseFormState } from './caseEditor.types'

export function mapCaseToFormValues(lootCase: LootCase): CaseFormState {
  return {
    name: lootCase.name,
    slug: lootCase.slug,
    slugManual: true,
    description: lootCase.description ?? '',
    imageUrl: lootCase.imageUrl ?? '',
    caseImage: lootCase.imageUrl ?? null,
    currency: lootCase.currency,
    valueMode: lootCase.valueMode,
    active: lootCase.active,
    targetMarginPercent: lootCase.targetMarginPercent,
    probabilityTargetPercent: lootCase.probabilityTargetPercent ?? 100,
    discountPercent: lootCase.discountPercent ?? 0,
    listPrice: lootCase.listPrice ?? lootCase.price,
    price: lootCase.price,
    listPriceManual: true,
    priceManual: true,
    items: lootCase.items.map((item): CaseDropItem => ({
      ...item,
      minMarginPercent: item.minMarginPercent ?? lootCase.targetMarginPercent,
      probabilityTolerance:
        item.probabilityTolerance ?? DEFAULT_ITEM_PROBABILITY_TOLERANCE,
      enabled: item.enabled ?? true,
      expectedValue:
        item.expectedValue ??
        roundPrice(item.price * ((item.probability ?? 0) / 100)),
    })),
  }
}

export function patchCaseDropItem(
  item: CaseDropItem,
  patch: Partial<CaseDropItem>,
): CaseDropItem {
  const next = { ...item, ...patch }
  return {
    ...next,
    expectedValue: roundPrice(next.price * (next.probability / 100)),
  }
}

export function fieldError(
  touched: boolean | undefined,
  error: string | undefined,
): string | undefined {
  return touched && error ? error : undefined
}

export function collectFormErrors(errors: Record<string, unknown>): string[] {
  const messages: string[] = []
  for (const value of Object.values(errors)) {
    if (typeof value === 'string') {
      messages.push(value)
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') messages.push(item)
      }
    }
  }
  return messages
}

export function updateCaseDropItem(
  items: CaseDropItem[],
  skinName: string,
  patch: Partial<CaseDropItem>,
): CaseDropItem[] {
  return items.map((item) =>
    item.skinName === skinName ? patchCaseDropItem(item, patch) : item,
  )
}
