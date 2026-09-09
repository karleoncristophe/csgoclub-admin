import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search, Target } from 'lucide-react'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import { UpgradePageNavigation } from '@/components/upgrades/UpgradePageNavigation'
import {
  DateRangePickerModal,
  DateRangePickerTrigger,
  getActiveQuickPresetLabel,
} from '@/components/ui/DateRangePickerModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import useDebounce from '@/hooks/useDebounce'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import {
  useGetAdminUpgradeAnalyticsQuery,
  type UpgradeCurrency,
  type UpgradeResult,
  type UpgradeSort,
} from '@/redux/store/api/upgrades/api.upgrades'
import { formatCentsMoney } from '@/utils/formatDisplay'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  applyPreset,
  endOfLocalDay,
  formatDateInputLocal,
  isRangeWithinMaxYear,
  parseDateInputLocal,
  startOfLocalDay,
} from '@/utils/metricsDateRange'

type DetailView = 'skins' | 'plays' | 'chance'

const INITIAL_RANGE = applyPreset('30d')
const FILTER_DEFAULTS = {
  view: 'skins',
  currency: 'BRL',
  result: 'all',
  q: '',
  page: '1',
  limit: '20',
  sort: 'newest',
  from: formatDateInputLocal(INITIAL_RANGE.start),
  to: formatDateInputLocal(INITIAL_RANGE.end),
}

const DETAIL_TABS = [
  { id: 'skins', label: 'Desempenho por skin' },
  { id: 'plays', label: 'Histórico de jogadas' },
  { id: 'chance', label: 'Auditoria das chances' },
]

