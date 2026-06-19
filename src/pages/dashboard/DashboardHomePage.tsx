import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useGetAdminDashboardMetricsQuery } from '@/redux/store/api/metrics/api.metrics'
import { Button } from '@/components/ui/Button'
import {
  DateRangePickerModal,
  DateRangePickerTrigger,
  getActiveQuickPresetLabel,
} from '@/components/ui/DateRangePickerModal'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  ChartTypeSelector,
  DualSeriesMetricsChart,
  useChartVariant,
} from '@/pages/dashboard/DashboardAnalyticsCharts'
import {
  loadStoredMetricsRange,
  saveStoredMetricsRange,
} from '@/utils/dashboardMetricsRangeStorage'
import { formatCentsUSD } from '@/utils/formatDisplay'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  applyPreset,
  endOfLocalDay,
  isRangeWithinMaxYear,
  startOfLocalDay,
} from '@/utils/metricsDateRange'

function MetricTile({
  label,
  value,
  hint,
  format = 'count',
}: {
  label: string
  value: number
  hint?: string
  format?: 'count' | 'currency'
}) {
  const display =
    format === 'currency'
      ? formatCentsUSD(value)
      : value.toLocaleString('pt-BR')

  return (
    <Surface variant="metricTile">
      <ThemeText as="p" tone="muted" className="text-xs font-medium uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText
        as="p"
        tone="primary"
        className="mt-2 text-2xl font-semibold tabular-nums"
      >
        {display}
      </ThemeText>
      {hint ? (
        <ThemeText as="p" tone="faint" className="mt-1 text-xs">
          {hint}
        </ThemeText>
      ) : null}
    </Surface>
  )
}

function initialDashboardRange() {
  const stored = loadStoredMetricsRange()
  if (stored) return stored
  return applyPreset('7d')
}

const chartArticleClass =
  'overflow-hidden rounded-3xl border border-zinc-200/70 bg-gradient-to-br from-white via-white to-zinc-50/80 p-5 shadow-sm dark:border-zinc-700/80 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-zinc-950 dark:ring-1 dark:ring-inset dark:ring-zinc-700/50 sm:p-6'

