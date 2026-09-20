import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '@/components/ui/BackLink'
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
import { BankProgressBar } from '@/components/cases/BankProgressBar'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
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

function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

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
    <div className="rounded-xl border border-border bg-surface-secondary p-3">
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

function Step({
  number,
  title,
  value,
  detail,
}: {
  number: number
  title: string
  value: string
  detail: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface-secondary p-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        {number}
      </span>
      <div className="min-w-0">
        <ThemeText as="p" tone="secondary" className="text-xs">
          {title}
        </ThemeText>
        <ThemeText as="p" tone="primary" className="mt-0.5 text-base font-semibold tabular-nums">
          {value}
        </ThemeText>
        <ThemeText as="p" tone="faint" className="mt-1 text-xs leading-relaxed">
          {detail}
        </ThemeText>
      </div>
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
      <div className="min-w-[11rem] space-y-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Unlock className="h-3 w-3" aria-hidden />
          Sempre
        </span>
        <BankProgressBar ratio={1} />
        <ThemeText tone="faint" className="text-xs">
          Custa até o preço da caixa
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
      <BankProgressBar ratio={ratio} />
      <ThemeText tone="secondary" className="text-xs tabular-nums">
        Banco precisa ter {formatSkinsPrice(item.requiredBankBalance, currency)}
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
    { skip: !id, refetchOnMountOrArgChange: true },
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
        <BackLink fallback="/dashboard/cases" className={`inline-flex items-center gap-2 ${linkBrand}`}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para caixas
        </BackLink>
        <Surface variant="errorBanner">
          {isError ? getErrorMessage(error) : 'Caixa não encontrada.'}
        </Surface>
      </div>
    )
  }

  const { case: lootCase, bank, financials, items, ledger } = data
  const currency = lootCase.currency
  const money = (value: number) => formatSkinsPrice(value, currency)
  // Backends antigos não mandam a separação fixa/variável: reconstrói pelo banco.
  const fixedMarginPerOpen =
    financials.fixedMarginPerOpen ?? Math.max(0, lootCase.price - bank.injectionPerOpen)
  const fixedMarginValue =
    financials.fixedMarginValue ?? fixedMarginPerOpen * financials.totalOpens
  const variableMarginValue =
    financials.variableMarginValue ?? financials.profit - fixedMarginValue
  const averageVariableMarginPerOpen =
    financials.averageVariableMarginPerOpen ??
    (financials.totalOpens > 0 ? variableMarginValue / financials.totalOpens : 0)
  const blockedCount = Math.max(0, bank.enabledItemsCount - bank.eligibleItemsCount)
  const marginGapPercent =
    Math.round((lootCase.realMarginPercent - lootCase.targetMarginPercent) * 100) / 100
  const battleRoundsInBank = Math.max(
    0,
    (ledger?.totalRealOpens ?? 0) - financials.totalOpens,
  )
  const itemsPaidOut = items.reduce((sum, item) => sum + item.totalPaidOut, 0)
  const itemsTimesWon = items.reduce((sum, item) => sum + item.timesWon, 0)

  return (
    <div className="space-y-6">
      <BackLink fallback="/dashboard/cases" className={`inline-flex items-center gap-2 ${linkBrand}`}>
        <ArrowLeft className="h-4 w-4" />
        Voltar para caixas
      </BackLink>

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
          {!lootCase.deleted && !lootCase.archivedAt && <Link
            to={`/dashboard/cases/${lootCase._id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
          >
            <Pencil className="h-4 w-4" />
            Editar caixa
          </Link>}
        </div>
      </div>

      <Surface variant="settingsPanel" className="!p-5">
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
              <TextBadge>{lootCase.deleted || lootCase.archivedAt ? 'Excluída do catálogo — histórico preservado' : lootCase.active ? 'Ativa' : 'Inativa'}</TextBadge>
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

        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-2 xl:grid-cols-4 dark:border-zinc-800">
          <div>
            <ThemeText tone="faint" className="text-xs">
              Preço da caixa
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
              Fica com a casa, por abertura
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold tabular-nums">
              {money(fixedMarginPerOpen)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              Garantido, não depende da skin que sai
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="faint" className="text-xs">
              Vai para o banco, por abertura
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold tabular-nums">
              {money(bank.injectionPerOpen)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              É daqui que saem os prêmios
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="faint" className="text-xs">
              Margem agora × alvo
            </ThemeText>
            <ThemeText
              tone={lootCase.expectedValueAlert ? 'danger' : 'primary'}
              className="mt-1 text-lg font-semibold tabular-nums"
            >
              {formatPercent(lootCase.realMarginPercent)}{' '}
              <ThemeText as="span" tone="faint" className="text-sm font-normal">
                × {formatPercent(lootCase.targetMarginPercent)}
              </ThemeText>
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              {marginGapPercent === 0
                ? 'No alvo'
                : marginGapPercent > 0
                  ? `${formatPercent(marginGapPercent)} acima · skins ficaram mais baratas`
                  : `${formatPercent(Math.abs(marginGapPercent))} abaixo · skins ficaram mais caras`}
              {marginGapPercent !== 0 && lootCase.suggestedPrice > 0
                ? ` · no alvo o preço seria ${money(lootCase.suggestedPrice)}`
                : ''}
            </ThemeText>
          </div>
        </div>
      </Surface>

      <Surface variant="settingsPanel" className="!p-5">
        <SectionTitle className="mb-1">Banco da caixa</SectionTitle>
        <ThemeText tone="secondary" className="mb-5 text-sm leading-relaxed">
          É o saldo que decide quais skins podem sair. Skin que custa até o preço da
          caixa sai sempre. Skin mais cara só sai quando o banco tem o valor inteiro dela.
        </ThemeText>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Saldo agora"
            value={money(bank.balance)}
            hint={`Sobe ${money(bank.injectionPerOpen)} a cada abertura, desce o valor da skin que saiu`}
          />
          <Metric
            label="Skins liberadas"
            value={`${bank.eligibleItemsCount} de ${bank.enabledItemsCount}`}
            hint={
              blockedCount > 0
                ? `${blockedCount} travada${blockedCount === 1 ? '' : 's'} esperando saldo`
                : 'Todas podem sair agora'
            }
          />
          <Metric
            label="Próxima a liberar"
            value={
              bank.nextUnlock
                ? bank.nextUnlock.skinName
                : 'Nenhuma travada'
            }
            hint={
              bank.nextUnlock
                ? `Falta ${money(bank.nextUnlock.bankShortfall)} · ${formatOpens(bank.nextUnlock.opensToUnlock)}`
                : 'Todas as skins já cabem no saldo'
            }
          />
          <Metric
            label="Para liberar a mais cara"
            value={
              bank.shortfallForFullPool > 0
                ? money(bank.shortfallForFullPool)
                : 'Já liberada'
            }
            hint={
              bank.shortfallForFullPool > 0
                ? `Saldo precisa chegar a ${money(bank.targetForFullPool)} · ${formatOpens(bank.opensToFullPool)}`
                : `Saldo cobre o item mais caro (${money(bank.targetForFullPool)})`
            }
          />
        </div>

        {battleRoundsInBank > 0 || bank.balance < 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <ThemeText tone="primary" className="text-sm font-medium">
              {battleRoundsInBank > 0
                ? `${battleRoundsInBank.toLocaleString('pt-BR')} rodada${battleRoundsInBank === 1 ? '' : 's'} de batalha também mexeram neste saldo`
                : 'Saldo negativo'}
            </ThemeText>
            <ThemeText tone="secondary" className="mt-1 text-xs leading-relaxed">
              {battleRoundsInBank > 0
                ? 'Rodadas de batalha entram e saem do banco igual a uma abertura, mas não contam em "Resultado das aberturas".'
                : ''}
              {bank.balance < 0
                ? ' Saiu mais em prêmio do que entrou — acontece quando a skin mais barata já custa mais que o preço da caixa.'
                : ''}
            </ThemeText>
          </div>
        ) : null}

        <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <ThemeText tone="overline" className="mb-3">
            O que acontece em uma abertura
          </ThemeText>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Step
              number={1}
              title="Jogador paga"
              value={money(lootCase.price)}
              detail={`${money(fixedMarginPerOpen)} fica com a casa e ${money(bank.injectionPerOpen)} entra no banco.`}
            />
            <Step
              number={2}
              title="Banco na hora do sorteio"
              value={money(bank.balance + bank.injectionPerOpen)}
              detail="Saldo atual + o que acabou de entrar. Skins até esse valor podem sair."
            />
            <Step
              number={3}
              title="Sorteia pela chance"
              value={`${bank.eligibleItemsCount} de ${bank.enabledItemsCount} podem sair`}
              detail={`Skin até ${money(lootCase.price)} sai sempre. Mais cara só se o banco cobre o valor inteiro. Se cair numa travada, sorteia de novo entre as liberadas.`}
            />
            <Step
              number={4}
              title="Sai o valor da skin"
              value="do banco"
              detail="Skin barata deixa o banco maior. Skin cara derruba o saldo e trava as caras de novo até acumular."
            />
          </div>
          <ThemeText tone="faint" className="mt-3 text-xs leading-relaxed">
            Bot e influencer nas batalhas não colocam nada no banco. Quando perdem, o valor da
            skin deles sai do banco e vai para o vencedor.
          </ThemeText>
        </div>
      </Surface>

      <Surface variant="settingsPanel" className="!p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionTitle>Itens da caixa</SectionTitle>
            <ThemeText tone="secondary" className="mt-1 text-sm">
              Da mais barata à mais cara. A coluna "Pode sair?" mostra o que o banco libera agora.
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
        <div className={listTable.wrap}>
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Item</th>
                <th className={listTable.th}>Valor</th>
                <th className={listTable.th}>Chance</th>
                <th className={listTable.th}>Saiu</th>
                <th className={listTable.th}>Pago</th>
                <th className={listTable.th}>Pode sair?</th>
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
              <tr className="border-t border-separator">
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

      <CollapsibleSection
        variant="card"
        title="Resultado das aberturas"
        description="Quanto entrou, quanto saiu em prêmios e como o lucro se divide."
        summary={
          <ThemeText as="span" tone="faint" className="text-xs tabular-nums">
            {money(financials.totalRevenue)} entrou · {money(financials.totalPayout)} saiu ·{' '}
            {money(financials.profit)} lucro
          </ThemeText>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Entrou"
            value={money(financials.totalRevenue)}
            hint={`${financials.totalOpens.toLocaleString('pt-BR')} abertura${financials.totalOpens === 1 ? '' : 's'}`}
          />
          <Metric
            label="Saiu em prêmios"
            value={money(financials.totalPayout)}
            hint={`Média ${money(financials.averagePayoutPerOpen)} por abertura`}
          />
          <Metric
            label="Ficou com a casa"
            value={money(fixedMarginValue)}
            hint={`${money(fixedMarginPerOpen)} por abertura, garantido`}
          />
          <Metric
            label="Banco: entrou − saiu"
            value={money(variableMarginValue)}
            hint={`Média ${money(averageVariableMarginPerOpen)} por abertura. Positivo = mais skin barata saiu; negativo = saiu skin cara.`}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <ThemeText tone="primary" className="text-sm font-medium tabular-nums">
            {money(fixedMarginValue)} da casa + {money(variableMarginValue)} do banco ={' '}
            {money(financials.profit)} de lucro
          </ThemeText>
          <ThemeText tone="faint" className="mt-1 text-xs">
            Lucro = entrou − saiu em prêmios. A parte da casa é fixa por abertura; a parte
            do banco varia com as skins que saíram.
          </ThemeText>
        </div>

        <div className="mt-5 grid gap-6 border-t border-zinc-100 pt-5 lg:grid-cols-3 dark:border-zinc-800">
          <div>
            <ThemeText tone="overline" className="mb-1">
              Valor real das skins
            </ThemeText>
            <InfoRow label="VE das skins agora" value={money(lootCase.expectedValue)} />
            <InfoRow label="Vai para o banco" value={money(bank.injectionPerOpen)} />
            <ThemeText tone="faint" className="mt-2 text-xs leading-relaxed">
              VE = soma de preço × chance com o catálogo de agora. O banco recebe o preço
              menos a margem alvo; os dois só coincidem quando a margem bate o alvo.
            </ThemeText>
          </div>
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
          </div>
          <div>
            <ThemeText tone="overline" className="mb-1">
              Como o drop saiu
            </ThemeText>
            <InfoRow
              label="Direto (skin já liberada)"
              value={financials.directCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Re-sorteio (caiu numa travada)"
              value={financials.rerollCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Fallback (nenhuma liberada)"
              value={financials.fallbackCount.toLocaleString('pt-BR')}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        variant="card"
        title="Últimos 30 dias"
        description="Faturamento do dia versus prêmios entregues."
      >
        <div className="mb-4 flex justify-end">
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
      </CollapsibleSection>

      <CollapsibleSection
        variant="card"
        title="Configuração"
        description="Preço, desconto, chances e datas."
        summary={
          <ThemeText as="span" tone="faint" className="text-xs">
            {lootCase.enabledItemsCount} itens ativos de {lootCase.itemsCount}
          </ThemeText>
        }
      >
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
      </CollapsibleSection>
    </div>
  )
}
