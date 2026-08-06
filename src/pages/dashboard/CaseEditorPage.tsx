import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import { CaseEconomicsPanel } from '@/components/cases/CaseEconomicsPanel'
import { CaseAiAssistantDrawer } from '@/components/cases/ai/CaseAiAssistantDrawer'
import { applyAiDraftToCaseForm } from '@/components/cases/ai/caseAiAssistant.utils'
import { CaseEditorPresetsModal } from '@/components/cases/editor/CaseEditorPresetsModal'
import { CaseEditorEconomyPoolSection } from '@/components/cases/editor/CaseEditorEconomyPoolSection'
import { CaseEditorGeneralSection } from '@/components/cases/editor/CaseEditorGeneralSection'
import { CaseEditorItemsTable } from '@/components/cases/editor/CaseEditorItemsTable'
import { CaseEditorPricingSection } from '@/components/cases/editor/CaseEditorPricingSection'
import { CaseEditorSkinSearchSection } from '@/components/cases/editor/CaseEditorSkinSearchSection'
import { fetchCsgoNetDevPresetItems } from '@/components/cases/editor/caseDevPreset'
import { fetchInfluencerDemoPresetItems } from '@/components/cases/editor/caseInfluencerDemoPreset'
import { fetchJapaSkinsPresetItems } from '@/components/cases/editor/caseJapaSkinsPreset'
import type { CaseFormState } from '@/components/cases/editor/caseEditor.types'
import {
  collectFormErrors,
  mapCaseToFormValues,
  toCaseDropItemsPayload,
  touchAllCaseFormFields,
} from '@/components/cases/editor/caseEditor.utils'
import { isPendingCaseImage } from '@/components/cases/CaseImageUploader'
import { Button } from '@/components/ui/Button'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { Modal } from '@/components/ui/Modal'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useCreateCaseMutation,
  useGetCaseByIdQuery,
  useGetCasesQuery,
  useUpdateCaseMutation,
  type CaseDropItem,
} from '@/redux/store/api/cases/api.cases'
import {
  useLazyGetSkinsCatalogItemQuery,
  type SkinsCatalogItem,
} from '@/redux/store/api/skins/api.skins'
import type {
  AiCaseAssistantContext,
  AiCaseDraft,
} from '@/redux/store/api/ai/api.ai'
import { uploadSingleFile } from '@/lib/upload'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  catalogSkinToCaseItem,
  computePriceAfterDiscount,
  computeProbabilitySum,
  computeSuggestedSalePrice,
  computeTotalExpectedValue,
  DEFAULT_ITEM_PROBABILITY_TOLERANCE,
  EMPTY_CASE_ECONOMY_LEDGER,
  remapCaseItemsForValueMode,
  resolveFairCaseListPrice,
  roundEconomics,
  roundPrice,
  type CaseEconomicsConfig,
  type CaseValueMode,
} from '@/utils/caseEconomics'
import { caseEditorInitialValues, caseEditorSchema } from '@/validators/caseEditorSchema'
import { useAdminPreferences } from '@/theme/AdminPreferencesContext'

const PRICING_FIELDS = [
  'targetMarginPercent',
  'probabilityTargetPercent',
  'discountPercent',
  'listPrice',
  'price',
] as const

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
      <ThemeText as="span" tone="faint" className="block text-[10px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="span" tone="primary" className="block text-sm font-semibold">
        {value}
      </ThemeText>
    </div>
  )
}

