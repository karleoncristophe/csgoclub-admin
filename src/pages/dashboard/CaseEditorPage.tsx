import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { CaseEconomicsPanel } from '@/components/cases/CaseEconomicsPanel'
import {
  CaseImageUploader,
  isPendingCaseImage,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { SkinPickerModal } from '@/components/cases/SkinPickerModal'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { filterChipClass } from '@/components/skins/filterChipClass'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import {
  formatSkinsPrice,
  SKINS_CURRENCY_OPTIONS,
  SkinsCurrency,
} from '@/constants/skinsCurrency'
import useDebounce from '@/hooks/useDebounce'
import {
  useCreateCaseMutation,
  useGetCaseByIdQuery,
  useUpdateCaseMutation,
  type CaseDropItem,
  type LootCase,
} from '@/redux/store/api/cases/api.cases'
import {
  useLazyGetSkinsCatalogItemQuery,
  useLazyGetSkinsCatalogQuery,
  type SkinsCatalogItem,
} from '@/redux/store/api/skins/api.skins'
import { useGetWeaponCategoriesQuery } from '@/redux/store/api/weapon-categories/api.weapon-categories'
import { uploadSingleFile } from '@/lib/upload'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  catalogSkinToCaseItem,
  computePriceAfterDiscount,
  computeSuggestedSalePrice,
  computeTotalExpectedValue,
  remapCaseItemsForValueMode,
  resolveItemEconomicsValue,
  roundPrice,
  slugifyCaseName,
  type CaseEconomicsConfig,
  type CaseValueMode,
} from '@/utils/caseEconomics'
import {
  caseEditorInitialValues,
  caseEditorSchema,
  type CaseEditorFormValues,
} from '@/validators/caseEditorSchema'

const SKIN_SEARCH_PAGE_SIZE = 12

type CaseFormState = CaseEditorFormValues & {
  caseImage: CaseImageValue
}

function mapCaseToFormValues(lootCase: LootCase): CaseFormState {
  return {
    name: lootCase.name,
    slug: lootCase.slug,
    slugManual: true,
    description: lootCase.description ?? '',
    imageUrl: lootCase.imageUrl ?? '',
    caseImage: lootCase.imageUrl ?? null,
    currency: lootCase.currency,
    valueMode: lootCase.valueMode,
    active: lootCase.active,
    targetMarginPercent: lootCase.targetMarginPercent,
    probabilityTargetPercent: lootCase.probabilityTargetPercent ?? 100,
    probabilityTolerance: lootCase.probabilityTolerance ?? 0.0001,
    discountPercent: lootCase.discountPercent ?? 0,
    listPrice: lootCase.listPrice ?? lootCase.price,
    price: lootCase.price,
    listPriceManual: true,
    priceManual: true,
    items: lootCase.items,
  }
}

function fieldError(
  touched: boolean | undefined,
  error: string | undefined,
): string | undefined {
  return touched && error ? error : undefined
}

