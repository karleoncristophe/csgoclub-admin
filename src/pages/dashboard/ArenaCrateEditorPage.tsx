import { useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { BackLink } from '@/components/ui/BackLink'
import { useGoBack } from '@/hooks/useGoBack'
import { ArenaCrateItemsTable } from '@/components/arena/ArenaCrateItemsTable'
import { ArenaCrateBankPanel } from '@/components/arena/ArenaCrateBankPanel'
import {
  ARENA_RARITY_COLOR,
  ARENA_RARITY_OPTIONS,
} from '@/components/arena/arenaRarity'
import {
  CaseImageUploader,
  isPendingCaseImage,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { CaseEditorSkinSearchSection } from '@/components/cases/editor/CaseEditorSkinSearchSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { Switch } from '@/components/ui/Switch'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import { uploadSingleFile } from '@/lib/upload'
import {
  useCreateArenaCrateMutation,
  useGetArenaCrateByIdQuery,
  useGetArenaPlayPricingQuery,
  useUpdateArenaCrateMutation,
  type ArenaCrate,
  type ArenaCrateItem,
  type ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  arenaBankBalance,
  arenaBankInjection,
  computeArenaCrateValues,
  countArenaEligibleItems,
} from '@/utils/arenaCrateEconomics'
import {
  arenaCrateEditorInitialValues,
  arenaCrateEditorSchema,
  arenaProbabilitySumError,
  enabledArenaProbabilitySum,
  type ArenaCrateEditorFormValues,
} from '@/validators/arenaCrateEditorSchema'

type ArenaCrateFormState = ArenaCrateEditorFormValues & {
  caseImage: CaseImageValue
  imageUrl?: string
}

function SummaryChip({
  label,
  value,
  error,
}: {
  label: string
  value: string
  error?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-white px-3 py-1.5 dark:bg-zinc-900 ${
        error
          ? 'border-red-400 dark:border-red-500'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <ThemeText
        as="span"
        tone="faint"
        className="block text-[10px] uppercase tracking-wide"
      >
        {label}
      </ThemeText>
      <ThemeText
        as="span"
        tone="primary"
        className={`block text-sm font-semibold ${
          error ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {value}
      </ThemeText>
    </div>
  )
}

function fieldError(touched: boolean | undefined, error: unknown) {
  if (!touched || typeof error !== 'string') return undefined
  return error
}

function mapCrateToForm(crate: ArenaCrate): ArenaCrateFormState {
  const rarity = crate.rarity
  return {
    name: crate.name ?? '',
    description: crate.description ?? '',
    rarity,
    color: crate.color || ARENA_RARITY_COLOR[rarity],
    active: crate.active,
    items: (crate.items ?? []).map((item) => ({
      skinName: item.skinName,
      image: item.image,
      rarity: item.rarity,
      probability: item.probability,
      enabled: item.enabled !== false,
      valueBrl: item.valueBrl,
      valueUsd: item.valueUsd,
      valueEur: item.valueEur,
    })),
    caseImage: crate.imageUrl ?? null,
    imageUrl: crate.imageUrl,
  }
}

function catalogSkinToArenaItem(skin: SkinsCatalogItem): ArenaCrateItem {
  return {
    skinName: skin.name,
    image: skin.image,
    rarity: skin.rarity
      ? { name: skin.rarity.name, color: skin.rarity.color }
      : undefined,
    probability: 0,
    enabled: true,
    valueBrl: skin.valueBrl,
    valueUsd: skin.valueUsd,
    valueEur: skin.valueEur,
  }
}

export default function ArenaCrateEditorPage() {
  const { id } = useParams()
  const goBack = useGoBack('/dashboard/arena')
  const isEdit = Boolean(id)

  const { data: existingCrate, isLoading: isLoadingCrate } =
    useGetArenaCrateByIdQuery(id ?? '', { skip: !id })
  const { data: playPricing } = useGetArenaPlayPricingQuery()
  const [createCrate, createState] = useCreateArenaCrateMutation()
  const [updateCrate, updateState] = useUpdateArenaCrateMutation()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [skinsModalOpen, setSkinsModalOpen] = useState(false)
  const errorBannerRef = useRef<HTMLDivElement>(null)

  const initialValues = useMemo<ArenaCrateFormState>(
    () =>
      existingCrate
        ? mapCrateToForm(existingCrate)
        : {
            ...arenaCrateEditorInitialValues,
            caseImage: null,
            imageUrl: '',
          },
    [existingCrate],
  )

  const formik = useFormik<ArenaCrateFormState>({
    initialValues,
    enableReinitialize: true,
    validationSchema: arenaCrateEditorSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      setUploadError(null)
      let imageUrl = values.imageUrl?.trim() || undefined

      try {
        if (isPendingCaseImage(values.caseImage)) {
          try {
            const uploaded = await uploadSingleFile(values.caseImage.file, 'arena', {
              crop: values.caseImage.crop,
            })
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
          rarity: values.rarity,
          color: values.color.trim() || ARENA_RARITY_COLOR[values.rarity],
          active: values.active,
          items: values.items.map((item) => ({
            skinName: item.skinName,
            image: item.image || undefined,
            rarity: item.rarity
              ? { name: item.rarity.name, color: item.rarity.color }
              : undefined,
            probability: Number(item.probability) || 0,
            enabled: item.enabled,
            ...(item.valueBrl != null ? { valueBrl: item.valueBrl } : {}),
            ...(item.valueUsd != null ? { valueUsd: item.valueUsd } : {}),
            ...(item.valueEur != null ? { valueEur: item.valueEur } : {}),
          })),
        }

        if (isEdit && id) {
          await updateCrate({
            id,
            body: { ...payload, imageUrl: imageUrl ?? '' },
          }).unwrap()
        } else {
          await createCrate(payload).unwrap()
        }
        goBack()
      } catch {
        // mutation error shown via saveError
      } finally {
        setSubmitting(false)
      }
    },
  })

  const { values, setFieldValue, handleChange, handleBlur, touched, errors } =
    formik
  const saving = createState.isLoading || updateState.isLoading
  const saveError = createState.error || updateState.error
  const addedSkinNames = useMemo(
    () => new Set(values.items.map((item) => item.skinName)),
    [values.items],
  )
  const probabilitySum = enabledArenaProbabilitySum(values.items)
  const probabilityError = arenaProbabilitySumError(values.items)
  const itemsError =
    probabilityError ??
    (typeof errors.items === 'string' ? errors.items : undefined)
  const crateValues = useMemo(
    () => computeArenaCrateValues(values.items),
    [values.items],
  )
  const playValueBrl = Number(playPricing?.valueBrl) || 0
  const eligibleCount = countArenaEligibleItems({
    items: values.items,
    openPrice: crateValues.valueBrl,
    bankBalance:
      arenaBankBalance(existingCrate?.economyLedger, SkinsCurrency.BRL) +
      arenaBankInjection(crateValues.valueBrl),
    currency: SkinsCurrency.BRL,
  })

  const handleRarityChange = (next: ArenaRarity) => {
    const previous = values.rarity
    void setFieldValue('rarity', next)
    if (
      !values.color.trim() ||
      values.color === ARENA_RARITY_COLOR[previous]
    ) {
      void setFieldValue('color', ARENA_RARITY_COLOR[next])
    }
  }

  const handleToggleSkin = (skin: SkinsCatalogItem) => {
    if (addedSkinNames.has(skin.name)) {
      void setFieldValue(
        'items',
        values.items.filter((item) => item.skinName !== skin.name),
      )
      return
    }
    void setFieldValue('items', [...values.items, catalogSkinToArenaItem(skin)])
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = await formik.validateForm()
    if (Object.keys(nextErrors).length > 0) {
      void formik.setTouched({
        name: true,
        description: true,
        rarity: true,
        color: true,
        active: true,
        items: values.items.map(() => ({
          skinName: true,
          probability: true,
          enabled: true,
        })),
      })
      void formik.setErrors(nextErrors)
      errorBannerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }
    void formik.submitForm()
  }

  if (isEdit && isLoadingCrate) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
      <div className="sticky top-0 z-30 -mx-4 -mt-6 bg-slate-50/85 px-4 py-4 backdrop-blur dark:bg-zinc-950/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <BackLink
              fallback="/dashboard/arena"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para Arena
            </BackLink>
            <ThemeText
              as="h1"
              tone="primary"
              className="truncate text-xl font-semibold tracking-tight"
            >
              {isEdit ? values.name || 'Editar crate' : 'Nova crate da Arena'}
            </ThemeText>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={goBack}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={formik.isSubmitting || saving}>
              {isEdit ? 'Salvar crate' : 'Criar crate'}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <SummaryChip label="Itens" value={String(values.items.length)} />
          <SummaryChip
            label="Soma chances"
            value={`${probabilitySum.toFixed(2)}%`}
            error={Boolean(probabilityError)}
          />
          <SummaryChip
            label="Elegíveis"
            value={String(eligibleCount)}
          />
          <SummaryChip
            label="Caixa BRL"
            value={formatSkinsPrice(crateValues.valueBrl, SkinsCurrency.BRL)}
          />
          <SummaryChip
            label="Caixa USD"
            value={formatSkinsPrice(crateValues.valueUsd, SkinsCurrency.USD)}
          />
          <SummaryChip
            label="Caixa EUR"
            value={formatSkinsPrice(crateValues.valueEur, SkinsCurrency.EUR)}
          />
          <SummaryChip
            label="Jogada BRL"
            value={formatSkinsPrice(playValueBrl, SkinsCurrency.BRL)}
          />
        </div>
      </div>

      <div ref={errorBannerRef}>
        {uploadError ? (
          <Surface variant="errorBanner">{uploadError}</Surface>
        ) : null}
        {saveError ? (
          <Surface variant="errorBanner">{getErrorMessage(saveError)}</Surface>
        ) : null}
        {Object.keys(errors).length > 0 && formik.submitCount > 0 ? (
          <Surface variant="errorBanner">
            {typeof errors.items === 'string'
              ? errors.items
              : 'Corrija os campos destacados antes de salvar.'}
          </Surface>
        ) : null}
      </div>

      <Surface variant="settingsPanel" className="!p-5">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Informações gerais
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
          Só uma crate ativa por raridade. O preço da jogada é global. O valor
          da caixa é o VE das skins, sem margem — fica estático ao salvar e
          entra no elegível e na publi.
        </ThemeText>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            label="Nome da crate"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ex.: Epic Crate"
            error={fieldError(touched.name, errors.name)}
          />
          <Select
            label="Raridade"
            name="rarity"
            value={values.rarity}
            onChange={(event) =>
              handleRarityChange(event.target.value as ArenaRarity)
            }
            onBlur={handleBlur}
          >
            {ARENA_RARITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            label="Cor"
            name="color"
            value={values.color}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="#d32ce6"
          />
          <Switch
            label="Status"
            name="active"
            checked={values.active}
            onChange={(checked) => void setFieldValue('active', checked)}
            description="Crate ativa precisa de itens habilitados somando 100%."
          />
          <div className="md:col-span-2 xl:col-span-3">
            <Input
              label="Descrição"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Opcional"
            />
          </div>
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
              label="Imagem da crate"
              description="Arraste uma imagem ou clique para enviar. Recomendado 1:1."
            />
          </div>
        </div>
      </Surface>

      <ArenaCrateBankPanel
        items={values.items}
        valueBrl={crateValues.valueBrl}
        valueUsd={crateValues.valueUsd}
        valueEur={crateValues.valueEur}
        ledger={existingCrate?.economyLedger}
        currency={SkinsCurrency.BRL}
      />

      <ArenaCrateItemsTable
        items={values.items}
        crateValue={crateValues.valueBrl}
        currency={SkinsCurrency.BRL}
        ledger={existingCrate?.economyLedger}
        itemsError={itemsError}
        onItemsChange={(items) => void setFieldValue('items', items, false)}
        headerAction={
          <Button type="button" size="sm" onClick={() => setSkinsModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar skins
          </Button>
        }
      />

      <Modal
        open={skinsModalOpen}
        onOpenChange={setSkinsModalOpen}
        title="Adicionar skins"
        description={`${values.items.length} item(ns) na crate. Clique na skin para adicionar; clique de novo para remover. Ela entra com os 3 valores de prêmio e chance 0%.`}
        size="full"
        footer={
          <Button type="button" onClick={() => setSkinsModalOpen(false)}>
            Concluir
          </Button>
        }
      >
        <CaseEditorSkinSearchSection
          embedded
          showPrizeValues
          currency={SkinsCurrency.BRL}
          addedSkinNames={addedSkinNames}
          onToggleSkin={handleToggleSkin}
        />
      </Modal>
    </form>
  )
}
