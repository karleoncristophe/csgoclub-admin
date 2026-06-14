import type { CaseImageValue } from '@/components/cases/CaseImageUploader'
import type { CaseDropItem, LootCase } from '@/redux/store/api/cases/api.cases'
import type { CaseEditorFormValues } from '@/validators/caseEditorSchema'

export type CaseFormState = Omit<CaseEditorFormValues, 'items'> & {
  caseImage: CaseImageValue
  items: CaseDropItem[]
}

export type CaseEditorSectionProps = {
  disabled?: boolean
}
