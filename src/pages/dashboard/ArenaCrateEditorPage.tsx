import { useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { ArenaCrateItemsTable } from '@/components/arena/ArenaCrateItemsTable'
import {
  ARENA_RARITY_COLOR,
  ARENA_RARITY_DEFAULT_VALUE_BRL,
  ARENA_RARITY_DEFAULT_VALUE_EUR,
  ARENA_RARITY_DEFAULT_VALUE_USD,
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
  useUpdateArenaCrateMutation,
  type ArenaCrate,
  type ArenaCrateItem,
  type ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  arenaCrateEditorInitialValues,
  arenaCrateEditorSchema,
  type ArenaCrateEditorFormValues,
} from '@/validators/arenaCrateEditorSchema'

type ArenaCrateFormState = ArenaCrateEditorFormValues & {
  caseImage: CaseImageValue
  imageUrl?: string
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
      <ThemeText
        as="span"
        tone="faint"
        className="block text-[10px] uppercase tracking-wide"
      >
        {label}
      </ThemeText>
      <ThemeText as="span" tone="primary" className="block text-sm font-semibold">
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
    valueBrl: crate.valueBrl ?? crate.value ?? ARENA_RARITY_DEFAULT_VALUE_BRL[rarity],
    valueUsd: crate.valueUsd ?? ARENA_RARITY_DEFAULT_VALUE_USD[rarity],
    valueEur: crate.valueEur ?? ARENA_RARITY_DEFAULT_VALUE_EUR[rarity],
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

function enabledProbabilitySum(items: ArenaCrateItem[]) {
  return items
    .filter((item) => item.enabled)
    .reduce((sum, item) => sum + (Number(item.probability) || 0), 0)
}

export default function ArenaCrateEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existingCrate, isLoading: isLoadingCrate } =
    useGetArenaCrateByIdQuery(id ?? '', { skip: !id })
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
          valueBrl: Number(values.valueBrl),
          valueUsd: Number(values.valueUsd),
          valueEur: Number(values.valueEur),
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
        navigate('/dashboard/arena')
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
  const probabilitySum = enabledProbabilitySum(values.items)
  const itemsError = typeof errors.items === 'string' ? errors.items : undefined

  const handleRarityChange = (next: ArenaRarity) => {
    const previous = values.rarity
    void setFieldValue('rarity', next)
    if (Number(values.valueBrl) === ARENA_RARITY_DEFAULT_VALUE_BRL[previous]) {
      void setFieldValue('valueBrl', ARENA_RARITY_DEFAULT_VALUE_BRL[next])
    }
    if (Number(values.valueUsd) === ARENA_RARITY_DEFAULT_VALUE_USD[previous]) {
      void setFieldValue('valueUsd', ARENA_RARITY_DEFAULT_VALUE_USD[next])
    }
    if (Number(values.valueEur) === ARENA_RARITY_DEFAULT_VALUE_EUR[previous]) {
      void setFieldValue('valueEur', ARENA_RARITY_DEFAULT_VALUE_EUR[next])
    }
    if (
      !values.color.trim() ||
      values.color === ARENA_RARITY_COLOR[previous]
    ) {
      void setFieldValue('color', ARENA_RARITY_COLOR[next])
    }
  }

  const handleAddSkin = (skin: SkinsCatalogItem) => {
    if (addedSkinNames.has(skin.name)) return
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
        valueBrl: true,
        valueUsd: true,
        valueEur: true,
        color: true,
        active: true,
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
            <Link
              to="/dashboard/arena"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para Arena
            </Link>
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
              onClick={() => navigate('/dashboard/arena')}
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
          />
          <SummaryChip
            label="BRL"
            value={formatSkinsPrice(Number(values.valueBrl) || 0, SkinsCurrency.BRL)}
          />
          <SummaryChip
            label="USD"
            value={formatSkinsPrice(Number(values.valueUsd) || 0, SkinsCurrency.USD)}
          />
          <SummaryChip
            label="EUR"
            value={formatSkinsPrice(Number(values.valueEur) || 0, SkinsCurrency.EUR)}
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

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Informações gerais
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
          Só uma crate ativa por raridade. Informe o valor fixo em cada moeda da
          carteira — o jogador paga o valor da moeda dele, sem conversão.
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
            label="Valor BRL"
            name="valueBrl"
            type="number"
            min={0}
            step={0.01}
            value={values.valueBrl}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldError(touched.valueBrl, errors.valueBrl)}
          />
          <Input
            label="Valor USD"
            name="valueUsd"
            type="number"
            min={0}
            step={0.01}
            value={values.valueUsd}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldError(touched.valueUsd, errors.valueUsd)}
          />
          <Input
            label="Valor EUR"
            name="valueEur"
            type="number"
            min={0}
            step={0.01}
            value={values.valueEur}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldError(touched.valueEur, errors.valueEur)}
          />
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

      <ArenaCrateItemsTable
        items={values.items}
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
        description={`${values.items.length} item(ns) na crate. Clique na skin para adicionar — ela entra com os 3 valores de prêmio e chance 0%.`}
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
          onAddSkin={handleAddSkin}
        />
      </Modal>
    </form>
  )
}
