import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { CatalogFiltersCard } from '@/components/skins/CatalogFiltersCard'
import { CatalogQuickFilterCards } from '@/components/skins/CatalogQuickFilterCards'
import { EditorSectionShell } from '@/components/cases/editor/EditorSectionShell'
import { Pagination } from '@/components/ui/Pagination'
import { ThemeText } from '@/components/ui/ThemeText'
import { SkinTripleCurrencyPrices } from '@/components/skins/SkinTripleCurrencyPrices'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import useDebounce from '@/hooks/useDebounce'
import {
  useLazyGetSkinsCatalogQuery,
  type CatalogSort,
  type SkinsCatalogItem,
} from '@/redux/store/api/skins/api.skins'
import { useGetWeaponCategoriesQuery } from '@/redux/store/api/weapon-categories/api.weapon-categories'
import {
  parseOptionalPrice,
  type SkinWearCode,
} from '@/constants/skinCatalogFlags'

const SKIN_SEARCH_PAGE_SIZE = 20

type CaseEditorSkinSearchSectionProps = {
  currency: SkinsCurrency
  addedSkinNames: Set<string>
  onToggleSkin: (skin: SkinsCatalogItem) => void
  /** Renderiza sem o card externo e sem título (uso dentro de modal) */
  embedded?: boolean
  /** Arena: mostra BRL + USD + EUR no card da skin. */
  showPrizeValues?: boolean
}

