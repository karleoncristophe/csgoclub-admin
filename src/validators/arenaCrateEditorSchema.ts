import * as Yup from 'yup'
import type {
  ArenaCrateItem,
  ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
import { ARENA_RARITIES } from '@/redux/store/api/arena/api.arena'

export const ARENA_CRATE_PROBABILITY_TARGET = 100
export const ARENA_CRATE_PROBABILITY_TOLERANCE = 0.05

export function enabledArenaProbabilitySum(items: ArenaCrateItem[] | undefined) {
  return (items ?? [])
    .filter((item) => item.enabled !== false)
    .reduce((total, item) => total + (Number(item.probability) || 0), 0)
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
  active: boolean
  items: ArenaCrateItem[]
}

export const arenaCrateEditorInitialValues: ArenaCrateEditorFormValues = {
  name: '',
  description: '',
  rarity: 'epic',
  color: '#d32ce6',
  active: false,
  items: [],
}
