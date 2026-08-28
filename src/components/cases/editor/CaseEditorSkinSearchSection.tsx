import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { filterChipClass } from '@/components/skins/filterChipClass'
import { EditorSectionShell } from '@/components/cases/editor/EditorSectionShell'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { SkinTripleCurrencyPrices } from '@/components/skins/SkinTripleCurrencyPrices'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import useDebounce from '@/hooks/useDebounce'
import {
  useLazyGetSkinsCatalogQuery,
  type CatalogSort,
  type SkinsCatalogItem,
} from '@/redux/store/api/skins/api.skins'
import { useGetWeaponCategoriesQuery } from '@/redux/store/api/weapon-categories/api.weapon-categories'

const SKIN_SEARCH_PAGE_SIZE = 20

function parseOptionalPrice(value: string): number | undefined {
  if (!value) return undefined
  const amount = Number(value.replace(',', '.'))
  if (!Number.isFinite(amount) || amount < 0) return undefined
  return amount
}

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
    catalogSort,
  ])

  useEffect(() => {
    void searchCatalog({
      search: debouncedSearch || undefined,
      currency,
      weaponType: skinWeaponType || undefined,
      rarity: skinRarity || undefined,
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

  return (
    <EditorSectionShell embedded={embedded}>
      {embedded ? null : (
        <>
          <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
            Buscar skins
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
            Clique na skin para adicionar. Clique de novo para remover.
          </ThemeText>
        </>
      )}

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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preço mín. ({currency})
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preço máx. ({currency})
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <Select
          label="Ordenar"
          name="skinCatalogSort"
          value={catalogSort}
          onChange={(e) => setCatalogSort(e.target.value as CatalogSort)}
        >
          <option value="price_desc">Mais cara primeiro</option>
          <option value="price_asc">Mais barata primeiro</option>
          <option value="name_asc">A–Z</option>
          <option value="name_desc">Z–A</option>
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
            {searchResults.map((skin) => {
              const selected = addedSkinNames.has(skin.name)
              return (
                <button
                  key={skin.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleSkin(skin)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-inset ring-brand-400/40 dark:border-brand-400/50 dark:bg-brand-500/15 dark:ring-brand-400/25'
                      : 'border-zinc-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-800 dark:hover:border-brand-700 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  {skin.image ? (
                    <img src={skin.image} alt="" className="h-12 w-14 object-contain" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <ThemeText tone="primary" className="line-clamp-2 text-xs font-medium">
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
                        {formatSkinsPrice(skin.priceWithTax, currency)} · taxa {skin.taxPercent}%
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
    </EditorSectionShell>
  )
}
