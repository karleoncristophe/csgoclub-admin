import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Package, Search } from 'lucide-react'
import { ARENA_RARITY_LABEL, ARENA_RARITY_OPTIONS } from '@/components/arena/arenaRarity'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { listTable, linkBrand } from '@/components/ui/listTable'
import useDebounce from '@/hooks/useDebounce'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import {
  ARENA_RARITIES,
  useGetArenaCrateOpensQuery,
  useGetArenaCratesQuery,
  type ArenaCrateOpenMethod,
  type ArenaCrateOpenSort,
  type ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { filterChipClasses, userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const

const FILTER_DEFAULTS = {
  crateId: '',
  matchId: '',
  q: '',
  page: '1',
  limit: '30',
  currency: '',
  rarity: '',
  method: '',
  from: '',
  to: '',
  min: '',
  max: '',
  sort: 'newest',
}

const CURRENCY_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'BRL', label: 'BRL' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
]

const METHOD_TABS: Array<{ id: ArenaCrateOpenMethod | 'all'; label: string }> = [
  { id: 'all', label: 'Sorteio' },
  { id: 'direct', label: 'Direto' },
  { id: 'reroll', label: 'Reroll' },
  { id: 'fallback', label: 'Fallback' },
]

function formatMoney(value: number, currency = 'BRL') {
  const code =
    currency === 'BRL' || currency === 'USD' || currency === 'EUR'
      ? currency
      : 'BRL'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function methodLabel(method?: string) {
  if (method === 'reroll') return 'Reroll'
  if (method === 'fallback') return 'Fallback'
  return 'Direto'
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined
}

function StatCard({
  label,
  value,
  hint,
  variant = 'default',
}: {
  label: string
  value: string
  hint: string
  variant?: keyof typeof userStatCardSpaciousClass
}) {
  return (
    <div className={userStatCardSpaciousClass[variant]}>
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="p" tone="primary" className="mt-1 text-lg font-semibold">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-2 text-xs leading-relaxed">
        {hint}
      </ThemeText>
    </div>
  )
}

export default function ArenaCrateOpensPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(FILTER_DEFAULTS)
  const { data: crates } = useGetArenaCratesQuery()

  const [searchInput, setSearchInput] = useState(filters.q)
  useEffect(() => {
    setSearchInput(filters.q)
  }, [filters.q])

  const debouncedSearch = useDebounce(searchInput.trim(), 300)
  useEffect(() => {
    if (debouncedSearch === filters.q) return
    setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  const page = parsePositiveInt(filters.page, 1)
  const limit = PAGE_SIZE_OPTIONS.includes(
    parsePositiveInt(filters.limit, 30) as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? parsePositiveInt(filters.limit, 30)
    : 30
  const safePage = Math.max(page, 1)
  const crateId = filters.crateId
  const matchId = filters.matchId
  const currency = filters.currency
  const rarity = filters.rarity as ArenaRarity | ''
  const method = filters.method as ArenaCrateOpenMethod | ''
  const minValue = parseOptionalNumber(filters.min)
  const maxValue = parseOptionalNumber(filters.max)
  const sort = (filters.sort || 'newest') as ArenaCrateOpenSort

  const { data, isLoading, isFetching, isError, error } = useGetArenaCrateOpensQuery({
    page: safePage,
    limit,
    dataEnvironment,
    ...(crateId ? { crateId } : {}),
    ...(matchId ? { matchId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(currency ? { currency } : {}),
    ...(rarity ? { rarity } : {}),
    ...(method ? { method } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(minValue != null ? { minValue } : {}),
    ...(maxValue != null ? { maxValue } : {}),
    ...(sort !== 'newest' ? { sort } : {}),
  })

  const summary = data?.summary
  const opens = data?.data ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const summaryCurrency = currency || 'BRL'

  const selectedCrateName = useMemo(
    () => crates?.find((crate) => crate._id === crateId)?.name,
    [crates, crateId],
  )

  const hasExtraFilters = Boolean(
    crateId ||
      matchId ||
      currency ||
      rarity ||
      method ||
      filters.from ||
      filters.to ||
      filters.min ||
      filters.max ||
      sort !== 'newest' ||
      filters.limit !== FILTER_DEFAULTS.limit,
  )

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

  return (
    <div className="space-y-6">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Skins sorteadas ao abrir crates da Arena (teste/influencer). Visão Dev.'
            : 'Skins sorteadas ao abrir crates da Arena. Visão Produção.'
        }
      >
        Aberturas Arena
      </PageTitle>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summary.topWonItem ? (
            <Link
              to={`/dashboard/arena/crate-opens/${summary.topWonItem.openId}`}
              className={`${userStatCardSpaciousClass.brand} group flex items-center gap-3 transition hover:border-brand-400 dark:hover:border-brand-400/50`}
            >
              <SkinRarityVisual
                rarity={{
                  name: summary.topWonItem.rarityName,
                  color: summary.topWonItem.rarityColor,
                }}
                className="h-16 w-16 shrink-0"
                showStar={false}
              >
                {summary.topWonItem.image ? (
                  <img
                    src={summary.topWonItem.image}
                    alt=""
                    className="max-h-14 max-w-full object-contain"
                  />
                ) : (
                  <ThemeText as="span" tone="faint" className="text-[10px]">
                    —
                  </ThemeText>
                )}
              </SkinRarityVisual>
              <div className="min-w-0">
                <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
                  Maior valor sorteado
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 truncate text-sm font-semibold">
                  {summary.topWonItem.skinName}
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold">
                  {formatMoney(summary.topWonItem.itemValue, summary.topWonItem.currency)}
                </ThemeText>
                <ThemeText as="p" tone="faint" className="mt-1 truncate text-xs">
                  {[summary.topWonItem.userName, summary.topWonItem.crateName]
                    .filter(Boolean)
                    .join(' · ') || 'Ver abertura'}
                </ThemeText>
              </div>
            </Link>
          ) : (
            <StatCard
              label="Maior valor sorteado"
              value="—"
              hint="Nenhuma abertura neste filtro"
              variant="brand"
            />
          )}
          <StatCard
            label="Total de aberturas"
            value={String(summary.totalOpens)}
            hint={`${summary.testOpensCount} de teste neste recorte`}
          />
          <StatCard
            label="Valor das jogadas"
            value={formatMoney(summary.totalPaid, summaryCurrency)}
            hint="Soma do valor da crate injetado no banco"
          />
          <StatCard
            label="Valor dos prêmios"
            value={formatMoney(summary.totalWonValue, summaryCurrency)}
            hint="Soma do que saiu das crates"
            variant="amber"
          />
          <StatCard
            label="Resultado"
            value={formatMoney(
              summary.houseValue ?? summary.totalPaid - summary.totalWonValue,
              summaryCurrency,
            )}
            hint="Jogadas − prêmios neste filtro"
            variant={
              (summary.houseValue ?? summary.totalPaid - summary.totalWonValue) >= 0
                ? 'default'
                : 'rose'
            }
          />
        </div>
      ) : null}

      <Surface variant="card">
        <div className="grid gap-3 p-5 pb-0 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              label="Buscar"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Usuário, Steam ID, skin ou crate…"
            />
          </div>
          <Select
            label="Crate"
            name="crateId"
            value={crateId}
            onChange={(e) => setFilter('crateId', e.target.value)}
          >
            <option value="">Todas</option>
            {(crates ?? []).map((crate) => (
              <option key={crate._id} value={crate._id}>
                {crate.name}
              </option>
            ))}
          </Select>
          <Select
            label="Raridade"
            name="rarity"
            value={rarity}
            onChange={(e) => setFilter('rarity', e.target.value)}
          >
            <option value="">Todas</option>
            {ARENA_RARITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            label="De"
            name="from"
            type="date"
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
          />
          <Input
            label="Até"
            name="to"
            type="date"
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
          />
          <Input
            label="Prêmio mínimo"
            name="min"
            type="number"
            min={0}
            step="0.01"
            value={filters.min}
            onChange={(e) => setFilter('min', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Prêmio máximo"
            name="max"
            type="number"
            min={0}
            step="0.01"
            value={filters.max}
            onChange={(e) => setFilter('max', e.target.value)}
            placeholder="—"
          />
          <Select
            label="Ordenar"
            name="sort"
            value={sort}
            onChange={(e) => setFilter('sort', e.target.value)}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="prize_desc">Maior prêmio</option>
            <option value="prize_asc">Menor prêmio</option>
          </Select>
          <Select
            label="Por página"
            name="limit"
            value={String(limit)}
            onChange={(e) => setFilter('limit', e.target.value)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2 px-5 pt-4 lg:grid-cols-2">
          <SegmentedTabs
            ariaLabel="Moeda"
            value={currency || 'all'}
            items={CURRENCY_TABS}
            onChange={(next) => setFilter('currency', next === 'all' ? '' : next)}
          />
          <SegmentedTabs
            ariaLabel="Tipo de sorteio"
            value={method || 'all'}
            items={METHOD_TABS}
            onChange={(next) => setFilter('method', next === 'all' ? '' : next)}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 px-5 pt-4">
          <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
            {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
          </span>
          <ThemeText as="p" tone="faint" className="inline-flex items-center gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            {data?.total ?? 0} resultados
          </ThemeText>
          {rarity ? (
            <span className={filterChipClasses(true, 'brand')}>
              {ARENA_RARITY_LABEL[rarity]}
            </span>
          ) : null}
          {crateId ? (
            <button
              type="button"
              onClick={() => setFilter('crateId', '')}
              className={filterChipClasses(true, 'brand')}
            >
              Crate: {selectedCrateName ?? 'filtrada'} ✕
            </button>
          ) : null}
          {matchId ? (
            <button
              type="button"
              onClick={() => setFilter('matchId', '')}
              className={filterChipClasses(true, 'brand')}
            >
              Jogada: {matchId.slice(-6)} ✕
            </button>
          ) : null}
          {hasExtraFilters ? (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  crateId: '',
                  matchId: '',
                  currency: '',
                  rarity: '',
                  method: '',
                  from: '',
                  to: '',
                  min: '',
                  max: '',
                  sort: 'newest',
                  limit: FILTER_DEFAULTS.limit,
                  page: '1',
                }, { resetPage: false })
              }
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando aberturas…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError ? (
          <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Quando</th>
                  <th className={listTable.th}>Jogador</th>
                  <th className={listTable.th}>Crate</th>
                  <th className={listTable.th}>Item recebido</th>
                  <th className={listTable.th}>Moeda</th>
                  <th className={`${listTable.th} text-right`}>Valores</th>
                  <th className={listTable.th}>Sorteio</th>
                  <th className={`${listTable.th} text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {opens.length === 0 ? (
                  <tr>
                    <td className={listTable.empty} colSpan={8}>
                      <div className="mx-auto max-w-md space-y-2 py-2">
                        <p>
                          Nenhuma abertura neste filtro
                          {isSandbox ? ' (Dev / teste)' : ' (Produção)'}.
                        </p>
                        <p className="text-xs text-muted">
                          Os totais do topo acompanham o filtro. Confira também
                          Produção ↔ Influencer.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  opens.map((open) => (
                    <tr key={open._id} className={listTable.tr}>
                      <td className={listTable.tdMuted}>{formatDateTime(open.createdAt)}</td>
                      <td className={listTable.td}>
                        {open.user ? (
                          <div>
                            <Link
                              to={`/dashboard/users/${open.userId}`}
                              className={linkBrand}
                            >
                              {open.user.name}
                            </Link>
                            {open.user.steamId ? (
                              <SteamIdLink steamId={open.user.steamId} className="mt-0.5 block" />
                            ) : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={listTable.tdStrong}>
                        <Link to={`/dashboard/arena/${open.crateId}`} className={linkBrand}>
                          {open.crate.name}
                        </Link>
                        {open.crate.rarity &&
                        ARENA_RARITIES.includes(open.crate.rarity as ArenaRarity) ? (
                          <span className="mt-0.5 block text-xs font-normal text-muted">
                            {ARENA_RARITY_LABEL[open.crate.rarity as ArenaRarity]}
                          </span>
                        ) : null}
                      </td>
                      <td className={listTable.td}>
                        <div className="flex min-w-[200px] items-center gap-3">
                          <SkinRarityVisual
                            rarity={{
                              name: open.wonItemRarityName,
                              color: open.wonItemRarityColor,
                            }}
                            className="h-12 w-14 shrink-0"
                            showStar={false}
                          >
                            {open.wonItemImage ? (
                              <img
                                src={open.wonItemImage}
                                alt=""
                                className="max-h-10 max-w-full object-contain"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted" />
                            )}
                          </SkinRarityVisual>
                          <span className="line-clamp-2">{open.wonSkinName}</span>
                        </div>
                      </td>
                      <td className={listTable.td}>
                        <TextBadge>{open.currency}</TextBadge>
                      </td>
                      <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                        <div>{formatMoney(open.itemValue, open.currency)}</div>
                        <div className="text-xs">
                          crate {formatMoney(open.pricePaid, open.currency)}
                        </div>
                      </td>
                      <td className={listTable.td}>
                        <TextBadge>{methodLabel(open.dropResolutionMethod)}</TextBadge>
                      </td>
                      <td className={`${listTable.td} text-right`}>
                        <Link
                          to={`/dashboard/arena/crate-opens/${open._id}`}
                          className={`${linkBrand} inline-flex items-center gap-1`}
                        >
                          Detalhe
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="p-5">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(next) => setFilter('page', String(next), { resetPage: false })}
          />
        </div>
      </Surface>
    </div>
  )
}
