import type { CaseDropItem, CaseDropItemPayload, LootCase } from '@/redux/store/api/cases/api.cases'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
} from '@/utils/caseEconomics'
import type { CaseFormState } from './caseEditor.types'

export function mapCaseToFormValues(lootCase: LootCase): CaseFormState {
  return {
    name: lootCase.name,
    description: lootCase.description ?? '',
    imageUrl: lootCase.imageUrl ?? '',
    caseImage: lootCase.imageUrl ?? null,
    currency: lootCase.currency,
    valueMode: lootCase.valueMode,
    active: lootCase.active,
    targetMarginPercent: lootCase.targetMarginPercent,
    probabilityTargetPercent: lootCase.probabilityTargetPercent ?? 100,
    discountPercent: lootCase.discountPercent ?? 0,
    listPrice: lootCase.listPrice ?? lootCase.suggestedPrice ?? 0,
    price: lootCase.price ?? 0,
    listPriceManual: false,
    priceManual: false,
    items: lootCase.items.map((item): CaseDropItem => ({
      ...item,
      minMarginPercent: item.minMarginPercent ?? lootCase.targetMarginPercent,
      probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
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

export function collectFormErrors(errors: unknown): string[] {
  if (!errors) return []

  if (typeof errors === 'string') {
    return [errors]
  }

  if (Array.isArray(errors)) {
    return errors.flatMap((item) => collectFormErrors(item))
  }

  if (typeof errors === 'object') {
    return Object.values(errors as Record<string, unknown>).flatMap((value) =>
      collectFormErrors(value),
    )
  }

  return []
}

export function touchAllCaseFormFields(
  values: CaseFormState,
): Record<string, unknown> {
  return {
    name: true,
    description: true,
    currency: true,
    valueMode: true,
    active: true,
    targetMarginPercent: true,
    probabilityTargetPercent: true,
    discountPercent: true,
    listPrice: true,
    price: true,
    items: values.items.map(() => ({
      skinName: true,
      probability: true,
      probabilityTolerance: true,
      minMarginPercent: true,
      basePrice: true,
      priceWithTax: true,
      price: true,
    })),
  }
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

/** Campos só do formulário — não enviar na API. */
export function toCaseDropItemPayload(item: CaseDropItem): CaseDropItemPayload {
  const { expectedValue: _expectedValue, ...payload } = item
  return {
    ...payload,
    probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  }
}

export function toCaseDropItemsPayload(
  items: CaseDropItem[],
): CaseDropItemPayload[] {
  return items.map(toCaseDropItemPayload)
}
