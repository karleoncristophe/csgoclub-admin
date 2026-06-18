import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import {
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  roundPrice,
  type CaseValueMode,
} from '@/utils/caseEconomics'
import type { DevPresetItemSeed } from './caseDevPreset'
import { buildCaseDropItemFromPreset } from './caseDevPreset'

/**
 * Pool balanceado para demo de influencer: VE ~US$ 5,9 → caixa ~US$ 8,4.
 * Todos os tiers ficam abaixo de 70% do preço (margem instantânea 30%), então
 * raros podem cair de verdade — diferente do preset csgo.net (Zeus 99,5%).
 */
export const INFLUENCER_DEMO_PRESET_ITEMS: DevPresetItemSeed[] = [
  {
    skinName: 'MP9 | Capillary (Field-Tested)',
    weaponLabel: 'MP9',
    skinLabel: 'Capillary',
    wear: 'FT',
    probability: 28,
    priceUsd: 4.5,
    rarityColor: '#5e98d9',
  },
  {
    skinName: 'Glock-18 | Moonrise (Field-Tested)',
    weaponLabel: 'Glock-18',
    skinLabel: 'Moonrise',
    wear: 'FT',
    probability: 24,
    priceUsd: 4.8,
    rarityColor: '#8847ff',
  },
  {
    skinName: 'AK-47 | Safari Mesh (Field-Tested)',
    weaponLabel: 'AK-47',
    skinLabel: 'Safari Mesh',
    wear: 'FT',
    probability: 20,
    priceUsd: 5.0,
    rarityColor: '#b0c3d9',
  },
  {
    skinName: 'M4A4 | Poly Mag (Field-Tested)',
    weaponLabel: 'M4A4',
    skinLabel: 'Poly Mag',
    wear: 'FT',
    probability: 14,
    priceUsd: 5.2,
    rarityColor: '#5e98d9',
  },
  {
    skinName: 'AWP | Capillary (Field-Tested)',
    weaponLabel: 'AWP',
    skinLabel: 'Capillary',
    wear: 'FT',
    probability: 10,
    priceUsd: 5.35,
    rarityColor: '#4b69ff',
  },
  {
    skinName: 'Desert Eagle | Corinthian (Field-Tested)',
    weaponLabel: 'Desert Eagle',
    skinLabel: 'Corinthian',
    wear: 'FT',
    probability: 4,
    priceUsd: 5.45,
    rarityColor: '#8847ff',
  },
]

type FetchCatalogItemFn = (params: {
  name: string
  currency?: SkinsCurrency
}) => { unwrap: () => Promise<SkinsCatalogItem> }

export async function fetchInfluencerDemoPresetItems(input: {
  fetchCatalogItem: FetchCatalogItemFn
  valueMode: CaseValueMode
  targetMarginPercent: number
}): Promise<CaseDropItem[]> {
  return Promise.all(
    INFLUENCER_DEMO_PRESET_ITEMS.map(async (seed) => {
      try {
        const catalog = await input
          .fetchCatalogItem({ name: seed.skinName, currency: SkinsCurrency.USD })
          .unwrap()
        return buildCaseDropItemFromPreset(
          {
            ...seed,
            priceUsd: roundPrice(catalog.price ?? seed.priceUsd),
          },
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
