import * as Yup from 'yup'
import type {
  ArenaCrateItem,
  ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
import { ARENA_RARITIES } from '@/redux/store/api/arena/api.arena'

const PROBABILITY_TOLERANCE = 0.05

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
  valueBrl: Yup.number()
    .min(0, 'Valor em BRL inválido')
    .required('Informe o valor em BRL'),
  valueUsd: Yup.number()
    .min(0, 'Valor em USD inválido')
    .required('Informe o valor em USD'),
  valueEur: Yup.number()
    .min(0, 'Valor em EUR inválido')
    .required('Informe o valor em EUR'),
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
    .test(
      'probability-sum',
      'As chances dos itens habilitados devem somar 100%',
      function (items) {
        const active = (this.parent as { active?: boolean }).active
        if (!active) return true
        const enabled = ((items ?? []) as ArenaCrateItem[]).filter(
          (item) => item.enabled,
        )
        if (enabled.length === 0) return true
        const sum = enabled.reduce(
          (total, item) => total + (Number(item.probability) || 0),
          0,
        )
        return Math.abs(sum - 100) <= PROBABILITY_TOLERANCE
      },
    ),
})

export type ArenaCrateEditorFormValues = {
  name: string
  description: string
  rarity: ArenaRarity
  valueBrl: number
  valueUsd: number
  valueEur: number
  color: string
  active: boolean
  items: ArenaCrateItem[]
}

export const arenaCrateEditorInitialValues: ArenaCrateEditorFormValues = {
  name: '',
  description: '',
  rarity: 'epic',
  valueBrl: 50,
  valueUsd: 10,
  valueEur: 10,
  color: '#d32ce6',
  active: false,
  items: [],
}
