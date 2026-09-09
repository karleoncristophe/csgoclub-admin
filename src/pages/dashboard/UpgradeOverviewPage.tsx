import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  ListTree,
  RefreshCw,
  Trophy,
} from 'lucide-react'
import {
  ChartTypeSelector,
  DualSeriesMetricsChart,
  useChartVariant,
} from '@/components/charts/AnalyticsCharts'
import { UpgradePageNavigation } from '@/components/upgrades/UpgradePageNavigation'
import {
  DateRangePickerModal,
  DateRangePickerTrigger,
  getActiveQuickPresetLabel,
} from '@/components/ui/DateRangePickerModal'
import { Button } from '@/components/ui/Button'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import {
  useGetAdminUpgradeAnalyticsQuery,
  type UpgradeCurrency,
} from '@/redux/store/api/upgrades/api.upgrades'
import { formatCentsAxisTick, formatCentsMoney } from '@/utils/formatDisplay'
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
  currency: 'BRL',
  from: formatDateInputLocal(INITIAL_RANGE.start),
  to: formatDateInputLocal(INITIAL_RANGE.end),
}

const CURRENCY_TABS = [
  { id: 'BRL', label: 'BRL' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
]

function formatPercent(value: number, signed = false) {
  const prefix = signed && value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatCount(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint: string
  icon: typeof CircleDollarSign
  tone?: 'neutral' | 'positive' | 'negative' | 'brand'
}) {
  const toneClass = {
    neutral: 'bg-surface-secondary text-muted',
    positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    negative: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    brand: 'bg-accent-soft text-accent-soft-foreground',
  }[tone]

  return (
    <Surface variant="metricTile" className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
            {label}
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-2 truncate text-xl font-semibold tabular-nums">
            {value}
          </ThemeText>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>
      <ThemeText as="p" tone="faint" className="mt-3 text-xs leading-relaxed">
        {hint}
      </ThemeText>
    </Surface>
  )
}

function InsightRow({
  label,
  value,
  detail,
  positive,
}: {
  label: string
  value: string
  detail: string
  positive?: boolean
}) {
  const Icon = positive === false ? ArrowDownRight : ArrowUpRight
  const color =
    positive === false
      ? 'text-rose-600 dark:text-rose-400'
      : positive === true
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-brand-600 dark:text-brand-400'

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary p-3">
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface ${color}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <ThemeText as="p" tone="label" className="text-xs">
          {label}
        </ThemeText>
        <p className={`mt-0.5 font-semibold tabular-nums ${color}`}>{value}</p>
        <ThemeText as="p" tone="faint" className="mt-1 text-xs leading-relaxed">
          {detail}
        </ThemeText>
      </div>
    </div>
  )
}

