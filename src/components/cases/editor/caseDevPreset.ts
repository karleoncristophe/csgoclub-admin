import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
  type CaseValueMode,
} from '@/utils/caseEconomics'

export type DevPresetItemSeed = {
  skinName: string
  catalogName?: string
  weaponLabel: string
  skinLabel: string
  wear?: string
  probability: number
  price: number
  rarityColor?: string
}

export const CSGO_NET_DEV_PRESET_ITEMS: DevPresetItemSeed[] = [
  {
    skinName: 'SSG 08 | Turbo Peek (Factory New)',
    weaponLabel: 'SSG 08',
    skinLabel: 'Turbo Peek',
    wear: 'FN',
    probability: 0.013,
    price: 72.53,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'Glock-18 | Fully Tuned (Well-Worn)',
    weaponLabel: 'Glock-18',
    skinLabel: 'Fully Tuned',
    wear: 'WW',
    probability: 0.014,
    price: 60.61,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'Charm | Quick Silver',
    weaponLabel: 'Charm',
    skinLabel: 'Quick Silver',
    probability: 0.036,
    price: 33.44,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'Desert Eagle | Kumicho Dragon (Field-Tested)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Kumicho Dragon',
    wear: 'FT',
    probability: 0.111,
    price: 21.22,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'M4A1-S | Party Animal (Field-Tested)',
    weaponLabel: 'M4A1-S',
    skinLabel: 'Party Animal',
    wear: 'FT',
    probability: 0.847,
    price: 10.48,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'Zeus x27 | Swamp DDPAT (Minimal Wear)',
    catalogName: 'Zeus x27 | Swamp DDPAT (Factory New)',
    weaponLabel: 'Zeus x27',
    skinLabel: 'Swamp DDPAT',
    wear: 'MW',
    probability: 98.979,
    price: 0.007,
    rarityColor: '#5e98d9',
  },
]

export function buildCaseDropItemFromPreset(
  seed: DevPresetItemSeed,
  catalog: SkinsCatalogItem | null,
  valueMode: CaseValueMode,
  targetMarginPercent: number,
): CaseDropItem {
  const economicsValue = seed.price

  return {
    skinName: seed.skinName,
    image: catalog?.image,
    rarity:
      catalog?.rarity?.name || catalog?.rarity?.color
        ? catalog.rarity
        : seed.rarityColor
          ? { color: seed.rarityColor }
          : undefined,
    basePrice: seed.price,
    taxPercent: 0,
    priceWithTax: seed.price,
    price: economicsValue,
    probability: seed.probability,
    minMarginPercent: targetMarginPercent,
    probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
    enabled: true,
    expectedValue: roundPrice(economicsValue * (seed.probability / 100)),
  }
}

type FetchCatalogItemFn = (params: {
  name: string
  currency?: SkinsCurrency
}) => { unwrap: () => Promise<SkinsCatalogItem> }

export async function fetchCsgoNetDevPresetItems(input: {
  fetchCatalogItem: FetchCatalogItemFn
  currency?: SkinsCurrency
  valueMode: CaseValueMode
  targetMarginPercent: number
}): Promise<CaseDropItem[]> {
  const currency = input.currency ?? SkinsCurrency.USD

  return Promise.all(
    CSGO_NET_DEV_PRESET_ITEMS.map(async (seed) => {
      const queryName = seed.catalogName ?? seed.skinName
      try {
        const catalog = await input.fetchCatalogItem({ name: queryName, currency }).unwrap()
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
