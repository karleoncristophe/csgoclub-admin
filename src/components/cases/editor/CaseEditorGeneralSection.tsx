import type { FormikProps } from 'formik'
import {
  CaseImageUploader,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { Switch } from '@/components/ui/Switch'
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
  const {
    values,
    setFieldValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    touched,
    errors,
  } = formik
  const { data: vitrines = [] } = useGetCaseVitrinesQuery()
  const activeHelp = caseFieldProps('active')
  const imageHelp = caseFieldProps('caseImage')

  const hasImage = Boolean(values.caseImage)
  const vitrineName = vitrines.find((item) => item._id === values.vitrineId)?.name

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
        <Switch
          label="Caixa ativa"
          name="active"
          checked={values.active}
          onChange={(checked) => {
            void setFieldValue('active', checked)
          }}
          onBlur={() => {
            void setFieldTouched('active', true)
          }}
          description="Exibida no site com o preço final"
          fieldHelp={activeHelp.fieldHelp}
        />
      </div>

      <div className="mt-4">
        <CollapsibleSection
          variant="inset"
          title="Descrição, vitrine e imagem"
          description="Opcionais de apresentação e base de cálculo do VE."
          summary={
            <ThemeText as="span" tone="faint" className="text-xs">
              {[
                vitrineName ?? 'Sem vitrine',
                hasImage ? 'Com imagem' : 'Sem imagem',
              ].join(' · ')}
            </ThemeText>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="md:col-span-2">
              <Input
                label="Descrição"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Opcional"
                {...caseFieldProps('description')}
              />
            </div>
            <div className="md:col-span-2">
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
          </div>
        </CollapsibleSection>
      </div>
    </Surface>
  )
}
