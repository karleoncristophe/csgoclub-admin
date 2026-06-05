import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { filterChipClass } from '@/components/skins/filterChipClass'
import useDebounce from '@/hooks/useDebounce'
import { labelFilterBoolean } from '@/i18n/enumLabels'
import { useGetUserInventoryQuery } from '@/redux/store/api/users/api.users'
import { useGetWeaponCategoriesQuery } from '@/redux/store/api/weapon-categories/api.weapon-categories'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  getSkinWeaponName,
  getSkinWeaponType,
} from '@/utils/skinWeaponType'

const PAGE_SIZE_OPTIONS = [12, 24, 30, 48, 60] as const
const DEFAULT_PAGE_SIZE = 24

function formatPrice(value: number | null | undefined, currency: string) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: (currency || 'BRL').toUpperCase(),
  }).format(value)
}

export function UserInventoryPanel({ userId }: { userId: string }) {
  const productsAnchorRef = useRef<HTMLDivElement>(null)
  const [searchInput, setSearchInput] = useState('')
  const [weaponTypeFilter, setWeaponTypeFilter] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [tradableFilter, setTradableFilter] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE)

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  const safePage = Math.max(page, 1)

  const { data: weaponCategories = [] } = useGetWeaponCategoriesQuery()

  const { data, isLoading, isFetching, isError, error } = useGetUserInventoryQuery({
    userId,
    currency: 'BRL',
    search: debouncedSearch || undefined,
    weaponType: weaponTypeFilter || undefined,
    rarity: rarityFilter || undefined,
    tradable:
      tradableFilter === 'true'
        ? true
        : tradableFilter === 'false'
          ? false
          : undefined,
    limit: itemsPerPage,
    offset: (safePage - 1) * itemsPerPage,
  })

  const items = data?.items ?? []
  const totalFiltered = data?.total ?? 0
  const totalInventory = data?.totalInventoryCount ?? 0
  const pageLimit = data?.limit ?? itemsPerPage
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageLimit))
  const currentPage = Math.min(safePage, totalPages)
  const pageStart = totalFiltered === 0 ? 0 : (currentPage - 1) * pageLimit + 1
  const pageEnd = Math.min(currentPage * pageLimit, totalFiltered)
  const priceRange = data?.priceRange ?? { min: 0, max: 0 }
  const rarityOptions = data?.rarityOptions ?? []

  const typeCounters = useMemo(() => {
    const counts = data?.typeCounts ?? {}
    return Object.entries(counts)
      .filter(([type]) => type !== 'Other')
      .sort((a, b) => b[1] - a[1])
  }, [data?.typeCounts])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const resetPage = () => setPage(1)

  return (
    <Surface variant="card" className="!p-6 sm:!p-6">
      <SectionTitle className="mb-2">Inventário CS2</SectionTitle>
      <ThemeText as="p" tone="secondary" className="mb-6 text-sm">
        Skins do inventário Steam do usuário, com preços do SkinsBack.
      </ThemeText>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input
          label="Buscar skin"
          name="searchInventory"
          placeholder="Ex.: AK-47, AWP, Fade..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            resetPage()
          }}
          autoComplete="off"
        />

        <Select
          label="Tipo da arma"
          name="weaponType"
          value={weaponTypeFilter}
          onChange={(e) => {
            setWeaponTypeFilter(e.target.value)
            resetPage()
          }}
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
          value={rarityFilter}
          onChange={(e) => {
            setRarityFilter(e.target.value)
            resetPage()
          }}
        >
          <option value="">Todas</option>
          {rarityOptions.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name} ({option.count})
            </option>
          ))}
        </Select>

        <Select
          label="Negociável"
          name="tradable"
          value={tradableFilter}
          onChange={(e) => {
            setTradableFilter(e.target.value)
            resetPage()
          }}
        >
          <option value="">Todos</option>
          <option value="true">{labelFilterBoolean('true')}</option>
          <option value="false">{labelFilterBoolean('false')}</option>
        </Select>

        <Select
          label="Itens por página"
          name="pageSize"
          value={String(itemsPerPage)}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value))
            resetPage()
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface variant="statTile" className="!p-4">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Inventário Steam
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
            {totalInventory}
          </ThemeText>
          <ThemeText as="p" tone="faint" className="text-xs">
            itens no total
          </ThemeText>
        </Surface>
        <Surface variant="statTile" className="!p-4">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Após filtros
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
            {totalFiltered}
          </ThemeText>
          <ThemeText as="p" tone="faint" className="text-xs">
            páginas: {totalPages}
          </ThemeText>
        </Surface>
        <Surface variant="statTile" className="!p-4">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Página atual
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold">
            {items.length}
          </ThemeText>
          <ThemeText as="p" tone="faint" className="text-xs">
            itens ({pageStart}-{pageEnd})
          </ThemeText>
        </Surface>
        <Surface variant="statTile" className="!p-4">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Faixa de preço
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
            {formatPrice(priceRange.min, 'BRL')} - {formatPrice(priceRange.max, 'BRL')}
          </ThemeText>
        </Surface>
      </div>

      {typeCounters.length > 0 ? (
        <div className="mb-6">
          <ThemeText as="p" tone="label" className="mb-3 text-xs uppercase">
            Tipos no inventário (após busca)
          </ThemeText>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {typeCounters.map(([type, count]) => {
              const active = weaponTypeFilter === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setWeaponTypeFilter(active ? '' : type)
                    resetPage()
                  }}
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

      {rarityOptions.length > 0 ? (
        <div className="mb-6">
          <ThemeText as="p" tone="label" className="mb-3 text-xs uppercase">
            Raridades (após busca e tipo)
          </ThemeText>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {rarityOptions.map((option) => {
              const active = rarityFilter === option.name
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => {
                    setRarityFilter(active ? '' : option.name)
                    resetPage()
                  }}
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

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando inventário...
        </div>
      ) : null}

      {isError ? (
        <p className={`mb-4 ${surfaceClass('errorBanner')}`}>
          {getErrorMessage(error)}
        </p>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <ThemeText as="p" tone="secondary" className="py-8 text-sm">
          {totalInventory === 0
            ? 'Inventário vazio ou privado na Steam.'
            : 'Nenhuma skin encontrada com os filtros atuais.'}
        </ThemeText>
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <div
          ref={productsAnchorRef}
          className="scroll-mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {items.map((skin) => (
            <Link
              key={skin.assetId}
              to={`/dashboard/skins/item?name=${encodeURIComponent(skin.name)}`}
              className="group block rounded-xl transition hover:opacity-95"
            >
              <Surface variant="cardInset" className="!p-4">
                <SkinRarityVisual rarity={skin.rarity} className="mb-3 h-28">
                  {skin.image ? (
                    <img
                      src={skin.image}
                      alt={skin.name}
                      loading="lazy"
                      className="h-full max-h-24 w-auto object-contain transition-[filter] duration-300 group-hover:drop-shadow-[0_4px_16px_color-mix(in_srgb,var(--skin-color)_25%,transparent)]"
                      style={
                        skin.rarity?.color
                          ? ({ '--skin-color': skin.rarity.color } as CSSProperties)
                          : undefined
                      }
                    />
                  ) : (
                    <ThemeText as="span" tone="faint" className="text-xs">
                      Sem imagem
                    </ThemeText>
                  )}
                </SkinRarityVisual>
                <ThemeText as="p" tone="primary" className="line-clamp-2 text-sm font-semibold">
                  {skin.name}
                </ThemeText>
                <ThemeText as="p" tone="secondary" className="mt-1 text-xs">
                  {skin.weaponType ?? getSkinWeaponType(skin.name)} ·{' '}
                  {getSkinWeaponName(skin.name)}
                  {skin.wear ? ` · ${skin.wear}` : ''}
                  {skin.rarity?.name ? ` · ${skin.rarity.name}` : ''}
                </ThemeText>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <ThemeText as="p" tone="primary" className="text-base font-semibold">
                    {formatPrice(skin.priceLocal ?? skin.price, skin.currency)}
                  </ThemeText>
                  <ThemeText as="p" tone="faint" className="text-xs">
                    {skin.tradable ? 'Negociável' : 'Bloqueado'}
                  </ThemeText>
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      ) : null}

      <Pagination
        className="mt-6"
        page={currentPage}
        totalPages={totalPages}
        scrollTargetRef={productsAnchorRef}
        onPageChange={(next) => setPage(Math.min(Math.max(next, 1), totalPages))}
      />

      {isFetching && !isLoading ? (
        <ThemeText as="p" tone="faint" className="mt-3 text-center text-xs">
          Atualizando inventário...
        </ThemeText>
      ) : null}
    </Surface>
  )
}
