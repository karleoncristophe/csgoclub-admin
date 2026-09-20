import type { FormikProps } from 'formik'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { EditorSectionShell } from '@/components/cases/editor/EditorSectionShell'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { ThemeText } from '@/components/ui/ThemeText'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import { useGetSkinsbackRatesQuery } from '@/redux/store/api/skins/api.skins'
import { previewSkinsbackFx } from '@/utils/skinsbackFx'
import type { CaseFormState } from './caseEditor.types'
import {
  fieldError,
  formatNumberFieldValue,
  parseNumberFieldValue,
} from './caseEditor.utils'

const FIXED_PRICE_FIELDS = [
  { name: 'fixedPriceBrl', currency: SkinsCurrency.BRL, currencyLabel: 'reais' },
  { name: 'fixedPriceUsd', currency: SkinsCurrency.USD, currencyLabel: 'dólares' },
  { name: 'fixedPriceEur', currency: SkinsCurrency.EUR, currencyLabel: 'euros' },
] as const satisfies ReadonlyArray<{
  name: 'fixedPriceBrl' | 'fixedPriceUsd' | 'fixedPriceEur'
  currency: SkinsCurrency
  currencyLabel: string
}>

type CaseEditorPricingSectionProps = {
  formik: FormikProps<CaseFormState>
  currency: SkinsCurrency
  /** Renderiza sem o card externo e sem título (uso dentro de accordion) */
  embedded?: boolean
}

export function CaseEditorPricingSection({
  formik,
  currency,
  embedded = false,
}: CaseEditorPricingSectionProps) {
  const { values, setFieldValue, handleBlur, touched, errors } = formik
  const { data: fxRates } = useGetSkinsbackRatesQuery()
  const sourceField = FIXED_PRICE_FIELDS.find((field) => field.currency === currency)
  const fxPreview = previewSkinsbackFx(
    sourceField ? (values[sourceField.name] ?? 0) : 0,
    currency,
    fxRates,
  )

  return (
    <EditorSectionShell embedded={embedded}>
      {embedded ? null : (
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Preço da caixa
        </ThemeText>
      )}
      <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
        O preço fica travado. A margem agora sobe ou desce com o catálogo. A margem alvo
        ({values.targetMarginPercent}%) só sugere o preço e define quanto entra no banco.
        Você fixa o preço só na moeda da caixa ({currency}); as outras moedas já
        aparecem convertidas pela cotação da SkinsBack e são gravadas assim ao salvar.
      </ThemeText>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {FIXED_PRICE_FIELDS.map((field) => {
          const isSource = field.currency === currency
          return (
            <CurrencyInput
              key={field.name}
              label={`Preço fixo (${field.currency})`}
              name={field.name}
              currency={field.currency}
              value={isSource ? (values[field.name] ?? 0) : (fxPreview?.[field.currency] ?? 0)}
              onChange={
                isSource
                  ? (value) => void setFieldValue(field.name, value)
                  : () => {}
              }
              disabled={!isSource}
              hint={
                isSource
                  ? `Preço final cobrado em ${field.currencyLabel}. É a base da conversão.`
                  : fxRates
                    ? `Convertido de ${currency} pela cotação SkinsBack (1 USD = ${fxRates.brl} BRL · ${fxRates.eur} EUR). É o que o site mostra.`
                    : `Convertido de ${currency} pela cotação SkinsBack`
              }
              error={
                isSource ? fieldError(touched[field.name], errors[field.name]) : undefined
              }
            />
          )
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input
          label="Margem de referência (%)"
          name="targetMarginPercent"
          type="number"
          min={0}
          max={99.99}
          step="0.01"
          value={formatNumberFieldValue(values.targetMarginPercent)}
          onChange={(e) => {
            void setFieldValue(
              'targetMarginPercent',
              parseNumberFieldValue(e.target.value),
            )
          }}
          onBlur={handleBlur}
          error={fieldError(touched.targetMarginPercent, errors.targetMarginPercent)}
          {...caseFieldProps('targetMarginPercent')}
        />
        <Input
          label="Meta soma chances (%)"
          name="probabilityTargetPercent"
          type="number"
          min={0}
          max={100}
          step="0.0001"
          value={formatNumberFieldValue(values.probabilityTargetPercent)}
          onChange={(e) => {
            void setFieldValue(
              'probabilityTargetPercent',
              parseNumberFieldValue(e.target.value),
            )
          }}
          onBlur={handleBlur}
          error={fieldError(
            touched.probabilityTargetPercent,
            errors.probabilityTargetPercent,
          )}
          {...caseFieldProps('probabilityTargetPercent')}
        />
        <CurrencyInput
          label="Preço de tabela"
          name="listPrice"
          currency={currency}
          value={values.listPrice ?? 0}
          onChange={() => {}}
          disabled
          hint="Derivado do preço fixo antes do desconto"
          {...caseFieldProps('listPrice')}
        />
        <Input
          label="Desconto no preço final (%)"
          name="discountPercent"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={formatNumberFieldValue(values.discountPercent)}
          onChange={(e) => {
            void setFieldValue(
              'discountPercent',
              parseNumberFieldValue(e.target.value),
            )
          }}
          onBlur={handleBlur}
          error={fieldError(touched.discountPercent, errors.discountPercent)}
          {...caseFieldProps('discountPercent')}
        />
        <CurrencyInput
          label="Preço fixo final (vitrine)"
          name="price"
          currency={currency}
          value={values.price ?? 0}
          onChange={() => {}}
          disabled
          hint="Valor fixo da moeda selecionada"
          error={fieldError(touched.price, errors.price)}
          {...caseFieldProps('price')}
        />
      </div>
    </EditorSectionShell>
  )
}