export default function CaseEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existingCase, isLoading: isLoadingCase } = useGetCaseByIdQuery(
    id ?? '',
    { skip: !id },
  )
  const { data: allCases = [] } = useGetCasesQuery()

  const [createCase, createState] = useCreateCaseMutation()
  const [updateCase, updateState] = useUpdateCaseMutation()
  const [fetchCatalogItem] = useLazyGetSkinsCatalogItemQuery()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [skinsModalOpen, setSkinsModalOpen] = useState(false)
  const [presetsModalOpen, setPresetsModalOpen] = useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [devPresetLoading, setDevPresetLoading] = useState(false)
  const [devPresetError, setDevPresetError] = useState<string | null>(null)
  const [influencerPresetLoading, setInfluencerPresetLoading] = useState(false)
  const [influencerPresetError, setInfluencerPresetError] = useState<string | null>(null)
  const [japaPresetLoading, setJapaPresetLoading] = useState(false)
  const [japaPresetError, setJapaPresetError] = useState<string | null>(null)
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
            sharedCaseIds: [],
            vitrineId: '',
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
          sharedCaseIds: values.sharedCaseIds,
          vitrineId: values.vitrineId?.trim() ? values.vitrineId : null,
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
        probabilityTolerance: item.probabilityTolerance,
        enabled: item.enabled,
        skinName: item.skinName,
      })),
    [values.items],
  )

  const economyLedger = useMemo(
    () => existingCase?.economyLedger ?? EMPTY_CASE_ECONOMY_LEDGER,
    [existingCase?.economyLedger],
  )

  const totalEV = useMemo(
    () =>
      roundPrice(
        computeTotalExpectedValue(economicsItems, values.valueMode as CaseValueMode),
      ),
    [economicsItems, values.valueMode],
  )

  const probabilitySum = useMemo(
    () => roundEconomics(computeProbabilitySum(economicsItems), 4),
    [economicsItems],
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
    if (values.listPriceManual) return
    if (suggestedPrice <= 0) return
    if (values.listPrice !== suggestedPrice) {
      void setFieldValue('listPrice', suggestedPrice, false)
    }
  }, [suggestedPrice, values.listPrice, values.listPriceManual, setFieldValue])

  useEffect(() => {
    if (values.priceManual) return
    if (priceFromDiscount <= 0) return
    if (values.price !== priceFromDiscount) {
      void setFieldValue('price', priceFromDiscount, false)
    }
  }, [priceFromDiscount, values.price, values.priceManual, setFieldValue])

  const addedSkinNames = useMemo(
    () => new Set(values.items.map((item) => item.skinName)),
    [values.items],
  )

  const aiContext = useMemo<AiCaseAssistantContext>(
    () => ({
      name: values.name?.trim() || undefined,
      currency: values.currency as SkinsCurrency,
      valueMode: values.valueMode as CaseValueMode,
      targetMarginPercent: values.targetMarginPercent,
      probabilityTargetPercent: values.probabilityTargetPercent,
      discountPercent: values.discountPercent,
      itemNames: values.items.map((item) => item.skinName),
    }),
    [
      values.name,
      values.currency,
      values.valueMode,
      values.targetMarginPercent,
      values.probabilityTargetPercent,
      values.discountPercent,
      values.items,
    ],
  )

  const formErrors = collectFormErrors(formik.errors as Record<string, unknown>)
  const saving = createState.isLoading || updateState.isLoading
  const saveError = createState.error ?? updateState.error
  const itemsError =
    typeof formik.errors.items === 'string' ? formik.errors.items : undefined
  const hasPricingError =
    validationAttempt > 0 &&
    PRICING_FIELDS.some((field) => Boolean(formik.errors[field]))

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
            ),
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
      catalogSkinToCaseItem(skin, values.valueMode as CaseValueMode, 0),
    ])
  }

  const handleApplyAiDraft = (draft: AiCaseDraft) => {
    void setValues(applyAiDraftToCaseForm(values, draft))
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
      const valueMode = values.valueMode as CaseValueMode
      const items = await fetchCsgoNetDevPresetItems({ fetchCatalogItem })
      const listPrice = resolveFairCaseListPrice({
        items,
        valueMode,
        targetMarginPercent: values.targetMarginPercent,
      })
      const price = roundPrice(
        computePriceAfterDiscount(listPrice, values.discountPercent),
      )

      await setValues({
        ...values,
        currency: SkinsCurrency.USD,
        name: 'Case Preset Dev',
        probabilityTargetPercent: 100,
        items,
        listPrice,
        price,
        listPriceManual: true,
        priceManual: true,
      })
    } catch (err) {
      setDevPresetError(getErrorMessage(err))
    } finally {
      setDevPresetLoading(false)
    }
  }

  const handleInfluencerDemoPresetApply = async () => {
    setInfluencerPresetLoading(true)
    setInfluencerPresetError(null)
    try {
      const items = await fetchInfluencerDemoPresetItems({ fetchCatalogItem })

      await setValues({
        ...values,
        currency: SkinsCurrency.USD,
        name: 'Caixa Demo Influencer',
        probabilityTargetPercent: 100,
        items,
        listPriceManual: false,
        priceManual: false,
      })
    } catch (err) {
      setInfluencerPresetError(getErrorMessage(err))
    } finally {
      setInfluencerPresetLoading(false)
    }
  }

  const handleJapaSkinsPresetApply = async () => {
    setJapaPresetLoading(true)
    setJapaPresetError(null)
    try {
      const valueMode = values.valueMode as CaseValueMode
      const items = await fetchJapaSkinsPresetItems({ fetchCatalogItem })
      const listPrice = resolveFairCaseListPrice({
        items,
        valueMode,
        targetMarginPercent: values.targetMarginPercent,
      })
      const price = roundPrice(
        computePriceAfterDiscount(listPrice, values.discountPercent),
      )

      await setValues({
        ...values,
        currency: SkinsCurrency.USD,
        name: 'japa skins',
        probabilityTargetPercent: 100,
        items,
        listPrice,
        price,
        listPriceManual: true,
        priceManual: true,
      })
    } catch (err) {
      setJapaPresetError(getErrorMessage(err))
    } finally {
      setJapaPresetLoading(false)
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

  const currency = values.currency as SkinsCurrency

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
      <div className="sticky top-0 z-30 -mx-4 -mt-6 bg-slate-50/85 px-4 py-4 backdrop-blur dark:bg-zinc-950/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/dashboard/cases"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para caixas
            </Link>
            <ThemeText
              as="h1"
              tone="primary"
              className="truncate text-xl font-semibold tracking-tight"
            >
              {isEdit ? values.name || 'Editar caixa' : 'Nova caixa'}
            </ThemeText>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="border-transparent bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-700 hover:to-purple-700 dark:border-transparent dark:bg-none dark:from-brand-600 dark:to-purple-600 dark:text-white"
              onClick={() => setAiAssistantOpen(true)}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Assistente IA
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard/cases')}
            >
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
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <SummaryChip label="Itens" value={String(values.items.length)} />
          <SummaryChip label="Soma chances" value={`${probabilitySum.toFixed(2)}%`} />
          <SummaryChip label="VE total" value={formatSkinsPrice(totalEV, currency)} />
          <SummaryChip
            label="Preço final"
            value={formatSkinsPrice(values.price ?? 0, currency)}
          />
        </div>
      </div>

      <CaseEditorGeneralSection
        formik={formik}
        disabled={formik.isSubmitting || saving}
        onCurrencyChange={handleCurrencyChange}
        onValueModeChange={handleValueModeChange}
      />

      <CaseEditorItemsTable
        items={values.items}
        currency={currency}
        valueMode={values.valueMode as CaseValueMode}
        openPrice={values.price}
        targetMarginPercent={values.targetMarginPercent}
        ledger={economyLedger}
        itemsError={itemsError}
        onItemsChange={handleItemsChange}
        headerAction={
          <>
            <Button type="button" size="sm" onClick={() => setSkinsModalOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar skins
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setPresetsModalOpen(true)}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Presets
            </Button>
          </>
        }
      />

      <CollapsibleSection
        title="Preço e margem"
        description="Margem alvo, meta de chances e desconto da vitrine."
        forceOpen={hasPricingError}
        summary={
          <ThemeText as="span" tone="faint" className="text-xs">
            Margem {values.targetMarginPercent}% ·{' '}
            {formatSkinsPrice(values.price ?? 0, currency)}
          </ThemeText>
        }
      >
        <CaseEditorPricingSection
          embedded
          formik={formik}
          currency={currency}
          totalEV={totalEV}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Resumo econômico"
        description="VE, banco virtual, pool elegível e margem do editor em tempo real."
        summary={
          <ThemeText as="span" tone="faint" className="text-xs">
            VE {formatSkinsPrice(totalEV, currency)}
          </ThemeText>
        }
      >
        <CaseEconomicsPanel
          items={economicsItems}
          currency={currency}
          valueMode={values.valueMode as CaseValueMode}
          config={economicsConfig}
          listPrice={values.listPrice}
          finalPrice={values.price}
          ledger={economyLedger}
          sharedLedger={(values.sharedCaseIds?.length ?? 0) > 0}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Margem acumulada compartilhada"
        description="Caixas que dividem o mesmo ledger de receita e payout."
        summary={
          <ThemeText as="span" tone="faint" className="text-xs">
            {values.sharedCaseIds?.length
              ? `${values.sharedCaseIds.length} caixa(s)`
              : 'Ledger isolado'}
          </ThemeText>
        }
      >
        <CaseEditorEconomyPoolSection
          embedded
          currency={currency}
          currentCaseId={id}
          sharedCaseIds={values.sharedCaseIds ?? []}
          availableCases={allCases.map((lootCase) => ({
            _id: lootCase._id,
            name: lootCase.name,
            slug: lootCase.slug,
            imageUrl: lootCase.imageUrl,
            active: lootCase.active,
            price: lootCase.price,
          }))}
          economyLedger={economyLedger}
          onSharedCaseIdsChange={(sharedCaseIds) => {
            void setFieldValue('sharedCaseIds', sharedCaseIds, false)
          }}
        />
      </CollapsibleSection>

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

      {uploadError ? <Surface variant="errorBanner">{uploadError}</Surface> : null}

      {saveError ? (
        <Surface variant="errorBanner">{getErrorMessage(saveError)}</Surface>
      ) : null}

      <Modal
        open={skinsModalOpen}
        onOpenChange={setSkinsModalOpen}
        title="Adicionar skins"
        description={`${values.items.length} item(ns) na caixa. Clique na skin para adicionar — ela entra com drop 0% e você ajusta na tabela.`}
        size="full"
        footer={
          <Button type="button" onClick={() => setSkinsModalOpen(false)}>
            Concluir
          </Button>
        }
      >
        <CaseEditorSkinSearchSection
          embedded
          currency={currency}
          addedSkinNames={addedSkinNames}
          onAddSkin={handleAddSkin}
        />
      </Modal>

      <CaseEditorPresetsModal
        open={presetsModalOpen}
        onOpenChange={setPresetsModalOpen}
        targetMarginPercent={values.targetMarginPercent}
        discountPercent={values.discountPercent}
        dev={{
          loading: devPresetLoading,
          error: devPresetError,
          onApply: () => void handleDevPresetApply(),
        }}
        japaSkins={{
          loading: japaPresetLoading,
          error: japaPresetError,
          onApply: () => void handleJapaSkinsPresetApply(),
        }}
        influencerDemo={{
          loading: influencerPresetLoading,
          error: influencerPresetError,
          onApply: () => void handleInfluencerDemoPresetApply(),
        }}
      />

      <CaseAiAssistantDrawer
        open={aiAssistantOpen}
        onOpenChange={setAiAssistantOpen}
        context={aiContext}
        currency={currency}
        onApplyDraft={handleApplyAiDraft}
      />
    </form>
  )
}