export default function DashboardHomePage() {
  const initial = useMemo(() => initialDashboardRange(), [])
  const [rangeStart, setRangeStart] = useState(() => initial.start)
  const [rangeEnd, setRangeEnd] = useState(() => initial.end)
  const [pickerOpen, setPickerOpen] = useState(false)

  const chartReg = useChartVariant('cs2-m-reg')
  const chartOpens = useChartVariant('cs2-m-opens')
  const chartDeposits = useChartVariant('cs2-m-dep')
  const chartRevenue = useChartVariant('cs2-m-rev')

  const orderOk =
    startOfLocalDay(rangeStart).getTime() <= endOfLocalDay(rangeEnd).getTime()
  const rangeOk = isRangeWithinMaxYear(
    startOfLocalDay(rangeStart),
    endOfLocalDay(rangeEnd),
  )
  const queryOk = orderOk && rangeOk

  const apiRange = useMemo(() => {
    if (!queryOk) return null
    return {
      startDate: startOfLocalDay(rangeStart).toISOString(),
      endDate: endOfLocalDay(rangeEnd).toISOString(),
    }
  }, [rangeStart, rangeEnd, queryOk])

  const {
    data: metrics,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminDashboardMetricsQuery(apiRange ?? { startDate: '', endDate: '' }, {
    skip: !apiRange,
  })

  const bucketLabel =
    metrics?.seriesGranularity === 'month' ? 'mês' : 'dia'

  const periodPresetLabel = useMemo(
    () => getActiveQuickPresetLabel(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  )

  return (
    <div className="space-y-8">
      <DateRangePickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        appliedStart={rangeStart}
        appliedEnd={rangeEnd}
        onApply={(start, end) => {
          setRangeStart(start)
          setRangeEnd(end)
          saveStoredMetricsRange(start, end)
        }}
      />

      <Surface variant="card">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ThemeText
              as="h1"
              tone="primary"
              className="text-xl font-semibold sm:text-2xl"
            >
              Métricas
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
              Cadastros, aberturas reais de caixa, depósitos e faturamento da
              plataforma. Valores financeiros normalizados em USD; aberturas de
              teste e afiliados de teste ficam de fora. Acima de 30 dias o
              gráfico agrupa por mês.
            </ThemeText>
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
            Atualizar
          </Button>
        </div>

        <div className="mb-2">
          <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
            Período
          </ThemeText>
          <DateRangePickerTrigger
            appliedStart={rangeStart}
            appliedEnd={rangeEnd}
            presetLabel={periodPresetLabel}
            onClick={() => setPickerOpen(true)}
          />
        </div>

        {!queryOk ? (
          <ThemeText as="p" tone="warning" className="mt-3 text-sm">
            Intervalo inválido ou maior que 366 dias. Ajuste no seletor de datas.
          </ThemeText>
        ) : null}

        {isError ? (
          <ThemeText as="p" tone="danger" className="mb-4 mt-4 text-sm">
            {getErrorMessage(error)}
          </ThemeText>
        ) : null}

        {isLoading && queryOk ? (
          <div className="flex items-center gap-2 py-12 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            Carregando métricas…
          </div>
        ) : null}

        {metrics && queryOk ? (
          <>
            <p className="mb-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Série por{' '}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {bucketLabel}
              </span>
              {metrics.seriesGranularity === 'month'
                ? ' (período longo: agregação mensal)'
                : ''}
              .
            </p>

            <div className="mb-8 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricTile
                  label="Usuários cadastrados"
                  value={metrics.totals.usersCreated}
                  hint="Exclui contas marcadas como excluídas"
                />
                <MetricTile
                  label="Aberturas de caixa"
                  value={metrics.totals.caseOpensReal}
                  hint="Somente aberturas reais (sem teste)"
                />
                <MetricTile
                  label="Depósitos"
                  value={metrics.totals.depositsCount}
                  hint="Transações de depósito no período"
                />
                <MetricTile
                  label="Influencers"
                  value={metrics.totals.influencersCreated}
                  hint="Cadastros de influencer ou afiliado de teste"
                />
                <MetricTile
                  label="Créditos bônus"
                  value={metrics.totals.bonusCreditsCount}
                  hint="Concessões manuais pelo admin"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile
                  label="Faturamento das caixas"
                  value={metrics.totals.revenueUsdCents}
                  format="currency"
                  hint="Gasto em aberturas reais (USD)"
                />
                <MetricTile
                  label="Valor dos drops"
                  value={metrics.totals.payoutUsdCents}
                  format="currency"
                  hint="Valor dos itens sorteados (USD)"
                />
                <MetricTile
                  label="Margem bruta"
                  value={metrics.totals.marginUsdCents}
                  format="currency"
                  hint="Faturamento − valor dos drops"
                />
                <MetricTile
                  label="Volume depositado"
                  value={metrics.totals.depositsVolumeCents}
                  format="currency"
                  hint="Soma dos depósitos creditados"
                />
              </div>
            </div>

            <div className="space-y-10">
              <article className={chartArticleClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <ThemeText as="h3" tone="primary" className="font-semibold">
                      Faturamento e drops por {bucketLabel}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-sm">
                      Quanto entrou nas caixas vs. valor dos prêmios entregues
                    </ThemeText>
                  </div>
                  <ChartTypeSelector
                    value={chartRevenue.variant}
                    onChange={chartRevenue.onChange}
                  />
                </div>
                <DualSeriesMetricsChart
                  data={metrics.series}
                  seriesGranularity={metrics.seriesGranularity}
                  variant={chartRevenue.variant}
                  keys={['revenueUsdCents', 'payoutUsdCents']}
                  names={['Faturamento', 'Drops']}
                  colors={['#059669', '#6366f1']}
                  gradientIds={['cs2Revenue', 'cs2Payout']}
                  valueFormat="currency"
                />
              </article>

              <article className={chartArticleClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <ThemeText as="h3" tone="primary" className="font-semibold">
                      Cadastros e aberturas por {bucketLabel}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-sm">
                      Novos usuários e aberturas reais de caixa
                    </ThemeText>
                  </div>
                  <ChartTypeSelector
                    value={chartReg.variant}
                    onChange={chartReg.onChange}
                  />
                </div>
                <DualSeriesMetricsChart
                  data={metrics.series}
                  seriesGranularity={metrics.seriesGranularity}
                  variant={chartReg.variant}
                  keys={['usersCreated', 'caseOpensReal']}
                  names={['Usuários', 'Aberturas']}
                  colors={['#5c6fff', '#7c3aed']}
                  gradientIds={['cs2Users', 'cs2Opens']}
                />
              </article>

              <article className={chartArticleClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <ThemeText as="h3" tone="primary" className="font-semibold">
                      Depósitos e cadastros por {bucketLabel}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-sm">
                      Novos depósitos creditados e usuários cadastrados
                    </ThemeText>
                  </div>
                  <ChartTypeSelector
                    value={chartDeposits.variant}
                    onChange={chartDeposits.onChange}
                  />
                </div>
                <DualSeriesMetricsChart
                  data={metrics.series}
                  seriesGranularity={metrics.seriesGranularity}
                  variant={chartDeposits.variant}
                  keys={['depositsCount', 'usersCreated']}
                  names={['Depósitos', 'Cadastros']}
                  colors={['#2563eb', '#0d9488']}
                  gradientIds={['cs2DepCount', 'cs2UsersDep']}
                />
              </article>

              <article className={chartArticleClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <ThemeText as="h3" tone="primary" className="font-semibold">
                      Margem e faturamento por {bucketLabel}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-sm">
                      Resultado bruto da operação de caixas
                    </ThemeText>
                  </div>
                  <ChartTypeSelector
                    value={chartOpens.variant}
                    onChange={chartOpens.onChange}
                  />
                </div>
                <DualSeriesMetricsChart
                  data={metrics.series}
                  seriesGranularity={metrics.seriesGranularity}
                  variant={chartOpens.variant}
                  keys={['marginUsdCents', 'revenueUsdCents']}
                  names={['Margem', 'Faturamento']}
                  colors={['#ea580c', '#5c6fff']}
                  gradientIds={['cs2Margin', 'cs2Rev']}
                  valueFormat="currency"
                />
              </article>
            </div>
          </>
        ) : null}
      </Surface>
    </div>
  )
}
