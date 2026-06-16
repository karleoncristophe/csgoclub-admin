import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CaseEconomicsPanel } from '@/components/cases/CaseEconomicsPanel'
import { CaseEditorDevPresetBar } from '@/components/cases/editor/CaseEditorDevPresetBar'
import { CaseEditorGeneralSection } from '@/components/cases/editor/CaseEditorGeneralSection'
import { CaseEditorItemsTable } from '@/components/cases/editor/CaseEditorItemsTable'
import { CaseEditorPricingSection } from '@/components/cases/editor/CaseEditorPricingSection'
import { CaseEditorSkinSearchSection } from '@/components/cases/editor/CaseEditorSkinSearchSection'
import { fetchCsgoNetDevPresetItems } from '@/components/cases/editor/caseDevPreset'
import type { CaseFormState } from '@/components/cases/editor/caseEditor.types'
import {
  collectFormErrors,
  mapCaseToFormValues,
  toCaseDropItemsPayload,
  touchAllCaseFormFields,
} from '@/components/cases/editor/caseEditor.utils'
import { isPendingCaseImage } from '@/components/cases/CaseImageUploader'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useCreateCaseMutation,
  useGetCaseByIdQuery,
  useUpdateCaseMutation,
  type CaseDropItem,
} from '@/redux/store/api/cases/api.cases'
import {
  useLazyGetSkinsCatalogItemQuery,
  type SkinsCatalogItem,
} from '@/redux/store/api/skins/api.skins'
import { uploadSingleFile } from '@/lib/upload'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  catalogSkinToCaseItem,
  computePriceAfterDiscount,
  computeSuggestedSalePrice,
  computeTotalExpectedValue,
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  remapCaseItemsForValueMode,
  roundPrice,
  type CaseEconomicsConfig,
  type CaseValueMode,
} from '@/utils/caseEconomics'
import { caseEditorInitialValues, caseEditorSchema } from '@/validators/caseEditorSchema'
import { useAdminPreferences } from '@/theme/AdminPreferencesContext'

