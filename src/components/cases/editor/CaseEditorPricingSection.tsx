import type { FormikProps } from 'formik'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { EditorSectionShell } from '@/components/cases/editor/EditorSectionShell'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseFormState } from './caseEditor.types'
import {
  fieldError,
  formatNumberFieldValue,
  parseNumberFieldValue,
} from './caseEditor.utils'

type CaseEditorPricingSectionProps = {
  formik: FormikProps<CaseFormState>
  currency: SkinsCurrency
  totalEV: number
  /** Renderiza sem o card externo e sem título (uso dentro de accordion) */
  embedded?: boolean
}

export function CaseEditorPricingSection({
  formik,
  currency,
  totalEV,
  embedded = false,
}: CaseEditorPricingSectionProps) {
  const { values, setFieldValue, handleBlur, touched, errors } = formik

  return (
    <EditorSectionShell embedded={embedded}>
      {embedded ? null : (
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Preço da caixa
        </ThemeText>
      )}
      <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
        O preço permanece fixo. O VE atual ({formatSkinsPrice(totalEV, currency)})
        acompanha as skins e recalcula a margem automaticamente pela fórmula
        ((preço − VE) ÷ VE) × 100.
      </ThemeText>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <CurrencyInput
          label="Preço fixo (BRL)"
          name="fixedPriceBrl"
          currency={SkinsCurrency.BRL}
          value={values.fixedPriceBrl ?? 0}
          onChange={(value) => void setFieldValue('fixedPriceBrl', value)}
          hint="Preço final cobrado em reais"
        />
        <CurrencyInput
          label="Preço fixo (USD)"
          name="fixedPriceUsd"
          currency={SkinsCurrency.USD}
          value={values.fixedPriceUsd ?? 0}
          onChange={(value) => void setFieldValue('fixedPriceUsd', value)}
          hint="Preço final cobrado em dólares"
        />
        <CurrencyInput
          label="Preço fixo (EUR)"
          name="fixedPriceEur"
          currency={SkinsCurrency.EUR}
          value={values.fixedPriceEur ?? 0}
          onChange={(value) => void setFieldValue('fixedPriceEur', value)}
          hint="Preço final cobrado em euros"
        />
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
