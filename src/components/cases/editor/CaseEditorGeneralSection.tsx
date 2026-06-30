import type { FormikProps } from 'formik'
import {
  CaseImageUploader,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  SKINS_CURRENCY_OPTIONS,
  SkinsCurrency,
} from '@/constants/skinsCurrency'
import { useGetCaseVitrinesQuery } from '@/redux/store/api/case-vitrines/api.case-vitrines'
import type { CaseValueMode } from '@/utils/caseEconomics'
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
  const { data: vitrines = [] } = useGetCaseVitrinesQuery()
  const activeHelp = caseFieldProps('active')
  const imageHelp = caseFieldProps('caseImage')

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
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Ex.: Neon Queen"
          error={fieldError(touched.name, errors.name)}
          {...caseFieldProps('name')}
        />
        <Select
          label="Moeda"
          name="currency"
          value={values.currency}
          onChange={(e) => onCurrencyChange(e.target.value as SkinsCurrency)}
          onBlur={handleBlur}
          {...caseFieldProps('currency')}
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
          {...caseFieldProps('valueMode')}
        >
          <option value="with_tax">Preço com taxa de categoria</option>
          <option value="base">Preço base SkinsBack</option>
        </Select>
        <Select
          label="Vitrine no site"
          name="vitrineId"
          value={values.vitrineId ?? ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
        >
          <option value="">Sem vitrine</option>
          {vitrines.map((vitrine) => (
            <option key={vitrine._id} value={vitrine._id}>
              {vitrine.name}
            </option>
          ))}
        </Select>
        <Input
          label="Descrição"
          name="description"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Opcional"
          {...caseFieldProps('description')}
        />
        <div className="md:col-span-2 xl:col-span-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ThemeText as="span" tone="primary" className="text-sm font-medium">
              Imagem da caixa
            </ThemeText>
            <FieldHelpButton fieldHelp={imageHelp.fieldHelp} />
          </div>
          {imageHelp.description ? (
            <ThemeText as="p" tone="faint" className="mb-2 text-xs">
              {imageHelp.description}
            </ThemeText>
          ) : null}
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
            <span className="flex items-center gap-1.5">
              <ThemeText as="span" tone="primary" className="text-sm font-medium">
                Caixa ativa
              </ThemeText>
              <FieldHelpButton fieldHelp={activeHelp.fieldHelp} />
            </span>
            <ThemeText as="span" tone="faint" className="mt-0.5 block text-xs">
              Exibida no site com o preço final
            </ThemeText>
          </span>
        </label>
      </div>
    </Surface>
  )
}