export function CaseEditorSkinSearchSection({
  currency,
  addedSkinNames,
  onToggleSkin,
  embedded = false,
  showPrizeValues = false,
}: CaseEditorSkinSearchSectionProps) {
  const [searchInput, setSearchInput] = useState('')
  const [skinWeaponType, setSkinWeaponType] = useState('')
  const [skinRarity, setSkinRarity] = useState('')
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [skinWears, setSkinWears] = useState<SkinWearCode[]>([])
  const [skinStattrak, setSkinStattrak] = useState(false)
  const [skinSouvenir, setSkinSouvenir] = useState(false)
  const [catalogSort, setCatalogSort] = useState<CatalogSort>('price_desc')
  const [skinSearchPage, setSkinSearchPage] = useState(1)
  const skinSearchAnchorRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  const debouncedMinPrice = useDebounce(minPriceInput.trim(), 150)
  const debouncedMaxPrice = useDebounce(maxPriceInput.trim(), 150)
  const [searchCatalog, searchState] = useLazyGetSkinsCatalogQuery()
  const { data: weaponCategories = [] } = useGetWeaponCategoriesQuery()

  const minPrice = parseOptionalPrice(debouncedMinPrice)
  const maxPrice = parseOptionalPrice(debouncedMaxPrice)

  useEffect(() => {
    setSkinSearchPage(1)
  }, [
    debouncedSearch,
    skinWeaponType,
    skinRarity,
    currency,
    minPrice,
    maxPrice,
    skinWears,
    skinStattrak,
    skinSouvenir,
    catalogSort,
  ])

  useEffect(() => {
    void searchCatalog({
      search: debouncedSearch || undefined,
      currency,
      weaponType: skinWeaponType || undefined,
      rarity: skinRarity || undefined,
      wear: skinWears.length ? skinWears : undefined,
      stattrak: skinStattrak || undefined,
      souvenir: skinSouvenir || undefined,
      sort: catalogSort,
      ...(typeof minPrice === 'number' ? { minPrice } : {}),
      ...(typeof maxPrice === 'number' ? { maxPrice } : {}),
      limit: SKIN_SEARCH_PAGE_SIZE,
      offset: (skinSearchPage - 1) * SKIN_SEARCH_PAGE_SIZE,
    })
  }, [
    debouncedSearch,
    currency,
    skinWeaponType,
    skinRarity,
    skinSearchPage,
    searchCatalog,
    catalogSort,
    minPrice,
    maxPrice,
    skinWears,
    skinStattrak,
    skinSouvenir,
  ])

  const searchResults = searchState.data?.items ?? []
  const skinSearchTotal = searchState.data?.total ?? 0
  const skinSearchLimit = searchState.data?.limit ?? SKIN_SEARCH_PAGE_SIZE
  const skinSearchTotalPages = Math.max(
    1,
    Math.ceil(skinSearchTotal / skinSearchLimit),
  )
  const skinSearchCurrentPage = Math.min(skinSearchPage, skinSearchTotalPages)
  const skinSearchPageStart =
    skinSearchTotal === 0
      ? 0
      : (skinSearchCurrentPage - 1) * skinSearchLimit + 1
  const skinSearchPageEnd = Math.min(
    skinSearchCurrentPage * skinSearchLimit,
    skinSearchTotal,
  )
  const skinRarityOptions = searchState.data?.rarityOptions ?? []
  const resetFilters = () => {
    setSkinWeaponType('')
    setSkinRarity('')
    setMinPriceInput('')
    setMaxPriceInput('')
    setSkinWears([])
    setSkinStattrak(false)
    setSkinSouvenir(false)
    setCatalogSort('price_desc')
  }
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

  return (
    <EditorSectionShell embedded={embedded}>
      {embedded ? null : (
        <>
          <ThemeText
            as="h2"
            tone="primary"
            className="mb-1 text-base font-semibold"
          >
            Buscar skins
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
            Clique na skin para adicionar. Clique de novo para remover.
          </ThemeText>
        </>
      )}

      <div className="mb-5">
        <CatalogFiltersCard
          weaponType={skinWeaponType}
          onWeaponTypeChange={setSkinWeaponType}
          rarity={skinRarity}
          onRarityChange={setSkinRarity}
          rarityOptions={skinRarityOptions}
          weaponCategories={weaponCategories}
          currencyLabel={currency}
          minPriceInput={minPriceInput}
          maxPriceInput={maxPriceInput}
          onMinPriceChange={setMinPriceInput}
          onMaxPriceChange={setMaxPriceInput}
          sort={catalogSort}
          onSortChange={setCatalogSort}
          wears={skinWears}
          onWearsChange={setSkinWears}
          stattrak={skinStattrak}
          onStattrakChange={setSkinStattrak}
          souvenir={skinSouvenir}
          onSouvenirChange={setSkinSouvenir}
          onReset={resetFilters}
        />
      </div>

      <CatalogQuickFilterCards
        typeCounters={skinTypeCounters}
        weaponType={skinWeaponType}
        onWeaponTypeChange={setSkinWeaponType}
        rarityOptions={skinRarityOptions}
        rarity={skinRarity}
        onRarityChange={setSkinRarity}
      />

      <div className="sticky top-0 z-10 -mx-1 mb-4 rounded-2xl border border-border bg-overlay/95 p-3 shadow-lg shadow-black/10 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por arma, skin ou acabamento..."
              className="h-11 w-full rounded-xl border border-field-border bg-field pl-10 pr-4 text-sm text-foreground outline-none shadow-field transition placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20"
              autoComplete="off"
            />
          </div>
          <ThemeText
            tone="secondary"
            className="shrink-0 text-xs tabular-nums sm:text-right"
          >
            {skinSearchTotal} skin{skinSearchTotal === 1 ? '' : 's'} encontrada
            {skinSearchTotal === 1 ? '' : 's'}
          </ThemeText>
        </div>
      </div>

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
          <ThemeText tone="label" className="mb-3 block text-xs">
            {skinSearchPageStart}–{skinSearchPageEnd} de {skinSearchTotal} skins
          </ThemeText>
          <div
            ref={skinSearchAnchorRef}
            className="scroll-mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {searchResults.map((skin) => {
              const selected = addedSkinNames.has(skin.name)
              return (
                <button
                  key={skin.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleSkin(skin)}
                  className={`flex min-h-24 items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 ${
                    selected
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-inset ring-brand-400/40 dark:border-brand-400/50 dark:bg-brand-500/15 dark:ring-brand-400/25'
                      : 'border-border bg-surface hover:border-accent/40 hover:bg-default'
                  }`}
                >
                  {skin.image ? (
                    <img
                      src={skin.image}
                      alt=""
                      className="h-12 w-14 object-contain"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <ThemeText
                      tone="primary"
                      className="line-clamp-2 text-xs font-medium"
                    >
                      {skin.name}
                    </ThemeText>
                    {showPrizeValues ? (
                      <SkinTripleCurrencyPrices
                        compact
                        valueBrl={skin.valueBrl}
                        valueUsd={skin.valueUsd}
                        valueEur={skin.valueEur}
                      />
                    ) : (
                      <ThemeText tone="label" className="mt-1 text-[11px]">
                        {formatSkinsPrice(skin.priceWithTax, currency)} · taxa{' '}
                        {skin.taxPercent}%
                      </ThemeText>
                    )}
                  </div>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-brand-600" />
                  )}
                </button>
              )
            })}
          </div>

          <Pagination
            className="mt-6"
            page={skinSearchCurrentPage}
            totalPages={skinSearchTotalPages}
            scrollTargetRef={skinSearchAnchorRef}
            onPageChange={(next) =>
              setSkinSearchPage(
                Math.min(Math.max(next, 1), skinSearchTotalPages),
              )
            }
          />

          {searchState.isFetching ? (
            <ThemeText as="p" tone="faint" className="mt-3 text-center text-xs">
              Atualizando página...
            </ThemeText>
          ) : null}
        </>
      ) : null}
    </EditorSectionShell>
  )
}
