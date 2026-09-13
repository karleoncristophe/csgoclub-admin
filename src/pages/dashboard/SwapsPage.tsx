import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Repeat2, Search } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import {
  SwapStatusBadge,
  formatSwapDateTime,
  formatSwapMoney,
  swapFundingLabel,
  swapLeftAccountHint,
} from '@/components/swaps/swapUi'
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
import {
  parseBoundedInt,
  parsePositiveInt,
  useUrlFilters,
} from '@/hooks/useUrlFilters'
import {
  useGetAdminSwapsQuery,
  type SwapCurrency,
  type SwapStatusFilter,
} from '@/redux/store/api/swaps/api.swaps'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { filterChipClasses, userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const
const DEFAULT_PAGE_SIZE = 30

const SWAPS_FILTER_DEFAULTS = {
  userId: '',
  q: '',
  status: '',
  currency: '',
  from: '',
  to: '',
  page: '1',
  limit: String(DEFAULT_PAGE_SIZE),
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

export default function SwapsPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(SWAPS_FILTER_DEFAULTS)

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
  const pageSize = parseBoundedInt(
    filters.limit,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS[0],
    PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1],
  )
  const safePage = Math.max(page, 1)
  const userId = filters.userId
  const status = filters.status as SwapStatusFilter | ''
  const currency = filters.currency as SwapCurrency | ''

  const { data, isLoading, isFetching, isError, error } = useGetAdminSwapsQuery({
    page: safePage,
    limit: pageSize,
    dataEnvironment,
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
    ...(currency ? { currency } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  })

  const filteredUserName = userId ? data?.data[0]?.user?.name : undefined
  const summary = data?.summary
  const swaps = data?.data ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const summaryCurrency = currency || swaps[0]?.currency || 'BRL'

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
            ? 'Trocas de teste (influencer): o que saiu da conta, o custo na dash e o troco. Visão Dev.'
            : 'Trocas reais: skins e/ou saldo que saíram da conta, custo do alvo na dash e o que sobrou. Visão Produção.'
        }
      >
        Swap
      </PageTitle>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Saiu em skins"
            value={formatSwapMoney(summary.sourceItemsTotal, summaryCurrency)}
            hint={`${summary.totalSwaps} swaps · valor das skins ofertadas`}
            variant="brand"
          />
          <StatCard
            label="Saiu em saldo"
            value={formatSwapMoney(summary.balanceUsedTotal, summaryCurrency)}
            hint="Complemento debitado da carteira"
          />
          <StatCard
            label="Montante"
            value={formatSwapMoney(
              summary.sourceItemsTotal + summary.balanceUsedTotal,
              summaryCurrency,
            )}
            hint="Skins + saldo que saíram da conta"
          />
          <StatCard
            label="Custou na dash"
            value={formatSwapMoney(summary.targetValueTotal, summaryCurrency)}
            hint="Preço com taxa dos alvos"
            variant="amber"
          />
          <StatCard
            label="Sobrou"
            value={formatSwapMoney(summary.changeCreditedTotal, summaryCurrency)}
            hint="Troco creditado de volta na carteira"
            variant="rose"
          />
          <StatCard
            label="Swaps"
            value={String(summary.totalSwaps)}
            hint={`${summary.completedCount} concluídos · ${summary.failedCount} falhas`}
          />
        </div>
      ) : null}

      <Surface variant="card">
        <div className="grid gap-3 p-5 pb-0 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-[220px] md:col-span-2">
            <Input
              label="Buscar"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Usuário, Steam ID ou skin alvo…"
            />
          </div>
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
          <Select
            label="Itens por página"
            name="pageSize"
            value={String(pageSize)}
            onChange={(e) => setFilter('limit', e.target.value)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
          <ThemeText as="p" tone="faint" className="inline-flex items-end gap-1.5 pb-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            {data?.total ?? 0} resultados
          </ThemeText>
        </div>

        <div className="mb-3 grid gap-2 px-5 pt-4 lg:grid-cols-2">
          <SegmentedTabs
            ariaLabel="Status do swap"
            value={status || 'all'}
            items={[
              { id: 'all', label: 'Todos' },
              { id: 'completed', label: 'Concluídos' },
              { id: 'failed', label: 'Falhou' },
              { id: 'in_progress', label: 'Em andamento' },
            ]}
            onChange={(next) => setFilter('status', next === 'all' ? '' : next)}
          />
          <SegmentedTabs
            ariaLabel="Moeda do swap"
            value={currency || 'all'}
            items={[
              { id: 'all', label: 'Moedas' },
              { id: 'BRL', label: 'BRL' },
              { id: 'USD', label: 'USD' },
              { id: 'EUR', label: 'EUR' },
            ]}
            onChange={(next) => setFilter('currency', next === 'all' ? '' : next)}
          />
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 px-5">
          <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
            {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
          </span>
          {userId ? (
            <button
              type="button"
              onClick={() => setFilters({ userId: '', page: '1' }, { resetPage: false })}
              className={filterChipClasses(true, 'brand')}
            >
              Usuário: {filteredUserName ?? 'filtrado'} ✕
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando swaps…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError && swaps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Repeat2 className="h-8 w-8 text-zinc-400" />
            <ThemeText as="p" tone="secondary" className="text-sm">
              Nenhum swap encontrado para este filtro.
            </ThemeText>
          </div>
        ) : null}

        {swaps.length > 0 ? (
          <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Alvo</th>
                  <th className={listTable.th}>Jogador</th>
                  <th className={listTable.th}>Saiu da conta</th>
                  <th className={`${listTable.th} text-right`}>Montante</th>
                  <th className={`${listTable.th} text-right`}>Custou na dash</th>
                  <th className={`${listTable.th} text-right`}>Sobrou</th>
                  <th className={listTable.th}>Status</th>
                  <th className={`${listTable.th} text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {swaps.map((swap) => {
                  const avatar =
                    swap.user?.avatarFull ?? swap.user?.avatarMedium ?? swap.user?.avatar

                  return (
                    <tr key={swap.id} className={listTable.tr}>
                      <td className={listTable.tdStrong}>
                        <div className="flex min-w-[240px] items-center gap-2">
                          <SkinRarityVisual
                            rarity={{
                              name: swap.targetRarityName ?? undefined,
                              color: swap.targetRarityColor ?? undefined,
                            }}
                            className="h-11 w-16 shrink-0"
                            showStar={false}
                          >
                            {swap.targetImage ? (
                              <img
                                src={swap.targetImage}
                                alt=""
                                className="max-h-10 max-w-full object-contain"
                              />
                            ) : (
                              <ThemeText as="span" tone="faint" className="text-[10px]">
                                —
                              </ThemeText>
                            )}
                          </SkinRarityVisual>
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {swap.targetName}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {formatSwapDateTime(swap.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={listTable.td}>
                        {swap.user ? (
                          <div className="min-w-[170px]">
                            <Link
                              to={`/dashboard/users/${swap.user._id}`}
                              className="flex min-w-0 items-center gap-2 hover:underline"
                            >
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover"
                                />
                              ) : (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
                                  {swap.user.name?.[0]?.toUpperCase() ?? '?'}
                                </span>
                              )}
                              <span className="truncate text-sm text-foreground">
                                {swap.user.name}
                              </span>
                            </Link>
                            {swap.user.steamId ? (
                              <div className="mt-1 pl-8">
                                <SteamIdLink steamId={swap.user.steamId} />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={listTable.td}>
                        <div className="min-w-[140px]">
                          <TextBadge>{swapFundingLabel(swap)}</TextBadge>
                          <span className="mt-1 block text-xs text-muted">
                            {swapLeftAccountHint(swap)}
                          </span>
                        </div>
                      </td>
                      <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                        {formatSwapMoney(swap.offeredTotal, swap.currency)}
                      </td>
                      <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                        <span className="block font-medium text-foreground">
                          {formatSwapMoney(swap.targetValue, swap.currency)}
                        </span>
                      </td>
                      <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                        {swap.changeCredited > 0
                          ? formatSwapMoney(swap.changeCredited, swap.currency)
                          : '—'}
                      </td>
                      <td className={listTable.td}>
                        <SwapStatusBadge status={swap.status} />
                      </td>
                      <td className={`${listTable.td} text-right`}>
                        <Link to={`/dashboard/swaps/${swap.id}`} className={linkBrand}>
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="p-5">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(next) =>
              setFilter('page', String(next), { resetPage: false })
            }
          />
        </div>
      </Surface>
    </div>
  )
}
