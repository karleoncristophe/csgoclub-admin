import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Target } from 'lucide-react'
import { UpgradePageNavigation } from '@/components/upgrades/UpgradePageNavigation'
import { UpgradePageHeader } from '@/components/upgrades/UpgradePageHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import {
  DateRangePickerModal,
  DateRangePickerTrigger,
  getActiveQuickPresetLabel,
} from '@/components/ui/DateRangePickerModal'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
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

const INITIAL_RANGE = applyPreset('30d')
const FILTER_DEFAULTS = {
  classId: '',
  targetName: '',
  currency: 'BRL',
  result: 'all',
  page: '1',
  limit: '20',
  sort: 'newest',
  from: formatDateInputLocal(INITIAL_RANGE.start),
  to: formatDateInputLocal(INITIAL_RANGE.end),
}

const CURRENCY_TABS = [
  { id: 'BRL', label: 'BRL' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
]

const RESULT_TABS = [
  { id: 'all', label: 'Todas as tentativas' },
  { id: 'won', label: 'Somente vitórias' },
  { id: 'lost', label: 'Somente derrotas' },
]

function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatCount(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
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

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Surface variant="metricTile" className="min-w-0">
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="p" tone="primary" className="mt-2 text-xl font-semibold tabular-nums">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-2 text-xs leading-relaxed">
        {detail}
      </ThemeText>
    </Surface>
  )
}

function platformResultTone(value: number) {
  return value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
}

