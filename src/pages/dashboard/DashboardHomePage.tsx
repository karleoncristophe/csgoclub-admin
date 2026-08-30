import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useGetAdminDashboardMetricsQuery, useGetAdminOnlineMetricsQuery } from '@/redux/store/api/metrics/api.metrics'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { Button } from '@/components/ui/Button'
import {
  DateRangePickerModal,
  DateRangePickerTrigger,
  getActiveQuickPresetLabel,
} from '@/components/ui/DateRangePickerModal'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import {
  ChartTypeSelector,
  DualSeriesMetricsChart,
  useChartVariant,
} from '@/components/charts/AnalyticsCharts'
import {
  loadStoredMetricsCurrency,
  saveStoredMetricsCurrency,
} from '@/utils/dashboardMetricsCurrencyStorage'
import {
  loadStoredMetricsRange,
  saveStoredMetricsRange,
} from '@/utils/dashboardMetricsRangeStorage'
import { formatCentsAxisTick, formatCentsMoney } from '@/utils/formatDisplay'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  applyPreset,
  endOfLocalDay,
  isRangeWithinMaxYear,
  startOfLocalDay,
} from '@/utils/metricsDateRange'
import {
  ADMIN_DASHBOARD_CURRENCIES,
  metricsMoneyKeys,
  type AdminDashboardCurrency,
} from '@/types/adminMetrics'

