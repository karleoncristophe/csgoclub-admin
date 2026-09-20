import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { SkinsbackRates } from '@/redux/store/api/skins/api.skins'
import { roundPrice } from '@/utils/caseEconomics'

export type FxPreview = Record<SkinsCurrency, number>

type LiveValues = {
  liveValueBrl?: number
  liveValueUsd?: number
  liveValueEur?: number
}

/**
 * Preview do que o servidor grava: se o item está no valor vivo do catálogo,
 * usa os valores nativos da SkinsBack (USD é a origem); senão converte a partir
 * do valor digitado na moeda da caixa. Mesma regra de `itemValueSnapshotFor`.
 */
export function previewItemValues(
  item: LiveValues,
  sourceValue: number,
  from: SkinsCurrency,
  rates: Pick<SkinsbackRates, 'brl' | 'eur'> | undefined,
): FxPreview | null {
  const live: Partial<FxPreview> = {
    [SkinsCurrency.BRL]: item.liveValueBrl,
    [SkinsCurrency.USD]: item.liveValueUsd,
    [SkinsCurrency.EUR]: item.liveValueEur,
  }
  const liveInSource = live[from]
  if (
    liveInSource != null &&
    live[SkinsCurrency.BRL] != null &&
    live[SkinsCurrency.USD] != null &&
    live[SkinsCurrency.EUR] != null &&
    roundPrice(liveInSource) === roundPrice(sourceValue)
  ) {
    return live as FxPreview
  }
  return previewSkinsbackFx(sourceValue, from, rates)
}

/**
 * Espelho de `buildItemValueSnapshotFromRates` do backend: converte um valor
 * na moeda de origem para BRL/USD/EUR pela cotação SkinsBack (base USD).
 * Serve só para o admin mostrar na hora o que o servidor vai gravar ao salvar.
 */
export function previewSkinsbackFx(
  value: number,
  from: SkinsCurrency,
  rates: Pick<SkinsbackRates, 'brl' | 'eur'> | undefined,
): FxPreview | null {
  if (!rates || !(value > 0)) return null
  const rateBrl = rates.brl > 0 ? rates.brl : 1
  const rateEur = rates.eur > 0 ? rates.eur : 1
  const normalized = roundPrice(value)

  let usd: number
  let brl: number
  let eur: number
  if (from === SkinsCurrency.BRL) {
    brl = normalized
    usd = roundPrice(normalized / rateBrl)
    eur = roundPrice(usd * rateEur)
  } else if (from === SkinsCurrency.EUR) {
    eur = normalized
    usd = roundPrice(normalized / rateEur)
    brl = roundPrice(usd * rateBrl)
  } else {
    usd = normalized
    brl = roundPrice(normalized * rateBrl)
    eur = roundPrice(normalized * rateEur)
  }
  return {
    [SkinsCurrency.BRL]: brl,
    [SkinsCurrency.USD]: usd,
    [SkinsCurrency.EUR]: eur,
  } as FxPreview
}