export default function UpgradeOverviewPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(FILTER_DEFAULTS)
  const [pickerOpen, setPickerOpen] = useState(false)
  const { variant: chartVariant, onChange: setChartVariant } =
    useChartVariant('upgrade-financials')

  const currency = filters.currency as UpgradeCurrency
  const rangeStart = parseDateInputLocal(filters.from) ?? INITIAL_RANGE.start
  const rangeEnd = parseDateInputLocal(filters.to) ?? INITIAL_RANGE.end
  const queryOk = isRangeWithinMaxYear(rangeStart, rangeEnd)
  const queryArgs = useMemo(
    () => ({
      page: 1,
      limit: 1,
      currency,
      dataEnvironment,
      from: startOfLocalDay(rangeStart).toISOString(),
      to: endOfLocalDay(rangeEnd).toISOString(),
    }),
    [currency, dataEnvironment, rangeEnd, rangeStart],
  )

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAdminUpgradeAnalyticsQuery(queryArgs, { skip: !queryOk })
  const summary = data?.summary
  const sourceShare = summary?.totalStakedCents
    ? (summary.sourceItemsStakeCents / summary.totalStakedCents) * 100
    : 0
  const balanceShare = summary?.totalStakedCents
    ? (summary.balanceStakeCents / summary.totalStakedCents) * 100
    : 0

  return (
    <div className="space-y-6">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Visão financeira dos upgrades realizados por contas de teste e influencers.'
            : 'Resumo financeiro dos upgrades concluídos pelos jogadores em produção.'
        }
      >
        Upgrade
      </PageTitle>
      <UpgradePageNavigation />

      <Surface variant="cardInset">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => refetch()}
            disabled={!queryOk}
            isLoading={isFetching && !isLoading}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Atualizar dados
          </Button>
        </div>
        {!queryOk ? (
          <ThemeText as="p" tone="warning" className="mt-4 text-sm">
            Selecione um período válido de até 366 dias.
          </ThemeText>
        ) : null}
        {isError ? (
          <ThemeText as="p" tone="danger" className="mt-4 text-sm">
            {getErrorMessage(error)}
          </ThemeText>
        ) : null}
      </Surface>

      {isLoading && queryOk ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Calculando o resultado financeiro…
        </div>
      ) : null}

      {summary && data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Resultado bruto da plataforma"
              value={formatCentsMoney(summary.grossProfitCents, currency)}
              hint={`Valor apostado menos as skins entregues. Margem bruta de ${formatPercent(summary.marginPercent)}.`}
              icon={summary.grossProfitCents >= 0 ? ArrowUpRight : ArrowDownRight}
              tone={summary.grossProfitCents >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Valor total apostado"
              value={formatCentsMoney(summary.totalStakedCents, currency)}
              hint={`Soma das skins e do saldo utilizados em ${summary.totalPlays.toLocaleString('pt-BR')} upgrades concluídos.`}
              icon={CircleDollarSign}
              tone="brand"
            />
            <MetricCard
              label="Valor entregue aos vencedores"
              value={formatCentsMoney(summary.totalPayoutCents, currency)}
              hint={`Valor das skins concedidas nas ${summary.wins.toLocaleString('pt-BR')} jogadas vencidas.`}
              icon={Trophy}
            />
            <MetricCard
              label="Percentual devolvido aos jogadores"
              value={formatPercent(summary.rtpPercent)}
              hint={`Também chamado de RTP real. Projeção estatística: ${formatPercent(100 - summary.expectedMarginPercent)}.`}
              icon={BarChart3}
            />
          </div>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.8fr)]">
            <Surface variant="chartPanel">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <SectionTitle>Valores apostados × skins entregues</SectionTitle>
                  <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                    Compara o valor recebido, o valor realmente entregue e a projeção estatística em {currency}.
                  </ThemeText>
                </div>
                <ChartTypeSelector value={chartVariant} onChange={setChartVariant} />
              </div>
              <DualSeriesMetricsChart
                data={data.series}
                seriesGranularity={data.seriesGranularity}
                variant={chartVariant}
                keys={['stakedCents', 'payoutCents']}
                names={['Valor apostado', 'Valor entregue']}
                colors={['#5c6fff', '#f43f5e']}
                gradientIds={['upgrade-stake', 'upgrade-payout']}
                third={{
                  key: 'expectedPayoutCents',
                  name: 'Entrega projetada',
                  color: '#f59e0b',
                  gradientId: 'upgrade-expected',
                }}
                formatValue={(value) => formatCentsMoney(value, currency)}
                formatAxisTick={(value) => formatCentsAxisTick(value, currency)}
                yAxisWidth={82}
              />
            </Surface>

            <Surface variant="cardInset" className="space-y-3">
              <div className="mb-1">
                <SectionTitle>Leitura do período</SectionTitle>
                <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                  Indicadores para interpretar o resultado sem misturar moedas.
                </ThemeText>
              </div>
              <InsightRow
                label="Resultado real comparado à projeção"
                value={formatCentsMoney(summary.profitVsExpectedCents, currency)}
                detail={`O resultado bruto projetado era ${formatCentsMoney(summary.expectedProfitCents, currency)}.`}
                positive={summary.profitVsExpectedCents >= 0}
              />
              <InsightRow
                label="Sucessos dos jogadores comparados à projeção"
                value={`${formatCount(summary.wins)} reais / ${formatCount(summary.expectedWins)} projetados`}
                detail={`A taxa real ficou ${formatPercent(Math.abs(summary.luckDeltaPercent))} ${summary.luckDeltaPercent > 0 ? 'acima' : 'abaixo'} da taxa projetada.`}
                positive={summary.luckDeltaPercent <= 0}
              />
              <InsightRow
                label="Origem do valor apostado"
                value={`${formatPercent(sourceShare)} em skins · ${formatPercent(balanceShare)} em saldo`}
                detail={`Dentro do saldo utilizado, ${formatCentsMoney(summary.bonusBalanceStakeCents, currency)} vieram de bônus.`}
              />
            </Surface>
          </div>

          <Surface variant="cardInset" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
                <ListTree className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <ThemeText as="p" tone="primary" className="font-semibold">
                  Precisa investigar o resultado?
                </ThemeText>
                <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                  Consulte o desempenho por skin, o histórico de jogadas ou a auditoria das probabilidades.
                </ThemeText>
              </div>
            </div>
            <Link
              to="/dashboard/upgrades/results"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Abrir detalhamento
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
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
