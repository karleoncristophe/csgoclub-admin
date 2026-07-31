import type { CaseFormState } from '@/components/cases/editor/caseEditor.types'
import type { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { AiCaseDraft } from '@/redux/store/api/ai/api.ai'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
  type CaseValueMode,
} from '@/utils/caseEconomics'

export function aiDraftToCaseItems(draft: AiCaseDraft): CaseDropItem[] {
  return draft.items.map((item) => ({
    skinName: item.skinName,
    image: item.image,
    rarity: item.rarity,
    basePrice: item.basePrice,
    taxPercent: item.taxPercent,
    priceWithTax: item.priceWithTax,
    price: item.price,
    probability: item.probability,
    probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
    enabled: true,
    expectedValue: roundPrice(item.price * (item.probability / 100)),
  }))
}

/**
 * Aplica a proposta da IA no formulário. Preços ficam em modo automático para o
 * editor recalcular a partir do VE, como acontece com os presets.
 */
export function applyAiDraftToCaseForm(
  values: CaseFormState,
  draft: AiCaseDraft,
): CaseFormState {
  return {
    ...values,
    name: draft.name?.trim() || values.name,
    description: draft.description?.trim() || values.description,
    currency: draft.currency as SkinsCurrency,
    valueMode: draft.valueMode as CaseValueMode,
    targetMarginPercent: draft.targetMarginPercent,
    probabilityTargetPercent: draft.probabilityTargetPercent,
    discountPercent: draft.discountPercent,
    items: aiDraftToCaseItems(draft),
    listPrice: draft.suggestedListPrice,
    price: draft.suggestedFinalPrice,
    listPriceManual: false,
    priceManual: false,
  }
}
