import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
  type CaseValueMode,
} from '@/utils/caseEconomics'

/**
 * Snapshot csgo.net (período a80e360d…) — valores e chances exatos em USD.
 * Catálogo só traz imagem/rarity; economia usa `priceUsd` do preset.
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

/** Ordem: maior chance → menor (como no painel csgo.net). */
export const CSGO_NET_DEV_PRESET_ITEMS: DevPresetItemSeed[] = [
  {
    skinName: 'Zeus x27 | Swamp DDPAT',
    catalogName: 'Zeus x27 | Swamp DDPAT (Factory New)',
    weaponLabel: 'Zeus x27',
    skinLabel: 'Swamp DDPAT',
    probability: 99.5046,
    priceUsd: 0.007,
    rarityColor: '#5e98d9',
  },
  {
    skinName: 'Desert Eagle | Kumicho Dragon (Field-Tested)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Kumicho Dragon',
    wear: 'FT',
    probability: 0.3336,
    priceUsd: 21.06,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'Charm | Quick Silver',
    weaponLabel: 'Charm',
    skinLabel: 'Quick Silver',
    probability: 0.0931,
    priceUsd: 33.15,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'M4A1-S | Party Animal (Field-Tested)',
    weaponLabel: 'M4A1-S',
    skinLabel: 'Party Animal',
    wear: 'FT',
    probability: 0.0273,
    priceUsd: 55.98,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'Glock-18 | Fully Tuned (Well-Worn)',
    weaponLabel: 'Glock-18',
    skinLabel: 'Fully Tuned',
    wear: 'WW',
    probability: 0.0241,
    priceUsd: 59.92,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'SSG 08 | Turbo Peek (Factory New)',
    weaponLabel: 'SSG 08',
    skinLabel: 'Turbo Peek',
    wear: 'FN',
    probability: 0.0173,
    priceUsd: 74.45,
    rarityColor: '#eb4b4b',
  },
]

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
