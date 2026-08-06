import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import { roundPrice } from '@/utils/caseEconomics'
import type { DevPresetItemSeed } from './caseDevPreset'
import { buildCaseDropItemFromPreset } from './caseDevPreset'

/**
 * Snapshot japa skins — Valor / Chance do design (pool 10M).
 * Intervalos derivados no open; aqui só probability + price.
 */
export const JAPA_SKINS_PRESET_ITEMS: DevPresetItemSeed[] = [
  {
    skinName: 'AUG | Commando Company (Field-Tested)',
    weaponLabel: 'AUG',
    skinLabel: 'Commando Company',
    wear: 'FT',
    probability: 99.5471,
    priceUsd: 0.005,
    rarityColor: '#b0c3d9',
  },
  {
    skinName: "Glock-18 | Ramese's Reach (Field-Tested)",
    weaponLabel: 'Glock-18',
    skinLabel: "Ramese's Reach",
    wear: 'FT',
    probability: 0.3448,
    priceUsd: 9.78,
    rarityColor: '#8847ff',
  },
  {
    skinName: "Charm | Lil' Ferno",
    weaponLabel: 'Charm',
    skinLabel: "Lil' Ferno",
    probability: 0.0461,
    priceUsd: 20.58,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'Desert Eagle | Conspiracy (Factory New)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Conspiracy',
    wear: 'FN',
    probability: 0.0355,
    priceUsd: 23.1,
    rarityColor: '#d32ce6',
  },
  {
    skinName: 'MAC-10 | Stalker (Field-Tested)',
    weaponLabel: 'MAC-10',
    skinLabel: 'Stalker',
    wear: 'FT',
    probability: 0.0147,
    priceUsd: 40.49,
    rarityColor: '#eb4b4b',
  },
  {
    skinName: 'Desert Eagle | Code Red (Minimal Wear)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Code Red',
    wear: 'MW',
    probability: 0.0117,
    priceUsd: 56.76,
    rarityColor: '#eb4b4b',
  },
]

export function estimateJapaSkinsPresetPricing(
  targetMarginPercent: number,
  discountPercent = 0,
): { expectedValue: number; listPrice: number; finalPrice: number } {
  const expectedValue = roundPrice(
    JAPA_SKINS_PRESET_ITEMS.reduce(
      (sum, item) => sum + item.priceUsd * (item.probability / 100),
      0,
    ),
  )
  const margin = Math.max(0, targetMarginPercent) / 100
  const listPrice = roundPrice(expectedValue * (1 + margin))
  const finalPrice = roundPrice(
    listPrice * (1 - Math.min(100, Math.max(0, discountPercent)) / 100),
  )

  return { expectedValue, listPrice, finalPrice }
}

type FetchCatalogItemFn = (params: {
  name: string
  currency?: SkinsCurrency
}) => { unwrap: () => Promise<SkinsCatalogItem> }

export async function fetchJapaSkinsPresetItems(input: {
  fetchCatalogItem: FetchCatalogItemFn
}): Promise<CaseDropItem[]> {
  return Promise.all(
    JAPA_SKINS_PRESET_ITEMS.map(async (seed) => {
      const queryName = seed.catalogName ?? seed.skinName
      try {
        const catalog = await input
          .fetchCatalogItem({ name: queryName, currency: SkinsCurrency.USD })
          .unwrap()
        return buildCaseDropItemFromPreset(seed, catalog)
      } catch {
        return buildCaseDropItemFromPreset(seed, null)
      }
    }),
  )
}
