import * as Yup from 'yup'
import { arenaRarityDisplayValues } from '@/components/arena/arenaRarity'
import type {
  ArenaCrateItem,
  ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
import { ARENA_RARITIES } from '@/redux/store/api/arena/api.arena'
import {
  DEFAULT_PROBABILITY_TARGET,
  enabledProbabilitySum,
} from '@/utils/probabilityRemainder'

export const ARENA_CRATE_PROBABILITY_TARGET = DEFAULT_PROBABILITY_TARGET
export const ARENA_CRATE_PROBABILITY_TOLERANCE = 0.05

export function enabledArenaProbabilitySum(items: ArenaCrateItem[] | undefined) {
  return enabledProbabilitySum(items ?? [])
}

export function arenaProbabilitySumError(
  items: ArenaCrateItem[] | undefined,
): string | undefined {
  const enabled = (items ?? []).filter((item) => item.enabled !== false)
  if (enabled.length === 0) return undefined
  const sum = enabledArenaProbabilitySum(enabled)
  const delta = ARENA_CRATE_PROBABILITY_TARGET - sum
  if (Math.abs(delta) <= ARENA_CRATE_PROBABILITY_TOLERANCE) return undefined
  if (delta > 0) {
    return `As chances devem somar 100%. Falta ${delta.toFixed(2)}% (agora ${sum.toFixed(2)}%).`
  }
  return `As chances devem somar 100%. Sobra ${Math.abs(delta).toFixed(2)}% (agora ${sum.toFixed(2)}%).`
}

export function arenaProbabilityInputError(
  items: ArenaCrateItem[] | undefined,
): string | undefined {
  const message = arenaProbabilitySumError(items)
  if (!message) return undefined
  const sum = enabledArenaProbabilitySum(items)
  const delta = ARENA_CRATE_PROBABILITY_TARGET - sum
  return delta > 0
    ? `Falta ${delta.toFixed(2)}% para 100%`
    : `Sobra ${Math.abs(delta).toFixed(2)}% de 100%`
}

export const arenaCrateItemSchema = Yup.object({
  skinName: Yup.string().required(),
  image: Yup.string().optional(),
  rarity: Yup.object({
    name: Yup.string().optional(),
    color: Yup.string().optional(),
  }).optional(),
  probability: Yup.number().min(0).max(100).required(),
  enabled: Yup.boolean().required(),
  valueBrl: Yup.number().min(0).optional(),
  valueUsd: Yup.number().min(0).optional(),
  valueEur: Yup.number().min(0).optional(),
})

export const arenaCrateEditorSchema = Yup.object({
  name: Yup.string().trim().required('Informe o nome da crate'),
  description: Yup.string().trim(),
  rarity: Yup.string()
    .oneOf([...ARENA_RARITIES])
    .required('Selecione a raridade'),
  color: Yup.string().trim(),
  displayValueBrl: Yup.number()
    .min(0, 'Valor vitrine BRL deve ser zero ou maior')
    .required('Informe o valor vitrine em BRL'),
  displayValueUsd: Yup.number()
    .min(0, 'Valor vitrine USD deve ser zero ou maior')
    .required('Informe o valor vitrine em USD'),
  displayValueEur: Yup.number()
    .min(0, 'Valor vitrine EUR deve ser zero ou maior')
    .required('Informe o valor vitrine em EUR'),
  active: Yup.boolean().required(),
  items: Yup.array()
    .of(arenaCrateItemSchema)
    .test(
      'active-items',
      'Crate ativa precisa de pelo menos um item habilitado',
      function (items) {
        const active = (this.parent as { active?: boolean }).active
        if (!active) return true
        return (items ?? []).some((item) => item?.enabled)
      },
    )
    .test('probability-sum', function (items) {
      const message = arenaProbabilitySumError(items as ArenaCrateItem[] | undefined)
      if (!message) return true
      return this.createError({ message })
    }),
})

export type ArenaCrateEditorFormValues = {
  name: string
  description: string
  rarity: ArenaRarity
  color: string
  displayValueBrl: number
  displayValueUsd: number
  displayValueEur: number
  active: boolean
  items: ArenaCrateItem[]
}

const defaultDisplay = arenaRarityDisplayValues('epic')

export const arenaCrateEditorInitialValues: ArenaCrateEditorFormValues = {
  name: '',
  description: '',
  rarity: 'epic',
  color: '#d32ce6',
  displayValueBrl: defaultDisplay.displayValueBrl,
  displayValueUsd: defaultDisplay.displayValueUsd,
  displayValueEur: defaultDisplay.displayValueEur,
  active: false,
  items: [],
}
