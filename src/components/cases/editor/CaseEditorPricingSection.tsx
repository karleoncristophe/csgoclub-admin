import type { FormikProps } from 'formik'
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
        />
        <div>
          <Input
            label="Preço de tabela"
            name="listPrice"
            type="number"
            min={0.01}
            step="0.01"
            value={values.listPrice || ''}
            onChange={(e) => {
              void setFieldValue('listPriceManual', true)
              void setFieldValue('listPrice', Number(e.target.value))
              void setFieldValue('priceManual', false)
            }}
            onBlur={handleBlur}
            error={fieldError(touched.listPrice, errors.listPrice)}
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
        />
        <div>
          <Input
            label="Preço final (vitrine)"
            name="price"
            type="number"
            min={0.01}
            step="0.01"
            value={values.price || ''}
            onChange={(e) => {
              void setFieldValue('priceManual', true)
              void setFieldValue('price', Number(e.target.value))
            }}
            onBlur={handleBlur}
            error={fieldError(touched.price, errors.price)}
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
