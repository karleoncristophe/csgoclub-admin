import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { filterChipClass } from '@/components/skins/filterChipClass'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import useDebounce from '@/hooks/useDebounce'
import {
  useLazyGetSkinsCatalogQuery,
  type SkinsCatalogItem,
} from '@/redux/store/api/skins/api.skins'
import { useGetWeaponCategoriesQuery } from '@/redux/store/api/weapon-categories/api.weapon-categories'

const SKIN_SEARCH_PAGE_SIZE = 12

type CaseEditorSkinSearchSectionProps = {
  currency: SkinsCurrency
  addedSkinNames: Set<string>
  onAddSkin: (skin: SkinsCatalogItem) => void
}

export function CaseEditorSkinSearchSection({
  currency,
  addedSkinNames,
  onAddSkin,
}: CaseEditorSkinSearchSectionProps) {
  const [searchInput, setSearchInput] = useState('')
  const [skinWeaponType, setSkinWeaponType] = useState('')
  const [skinRarity, setSkinRarity] = useState('')
  const [skinSearchPage, setSkinSearchPage] = useState(1)
  const skinSearchAnchorRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  const [searchCatalog, searchState] = useLazyGetSkinsCatalogQuery()
  const { data: weaponCategories = [] } = useGetWeaponCategoriesQuery()

  useEffect(() => {
    setSkinSearchPage(1)
  }, [debouncedSearch, skinWeaponType, skinRarity, currency])

  useEffect(() => {
    void searchCatalog({
      search: debouncedSearch || undefined,
      currency,
      weaponType: skinWeaponType || undefined,
      rarity: skinRarity || undefined,
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
    <Surface variant="card" className="!p-6">
      <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
        Buscar skins
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
        Clique na skin para adicionar direto na tabela de itens.
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
            {searchResults.map((skin) => {
              const alreadyAdded = addedSkinNames.has(skin.name)
              return (
                <button
                  key={skin.name}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => onAddSkin(skin)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    alreadyAdded
                      ? 'cursor-not-allowed border-zinc-200/60 opacity-50 dark:border-zinc-800/60'
                      : 'border-zinc-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-800 dark:hover:border-brand-700 dark:hover:bg-brand-950/20'
                  }`}
                >
                  {skin.image ? (
                    <img src={skin.image} alt="" className="h-12 w-14 object-contain" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <ThemeText tone="primary" className="line-clamp-2 text-xs font-medium">
                      {skin.name}
                    </ThemeText>
                    <ThemeText tone="label" className="mt-1 text-[11px]">
                      {formatSkinsPrice(skin.priceWithTax, currency)} · taxa {skin.taxPercent}%
                    </ThemeText>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-brand-600" />
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
    </Surface>
  )
}
