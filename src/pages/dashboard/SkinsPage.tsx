import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  formatSkinsPrice,
  SKINS_CURRENCY_OPTIONS,
  SkinsCurrency,
} from '@/constants/skinsCurrency'
import { useAdminPreferences } from '@/theme/AdminPreferencesContext'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { listTable, linkBrand } from '@/components/ui/listTable'
import {
  useGetSkinsCatalogQuery,
} from '@/redux/store/api/skins/api.skins'
import { useGetWeaponCategoriesQuery } from '@/redux/store/api/weapon-categories/api.weapon-categories'
import useDebounce from '@/hooks/useDebounce'
import {
  parseBoundedInt,
  parsePositiveInt,
  useUrlFilters,
} from '@/hooks/useUrlFilters'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  getSkinWeaponName,
  getSkinWeaponType,
} from '@/utils/skinWeaponType'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'

const PAGE_SIZE_OPTIONS = [12, 24, 30, 48, 60, 100] as const
const DEFAULT_PAGE_SIZE = 30

const SKINS_FILTER_DEFAULTS = {
  q: '',
  weapon: '',
  rarity: '',
  minP: '0',
  maxP: '100',
  page: '1',
  limit: String(DEFAULT_PAGE_SIZE),
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function toPercentPriceRange(
  min: number,
  max: number,
  minPercent: number,
  maxPercent: number,
) {
  if (max <= min) return { minPrice: min, maxPrice: max }
  const range = max - min
  return {
    minPrice: min + (range * minPercent) / 100,
    maxPrice: min + (range * maxPercent) / 100,
  }
}

export default function SkinsPage() {
  const productsAnchorRef = useRef<HTMLDivElement>(null)
  const { skinsCurrency, setSkinsCurrency } = useAdminPreferences()
  const { filters, setFilters, setFilter } = useUrlFilters(SKINS_FILTER_DEFAULTS)

  const [searchInput, setSearchInput] = useState(filters.q)
  useEffect(() => {
    setSearchInput(filters.q)
  }, [filters.q])

  const [minPercentInput, setMinPercentInput] = useState(() =>
    clampPercent(Number(filters.minP)),
  )
  const [maxPercentInput, setMaxPercentInput] = useState(() =>
    clampPercent(Number(filters.maxP)),
  )
  useEffect(() => {
    setMinPercentInput(clampPercent(Number(filters.minP)))
  }, [filters.minP])
  useEffect(() => {
    setMaxPercentInput(clampPercent(Number(filters.maxP)))
  }, [filters.maxP])

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  const debouncedMinPercent = useDebounce(minPercentInput, 350)
  const debouncedMaxPercent = useDebounce(maxPercentInput, 350)

  useEffect(() => {
    if (debouncedSearch === filters.q) return
    setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  useEffect(() => {
    const minP = String(clampPercent(debouncedMinPercent))
    const maxP = String(clampPercent(debouncedMaxPercent))
    if (minP === filters.minP && maxP === filters.maxP) return
    setFilters({ minP, maxP })
  }, [
    debouncedMinPercent,
    debouncedMaxPercent,
    filters.minP,
    filters.maxP,
    setFilters,
  ])

  const minPercent = Math.min(debouncedMinPercent, debouncedMaxPercent)
  const maxPercent = Math.max(debouncedMinPercent, debouncedMaxPercent)
  const page = parsePositiveInt(filters.page, 1)
  const itemsPerPage = parseBoundedInt(
    filters.limit,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS[0],
    PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1],
  )
  const safePage = Math.max(page, 1)

  const { data: weaponCategories = [] } = useGetWeaponCategoriesQuery()

  const { data, isLoading, isFetching, isError, error } = useGetSkinsCatalogQuery({
    currency: skinsCurrency,
    search: debouncedSearch || undefined,
    weaponType: filters.weapon || undefined,
    rarity: filters.rarity || undefined,
    minPricePercent: minPercent,
    maxPricePercent: maxPercent,
    limit: itemsPerPage,
    offset: (safePage - 1) * itemsPerPage,
  })

  const catalogItems = data?.items ?? []
  const catalogTotal = data?.total ?? 0
  const pageLimit = data?.limit ?? itemsPerPage
  const totalPages = Math.max(1, Math.ceil(catalogTotal / pageLimit))

  const currentPage = Math.min(safePage, totalPages)

  const priceRange = data?.priceRange ?? { min: 0, max: 0 }
  const selectedPriceRange = useMemo(
    () => toPercentPriceRange(priceRange.min, priceRange.max, minPercent, maxPercent),
    [priceRange.min, priceRange.max, minPercent, maxPercent],
  )

  const typeCounters = useMemo(() => {
    const counts = data?.typeCounts ?? {}
    return Object.entries(counts)
      .filter(([type]) => type !== 'Other')
      .sort((a, b) => b[1] - a[1])
  }, [data?.typeCounts])

  const rarityOptions = data?.rarityOptions ?? []

  const pageStart = catalogTotal === 0 ? 0 : (currentPage - 1) * pageLimit + 1
  const pageEnd = Math.min(currentPage * pageLimit, catalogTotal)

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Catálogo com filtros por tipo, raridade e preço. Paginação configurável via API.">
        Skins
      </PageTitle>

      <Surface variant="card">
        <div className="grid gap-3 p-5 pb-4 md:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Moeda"
            name="currency"
            value={skinsCurrency}
            onChange={(e) => {
              setSkinsCurrency(e.target.value as SkinsCurrency)
              setFilter('page', '1', { resetPage: false })
            }}
          >
            {SKINS_CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Input
            label="Buscar skin"
            name="searchSkin"
            placeholder="Ex.: AK-47, AWP, Fade..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
          />

          <Select
            label="Tipo da arma"
            name="weaponType"
            value={filters.weapon}
            onChange={(e) => setFilter('weapon', e.target.value)}
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
            name="rarity"
            value={filters.rarity}
            onChange={(e) => setFilter('rarity', e.target.value)}
          >
            <option value="">Todas</option>
            {rarityOptions.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name} ({option.count})
              </option>
            ))}
          </Select>

          <Select
            label="Itens por página"
            name="pageSize"
            value={String(itemsPerPage)}
            onChange={(e) => setFilter('limit', e.target.value)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>

          <Input
            label="Preço mínimo (%)"
            name="minPercent"
            type="number"
            min={0}
            max={100}
            value={String(minPercentInput)}
            onChange={(e) => setMinPercentInput(clampPercent(Number(e.target.value)))}
          />

          <Input
            label="Preço máximo (%)"
            name="maxPercent"
            type="number"
            min={0}
            max={100}
            value={String(maxPercentInput)}
            onChange={(e) => setMaxPercentInput(clampPercent(Number(e.target.value)))}
          />
        </div>

        <div className="mb-4 grid gap-3 px-5 sm:grid-cols-2 lg:grid-cols-4">
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Página atual
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
              {catalogItems.length}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-xs">
              itens ({pageStart}-{pageEnd}) · {pageLimit}/página
            </ThemeText>
          </Surface>
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Total filtrado
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
              {catalogTotal}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-xs">
              páginas: {totalPages}
            </ThemeText>
          </Surface>
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Faixa de preço base
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(priceRange.min, skinsCurrency)} - {formatSkinsPrice(priceRange.max, skinsCurrency)}
            </ThemeText>
          </Surface>
          <Surface variant="statTile" className="!p-4">
            <ThemeText as="p" tone="label" className="text-xs uppercase">
              Faixa selecionada
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(selectedPriceRange.minPrice, skinsCurrency)} -{' '}
              {formatSkinsPrice(selectedPriceRange.maxPrice, skinsCurrency)}
            </ThemeText>
          </Surface>
        </div>

        <div className="mb-6 px-5">
          <SectionTitle>Tipos no catálogo (após busca)</SectionTitle>
          <SegmentedTabs
            ariaLabel="Tipo da arma"
            className="mt-3"
            value={filters.weapon || 'all'}
            items={[
              { id: 'all', label: 'Todos' },
              ...typeCounters.map(([type, count]) => ({
                id: type,
                label: `${type} (${count})`,
              })),
            ]}
            onChange={(next) => setFilter('weapon', next === 'all' ? '' : next)}
          />
        </div>

        {rarityOptions.length > 0 ? (
          <div className="mb-6 px-5">
            <SectionTitle>Raridades (após busca e tipo)</SectionTitle>
            <SegmentedTabs
              ariaLabel="Raridade"
              className="mt-3"
              value={filters.rarity || 'all'}
              items={[
                { id: 'all', label: 'Todas' },
                ...rarityOptions.map((option) => ({
                  id: option.name,
                  label: `${option.name} (${option.count})`,
                })),
              ]}
              onChange={(next) => setFilter('rarity', next === 'all' ? '' : next)}
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            Carregando catálogo de skins...
          </div>
        ) : null}

        {isError ? (
          <p className={`mb-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(error)}
          </p>
        ) : null}

        {!isLoading && !isError && catalogItems.length === 0 ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Nenhuma skin encontrada com os filtros atuais.
          </ThemeText>
        ) : null}

        {!isLoading && !isError && catalogItems.length > 0 ? (
          <div ref={productsAnchorRef} className={`scroll-mt-6 ${listTable.wrap}`}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Skin</th>
                  <th className={listTable.th}>Arma</th>
                  <th className={listTable.th}>Raridade</th>
                  <th className={`${listTable.th} text-right`}>Preço base</th>
                  <th className={`${listTable.th} text-right`}>Preço final</th>
                  <th className={`${listTable.th} text-right`}>Estoque</th>
                  <th className={`${listTable.th} text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {catalogItems.map((skin) => (
                  <tr key={`${skin.name}-${skin.classId ?? ''}`} className={listTable.tr}>
                    <td className={listTable.tdStrong}>
                      <div className="flex min-w-[260px] items-center gap-3">
                        <SkinRarityVisual rarity={skin.rarity} className="h-12 w-16 shrink-0" showStar={false}>
                          {skin.image ? (
                            <img src={skin.image} alt="" loading="lazy" className="max-h-10 max-w-full object-contain" />
                          ) : null}
                        </SkinRarityVisual>
                        <span className="line-clamp-2">{skin.name}</span>
                      </div>
                    </td>
                    <td className={listTable.td}>
                      <span className="whitespace-nowrap">{getSkinWeaponType(skin.name)}</span>
                      <span className="block text-xs text-muted">{getSkinWeaponName(skin.name)}</span>
                    </td>
                    <td className={listTable.td}>
                      <span style={{ color: skin.rarity?.color }}>{skin.rarity?.name ?? '—'}</span>
                    </td>
                    <td className={`${listTable.tdMuted} text-right`}>
                      {formatSkinsPrice(skin.price, skin.currency)}
                      {skin.taxPercent > 0 ? <span className="block text-[11px]">taxa {skin.taxPercent}%</span> : null}
                    </td>
                    <td className={`${listTable.tdStrong} text-right tabular-nums`}>
                      {formatSkinsPrice(skin.priceWithTax ?? skin.price, skin.currency)}
                    </td>
                    <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                      {skin.availableCount ?? 0}
                    </td>
                    <td className={`${listTable.td} text-right`}>
                      <Link
                        to={`/dashboard/skins/item?name=${encodeURIComponent(skin.name)}&currency=${skinsCurrency}`}
                        className={linkBrand}
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <Pagination
          className="p-5"
          page={currentPage}
          totalPages={totalPages}
          scrollTargetRef={productsAnchorRef}
          onPageChange={(next) =>
            setFilter('page', String(Math.min(Math.max(next, 1), totalPages)), {
              resetPage: false,
            })
          }
        />

        {isFetching && !isLoading ? (
          <ThemeText as="p" tone="faint" className="mt-3 text-center text-xs">
            Atualizando página...
          </ThemeText>
        ) : null}
      </Surface>
    </div>
  )
}