function collectFormErrors(errors: Record<string, unknown>): string[] {
  const messages: string[] = []
  for (const value of Object.values(errors)) {
    if (typeof value === 'string') {
      messages.push(value)
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') messages.push(item)
      }
    }
  }
  return messages
}

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

  const [searchInput, setSearchInput] = useState('')
  const [skinWeaponType, setSkinWeaponType] = useState('')
  const [skinRarity, setSkinRarity] = useState('')
  const [pickerSkin, setPickerSkin] = useState<SkinsCatalogItem | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [skinSearchPage, setSkinSearchPage] = useState(1)
  const skinSearchAnchorRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  const [searchCatalog, searchState] = useLazyGetSkinsCatalogQuery()
  const [fetchCatalogItem] = useLazyGetSkinsCatalogItemQuery()
  const { data: weaponCategories = [] } = useGetWeaponCategoriesQuery()

  const initialValues = useMemo<CaseFormState>(
    () =>
      existingCase
        ? mapCaseToFormValues(existingCase)
        : { ...caseEditorInitialValues, caseImage: null },
    [existingCase],
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
          slug: values.slug.trim(),
          description: values.description.trim() || undefined,
          imageUrl,
          currency: values.currency as SkinsCurrency,
          valueMode: values.valueMode as CaseValueMode,
          listPrice: roundPrice(values.listPrice),
          price: roundPrice(values.price),
          targetMarginPercent: values.targetMarginPercent,
          probabilityTargetPercent: values.probabilityTargetPercent,
          probabilityTolerance: values.probabilityTolerance,
          discountPercent: values.discountPercent,
          items: values.items as CaseDropItem[],
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
      probabilityTolerance: values.probabilityTolerance,
      discountPercent: values.discountPercent,
    }),
    [
      values.targetMarginPercent,
      values.probabilityTargetPercent,
      values.probabilityTolerance,
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
        skinName: item.skinName,
      })),
    [values.items],
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
    setSkinSearchPage(1)
  }, [debouncedSearch, skinWeaponType, skinRarity, values.currency])

  useEffect(() => {
    void searchCatalog({
      search: debouncedSearch || undefined,
      currency: values.currency as SkinsCurrency,
      weaponType: skinWeaponType || undefined,
      rarity: skinRarity || undefined,
      limit: SKIN_SEARCH_PAGE_SIZE,
      offset: (skinSearchPage - 1) * SKIN_SEARCH_PAGE_SIZE,
    })
  }, [
    debouncedSearch,
    values.currency,
    skinWeaponType,
    skinRarity,
    skinSearchPage,
    searchCatalog,
  ])

  const searchResults = searchState.data?.items ?? []
  const skinSearchTotal = searchState.data?.total ?? 0
  const skinSearchLimit = searchState.data?.limit ?? SKIN_SEARCH_PAGE_SIZE
  const skinSearchTotalPages = Math.max(1, Math.ceil(skinSearchTotal / skinSearchLimit))
  const skinSearchCurrentPage = Math.min(skinSearchPage, skinSearchTotalPages)
  const skinSearchPageStart =
    skinSearchTotal === 0 ? 0 : (skinSearchCurrentPage - 1) * skinSearchLimit + 1
  const skinSearchPageEnd = Math.min(skinSearchCurrentPage * skinSearchLimit, skinSearchTotal)
  const skinRarityOptions = searchState.data?.rarityOptions ?? []
  const skinTypeCounters = useMemo(() => {
    const counts = searchState.data?.typeCounts ?? {}
    return Object.entries(counts)
      .filter(([type]) => type !== 'Other')
      .sort((a, b) => b[1] - a[1])
  }, [searchState.data?.typeCounts])

  useEffect(() => {
    if (skinSearchPage > skinSearchTotalPages) {
      setSkinSearchPage(skinSearchTotalPages)
    }
  }, [skinSearchPage, skinSearchTotalPages])

  useEffect(() => {
    if (values.listPriceManual || suggestedPrice <= 0) return
    if (values.listPrice !== suggestedPrice) {
      void setFieldValue('listPrice', suggestedPrice, false)
    }
  }, [suggestedPrice, values.listPriceManual, values.listPrice, setFieldValue])

  useEffect(() => {
    if (values.priceManual || priceFromDiscount <= 0) return
    if (values.price !== priceFromDiscount) {
      void setFieldValue('price', priceFromDiscount, false)
    }
  }, [priceFromDiscount, values.priceManual, values.price, setFieldValue])


  const itemNames = new Set(values.items.map((item) => item.skinName))
  const formErrors = collectFormErrors(formik.errors as Record<string, unknown>)
  const saving = createState.isLoading || updateState.isLoading
  const saveError = createState.error ?? updateState.error

  const handleNameChange = (nextName: string) => {
    void setFieldValue('name', nextName)
    if (!values.slugManual) {
      void setFieldValue('slug', slugifyCaseName(nextName), false)
    }
  }

  const handleValueModeChange = (nextMode: CaseValueMode) => {
    void setFieldValue('valueMode', nextMode)
    void setFieldValue(
      'items',
      remapCaseItemsForValueMode(values.items as CaseDropItem[], nextMode),
      false,
    )
  }

  const handleCurrencyChange = async (nextCurrency: SkinsCurrency) => {
    await setFieldValue('currency', nextCurrency)
    if (values.items.length === 0) return

    const refreshed = await Promise.all(
      values.items.map(async (item) => {
        try {
          const skin = await fetchCatalogItem({
            name: item.skinName,
            currency: nextCurrency,
          }).unwrap()
          return catalogSkinToCaseItem(
            skin,
            values.valueMode as CaseValueMode,
            item.probability,
          )
        } catch {
          return item
        }
      }),
    )
    await setFieldValue('items', refreshed, false)
  }

  const handleConfirmSkin = (skin: SkinsCatalogItem, probability: number) => {
    if (itemNames.has(skin.name)) {
      setPickerOpen(false)
      return
    }
    void setFieldValue('items', [
      ...values.items,
      catalogSkinToCaseItem(skin, values.valueMode as CaseValueMode, probability),
    ])
    setPickerOpen(false)
    setPickerSkin(null)
    setSearchInput('')
  }

  const handleProbabilityChange = (skinName: string, rawValue: string) => {
    const probability = Number(rawValue.replace(',', '.'))
    const nextItems = values.items.map((item) =>
      item.skinName === skinName
        ? { ...item, probability: Number.isFinite(probability) ? Math.max(0, probability) : 0 }
        : item,
    )
    void setFieldValue('items', nextItems, false)
  }

  const handleRemoveItem = (skinName: string) => {
    void setFieldValue(
      'items',
      values.items.filter((item) => item.skinName !== skinName),
      false,
    )
  }

  const handleApplySuggestedPrice = () => {
    void setValues({
      ...values,
      listPrice: suggestedPrice,
      listPriceManual: false,
      priceManual: false,
    })
  }

  const handleApplyDiscountPrice = () => {
    void setValues({
      ...values,
      price: priceFromDiscount,
      priceManual: true,
    })
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

      <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
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
              onBlur={formik.handleBlur}
              placeholder="Ex.: Neon Queen"
              error={fieldError(formik.touched.name, formik.errors.name)}
            />
            <Input
              label="Slug"
              name="slug"
              value={values.slug}
              onChange={(e) => {
                void setFieldValue('slugManual', true)
                void setFieldValue('slug', e.target.value)
              }}
              onBlur={formik.handleBlur}
              placeholder="neon-queen"
              error={fieldError(formik.touched.slug, formik.errors.slug)}
            />
            <Select
              label="Moeda"
              name="currency"
              value={values.currency}
              onChange={(e) => void handleCurrencyChange(e.target.value as SkinsCurrency)}
              onBlur={formik.handleBlur}
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
              onChange={(e) => handleValueModeChange(e.target.value as CaseValueMode)}
              onBlur={formik.handleBlur}
            >
              <option value="with_tax">Preço com taxa de categoria</option>
              <option value="base">Preço base SkinsBack</option>
            </Select>
            <Input
              label="Descrição"
              name="description"
              value={values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Opcional"
            />
            <div className="md:col-span-2 xl:col-span-3">
              <CaseImageUploader
                value={values.caseImage}
                onChange={(next) => {
                  void setFieldValue('caseImage', next)
                  if (typeof next === 'string') {
                    void setFieldValue('imageUrl', next)
                  } else if (!next) {
                    void setFieldValue('imageUrl', '')
                  }
                }}
                disabled={formik.isSubmitting || saving}
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800 md:col-span-2 xl:col-span-1">
              <input
                type="checkbox"
                name="active"
                checked={values.active}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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

        <Surface variant="card" className="!p-6">
          <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
            Buscar skins
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
            Preço base e taxa vêm da API com margens das categorias de arma.
          </ThemeText>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ex.: AK-47, Dragon Lore, Fade..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-brand-500/0 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                autoComplete="off"
              />
            </div>
            <Select
              label="Tipo da arma"
              name="skinWeaponType"
              value={skinWeaponType}
              onChange={(e) => setSkinWeaponType(e.target.value)}
            >
              <option value="">Todos</option>
              {weaponCategories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              label="Raridade"
              name="skinRarity"
              value={skinRarity}
              onChange={(e) => setSkinRarity(e.target.value)}
            >
              <option value="">Todas</option>
              {skinRarityOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name} ({option.count})
                </option>
              ))}
            </Select>
          </div>

          {skinTypeCounters.length > 0 ? (
            <div className="mb-6">
              <SectionTitle>Tipos no catálogo</SectionTitle>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {skinTypeCounters.slice(0, 8).map(([type, count]) => {
                  const active = skinWeaponType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSkinWeaponType(active ? '' : type)}
                      className={active ? filterChipClass.active : filterChipClass.inactive}
                    >
                      <ThemeText
                        as="p"
                        tone="primary"
                        className={`text-sm font-semibold ${active ? 'dark:text-brand-100' : ''}`}
                      >
                        {type}
                      </ThemeText>
                      <ThemeText as="p" tone="secondary" className="text-xs">
                        {count} skin{count === 1 ? '' : 's'}
                      </ThemeText>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {skinRarityOptions.length > 0 ? (
            <div className="mb-6">
              <SectionTitle>Raridades</SectionTitle>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {skinRarityOptions.slice(0, 8).map((option) => {
                  const active = skinRarity === option.name
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setSkinRarity(active ? '' : option.name)}
                      className={active ? filterChipClass.active : filterChipClass.inactive}
                    >
                      <SkinRarityBar rarity={option} className="mb-2" />
                      <ThemeText
                        as="p"
                        tone="primary"
                        className={`text-sm font-semibold ${active ? 'dark:text-brand-100' : ''}`}
                      >
                        {option.name}
                      </ThemeText>
                      <ThemeText as="p" tone="secondary" className="text-xs">
                        {option.count} skin{option.count === 1 ? '' : 's'}
                      </ThemeText>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {searchState.isFetching && searchResults.length === 0 ? (
            <ThemeText tone="secondary" className="mb-4 text-sm">
              Buscando no catálogo...
            </ThemeText>
          ) : null}

          {searchResults.length === 0 && !searchState.isFetching ? (
            <ThemeText tone="secondary" className="mb-4 text-sm">
              Nenhuma skin encontrada com os filtros atuais.
            </ThemeText>
          ) : null}

          {searchResults.length > 0 ? (
            <>
              <ThemeText tone="label" className="mb-3 text-xs">
                {skinSearchPageStart}–{skinSearchPageEnd} de {skinSearchTotal} skins
              </ThemeText>
              <div
                ref={skinSearchAnchorRef}
                className="scroll-mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {searchResults.map((skin) => (
                  <button
                    key={skin.name}
                    type="button"
                    onClick={() => {
                      setPickerSkin(skin)
                      setPickerOpen(true)
                    }}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/20"
                  >
                    {skin.image ? (
                      <img src={skin.image} alt="" className="h-12 w-14 object-contain" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <ThemeText tone="primary" className="line-clamp-2 text-xs font-medium">
                        {skin.name}
                      </ThemeText>
                      <ThemeText tone="label" className="mt-1 text-[11px]">
                        {formatSkinsPrice(skin.priceWithTax, values.currency as SkinsCurrency)} · taxa{' '}
                        {skin.taxPercent}%
                      </ThemeText>
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-brand-600" />
                  </button>
                ))}
              </div>

              <Pagination
                className="mt-6"
                page={skinSearchCurrentPage}
                totalPages={skinSearchTotalPages}
                scrollTargetRef={skinSearchAnchorRef}
                onPageChange={(next) =>
                  setSkinSearchPage(Math.min(Math.max(next, 1), skinSearchTotalPages))
                }
              />

              {searchState.isFetching ? (
                <ThemeText as="p" tone="faint" className="mt-3 text-center text-xs">
                  Atualizando página...
                </ThemeText>
              ) : null}
            </>
          ) : null}
        </Surface>

        <Surface variant="card" className="!p-6">
          <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
            Itens da caixa ({values.items.length})
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
            Cada item tem valor (API) e chance %. O VE do item é{' '}
            <span className="font-medium">valor × (chance / 100)</span> — igual ao fluxo do{' '}
            <a
              href="https://csgo.net/br/case/NeonQueen"
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 hover:underline dark:text-brand-400"
            >
              csgo.net
            </a>
            .
          </ThemeText>

          {values.items.length === 0 ? (
            <ThemeText tone="secondary" className="text-sm">
              Nenhum item adicionado. Use a busca acima para montar a caixa.
            </ThemeText>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Raridade</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Chance %</th>
                    <th className="px-3 py-2">VE item</th>
                    <th className="px-3 py-2">Base</th>
                    <th className="px-3 py-2">Taxa</th>
                    <th className="px-3 py-2">Com taxa</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {values.items.map((item: CaseDropItem) => {
                    const itemValue = resolveItemEconomicsValue(
                      item,
                      values.valueMode as CaseValueMode,
                    )
                    const veItem = roundPrice(itemValue * (item.probability / 100))
                    return (
                      <tr
                        key={item.skinName}
                        className="border-b border-zinc-100 dark:border-zinc-800/80"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="h-10 w-12 object-contain"
                              />
                            ) : null}
                            <ThemeText tone="primary" className="max-w-[200px] text-xs font-medium">
                              {item.skinName}
                            </ThemeText>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {item.rarity?.name || item.rarity?.color ? (
                            <div className="min-w-[110px]">
                              <SkinRarityBar rarity={item.rarity} className="mb-1.5" />
                              <ThemeText tone="label" className="text-[11px]">
                                {item.rarity?.name ?? '—'}
                              </ThemeText>
                            </div>
                          ) : (
                            <ThemeText tone="faint" className="text-xs">
                              —
                            </ThemeText>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap font-medium">
                          {formatSkinsPrice(itemValue, values.currency as SkinsCurrency)}
                          <ThemeText tone="faint" className="mt-0.5 block text-[10px]">
                            {values.valueMode === 'with_tax' ? 'Com taxa' : 'Base'}
                          </ThemeText>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.0001"
                            value={item.probability}
                            onChange={(e) =>
                              handleProbabilityChange(item.skinName, e.target.value)
                            }
                            className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap font-semibold text-brand-700 dark:text-brand-400">
                          {formatSkinsPrice(veItem, values.currency as SkinsCurrency)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                          {formatSkinsPrice(item.basePrice, values.currency as SkinsCurrency)}
                        </td>
                        <td className="px-3 py-3 text-zinc-500 dark:text-zinc-400">
                          {item.taxPercent}%
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                          {formatSkinsPrice(item.priceWithTax, values.currency as SkinsCurrency)}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.skinName)}
                            className={surfaceClass('ghostIconButton')}
                            aria-label="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {typeof formik.errors.items === 'string' ? (
            <ThemeText as="p" tone="secondary" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {formik.errors.items}
            </ThemeText>
          ) : null}
        </Surface>

        <Surface variant="card" className="!p-6">
          <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
            Preço da caixa
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
            Com base no VE total dos itens ({formatSkinsPrice(totalEV, values.currency as SkinsCurrency)}),
            defina margem, desconto e preço de abertura da caixa.
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
              onBlur={formik.handleBlur}
              error={fieldError(
                formik.touched.targetMarginPercent,
                formik.errors.targetMarginPercent,
              )}
            />
            <Input
              label="Meta soma chances (%)"
              name="probabilityTargetPercent"
              type="number"
              min={0}
              max={100}
              step="0.0001"
              value={values.probabilityTargetPercent}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={fieldError(
                formik.touched.probabilityTargetPercent,
                formik.errors.probabilityTargetPercent,
              )}
            />
            <Input
              label="Tolerância soma (%)"
              name="probabilityTolerance"
              type="number"
              min={0}
              max={5}
              step="0.0001"
              value={values.probabilityTolerance}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={fieldError(
                formik.touched.probabilityTolerance,
                formik.errors.probabilityTolerance,
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
                onBlur={formik.handleBlur}
                error={fieldError(formik.touched.listPrice, formik.errors.listPrice)}
              />
              <button
                type="button"
                onClick={handleApplySuggestedPrice}
                className="mt-2 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
              >
                Usar sugerido ({formatSkinsPrice(suggestedPrice, values.currency as SkinsCurrency)})
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
              onBlur={formik.handleBlur}
              error={fieldError(
                formik.touched.discountPercent,
                formik.errors.discountPercent,
              )}
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
                onBlur={formik.handleBlur}
                error={fieldError(formik.touched.price, formik.errors.price)}
              />
              <button
                type="button"
                onClick={handleApplyDiscountPrice}
                className="mt-2 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
              >
                Aplicar desconto ({formatSkinsPrice(priceFromDiscount, values.currency as SkinsCurrency)})
              </button>
            </div>
          </div>
        </Surface>

        <CaseEconomicsPanel
          items={economicsItems}
          currency={values.currency as SkinsCurrency}
          valueMode={values.valueMode as CaseValueMode}
          config={economicsConfig}
          listPrice={values.listPrice}
          finalPrice={values.price}
        />

        {formik.submitCount > 0 && formErrors.length > 0 ? (
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
        ) : null}

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

      <SkinPickerModal
        open={pickerOpen}
        skin={pickerSkin}
        currency={values.currency as SkinsCurrency}
        alreadyAdded={pickerSkin ? itemNames.has(pickerSkin.name) : false}
        onClose={() => {
          setPickerOpen(false)
          setPickerSkin(null)
        }}
        onConfirm={handleConfirmSkin}
      />
    </div>
  )
}