const CURRENCY_TABS = [
  { id: 'BRL', label: 'BRL' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
]

const RESULT_TABS = [
  { id: 'all', label: 'Todos os resultados' },
  { id: 'won', label: 'Upgrade bem-sucedido' },
  { id: 'lost', label: 'Upgrade sem sucesso' },
]

function formatPercent(value: number, signed = false) {
  const prefix = signed && value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
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

function platformResultTone(value: number) {
  return value >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400'
}

export default function UpgradeResultsPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(FILTER_DEFAULTS)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.q)
  const debouncedSearch = useDebounce(searchInput.trim(), 300)

  useEffect(() => {
    if (debouncedSearch !== filters.q) setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  const view: DetailView =
    filters.view === 'plays' || filters.view === 'chance'
      ? filters.view
      : 'skins'
  const currency = filters.currency as UpgradeCurrency
  const result =
    filters.result === 'won' || filters.result === 'lost'
      ? (filters.result as UpgradeResult)
      : undefined
  const sort = filters.sort as UpgradeSort
  const page = parsePositiveInt(filters.page, 1)
  const limit = [20, 30, 50, 100].includes(parsePositiveInt(filters.limit, 20))
    ? parsePositiveInt(filters.limit, 20)
    : 20
  const rangeStart = parseDateInputLocal(filters.from) ?? INITIAL_RANGE.start
  const rangeEnd = parseDateInputLocal(filters.to) ?? INITIAL_RANGE.end
  const queryOk = isRangeWithinMaxYear(rangeStart, rangeEnd)

  const queryArgs = useMemo(
    () => ({
      page: view === 'plays' ? page : 1,
      limit: view === 'plays' ? limit : 20,
      currency,
      dataEnvironment,
      from: startOfLocalDay(rangeStart).toISOString(),
      to: endOfLocalDay(rangeEnd).toISOString(),
      ...(view === 'plays' && result ? { result } : {}),
      ...(view !== 'chance' && debouncedSearch
        ? { search: debouncedSearch }
        : {}),
      ...(view === 'plays' && sort !== 'newest' ? { sort } : {}),
    }),
    [
      currency,
      dataEnvironment,
      debouncedSearch,
      limit,
      page,
      rangeEnd,
      rangeStart,
      result,
      sort,
      view,
    ],
  )

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAdminUpgradeAnalyticsQuery(queryArgs, { skip: !queryOk })
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  useEffect(() => {
    if (view === 'plays' && page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, setFilter, totalPages, view])

  return (
    <div className="space-y-6">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Investigação das jogadas realizadas por contas de teste e influencers.'
            : 'Consulte skins, jogadas individuais e aderência das probabilidades em produção.'
        }
      >
        Detalhamento do Upgrade
      </PageTitle>
      <UpgradePageNavigation />

      <Surface variant="cardInset" className="space-y-5">
        <div>
          <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
            O que deseja analisar?
          </ThemeText>
          <SegmentedTabs
            ariaLabel="Tipo de detalhamento do Upgrade"
            value={view}
            items={DETAIL_TABS}
            onChange={(value) => setFilters({ view: value, page: '1' })}
          />
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-end">
            <div>
              <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
                Moeda dos valores
              </ThemeText>
              <SegmentedTabs
                ariaLabel="Moeda dos valores do Upgrade"
                value={currency}
                items={CURRENCY_TABS}
                onChange={(value) => setFilter('currency', value)}
              />
            </div>
            <DateRangePickerTrigger
              appliedStart={rangeStart}
              appliedEnd={rangeEnd}
              presetLabel={getActiveQuickPresetLabel(rangeStart, rangeEnd)}
              onClick={() => setPickerOpen(true)}
            />
            {view !== 'chance' ? (
              <div className="min-w-[260px] flex-1">
                <Input
                  label={view === 'skins' ? 'Localizar skin ou jogador' : 'Localizar jogada'}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Nome, Steam ID ou skin alvo"
                  endAdornment={<Search className="h-4 w-4" aria-hidden />}
                />
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => refetch()}
            disabled={!queryOk}
            isLoading={isFetching && !isLoading}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Atualizar dados
          </Button>
        </div>

        {view === 'plays' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
                Resultado do jogador
              </ThemeText>
              <SegmentedTabs
                ariaLabel="Resultado da jogada"
                value={filters.result}
                items={RESULT_TABS}
                onChange={(value) => setFilter('result', value)}
              />
            </div>
            <Select
              label="Ordenação do histórico"
              value={sort}
              onChange={(event) => setFilter('sort', event.target.value)}
            >
              <option value="newest">Jogadas mais recentes</option>
              <option value="oldest">Jogadas mais antigas</option>
              <option value="stake_desc">Maior valor apostado</option>
              <option value="payout_desc">Maior valor entregue</option>
              <option value="profit_desc">Maior resultado da plataforma</option>
              <option value="chance_desc">Maior probabilidade de sucesso</option>
            </Select>
          </div>
        ) : null}

        {!queryOk ? (
          <ThemeText as="p" tone="warning" className="text-sm">
            Selecione um período válido de até 366 dias.
          </ThemeText>
        ) : null}
        {isError ? (
          <ThemeText as="p" tone="danger" className="text-sm">
            {getErrorMessage(error)}
          </ThemeText>
        ) : null}
      </Surface>

      {isLoading && queryOk ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando o detalhamento…
        </div>
      ) : null}

      {data && view === 'skins' ? (
        <Surface variant="card">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionTitle>Desempenho por skin escolhida como alvo</SectionTitle>
              <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                As 15 skins com maior valor entregue no período selecionado.
              </ThemeText>
            </div>
            <ThemeText as="p" tone="faint" className="text-xs">
              Valores exclusivamente em {currency}
            </ThemeText>
          </div>
          <div className={listTable.wrap}>
            <table className={`${listTable.table} min-w-[1100px]`}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Skin escolhida como alvo</th>
                  <th className={listTable.th}>Upgrades tentados</th>
                  <th className={listTable.th}>Sucesso real / projetado</th>
                  <th className={listTable.th}>Valor total apostado</th>
                  <th className={listTable.th}>Valor entregue</th>
                  <th className={listTable.th}>Resultado da plataforma</th>
                  <th className={listTable.th}>Margem bruta</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.targets.map((row) => (
                  <tr
                    key={`${row.target.classId ?? row.target.name}-${row.target.image ?? ''}`}
                    className={listTable.tr}
                  >
                    <td className={listTable.tdStrong}>
                      <div className="flex min-w-[280px] items-center gap-3">
                        <span
                          className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary"
                          style={{
                            borderLeftColor: row.target.rarityColor,
                            borderLeftWidth: 3,
                          }}
                        >
                          {row.target.image ? (
                            <img src={row.target.image} alt="" className="max-h-10 max-w-[58px] object-contain" />
                          ) : (
                            <Target className="h-4 w-4 text-muted" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[310px] truncate">{row.target.name}</p>
                          <ThemeText as="p" tone="faint" className="mt-0.5 text-xs">
                            {row.target.rarityName ?? 'Raridade não informada'}
                          </ThemeText>
                        </div>
                      </div>
                    </td>
                    <td className={listTable.tdMuted}>
                      {row.attempts.toLocaleString('pt-BR')}
                    </td>
                    <td className={listTable.tdMuted}>
                      <p className="font-medium text-foreground">
                        {formatPercent(row.winRatePercent)} / {formatPercent(row.expectedWinRatePercent)}
                      </p>
                      <p className="mt-0.5 text-xs">{row.wins} upgrades bem-sucedidos</p>
                    </td>
                    <td className={listTable.tdMuted}>{formatCentsMoney(row.stakedCents, currency)}</td>
                    <td className={listTable.tdMuted}>{formatCentsMoney(row.payoutCents, currency)}</td>
                    <td className={`${listTable.tdMuted} font-semibold ${platformResultTone(row.grossProfitCents)}`}>
                      {formatCentsMoney(row.grossProfitCents, currency)}
                    </td>
                    <td className={`${listTable.tdMuted} font-semibold ${platformResultTone(row.marginPercent)}`}>
                      {formatPercent(row.marginPercent)}
                    </td>
                  </tr>
                ))}
                {!data.targets.length ? (
                  <tr>
                    <td colSpan={7} className={listTable.empty}>Nenhuma skin encontrada no período.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Surface>
      ) : null}

      {data && view === 'plays' ? (
        <Surface variant="card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionTitle>Histórico de upgrades concluídos</SectionTitle>
              <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                {data.total.toLocaleString('pt-BR')} jogadas correspondem aos filtros selecionados.
              </ThemeText>
            </div>
            <div className="w-36">
              <Select
                label="Itens por página"
                value={String(limit)}
                onChange={(event) => setFilter('limit', event.target.value)}
              >
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          </div>
          <div className={listTable.wrap}>
            <table className={`${listTable.table} min-w-[1250px]`}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Data da jogada</th>
                  <th className={listTable.th}>Jogador</th>
                  <th className={listTable.th}>Skin escolhida como alvo</th>
                  <th className={listTable.th}>Valor apostado</th>
                  <th className={listTable.th}>Probabilidade de sucesso</th>
                  <th className={listTable.th}>Resultado do jogador</th>
                  <th className={listTable.th}>Valor entregue</th>
                  <th className={listTable.th}>Resultado da plataforma</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.items.map((item) => (
                  <tr key={item.id} className={listTable.tr}>
                    <td className={listTable.tdMuted}>{formatDateTime(item.createdAt)}</td>
                    <td className={listTable.tdStrong}>
                      {item.player ? (
                        <div className="flex min-w-[190px] items-center gap-2.5">
                          <UserAvatarLink
                            userId={item.player.id}
                            name={item.player.name}
                            avatar={item.player.avatar}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/dashboard/users/${item.player.id}`}
                              className="block max-w-[170px] truncate hover:text-brand-600 dark:hover:text-brand-400"
                            >
                              {item.player.name}
                            </Link>
                            <SteamIdLink steamId={item.player.steamId} />
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className={listTable.tdStrong}>
                      <div className="flex min-w-[280px] items-center gap-3">
                        <span
                          className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary"
                          style={{
                            borderLeftColor: item.target.rarityColor,
                            borderLeftWidth: 3,
                          }}
                        >
                          {item.target.image ? (
                            <img src={item.target.image} alt="" className="max-h-9 max-w-12 object-contain" />
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[280px] truncate">{item.target.name}</p>
                          <ThemeText as="p" tone="faint" className="mt-0.5 text-xs">
                            Valor do alvo: {formatCentsMoney(item.target.valueCents, currency)}
                          </ThemeText>
                        </div>
                      </div>
                    </td>
                    <td className={listTable.tdMuted}>
                      <p className="font-medium text-foreground">{formatCentsMoney(item.sourceTotalCents, currency)}</p>
                      <p className="mt-0.5 text-xs">
                        {item.sourceItemsCount} skin(s) + {formatCentsMoney(item.balanceUsedCents, currency)} em saldo
                      </p>
                    </td>
                    <td className={listTable.tdMuted}>{formatPercent(item.chancePercent)}</td>
                    <td className={listTable.td}>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.result === 'won'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.result === 'won' ? 'Upgrade bem-sucedido' : 'Upgrade sem sucesso'}
                      </span>
                    </td>
                    <td className={listTable.tdMuted}>{formatCentsMoney(item.payoutCents, currency)}</td>
                    <td className={`${listTable.tdMuted} font-semibold ${platformResultTone(item.grossProfitCents)}`}>
                      <p>{formatCentsMoney(item.grossProfitCents, currency)}</p>
                      <p className="mt-0.5 text-xs font-normal">Margem: {formatPercent(item.marginPercent)}</p>
                    </td>
                  </tr>
                ))}
                {!data.items.length ? (
                  <tr>
                    <td colSpan={8} className={listTable.empty}>Nenhuma jogada encontrada no período.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(next) => setFilter('page', String(next), { resetPage: false })}
            className="mt-4"
          />
        </Surface>
      ) : null}

      {data && view === 'chance' ? (
        <Surface variant="card">
          <div className="mb-4">
            <SectionTitle>Auditoria das probabilidades de sucesso</SectionTitle>
            <ThemeText as="p" tone="secondary" className="mt-1 max-w-3xl text-sm">
              Compara a taxa de sucesso observada com a taxa projetada pela soma das probabilidades de cada jogada.
            </ThemeText>
          </div>
          <div className={listTable.wrap}>
            <table className={`${listTable.table} min-w-[1050px]`}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Faixa de probabilidade</th>
                  <th className={listTable.th}>Upgrades analisados</th>
                  <th className={listTable.th}>Sucessos observados</th>
                  <th className={listTable.th}>Taxa real</th>
                  <th className={listTable.th}>Taxa projetada</th>
                  <th className={listTable.th}>Diferença</th>
                  <th className={listTable.th}>Valor apostado</th>
                  <th className={listTable.th}>Valor entregue</th>
                  <th className={listTable.th}>Resultado da plataforma</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.chanceBuckets.map((bucket) => {
                  const delta = bucket.actualWinRatePercent - bucket.expectedWinRatePercent
                  return (
                    <tr key={bucket.label} className={listTable.tr}>
                      <td className={listTable.tdStrong}>{bucket.label}</td>
                      <td className={listTable.tdMuted}>{bucket.plays.toLocaleString('pt-BR')}</td>
                      <td className={listTable.tdMuted}>{bucket.wins.toLocaleString('pt-BR')}</td>
                      <td className={listTable.tdMuted}>{formatPercent(bucket.actualWinRatePercent)}</td>
                      <td className={listTable.tdMuted}>{formatPercent(bucket.expectedWinRatePercent)}</td>
                      <td className={`${listTable.tdMuted} font-semibold ${platformResultTone(-delta)}`}>
                        {formatPercent(delta, true)}
                      </td>
                      <td className={listTable.tdMuted}>{formatCentsMoney(bucket.stakedCents, currency)}</td>
                      <td className={listTable.tdMuted}>{formatCentsMoney(bucket.payoutCents, currency)}</td>
                      <td className={`${listTable.tdMuted} font-semibold ${platformResultTone(bucket.grossProfitCents)}`}>
                        {formatCentsMoney(bucket.grossProfitCents, currency)}
                      </td>
                    </tr>
                  )
                })}
                {!data.chanceBuckets.length ? (
                  <tr>
                    <td colSpan={9} className={listTable.empty}>Nenhuma probabilidade encontrada no período.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Surface>
      ) : null}

      <DateRangePickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        appliedStart={rangeStart}
        appliedEnd={rangeEnd}
        onApply={(start, end) => {
          setFilters({
            from: formatDateInputLocal(start),
            to: formatDateInputLocal(end),
          })
        }}
      />
    </div>
  )
}
