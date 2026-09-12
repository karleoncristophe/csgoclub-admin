import * as Yup from 'yup'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import {
  computeBankInjection,
  computeProbabilitySum,
  countEligibleDropItems,
  isProbabilitySumValid,
  MIN_CASE_ITEM_PRICE,
  type CaseValueMode,
} from '@/utils/caseEconomics'

export const caseDropItemSchema = Yup.object({
  skinName: Yup.string().required(),
  image: Yup.string().optional(),
  rarity: Yup.object({
    name: Yup.string().optional(),
    color: Yup.string().optional(),
  }).optional(),
  basePrice: Yup.number()
    .min(MIN_CASE_ITEM_PRICE, 'Preço base inválido')
    .required(),
  taxPercent: Yup.number().min(0).required(),
  priceWithTax: Yup.number()
    .min(MIN_CASE_ITEM_PRICE, 'Preço com taxa inválido')
    .required(),
  price: Yup.number().min(MIN_CASE_ITEM_PRICE).required(),
  fixedValueBrl: Yup.number().when('useFixedValue', {
    is: true,
    then: (schema) =>
      schema.min(MIN_CASE_ITEM_PRICE, 'Valor fixo em BRL inválido').required(),
    otherwise: (schema) => schema.optional(),
  }),
  fixedValueUsd: Yup.number().when('useFixedValue', {
    is: true,
    then: (schema) =>
      schema.min(MIN_CASE_ITEM_PRICE, 'Valor fixo em USD inválido').required(),
    otherwise: (schema) => schema.optional(),
  }),
  fixedValueEur: Yup.number().when('useFixedValue', {
    is: true,
    then: (schema) =>
      schema.min(MIN_CASE_ITEM_PRICE, 'Valor fixo em EUR inválido').required(),
    otherwise: (schema) => schema.optional(),
  }),
  useFixedValue: Yup.boolean().optional(),
  probability: Yup.number().min(0).max(100).required(),
  probabilityTolerance: Yup.number().min(0).max(5).required(),
  enabled: Yup.boolean().required(),
})

export const caseEditorSchema = Yup.object({
  name: Yup.string().trim().required('Informe o nome da caixa'),
  description: Yup.string().trim(),
  imageUrl: Yup.string()
    .trim()
    .transform((value) => (value ? value : undefined))
    .url('URL da imagem inválida')
    .optional(),
  currency: Yup.string()
    .oneOf(Object.values(SkinsCurrency))
    .required(),
  valueMode: Yup.string()
    .oneOf(['base', 'with_tax'] as CaseValueMode[])
    .required(),
  active: Yup.boolean().required(),
  targetMarginPercent: Yup.number()
    .min(0, 'Margem mínima é 0%')
    .max(99.99, 'Margem máxima é 99,99%')
    .required('Informe a margem alvo'),
  probabilityTargetPercent: Yup.number()
    .min(0)
    .max(100)
    .required('Informe a meta de probabilidade'),
  discountPercent: Yup.number().min(0).max(100).required('Informe o desconto'),
  fixedPriceBrl: Yup.number().min(0.01, 'Preço fixo em BRL inválido').required(),
  fixedPriceUsd: Yup.number().min(0.01, 'Preço fixo em USD inválido').required(),
  fixedPriceEur: Yup.number().min(0.01, 'Preço fixo em EUR inválido').required(),
  listPrice: Yup.number().when('items', {
    is: (items: unknown[]) => Array.isArray(items) && items.length > 0,
    then: (schema) =>
      schema
        .min(0.01, 'Preço de tabela deve ser maior que zero')
        .required('Informe o preço de tabela'),
    otherwise: (schema) => schema.min(0),
  }),
  price: Yup.number().when('items', {
    is: (items: unknown[]) => Array.isArray(items) && items.length > 0,
    then: (schema) =>
      schema
        .min(0.01, 'Preço final deve ser maior que zero')
        .required('Informe o preço final'),
    otherwise: (schema) => schema.min(0),
  }),
  listPriceManual: Yup.boolean(),
  priceManual: Yup.boolean(),
  sharedCaseIds: Yup.array().of(Yup.string().required()),
  vitrineId: Yup.string().nullable().optional(),
  items: Yup.array()
    .of(caseDropItemSchema)
    .min(1, 'Adicione pelo menos um item à caixa')
    .test('enabled-items', 'Habilite pelo menos um item no pool de drop', function (items) {
      if (!items?.length) return true
      return items.some((item) => item.enabled !== false)
    })
    .test('probability-sum', 'Soma das probabilidades inválida', function (items) {
      if (!items?.length) return true
      const { probabilityTargetPercent } = this.parent as {
        probabilityTargetPercent: number
      }
      const enabledItems = items.filter((item) => item.enabled !== false)
      const sum = computeProbabilitySum(
        items.map((item) => ({
          probability: item.probability,
          enabled: item.enabled,
        })),
      )
      const aggregatedTolerance = enabledItems.reduce(
        (total, item) => total + (item.probabilityTolerance ?? 0.0001),
        0,
      )
      if (
        isProbabilitySumValid(sum, {
          probabilityTargetPercent,
          probabilityTolerance: aggregatedTolerance,
        })
      ) {
        return true
      }
      const delta = probabilityTargetPercent - sum
      return this.createError({
        message: `Soma atual: ${sum.toFixed(4)}% — ${
          delta > 0 ? 'falta' : 'sobra'
        } ${Math.abs(delta).toFixed(4)}% (meta: ${probabilityTargetPercent}%)`,
      })
    })
    .test('item-prices', 'Itens sem preço válido no catálogo', function (items) {
      if (!items?.length) return true
      const invalid = items.find(
        (item) =>
          item.enabled !== false &&
          (item.basePrice < MIN_CASE_ITEM_PRICE ||
            item.priceWithTax < MIN_CASE_ITEM_PRICE),
      )
      if (!invalid) return true
      return this.createError({
        message: `"${invalid.skinName}" está sem preço válido no catálogo`,
      })
    })
    // Com o banco zerado só saem itens que cabem no preço da abertura; sem
    // nenhum deles a caixa não paga nem a primeira abertura.
    .test('droppable-pool', 'Nenhum item elegível para drop', function (items) {
      if (!items?.length) return true
      const parent = this.parent as {
        price: number
        targetMarginPercent: number
        valueMode: CaseValueMode
      }
      const eligible = countEligibleDropItems({
        items: items.map((item) => ({
          basePrice: item.basePrice,
          priceWithTax: item.priceWithTax,
          price: item.price,
          probability: item.probability,
          enabled: item.enabled,
        })),
        openPrice: parent.price,
        bankBalance: computeBankInjection(
          parent.price,
          parent.targetMarginPercent,
        ),
        valueMode: parent.valueMode,
      })
      if (eligible > 0) return true
      return this.createError({
        message:
          'Nenhum item habilitado cabe no preço da abertura. Inclua um item mais barato ou aumente o preço.',
      })
    }),
})

export type CaseEditorFormValues = Yup.InferType<typeof caseEditorSchema>

export const caseEditorInitialValues: CaseEditorFormValues = {
  name: '',
  description: '',
  imageUrl: '',
  currency: SkinsCurrency.BRL,
  valueMode: 'with_tax',
  active: false,
  targetMarginPercent: 30,
  probabilityTargetPercent: 100,
  discountPercent: 0,
  fixedPriceBrl: 0,
  fixedPriceUsd: 0,
  fixedPriceEur: 0,
  listPrice: 0,
  price: 0,
  listPriceManual: false,
  priceManual: false,
  sharedCaseIds: [],
  vitrineId: '',
  items: [],
}