export default function UpgradeTargetDetailPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(FILTER_DEFAULTS)
  const [pickerOpen, setPickerOpen] = useState(false)

  const currency = filters.currency as UpgradeCurrency
  const result = filters.result === 'won' || filters.result === 'lost' ? (filters.result as UpgradeResult) : undefined
  const sort = filters.sort as UpgradeSort
  const page = parsePositiveInt(filters.page, 1)
  const limit = [20, 30, 50, 100].includes(parsePositiveInt(filters.limit, 20))
    ? parsePositiveInt(filters.limit, 20)
    : 20
  const targetClassId = filters.classId.trim()
  const targetName = filters.targetName.trim()
  const hasTarget = Boolean(targetClassId || targetName)
  const rangeStart = parseDateInputLocal(filters.from) ?? INITIAL_RANGE.start
  const rangeEnd = parseDateInputLocal(filters.to) ?? INITIAL_RANGE.end
  const queryOk = hasTarget && isRangeWithinMaxYear(rangeStart, rangeEnd)

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      currency,
      dataEnvironment,
      from: startOfLocalDay(rangeStart).toISOString(),
      to: endOfLocalDay(rangeEnd).toISOString(),
      ...(result ? { result } : {}),
      ...(targetClassId ? { targetClassId } : { targetName }),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [currency, dataEnvironment, limit, page, rangeEnd, rangeStart, result, sort, targetClassId, targetName],
  )

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminUpgradeAnalyticsQuery(queryArgs, {
    skip: !queryOk,
  })
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const summary = data?.summary
  const target = data?.targets[0]?.target ?? data?.items[0]?.target

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, setFilter, totalPages])

  return (
    <div className="space-y-6">
      <BackLink
        fallback="/dashboard/upgrades/results"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar às skins
      </BackLink>

      <UpgradePageHeader
        title="Detalhe da skin no Upgrade"
        subtitle={
          isSandbox
            ? 'Tentativas feitas por contas de teste e influencers.'
            : 'Todas as tentativas desta skin no período selecionado.'
        }
      />
      <UpgradePageNavigation />

      <Surface variant="cardInset" className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-end">
            <div>
              <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
                Moeda dos valores
              </ThemeText>
              <SegmentedTabs
                ariaLabel="Moeda das tentativas desta skin"
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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
              Resultado da tentativa
            </ThemeText>
            <SegmentedTabs
              ariaLabel="Filtrar resultado das tentativas"
              value={filters.result}
              items={RESULT_TABS}
              onChange={(value) => setFilter('result', value)}
            />
          </div>
          <Select label="Ordenar tentativas" value={sort} onChange={(event) => setFilter('sort', event.target.value)}>
            <option value="newest">Mais recentes primeiro</option>
            <option value="oldest">Mais antigas primeiro</option>
            <option value="chance_desc">Maior chance primeiro</option>
            <option value="stake_desc">Maior valor apostado</option>
            <option value="payout_desc">Maior valor entregue</option>
          </Select>
        </div>

        {!hasTarget ? (
          <ThemeText as="p" tone="warning" className="text-sm">
            A skin não foi identificada. Volte à listagem e abra o detalhe novamente.
          </ThemeText>
        ) : null}
        {hasTarget && !isRangeWithinMaxYear(rangeStart, rangeEnd) ? (
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
          Carregando tentativas da skin…
        </div>
      ) : null}

      {data && summary ? (
        <>
          <Surface variant="settingsPanel" className="!p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary"
                  style={{
                    borderLeftColor: target?.rarityColor,
                    borderLeftWidth: 4,
                  }}
                >
                  {target?.image ? (
                    <img src={target.image} alt="" className="max-h-16 max-w-20 object-contain" />
                  ) : (
                    <Target className="h-6 w-6 text-muted" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <ThemeText as="p" tone="label" className="text-xs uppercase tracking-wide">
                    Skin escolhida como alvo
                  </ThemeText>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">{target?.name ?? targetName}</h2>
                  <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                    {target?.rarityName ?? 'Raridade não informada'}
                  </ThemeText>
                </div>
              </div>
              <ThemeText as="p" tone="faint" className="text-xs">
                Valores exclusivamente em {currency}
              </ThemeText>
            </div>
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Tentativas encontradas"
              value={formatCount(summary.totalPlays)}
              detail="Quantidade de sorteios que correspondem aos filtros atuais."
            />
            <Metric
              label="Vitórias obtidas"
              value={`${formatCount(summary.wins)} de ${formatCount(summary.totalPlays)}`}
              detail={`${formatPercent(summary.winRatePercent)} das tentativas venceram.`}
            />
            <Metric
              label="Chance média dos sorteios"
              value={formatPercent(summary.averageChancePercent)}
              detail="Média das chances registradas antes de cada sorteio."
            />
            <Metric
              label="Vitórias esperadas"
              value={formatCount(summary.expectedWins)}
              detail="Referência estatística de longo prazo, não uma meta mínima."
            />
            <Metric
              label="Valor total apostado"
              value={formatCentsMoney(summary.totalStakedCents, currency)}
              detail="Skins consumidas e saldo utilizados nas tentativas."
            />
            <Metric
              label="Valor entregue"
              value={formatCentsMoney(summary.totalPayoutCents, currency)}
              detail="Valor da skin alvo entregue nas tentativas vencidas."
            />
            <Metric
              label="Resultado bruto da plataforma"
              value={formatCentsMoney(summary.grossProfitCents, currency)}
              detail={`Valor apostado menos valor entregue. Margem de ${formatPercent(summary.marginPercent)}.`}
            />
          </div>

          <Surface variant="card">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTitle>Todas as tentativas desta skin</SectionTitle>
                <ThemeText as="p" tone="secondary" className="mt-1 max-w-3xl text-sm">
                  O percentual sorteado mostra onde o resultado caiu. A tentativa vence quando ele está dentro da chance
                  de vitória exibida.
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
              <table className={`${listTable.table} min-w-[1350px]`}>
                <thead>
                  <tr className={listTable.theadRow}>
                    <th className={listTable.th}>Data</th>
                    <th className={listTable.th}>Quem tentou</th>
                    <th className={listTable.th}>Valor apostado</th>
                    <th className={listTable.th}>Valor da skin alvo</th>
                    <th className={listTable.th}>Chance de vitória</th>
                    <th className={listTable.th}>Percentual sorteado</th>
                    <th className={listTable.th}>Resultado</th>
                    <th className={listTable.th}>Valor entregue</th>
                  </tr>
                </thead>
                <tbody className={listTable.tbody}>
                  {data.items.map((item) => (
                    <tr key={item.id} className={listTable.tr}>
                      <td className={listTable.tdMuted}>{formatDateTime(item.createdAt)}</td>
                      <td className={listTable.tdStrong}>
                        {item.player ? (
                          <div className="flex min-w-[210px] items-center gap-2.5">
                            <UserAvatarLink
                              userId={item.player.id}
                              name={item.player.name}
                              avatar={item.player.avatar}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/dashboard/users/${item.player.id}`}
                                className="block max-w-[180px] truncate hover:text-brand-600 dark:hover:text-brand-400"
                              >
                                {item.player.name}
                              </Link>
                              <SteamIdLink steamId={item.player.steamId} />
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={listTable.tdMuted}>
                        <p className="font-medium text-foreground">
                          {formatCentsMoney(item.sourceTotalCents, currency)}
                        </p>
                        <p className="mt-0.5 text-xs">
                          {item.sourceItemsCount} skin(s) + {formatCentsMoney(item.balanceUsedCents, currency)} em saldo
                        </p>
                      </td>
                      <td className={listTable.tdMuted}>{formatCentsMoney(item.target.valueCents, currency)}</td>
                      <td className={listTable.tdMuted}>
                        <p className="font-medium text-foreground">{formatPercent(item.chancePercent)}</p>
                        <p className="mt-0.5 text-xs">Faixa vencedora: de 0% até esta chance</p>
                      </td>
                      <td className={listTable.tdMuted}>
                        <p className="font-medium text-foreground">{formatPercent(item.fairValuePercent)}</p>
                        <p className="mt-0.5 text-xs">Número efetivamente sorteado</p>
                      </td>
                      <td className={listTable.td}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.result === 'won'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {item.result === 'won' ? 'Venceu' : 'Perdeu'}
                        </span>
                      </td>
                      <td className={listTable.tdMuted}>
                        <p>{formatCentsMoney(item.payoutCents, currency)}</p>
                        <p className={`mt-0.5 text-xs font-semibold ${platformResultTone(item.grossProfitCents)}`}>
                          Plataforma: {formatCentsMoney(item.grossProfitCents, currency)}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {!data.items.length ? (
                    <tr>
                      <td colSpan={8} className={listTable.empty}>
                        Nenhuma tentativa encontrada para esta skin e filtros.
                      </td>
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
        </>
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
