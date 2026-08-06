import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Box,
  ExternalLink,
  Lock,
  Package,
  Pencil,
  Unlock,
} from 'lucide-react'
import {
  ChartTypeSelector,
  DualSeriesMetricsChart,
  useChartVariant,
} from '@/components/charts/AnalyticsCharts'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { formatSkinsPrice, type SkinsCurrency } from '@/constants/skinsCurrency'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import {
  useGetCaseDetailsQuery,
  type AdminCaseDailyPoint,
  type AdminCaseItemStats,
} from '@/redux/store/api/cases/api.cases'
import { getErrorMessage } from '@/utils/getErrorMessage'

const DAILY_WINDOW_DAYS = 30

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

/**
 * A API só devolve os dias que tiveram abertura. A curva precisa da janela
 * inteira, senão dois dias isolados viram uma linha esticada sem noção de tempo.
 */
function buildDailySeries(daily: AdminCaseDailyPoint[]): AdminCaseDailyPoint[] {
  const byDate = new Map(daily.map((point) => [point.date, point]))
  const series: AdminCaseDailyPoint[] = []
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)
  cursor.setUTCDate(cursor.getUTCDate() - (DAILY_WINDOW_DAYS - 1))

  for (let index = 0; index < DAILY_WINDOW_DAYS; index += 1) {
    const date = cursor.toISOString().slice(0, 10)
    series.push(byDate.get(date) ?? { date, opens: 0, revenue: 0, payout: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return series
}

function formatOpens(value: number | null) {
  if (value == null) return '—'
  if (value === 0) return 'já liberado'
  return `${value.toLocaleString('pt-BR')} abertura${value === 1 ? '' : 's'}`
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="p" tone="primary" className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
        {value}
      </ThemeText>
      {hint ? (
        <ThemeText as="p" tone="faint" className="mt-1.5 text-xs leading-relaxed">
          {hint}
        </ThemeText>
      ) : null}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800/80">
      <ThemeText tone="secondary" className="text-sm">
        {label}
      </ThemeText>
      <ThemeText tone="primary" className="text-sm font-medium tabular-nums">
        {value}
      </ThemeText>
    </div>
  )
}

function BankProgress({ ratio }: { ratio: number }) {
  const percent = Math.min(100, Math.max(0, ratio * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function EligibilityCell({
  item,
  currency,
  bankBalance,
}: {
  item: AdminCaseItemStats
  currency: SkinsCurrency
  bankBalance: number
}) {
  if (!item.enabled) {
    return (
      <ThemeText tone="faint" className="text-xs">
        Desabilitado
      </ThemeText>
    )
  }

  if (item.coveredByOpenPrice) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Unlock className="h-3 w-3" aria-hidden />
          Sempre
        </span>
        <ThemeText tone="faint" className="text-xs">
          Cabe no preço da abertura
        </ThemeText>
      </div>
    )
  }

  const ratio =
    item.requiredBankBalance > 0 ? bankBalance / item.requiredBankBalance : 1

  return (
    <div className="min-w-[11rem] space-y-1.5">
      {item.eligible ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Unlock className="h-3 w-3" aria-hidden />
          Liberado
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <Lock className="h-3 w-3" aria-hidden />
          Travado
        </span>
      )}
      <BankProgress ratio={ratio} />
      <ThemeText tone="secondary" className="text-xs tabular-nums">
        Precisa {formatSkinsPrice(item.requiredBankBalance, currency)}
      </ThemeText>
      {!item.eligible ? (
        <ThemeText tone="faint" className="text-xs">
          Falta {formatSkinsPrice(item.bankShortfall, currency)} ·{' '}
          {formatOpens(item.opensToUnlock)}
        </ThemeText>
      ) : null}
    </div>
  )
}

export default function CaseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { data, isLoading, isError, error } = useGetCaseDetailsQuery(
    { id, dataEnvironment },
    { skip: !id },
  )
  const chart = useChartVariant('cs2-case-daily')
  const dailySeries = useMemo(
    () => buildDailySeries(data?.daily ?? []),
    [data?.daily],
  )

  if (isLoading) {
    return (
      <ThemeText tone="secondary" className="py-10 text-sm">
        Carregando detalhes da caixa...
      </ThemeText>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/cases" className={`inline-flex items-center gap-2 ${linkBrand}`}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para caixas
        </Link>
        <Surface variant="errorBanner">
          {isError ? getErrorMessage(error) : 'Caixa não encontrada.'}
        </Surface>
      </div>
    )
  }

  const { case: lootCase, bank, financials, items } = data
  const currency = lootCase.currency
  const money = (value: number) => formatSkinsPrice(value, currency)
  const blockedCount = Math.max(0, bank.enabledItemsCount - bank.eligibleItemsCount)
  const itemsPaidOut = items.reduce((sum, item) => sum + item.totalPaidOut, 0)
  const itemsTimesWon = items.reduce((sum, item) => sum + item.timesWon, 0)

  return (
    <div className="space-y-6">
      <Link to="/dashboard/cases" className={`inline-flex items-center gap-2 ${linkBrand}`}>
        <ArrowLeft className="h-4 w-4" />
        Voltar para caixas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          subtitle={
            isSandbox
              ? `/${lootCase.slug} · Visão Dev: só aberturas de teste (influencer).`
              : `/${lootCase.slug} · Visão Produção: só aberturas reais.`
          }
        >
          {lootCase.name}
        </PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/dashboard/case-opens?caseId=${lootCase._id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60"
          >
            <ExternalLink className="h-4 w-4" />
            Aberturas
          </Link>
          <Link
            to={`/dashboard/cases/${lootCase._id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
          >
            <Pencil className="h-4 w-4" />
            Editar caixa
          </Link>
        </div>
      </div>

      <Surface variant="card" className="!p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-950/60">
            {lootCase.imageUrl ? (
              <img
                src={lootCase.imageUrl}
                alt={lootCase.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-8 w-8 text-zinc-400" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-[14rem] flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TextBadge>{lootCase.active ? 'Ativa' : 'Inativa'}</TextBadge>
              <TextBadge>{currency}</TextBadge>
              <TextBadge>
                {lootCase.valueMode === 'with_tax' ? 'Valor com taxa' : 'Valor base'}
              </TextBadge>
            </div>
            {lootCase.description ? (
              <ThemeText tone="secondary" className="text-sm leading-relaxed">
                {lootCase.description}
              </ThemeText>
            ) : null}
            <ThemeText tone="faint" className="text-xs">
              Criada em {formatDateTime(lootCase.createdAt)} · Atualizada em{' '}
              {formatDateTime(lootCase.updatedAt)}
            </ThemeText>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800">
          <div>
            <ThemeText tone="faint" className="text-xs">
              Preço da abertura
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold tabular-nums">
              {money(lootCase.price)}
            </ThemeText>
            {lootCase.discountPercent > 0 ? (
              <ThemeText tone="faint" className="text-xs">
                Tabela {money(lootCase.listPrice)} · −{lootCase.discountPercent}%
              </ThemeText>
            ) : null}
          </div>
          <div>
            <ThemeText tone="faint" className="text-xs">
              Valor esperado (VE)
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold tabular-nums">
              {money(lootCase.expectedValue)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              Soma do valor × chance de cada item
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="faint" className="text-xs">
              Margem alvo
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold tabular-nums">
              {lootCase.targetMarginPercent}%
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              Preço = VE × (1 + margem)
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="faint" className="text-xs">
              Margem real (design)
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold tabular-nums">
              {lootCase.realMarginPercent.toFixed(2)}%
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              (Preço − VE) ÷ VE
            </ThemeText>
          </div>
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-1">Resultado</SectionTitle>
        <ThemeText tone="secondary" className="mb-5 text-sm leading-relaxed">
          Quanto entrou nas aberturas, quanto saiu em prêmios e o que sobrou.
        </ThemeText>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Entrou (faturamento)"
            value={money(financials.totalRevenue)}
            hint={`${financials.totalOpens.toLocaleString('pt-BR')} abertura${financials.totalOpens === 1 ? '' : 's'}`}
          />
          <Metric
            label="Saiu (prêmios)"
            value={money(financials.totalPayout)}
            hint={`Média ${money(financials.averagePayoutPerOpen)} por abertura`}
          />
          <Metric
            label="Sobrou (lucro)"
            value={money(financials.profit)}
            hint={`Margem realizada ${financials.marginPercent.toFixed(2)}% · meta ${lootCase.targetMarginPercent}%`}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <ThemeText tone="primary" className="text-sm font-medium tabular-nums">
            {money(financials.totalRevenue)} − {money(financials.totalPayout)} ={' '}
            {money(financials.profit)}
          </ThemeText>
          <ThemeText tone="faint" className="mt-1 text-xs">
            Faturamento − prêmios pagos = lucro
          </ThemeText>
        </div>

        <div className="mt-5 grid gap-6 border-t border-zinc-100 pt-5 lg:grid-cols-2 dark:border-zinc-800">
          <div>
            <ThemeText tone="overline" className="mb-1">
              Destino dos prêmios
            </ThemeText>
            <InfoRow
              label="Guardados no inventário"
              value={financials.keptCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Convertidos em saldo"
              value={financials.convertedCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Aguardando decisão"
              value={financials.pendingCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Soma"
              value={(
                financials.keptCount +
                financials.convertedCount +
                financials.pendingCount
              ).toLocaleString('pt-BR')}
            />
          </div>
          <div>
            <ThemeText tone="overline" className="mb-1">
              Como o drop saiu
            </ThemeText>
            <InfoRow
              label="Direto (já liberado)"
              value={financials.directCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Re-sorteio (banco travou)"
              value={financials.rerollCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Fallback (nada liberado)"
              value={financials.fallbackCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Soma"
              value={(
                financials.directCount +
                financials.rerollCount +
                financials.fallbackCount
              ).toLocaleString('pt-BR')}
            />
          </div>
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-1">Banco virtual</SectionTitle>
        <ThemeText tone="secondary" className="mb-5 text-sm leading-relaxed">
          Cada abertura coloca {money(bank.injectionPerOpen)} no banco (o VE da caixa).
          Itens até o preço da abertura saem sempre. Itens mais caros só entram no
          sorteio quando o saldo chega no valor deles — e esse valor sai do banco
          quando alguém ganha.
        </ThemeText>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Saldo agora"
            value={money(bank.balance)}
            hint={`+ ${money(bank.injectionPerOpen)} por abertura`}
          />
          <Metric
            label="Itens liberados"
            value={`${bank.eligibleItemsCount}/${bank.enabledItemsCount}`}
            hint={
              blockedCount > 0
                ? `${blockedCount} ainda precisam de saldo`
                : 'Todos liberados neste momento'
            }
          />
          <Metric
            label="Próximo item"
            value={
              bank.nextUnlock
                ? money(bank.nextUnlock.bankShortfall)
                : 'Nada travado'
            }
            hint={
              bank.nextUnlock
                ? `Falta esse valor para liberar ${bank.nextUnlock.skinName} · ${formatOpens(bank.nextUnlock.opensToUnlock)}`
                : 'Nenhum item esperando saldo'
            }
          />
          <Metric
            label="Para liberar tudo"
            value={
              bank.shortfallForFullPool > 0
                ? money(bank.shortfallForFullPool)
                : 'Pronto'
            }
            hint={
              bank.shortfallForFullPool > 0
                ? `Saldo precisa chegar a ${money(bank.targetForFullPool)} · ${formatOpens(bank.opensToFullPool)}`
                : `Saldo já cobre o item mais caro (${money(bank.targetForFullPool)})`
            }
          />
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionTitle>Últimos 30 dias</SectionTitle>
            <ThemeText tone="secondary" className="mt-1 text-sm">
              Faturamento do dia versus prêmios entregues.
            </ThemeText>
          </div>
          <ChartTypeSelector value={chart.variant} onChange={chart.onChange} />
        </div>
        <DualSeriesMetricsChart
          data={dailySeries}
          seriesGranularity="day"
          variant={chart.variant}
          keys={['revenue', 'payout']}
          names={['Faturamento', 'Prêmios']}
          colors={['#059669', '#6366f1']}
          gradientIds={['cs2CaseRevenue', 'cs2CasePayout']}
          formatValue={money}
        />
      </Surface>

      <Surface variant="card" className="!p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionTitle>Itens da caixa</SectionTitle>
            <ThemeText tone="secondary" className="mt-1 text-sm">
              Do mais barato ao mais caro — a ordem em que o banco libera.
            </ThemeText>
          </div>
          <div className="text-right">
            <ThemeText tone="faint" className="text-xs">
              Totais da tabela
            </ThemeText>
            <ThemeText tone="primary" className="text-sm font-medium tabular-nums">
              {itemsTimesWon.toLocaleString('pt-BR')} saídas · {money(itemsPaidOut)} pagos
            </ThemeText>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Item</th>
                <th className={listTable.th}>Valor</th>
                <th className={listTable.th}>Chance</th>
                <th className={listTable.th}>Saiu</th>
                <th className={listTable.th}>Pago</th>
                <th className={listTable.th}>Banco</th>
              </tr>
            </thead>
            <tbody className={listTable.tbody}>
              {items.map((item, index) => (
                <tr key={`${item.skinName}-${index}`} className={listTable.tr}>
                  <td className={listTable.td}>
                    <div className="flex items-center gap-3">
                      <SkinRarityVisual
                        rarity={{ name: item.rarityName, color: item.rarityColor }}
                        className="h-12 w-12 shrink-0"
                        showStar={false}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.skinName}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <Box className="h-5 w-5 text-zinc-400" aria-hidden />
                        )}
                      </SkinRarityVisual>
                      <div className="min-w-0">
                        <ThemeText tone="primary" className="truncate text-sm font-medium">
                          {item.skinName}
                        </ThemeText>
                        {item.rarityName ? (
                          <ThemeText tone="faint" className="text-xs">
                            {item.rarityName}
                          </ThemeText>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className={listTable.td}>
                    <ThemeText tone="primary" className="text-sm font-medium tabular-nums">
                      {money(item.price)}
                    </ThemeText>
                    <ThemeText tone="faint" className="text-xs tabular-nums">
                      VE {money(item.expectedValue)}
                    </ThemeText>
                  </td>
                  <td className={listTable.td}>
                    <ThemeText tone="primary" className="text-sm tabular-nums">
                      {item.probability.toFixed(4)}%
                    </ThemeText>
                    <ThemeText tone="faint" className="text-xs tabular-nums">
                      real {item.actualDropPercent.toFixed(4)}%
                    </ThemeText>
                  </td>
                  <td className={listTable.td}>
                    <ThemeText tone="primary" className="text-sm tabular-nums">
                      {item.timesWon.toLocaleString('pt-BR')}×
                    </ThemeText>
                    {item.lastWonAt ? (
                      <ThemeText tone="faint" className="text-xs">
                        {formatDateTime(item.lastWonAt)}
                      </ThemeText>
                    ) : null}
                  </td>
                  <td className={`${listTable.td} tabular-nums`}>
                    {money(item.totalPaidOut)}
                  </td>
                  <td className={listTable.td}>
                    <EligibilityCell
                      item={item}
                      currency={currency}
                      bankBalance={bank.balance}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className={listTable.td} colSpan={3}>
                  <ThemeText tone="secondary" className="text-sm font-medium">
                    Totais
                  </ThemeText>
                </td>
                <td className={listTable.td}>
                  <ThemeText tone="primary" className="text-sm font-semibold tabular-nums">
                    {itemsTimesWon.toLocaleString('pt-BR')}×
                  </ThemeText>
                </td>
                <td className={listTable.td}>
                  <ThemeText tone="primary" className="text-sm font-semibold tabular-nums">
                    {money(itemsPaidOut)}
                  </ThemeText>
                </td>
                <td className={listTable.td}>
                  <ThemeText tone="faint" className="text-xs">
                    {bank.eligibleItemsCount}/{bank.enabledItemsCount} liberados
                  </ThemeText>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-3">Configuração</SectionTitle>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <InfoRow label="Preço de tabela" value={money(lootCase.listPrice)} />
            <InfoRow label="Desconto" value={`${lootCase.discountPercent}%`} />
            <InfoRow label="Preço final" value={money(lootCase.price)} />
            <InfoRow
              label="Margem alvo"
              value={`${lootCase.targetMarginPercent}%`}
            />
          </div>
          <div>
            <InfoRow
              label="Soma das chances"
              value={`${lootCase.probabilitySum.toFixed(4)}% de ${lootCase.probabilityTargetPercent}%`}
            />
            <InfoRow
              label="Itens"
              value={`${lootCase.enabledItemsCount} ativos de ${lootCase.itemsCount}`}
            />
            <InfoRow
              label="Primeira abertura"
              value={formatDateTime(financials.firstOpenAt)}
            />
            <InfoRow
              label="Última abertura"
              value={formatDateTime(financials.lastOpenAt)}
            />
          </div>
        </div>
      </Surface>
    </div>
  )
}
