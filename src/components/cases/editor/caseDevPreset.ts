import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
  type CaseValueMode,
} from '@/utils/caseEconomics'

/**
 * Pool de dev/produção: perfil de vitrine comum (muito filler, raro com chance real).
 * Todos os itens ficam elegíveis — o preço da caixa usa o piso do item mais caro.
 */
export type DevPresetItemSeed = {
  skinName: string
  catalogName?: string
  weaponLabel: string
  skinLabel: string
  wear?: string
  probability: number
  priceUsd: number
  rarityColor?: string
}

/** Ordem: maior chance → menor. Chances somam 100%. */
export const FAIR_DEV_PRESET_ITEMS: DevPresetItemSeed[] = [
  {
    skinName: 'MP9 | Capillary (Field-Tested)',
    weaponLabel: 'MP9',
    skinLabel: 'Capillary',
    wear: 'FT',
    probability: 32,
    priceUsd: 5.8,
    rarityColor: '#5e98d9',
  },
  {
    skinName: 'Glock-18 | Moonrise (Field-Tested)',
    weaponLabel: 'Glock-18',
    skinLabel: 'Moonrise',
    wear: 'FT',
    probability: 25,
    priceUsd: 6.4,
    rarityColor: '#8847ff',
  },
  {
    skinName: 'AK-47 | Safari Mesh (Field-Tested)',
    weaponLabel: 'AK-47',
    skinLabel: 'Safari Mesh',
    wear: 'FT',
    probability: 20,
    priceUsd: 7,
    rarityColor: '#b0c3d9',
  },
  {
    skinName: 'M4A4 | Poly Mag (Field-Tested)',
    weaponLabel: 'M4A4',
    skinLabel: 'Poly Mag',
    wear: 'FT',
    probability: 12,
    priceUsd: 7.8,
    rarityColor: '#5e98d9',
  },
  {
    skinName: 'AWP | Capillary (Field-Tested)',
    weaponLabel: 'AWP',
    skinLabel: 'Capillary',
    wear: 'FT',
    probability: 8,
    priceUsd: 8.6,
    rarityColor: '#4b69ff',
  },
  {
    skinName: 'Desert Eagle | Corinthian (Field-Tested)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Corinthian',
    wear: 'FT',
    probability: 3,
    priceUsd: 9.5,
    rarityColor: '#8847ff',
  },
]

/** @deprecated Use FAIR_DEV_PRESET_ITEMS */
export const CSGO_NET_DEV_PRESET_ITEMS = FAIR_DEV_PRESET_ITEMS

export function estimateFairDevPresetPricing(
  targetMarginPercent: number,
  discountPercent = 0,
): { expectedValue: number; listPrice: number; finalPrice: number } {
  const expectedValue = roundPrice(
    FAIR_DEV_PRESET_ITEMS.reduce(
      (sum, item) => sum + item.priceUsd * (item.probability / 100),
      0,
    ),
  )
  const margin = targetMarginPercent / 100
  const divisor = 1 - margin
  const evPrice = divisor > 0 ? expectedValue / divisor : expectedValue
  const maxItem = Math.max(...FAIR_DEV_PRESET_ITEMS.map((item) => item.priceUsd))
  const eligibilityFloor = divisor > 0 ? maxItem / divisor : maxItem
  const listPrice = roundPrice(Math.max(evPrice, eligibilityFloor))
  const finalPrice = roundPrice(listPrice * (1 - Math.min(100, Math.max(0, discountPercent)) / 100))

  return { expectedValue, listPrice, finalPrice }
}

export function buildCaseDropItemFromPreset(
  seed: DevPresetItemSeed,
  catalog: SkinsCatalogItem | null,
  valueMode: CaseValueMode,
  targetMarginPercent: number,
): CaseDropItem {
  const price = seed.priceUsd
  const economicsValue = price

  return {
    skinName: seed.skinName,
    image: catalog?.image,
    rarity:
      catalog?.rarity?.name || catalog?.rarity?.color
        ? catalog.rarity
        : seed.rarityColor
          ? { color: seed.rarityColor }
          : undefined,
    basePrice: price,
    taxPercent: catalog?.taxPercent ?? 0,
    priceWithTax: price,
    price: economicsValue,
    probability: seed.probability,
    minMarginPercent: targetMarginPercent,
    probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
    enabled: true,
    expectedValue: roundPrice(price * (seed.probability / 100)),
  }
}

type FetchCatalogItemFn = (params: {
  name: string
  currency?: SkinsCurrency
}) => { unwrap: () => Promise<SkinsCatalogItem> }

export async function fetchFairDevPresetItems(input: {
  fetchCatalogItem: FetchCatalogItemFn
  valueMode: CaseValueMode
  targetMarginPercent: number
}): Promise<CaseDropItem[]> {
  return Promise.all(
    FAIR_DEV_PRESET_ITEMS.map(async (seed) => {
      const queryName = seed.catalogName ?? seed.skinName
      try {
        const catalog = await input
          .fetchCatalogItem({ name: queryName, currency: SkinsCurrency.USD })
          .unwrap()
        return buildCaseDropItemFromPreset(
          seed,
          catalog,
          input.valueMode,
          input.targetMarginPercent,
        )
      } catch {
        return buildCaseDropItemFromPreset(
          seed,
          null,
          input.valueMode,
          input.targetMarginPercent,
        )
      }
    }),
  )
}

/** @deprecated Use fetchFairDevPresetItems */
export const fetchCsgoNetDevPresetItems = fetchFairDevPresetItems
