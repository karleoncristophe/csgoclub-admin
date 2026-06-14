import type { FormikProps } from 'formik'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseFormState } from './caseEditor.types'
import { fieldError } from './caseEditor.utils'

type CaseEditorPricingSectionProps = {
  formik: FormikProps<CaseFormState>
  currency: SkinsCurrency
  totalEV: number
  suggestedPrice: number
  priceFromDiscount: number
  onApplySuggestedPrice: () => void
  onApplyDiscountPrice: () => void
}

export function CaseEditorPricingSection({
  formik,
  currency,
  totalEV,
  suggestedPrice,
  priceFromDiscount,
  onApplySuggestedPrice,
  onApplyDiscountPrice,
}: CaseEditorPricingSectionProps) {
  const { values, setFieldValue, handleChange, handleBlur, touched, errors } = formik

  return (
    <Surface variant="card" className="!p-6">
      <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
        Preço da caixa
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
        Com base no VE total dos itens ({formatSkinsPrice(totalEV, currency)}), defina margem,
        desconto e preço de abertura da caixa.
      </ThemeText>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input
          label="Margem alvo (%)"
          name="targetMarginPercent"
          type="number"
          min={0}
          max={99.99}
          step="0.01"
          value={values.targetMarginPercent}
          onChange={(e) => {
            void setFieldValue('targetMarginPercent', Number(e.target.value))
            void setFieldValue('listPriceManual', false)
            void setFieldValue('priceManual', false)
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
          value={values.probabilityTargetPercent}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            touched.probabilityTargetPercent,
            errors.probabilityTargetPercent,
          )}
          {...caseFieldProps('probabilityTargetPercent')}
        />
        <div>
          <CurrencyInput
            label="Preço de tabela"
            name="listPrice"
            currency={currency}
            value={values.listPrice}
            onChange={(amount) => {
              void setFieldValue('listPriceManual', true)
              void setFieldValue('listPrice', amount)
              void setFieldValue('priceManual', false)
            }}
            onBlur={handleBlur}
            error={fieldError(touched.listPrice, errors.listPrice)}
            {...caseFieldProps('listPrice')}
          />
          <button
            type="button"
            onClick={onApplySuggestedPrice}
            className="mt-2 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            Usar sugerido ({formatSkinsPrice(suggestedPrice, currency)})
          </button>
        </div>
        <Input
          label="Desconto no preço final (%)"
          name="discountPercent"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={values.discountPercent}
          onChange={(e) => {
            void setFieldValue('discountPercent', Number(e.target.value))
            void setFieldValue('priceManual', false)
          }}
          onBlur={handleBlur}
          error={fieldError(touched.discountPercent, errors.discountPercent)}
          {...caseFieldProps('discountPercent')}
        />
        <div>
          <CurrencyInput
            label="Preço final (vitrine)"
            name="price"
            currency={currency}
            value={values.price}
            onChange={(amount) => {
              void setFieldValue('priceManual', true)
              void setFieldValue('price', amount)
            }}
            onBlur={handleBlur}
            error={fieldError(touched.price, errors.price)}
            {...caseFieldProps('price')}
          />
          <button
            type="button"
            onClick={onApplyDiscountPrice}
            className="mt-2 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            Aplicar desconto ({formatSkinsPrice(priceFromDiscount, currency)})
          </button>
        </div>
      </div>
    </Surface>
  )
}