function MetricTile({
  label,
  value,
  hint,
  format = 'count',
  currency = 'USD',
}: {
  label: string
  value: number
  hint?: string
  format?: 'count' | 'currency'
  currency?: AdminDashboardCurrency
}) {
  const display =
    format === 'currency'
      ? formatCentsMoney(value, currency)
      : value.toLocaleString('pt-BR')

  return (
    <Surface variant="metricTile">
      <ThemeText as="p" tone="muted" className="text-xs font-medium uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText
        as="p"
        tone="primary"
        className="mt-1 text-xl font-semibold tabular-nums"
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
  'overflow-hidden rounded-3xl border border-border bg-linear-to-br from-surface via-surface to-accent-soft p-5 text-left shadow-sm shadow-black/5 sm:p-6'

export default function DashboardHomePage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const initial = useMemo(() => initialDashboardRange(), [])
  const [rangeStart, setRangeStart] = useState(() => initial.start)
  const [rangeEnd, setRangeEnd] = useState(() => initial.end)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [currency, setCurrency] = useState<AdminDashboardCurrency>(
    () => loadStoredMetricsCurrency(),
  )
  const moneyKeys = metricsMoneyKeys(currency)

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
      dataEnvironment,
    }
  }, [rangeStart, rangeEnd, queryOk, dataEnvironment])

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

  const { data: onlineMetrics } = useGetAdminOnlineMetricsQuery(undefined, {
    pollingInterval: 10_000,
  })

  const liveOnlineCount = onlineMetrics?.onlineCount ?? metrics?.onlineCount

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
              {isSandbox
                ? 'Visão Dev: influencers, aberturas de teste, créditos bônus e faturamento fake — nada se mistura com produção.'
                : 'Visão Produção: cadastros reais, aberturas reais, depósitos e faturamento. Influencers e testes ficam de fora.'}{' '}
              Dinheiro é nativo da carteira (BRL, USD ou EUR) — sem conversão. Acima de 30 dias o gráfico agrupa por mês.
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

        {typeof liveOnlineCount === 'number' ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricTile
              label="Online agora"
              value={liveOnlineCount}
              hint="Presença em tempo real no site (Socket.io /presence)"
            />
          </div>
        ) : null}

        {isLoading && queryOk ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            Carregando métricas…
          </div>
        ) : null}

        {metrics && queryOk ? (
          <>
            <p className="mb-4 mt-2 text-sm text-muted">
              Série por{' '}
              <span className="font-medium text-foreground">
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
                  label={isSandbox ? 'Influencers cadastrados' : 'Usuários cadastrados'}
                  value={metrics.totals.usersCreated}
                  hint={
                    isSandbox
                      ? 'Somente contas influencer / teste'
                      : 'Exclui influencers e contas excluídas'
                  }
                />
                <MetricTile
                  label="Aberturas de caixa"
                  value={metrics.totals.caseOpensReal}
                  hint={
                    isSandbox
                      ? 'Somente aberturas de teste'
                      : 'Somente aberturas reais (sem teste)'
                  }
                />
                <MetricTile
                  label={isSandbox ? 'Créditos bônus' : 'Depósitos'}
                  value={metrics.totals.depositsCount}
                  hint={
                    isSandbox
                      ? 'Concessões manuais / bônus no período'
                      : 'Transações de depósito no período'
                  }
                />
                {!isSandbox ? (
                  <>
                    <MetricTile
                      label="Influencers"
                      value={metrics.totals.influencersCreated}
                      hint="Cadastros de influencer (fora desta visão)"
                    />
                    <MetricTile
                      label="Créditos bônus"
                      value={metrics.totals.bonusCreditsCount}
                      hint="Concessões manuais pelo admin"
                    />
                  </>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ThemeText as="p" tone="label" className="text-sm font-medium">
                  Carteira
                </ThemeText>
                <SegmentedTabs
                  ariaLabel="Moeda da carteira"
                  value={currency}
                  items={ADMIN_DASHBOARD_CURRENCIES.map((code) => ({ id: code, label: code }))}
                  onChange={(next) => {
                    const code = next as (typeof ADMIN_DASHBOARD_CURRENCIES)[number]
                    setCurrency(code)
                    saveStoredMetricsCurrency(code)
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label={isSandbox ? 'Gasto em aberturas teste' : 'Faturamento das caixas'}
                  value={metrics.totals[moneyKeys.revenue]}
                  format="currency"
                  currency={currency}
                  hint={
                    isSandbox
                      ? `Gasto em aberturas de teste (${currency})`
                      : `Gasto na carteira ${currency} — sem conversão`
                  }
                />
                <MetricTile
                  label="Valor dos drops"
                  value={metrics.totals[moneyKeys.payout]}
                  format="currency"
                  currency={currency}
                  hint={`Valor dos itens sorteados na mesma moeda (${currency})`}
                />
                <MetricTile
                  label="Margem bruta"
                  value={metrics.totals[moneyKeys.margin]}
                  format="currency"
                  currency={currency}
                  hint="Faturamento − valor dos drops, na carteira selecionada"
                />
                <MetricTile
                  label={isSandbox ? 'Volume de bônus' : 'Volume depositado'}
                  value={
                    metrics.totals[moneyKeys.depositsVolume] ??
                    (currency === 'USD' ? metrics.totals.depositsVolumeCents : 0)
                  }
                  format="currency"
                  currency={currency}
                  hint={
                    isSandbox
                      ? `Soma dos créditos bônus em ${currency}`
                      : `Depósitos creditados na carteira ${currency}`
                  }
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
                      Quanto entrou nas caixas vs. valor dos prêmios, em {currency}
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
                  keys={[moneyKeys.revenue, moneyKeys.payout]}
                  names={['Faturamento', 'Drops']}
                  colors={['#059669', '#6366f1']}
                  gradientIds={['cs2Revenue', 'cs2Payout']}
                  valueFormat="currency"
                  formatValue={(value) => formatCentsMoney(value, currency)}
                  formatAxisTick={(value) => formatCentsAxisTick(value, currency)}
                />
              </article>

              <article className={chartArticleClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <ThemeText as="h3" tone="primary" className="font-semibold">
                      Cadastros e aberturas por {bucketLabel}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-sm">
                      {isSandbox
                        ? 'Novos influencers e aberturas de teste'
                        : 'Novos usuários e aberturas reais de caixa'}
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
                      {isSandbox ? 'Bônus e cadastros' : 'Depósitos e cadastros'} por{' '}
                      {bucketLabel}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-sm">
                      {isSandbox
                        ? 'Créditos bônus e influencers cadastrados'
                        : 'Novos depósitos creditados e usuários cadastrados'}
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
                  names={[isSandbox ? 'Bônus' : 'Depósitos', 'Cadastros']}
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
                      Resultado bruto das caixas na carteira {currency}
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
                  keys={[moneyKeys.margin, moneyKeys.revenue]}
                  names={['Margem', 'Faturamento']}
                  colors={['#ea580c', '#5c6fff']}
                  gradientIds={['cs2Margin', 'cs2Rev']}
                  valueFormat="currency"
                  formatValue={(value) => formatCentsMoney(value, currency)}
                  formatAxisTick={(value) => formatCentsAxisTick(value, currency)}
                />
              </article>
            </div>
          </>
        ) : null}
      </Surface>
    </div>
  )
}
