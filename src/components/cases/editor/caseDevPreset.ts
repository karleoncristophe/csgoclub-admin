import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
  type CaseValueMode,
} from '@/utils/caseEconomics'

/** Snapshot csgo.net — nomes, chances e preços USD enviados pelo time. */
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

export const CSGO_NET_DEV_PRESET_ITEMS: DevPresetItemSeed[] = [
  {
    skinName: 'SSG 08 | Turbo Peek (Factory New)',
    weaponLabel: 'SSG 08',
    skinLabel: 'Turbo Peek',
    wear: 'FN',
    probability: 0.013,
    priceUsd: 72.53,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'Glock-18 | Fully Tuned (Well-Worn)',
    weaponLabel: 'Glock-18',
    skinLabel: 'Fully Tuned',
    wear: 'WW',
    probability: 0.014,
    priceUsd: 60.61,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'Charm | Quick Silver',
    weaponLabel: 'Charm',
    skinLabel: 'Quick Silver',
    probability: 0.036,
    priceUsd: 33.44,
    rarityColor: '#8847ff',
  },
  {
    skinName: 'Desert Eagle | Kumicho Dragon (Field-Tested)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Kumicho Dragon',
    wear: 'FT',
    probability: 0.111,
    priceUsd: 21.22,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'M4A1-S | Party Animal (Field-Tested)',
    weaponLabel: 'M4A1-S',
    skinLabel: 'Party Animal',
    wear: 'FT',
    probability: 0.847,
    priceUsd: 10.48,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'Zeus x27 | Swamp DDPAT (Minimal Wear)',
    catalogName: 'Zeus x27 | Swamp DDPAT (Factory New)',
    weaponLabel: 'Zeus x27',
    skinLabel: 'Swamp DDPAT',
    wear: 'MW',
    probability: 98.979,
    priceUsd: 0.007,
    rarityColor: '#b0c3d9',
  },
]

export function estimateCsgoNetDevPresetPricing(
  targetMarginPercent: number,
  discountPercent = 0,
): { expectedValue: number; listPrice: number; finalPrice: number } {
  const expectedValue = roundPrice(
    CSGO_NET_DEV_PRESET_ITEMS.reduce(
      (sum, item) => sum + item.priceUsd * (item.probability / 100),
      0,
    ),
  )
  const margin = targetMarginPercent / 100
  const divisor = 1 - margin
  const evPrice = divisor > 0 ? expectedValue / divisor : expectedValue
  const maxItem = Math.max(...CSGO_NET_DEV_PRESET_ITEMS.map((item) => item.priceUsd))
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

export async function fetchCsgoNetDevPresetItems(input: {
  fetchCatalogItem: FetchCatalogItemFn
  valueMode: CaseValueMode
  targetMarginPercent: number
}): Promise<CaseDropItem[]> {
  return Promise.all(
    CSGO_NET_DEV_PRESET_ITEMS.map(async (seed) => {
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
