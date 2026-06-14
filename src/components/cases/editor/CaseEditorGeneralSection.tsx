import type { FormikProps } from 'formik'
import {
  CaseImageUploader,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  SKINS_CURRENCY_OPTIONS,
  SkinsCurrency,
} from '@/constants/skinsCurrency'
import type { CaseValueMode } from '@/utils/caseEconomics'
import { slugifyCaseName } from '@/utils/caseEconomics'
import type { CaseFormState } from './caseEditor.types'
import { fieldError } from './caseEditor.utils'

type CaseEditorGeneralSectionProps = {
  formik: FormikProps<CaseFormState>
  disabled?: boolean
  onCurrencyChange: (currency: SkinsCurrency) => void
  onValueModeChange: (mode: CaseValueMode) => void
}

export function CaseEditorGeneralSection({
  formik,
  disabled = false,
  onCurrencyChange,
  onValueModeChange,
}: CaseEditorGeneralSectionProps) {
  const { values, setFieldValue, handleChange, handleBlur, touched, errors } = formik

  const handleNameChange = (nextName: string) => {
    void setFieldValue('name', nextName)
    if (!values.slugManual) {
      void setFieldValue('slug', slugifyCaseName(nextName), false)
    }
  }

  return (
    <Surface variant="card" className="!p-6">
      <ThemeText as="h2" tone="primary" className="mb-4 text-base font-semibold">
        Informações gerais
      </ThemeText>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input
          label="Nome da caixa"
          name="name"
          value={values.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Ex.: Neon Queen"
          error={fieldError(touched.name, errors.name)}
        />
        <Input
          label="Slug"
          name="slug"
          value={values.slug}
          onChange={(e) => {
            void setFieldValue('slugManual', true)
            void setFieldValue('slug', e.target.value)
          }}
          onBlur={handleBlur}
          placeholder="neon-queen"
          error={fieldError(touched.slug, errors.slug)}
        />
        <Select
          label="Moeda"
          name="currency"
          value={values.currency}
          onChange={(e) => onCurrencyChange(e.target.value as SkinsCurrency)}
          onBlur={handleBlur}
        >
          {SKINS_CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          label="Valor no cálculo do VE"
          name="valueMode"
          value={values.valueMode}
          onChange={(e) => onValueModeChange(e.target.value as CaseValueMode)}
          onBlur={handleBlur}
        >
          <option value="with_tax">Preço com taxa de categoria</option>
          <option value="base">Preço base SkinsBack</option>
        </Select>
        <Input
          label="Descrição"
          name="description"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Opcional"
        />
        <div className="md:col-span-2 xl:col-span-3">
          <CaseImageUploader
            value={values.caseImage}
            onChange={(next: CaseImageValue) => {
              void setFieldValue('caseImage', next)
              if (typeof next === 'string') {
                void setFieldValue('imageUrl', next)
              } else if (!next) {
                void setFieldValue('imageUrl', '')
              }
            }}
            disabled={disabled}
          />
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800 md:col-span-2 xl:col-span-1">
          <input
            type="checkbox"
            name="active"
            checked={values.active}
            onChange={handleChange}
            onBlur={handleBlur}
            className="h-4 w-4 rounded border-zinc-300 text-brand-600"
          />
          <span>
            <ThemeText as="span" tone="primary" className="text-sm font-medium">
              Caixa ativa
            </ThemeText>
            <ThemeText as="span" tone="faint" className="mt-0.5 block text-xs">
              Exibida no site com o preço final
            </ThemeText>
          </span>
        </label>
      </div>
    </Surface>
  )
}