export default function CaseEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existingCase, isLoading: isLoadingCase } = useGetCaseByIdQuery(
    id ?? '',
    { skip: !id },
  )

  const [createCase, createState] = useCreateCaseMutation()
  const [updateCase, updateState] = useUpdateCaseMutation()
  const [fetchCatalogItem] = useLazyGetSkinsCatalogItemQuery()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [devPresetLoading, setDevPresetLoading] = useState(false)
  const [devPresetError, setDevPresetError] = useState<string | null>(null)
  const [validationAttempt, setValidationAttempt] = useState(0)
  const errorBannerRef = useRef<HTMLDivElement>(null)
  const { skinsCurrency: defaultSkinsCurrency } = useAdminPreferences()

  const initialValues = useMemo<CaseFormState>(
    () =>
      existingCase
        ? mapCaseToFormValues(existingCase)
        : {
            ...caseEditorInitialValues,
            caseImage: null,
            items: [],
            currency: defaultSkinsCurrency,
          },
    [existingCase, defaultSkinsCurrency],
  )

  const formik = useFormik<CaseFormState>({
    initialValues,
    enableReinitialize: true,
    validationSchema: caseEditorSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      setUploadError(null)
      let imageUrl = values.imageUrl?.trim() || undefined

      try {
        if (isPendingCaseImage(values.caseImage)) {
          try {
            const uploaded = await uploadSingleFile(values.caseImage.file, 'cases')
            imageUrl = uploaded.url
          } catch (err) {
            setUploadError(getErrorMessage(err))
            return
          }
        } else if (typeof values.caseImage === 'string') {
          imageUrl = values.caseImage
        } else if (!values.caseImage) {
          imageUrl = undefined
        }

        const payload = {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          imageUrl,
          currency: values.currency as SkinsCurrency,
          valueMode: values.valueMode as CaseValueMode,
          targetMarginPercent: values.targetMarginPercent,
          probabilityTargetPercent: values.probabilityTargetPercent,
          probabilityTolerance: DEFAULT_ITEM_PROBABILITY_TOLERANCE,
          discountPercent: values.discountPercent,
          items: toCaseDropItemsPayload(values.items),
          active: values.active,
        }

        if (isEdit && id) {
          await updateCase({ id, body: payload }).unwrap()
        } else {
          await createCase(payload).unwrap()
        }
        navigate('/dashboard/cases')
      } catch {
        // mutation error shown via saveError
      } finally {
        setSubmitting(false)
      }
    },
  })

  const { values, setFieldValue, setValues } = formik

  const economicsConfig: CaseEconomicsConfig = useMemo(
    () => ({
      targetMarginPercent: values.targetMarginPercent,
      probabilityTargetPercent: values.probabilityTargetPercent,
      discountPercent: values.discountPercent,
    }),
    [
      values.targetMarginPercent,
      values.probabilityTargetPercent,
      values.discountPercent,
    ],
  )

  const economicsItems = useMemo(
    () =>
      values.items.map((item) => ({
        basePrice: item.basePrice,
        priceWithTax: item.priceWithTax,
        price: item.price,
        probability: item.probability,
        minMarginPercent: item.minMarginPercent,
        probabilityTolerance: item.probabilityTolerance,
        enabled: item.enabled,
        skinName: item.skinName,
      })),
    [values.items],
  )

  const economyLedger = useMemo(
    () =>
      existingCase?.economyLedger ?? {
        totalRevenue: 0,
        totalPayout: 0,
        totalRealOpens: 0,
      },
    [existingCase?.economyLedger],
  )

  const totalEV = useMemo(
    () =>
      roundPrice(
        computeTotalExpectedValue(economicsItems, values.valueMode as CaseValueMode),
      ),
    [economicsItems, values.valueMode],
  )

  const suggestedPrice = useMemo(
    () => roundPrice(computeSuggestedSalePrice(totalEV, values.targetMarginPercent)),
    [totalEV, values.targetMarginPercent],
  )

  const priceFromDiscount = useMemo(
    () => roundPrice(computePriceAfterDiscount(values.listPrice, values.discountPercent)),
    [values.listPrice, values.discountPercent],
  )

  useEffect(() => {
    if (suggestedPrice <= 0) return
    if (values.listPrice !== suggestedPrice) {
      void setFieldValue('listPrice', suggestedPrice, false)
    }
  }, [suggestedPrice, values.listPrice, setFieldValue])

  useEffect(() => {
    if (priceFromDiscount <= 0) return
    if (values.price !== priceFromDiscount) {
      void setFieldValue('price', priceFromDiscount, false)
    }
  }, [priceFromDiscount, values.price, setFieldValue])

  const addedSkinNames = useMemo(
    () => new Set(values.items.map((item) => item.skinName)),
    [values.items],
  )

  const formErrors = collectFormErrors(formik.errors as Record<string, unknown>)
  const saving = createState.isLoading || updateState.isLoading
  const saveError = createState.error ?? updateState.error
  const itemsError =
    typeof formik.errors.items === 'string' ? formik.errors.items : undefined

  const handleValueModeChange = (nextMode: CaseValueMode) => {
    void setFieldValue('valueMode', nextMode)
    void setFieldValue('items', remapCaseItemsForValueMode(values.items, nextMode), false)
  }

  const handleCurrencyChange = async (nextCurrency: SkinsCurrency) => {
    await setFieldValue('currency', nextCurrency)
    if (values.items.length === 0) return

    const refreshed = await Promise.all(
      values.items.map(async (item): Promise<CaseDropItem> => {
        try {
          const skin = await fetchCatalogItem({
            name: item.skinName,
            currency: nextCurrency,
          }).unwrap()
          return {
            ...catalogSkinToCaseItem(
              skin,
              values.valueMode as CaseValueMode,
              item.probability,
              item.minMarginPercent,
            ),
            minMarginPercent: item.minMarginPercent,
            probabilityTolerance: item.probabilityTolerance,
            enabled: item.enabled,
          }
        } catch {
          return item
        }
      }),
    )
    await setFieldValue('items', refreshed, false)
  }

  const handleAddSkin = (skin: SkinsCatalogItem) => {
    if (addedSkinNames.has(skin.name)) return
    void setFieldValue('items', [
      ...values.items,
      catalogSkinToCaseItem(
        skin,
        values.valueMode as CaseValueMode,
        0,
        values.targetMarginPercent,
      ),
    ])
  }

  const handleItemsChange = (items: CaseDropItem[]) => {
    void setFieldValue('items', items, false)
    void setFieldValue('listPriceManual', false, false)
    void setFieldValue('priceManual', false, false)
  }

  const handleDevPresetApply = async () => {
    setDevPresetLoading(true)
    setDevPresetError(null)
    try {
      const items = await fetchCsgoNetDevPresetItems({
        fetchCatalogItem,
        valueMode: values.valueMode as CaseValueMode,
        targetMarginPercent: values.targetMarginPercent,
      })

      await setValues({
        ...values,
        currency: SkinsCurrency.USD,
        name: 'Case Preset Dev',
        probabilityTargetPercent: 100,
        items,
        listPriceManual: false,
        priceManual: false,
      })
    } catch (err) {
      setDevPresetError(getErrorMessage(err))
    } finally {
      setDevPresetLoading(false)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationAttempt((count) => count + 1)
    const errors = await formik.validateForm()

    if (Object.keys(errors).length > 0) {
      void formik.setTouched(touchAllCaseFormFields(formik.values))
      void formik.setErrors(errors)
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    void formik.submitForm()
  }

  if (isEdit && isLoadingCase) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard/cases"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <PageTitle subtitle="Monte a caixa com skins reais do catálogo SkinsBack (preço base + taxa por categoria).">
        {isEdit ? 'Editar caixa' : 'Nova caixa'}
      </PageTitle>

      <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
        <CaseEditorGeneralSection
          formik={formik}
          disabled={formik.isSubmitting || saving}
          onCurrencyChange={handleCurrencyChange}
          onValueModeChange={handleValueModeChange}
        />

        <CaseEditorDevPresetBar
          loading={devPresetLoading}
          error={devPresetError}
          onApply={() => void handleDevPresetApply()}
        />

        <CaseEditorSkinSearchSection
          currency={values.currency as SkinsCurrency}
          addedSkinNames={addedSkinNames}
          onAddSkin={handleAddSkin}
        />

        <CaseEditorItemsTable
          items={values.items}
          currency={values.currency as SkinsCurrency}
          valueMode={values.valueMode as CaseValueMode}
          openPrice={values.price}
          targetMarginPercent={values.targetMarginPercent}
          ledger={economyLedger}
          itemsError={itemsError}
          onItemsChange={handleItemsChange}
        />

        <CaseEditorPricingSection
          formik={formik}
          currency={values.currency as SkinsCurrency}
          totalEV={totalEV}
        />

        <CaseEconomicsPanel
          items={economicsItems}
          currency={values.currency as SkinsCurrency}
          valueMode={values.valueMode as CaseValueMode}
          config={economicsConfig}
          listPrice={values.listPrice}
          finalPrice={values.price}
          ledger={economyLedger}
        />

        <div ref={errorBannerRef}>
          {validationAttempt > 0 && formErrors.length > 0 ? (
            <Surface variant="errorBanner" className="!p-4">
              <ThemeText as="p" tone="primary" className="mb-2 text-sm font-medium">
                Corrija antes de salvar:
              </ThemeText>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {formErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Surface>
          ) : validationAttempt > 0 &&
            Object.keys(formik.errors).length > 0 &&
            formErrors.length === 0 ? (
            <Surface variant="errorBanner" className="!p-4">
              <ThemeText as="p" tone="primary" className="text-sm">
                Existem campos inválidos no formulário. Revise nome, itens e preços.
              </ThemeText>
            </Surface>
          ) : null}
        </div>

        {uploadError ? (
          <Surface variant="errorBanner">{uploadError}</Surface>
        ) : null}

        {saveError ? (
          <Surface variant="errorBanner">{getErrorMessage(saveError)}</Surface>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/cases')}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={formik.isSubmitting || saving}
            disabled={formik.isSubmitting || saving}
          >
            {isEdit ? 'Salvar alterações' : 'Criar caixa'}
          </Button>
        </div>
      </form>
    </div>
  )
}
