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
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { userStatCardSpaciousClass } from '@/components/users/userPanelClasses'
import { formatSkinsPrice, type SkinsCurrency } from '@/constants/skinsCurrency'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import {
  useGetCaseDetailsQuery,
  type AdminCaseItemStats,
} from '@/redux/store/api/cases/api.cases'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatDayLabel(value: string) {
  const [, month, day] = value.split('-')
  return month && day ? `${day}/${month}` : value
}

function formatOpens(value: number | null) {
  if (value == null) return '—'
  if (value === 0) return 'liberado'
  return `${value.toLocaleString('pt-BR')} abertura${value === 1 ? '' : 's'}`
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
      <ThemeText as="p" tone="primary" className="mt-2 text-xl font-bold sm:text-2xl">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-2 text-xs leading-relaxed">
        {hint}
      </ThemeText>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <ThemeText tone="secondary" className="text-sm">
        {label}
      </ThemeText>
      <ThemeText tone="primary" className="text-sm font-medium">
        {value}
      </ThemeText>
    </div>
  )
}

/** Quanto do saldo exigido o banco já cobre. */
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

  const ratio = item.requiredBankBalance > 0 ? bankBalance / item.requiredBankBalance : 1

  return (
    <div className="min-w-[10rem] space-y-1.5">
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
      <ThemeText tone="faint" className="text-xs">
        {item.eligible
          ? `Banco exigido ${formatSkinsPrice(item.requiredBankBalance, currency)}`
          : `Falta ${formatSkinsPrice(item.bankShortfall, currency)} · ${formatOpens(item.opensToUnlock)}`}
      </ThemeText>
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

  const { case: lootCase, bank, financials, items, daily } = data
  const currency = lootCase.currency
  const money = (value: number) => formatSkinsPrice(value, currency)
  const maxDailyValue = Math.max(
    1,
    ...daily.map((point) => Math.max(point.revenue, point.payout)),
  )
  const blockedCount = bank.enabledItemsCount - bank.eligibleItemsCount

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
              ? `/${lootCase.slug} · Visão Dev: números vindos apenas de aberturas de teste (influencer).`
              : `/${lootCase.slug} · Visão Produção: números vindos apenas de aberturas reais.`
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
          <div className="min-w-[16rem] flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TextBadge>{lootCase.active ? 'Ativa' : 'Inativa'}</TextBadge>
              <TextBadge>{currency}</TextBadge>
              <TextBadge>
                {lootCase.valueMode === 'with_tax' ? 'Valor com taxa' : 'Valor base'}
              </TextBadge>
              {lootCase.sharedCaseIds.length > 0 ? (
                <TextBadge>
                  Banco compartilhado com {lootCase.sharedCaseIds.length} caixa
                  {lootCase.sharedCaseIds.length === 1 ? '' : 's'}
                </TextBadge>
              ) : null}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={userStatCardSpaciousClass.brand}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
                Preço da abertura
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-xl font-bold">
                {money(lootCase.price)}
              </ThemeText>
              {lootCase.discountPercent > 0 ? (
                <ThemeText as="p" tone="faint" className="mt-1 text-xs line-through">
                  {money(lootCase.listPrice)}
                </ThemeText>
              ) : null}
            </div>
            <div className={userStatCardSpaciousClass.default}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
                Valor esperado
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-xl font-bold">
                {money(lootCase.expectedValue)}
              </ThemeText>
              <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                Margem de design {lootCase.realMarginPercent.toFixed(2)}%
              </ThemeText>
            </div>
          </div>
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-4">Faturamento</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Faturamento"
            value={money(financials.totalRevenue)}
            hint={`${financials.totalOpens.toLocaleString('pt-BR')} abertura${financials.totalOpens === 1 ? '' : 's'} registrada${financials.totalOpens === 1 ? '' : 's'}`}
            variant="brand"
          />
          <StatCard
            label="Prêmios pagos"
            value={money(financials.totalPayout)}
            hint={`Média de ${money(financials.averagePayoutPerOpen)} por abertura`}
          />
          <StatCard
            label="Lucro"
            value={money(financials.profit)}
            hint="Faturamento menos os prêmios entregues"
            variant={financials.profit < 0 ? 'rose' : 'default'}
          />
          <StatCard
            label="Margem realizada"
            value={`${financials.marginPercent.toFixed(2)}%`}
            hint={`Meta de design: ${lootCase.targetMarginPercent}%`}
          />
          <StatCard
            label="Maior prêmio"
            value={money(financials.biggestPayout)}
            hint={
              financials.lastOpenAt
                ? `Última abertura em ${formatDateTime(financials.lastOpenAt)}`
                : 'Nenhuma abertura ainda'
            }
            variant="amber"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Surface variant="insetPanelSm">
            <ThemeText tone="overline" className="mb-2">
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
          </Surface>
          <Surface variant="insetPanelSm">
            <ThemeText tone="overline" className="mb-2">
              Como o drop foi resolvido
            </ThemeText>
            <InfoRow
              label="Item sorteado já elegível"
              value={financials.directCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Novo sorteio (banco travou o item)"
              value={financials.rerollCount.toLocaleString('pt-BR')}
            />
            <InfoRow
              label="Item de segurança (nada elegível)"
              value={financials.fallbackCount.toLocaleString('pt-BR')}
            />
          </Surface>
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-1">Banco virtual</SectionTitle>
        <ThemeText tone="secondary" className="mb-4 text-sm leading-relaxed">
          Cada abertura injeta {money(bank.injectionPerOpen)} no banco. Um item mais caro
          que o preço da abertura só entra no sorteio quando o saldo alcança o valor de
          mercado dele, e o valor sai do banco quando alguém ganha.
        </ThemeText>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Saldo atual"
            value={money(bank.balance)}
            hint={`Injeção de ${money(bank.injectionPerOpen)} por abertura`}
            variant={bank.balance < 0 ? 'rose' : 'brand'}
          />
          <StatCard
            label="Itens liberados"
            value={`${bank.eligibleItemsCount}/${bank.enabledItemsCount}`}
            hint={
              blockedCount > 0
                ? `${blockedCount} item${blockedCount === 1 ? '' : 's'} esperando saldo`
                : 'Todo o pool está liberado agora'
            }
          />
          <StatCard
            label="Próximo a liberar"
            value={bank.nextUnlock ? money(bank.nextUnlock.bankShortfall) : '—'}
            hint={
              bank.nextUnlock
                ? `${bank.nextUnlock.skinName} · ${formatOpens(bank.nextUnlock.opensToUnlock)}`
                : 'Nada travado no momento'
            }
            variant="amber"
          />
          <StatCard
            label="Pool completo"
            value={money(bank.targetForFullPool)}
            hint={
              bank.shortfallForFullPool > 0
                ? `Faltam ${money(bank.shortfallForFullPool)} · ${formatOpens(bank.opensToFullPool)}`
                : 'Saldo já cobre o item mais caro'
            }
          />
        </div>
      </Surface>

      {daily.length > 0 ? (
        <Surface variant="card" className="!p-6">
          <SectionTitle className="mb-1">Últimos 30 dias</SectionTitle>
          <ThemeText tone="secondary" className="mb-5 text-sm">
            Barra cheia é o faturamento; a linha interna é o valor entregue em prêmios.
          </ThemeText>
          <div className="scrollbar-list overflow-x-auto">
            <div className="flex min-w-full items-end gap-1.5">
              {daily.map((point) => (
                <div
                  key={point.date}
                  className="flex min-w-[2.25rem] flex-1 flex-col items-center gap-1.5"
                  title={`${formatDayLabel(point.date)} · ${point.opens} abertura(s) · faturou ${money(point.revenue)} · pagou ${money(point.payout)}`}
                >
                  <div className="relative flex h-32 w-full items-end overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800/60">
                    <div
                      className="w-full rounded-md bg-brand-500/80"
                      style={{ height: `${(point.revenue / maxDailyValue) * 100}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 w-full border-t-2 border-amber-500"
                      style={{ height: `${(point.payout / maxDailyValue) * 100}%` }}
                    />
                  </div>
                  <ThemeText tone="faint" className="text-[10px]">
                    {formatDayLabel(point.date)}
                  </ThemeText>
                </div>
              ))}
            </div>
          </div>
        </Surface>
      ) : null}

      <Surface variant="card" className="!p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Itens da caixa</SectionTitle>
          <ThemeText tone="faint" className="text-xs">
            Ordenados do mais barato ao mais caro — a ordem em que o banco vai liberando.
          </ThemeText>
        </div>
        <div className="overflow-x-auto">
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Item</th>
                <th className={listTable.th}>Valor</th>
                <th className={listTable.th}>Chance</th>
                <th className={listTable.th}>Saiu</th>
                <th className={listTable.th}>Pago em prêmios</th>
                <th className={listTable.th}>Situação no banco</th>
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
                    <ThemeText tone="primary" className="text-sm font-medium">
                      {money(item.price)}
                    </ThemeText>
                    <ThemeText tone="faint" className="text-xs">
                      VE {money(item.expectedValue)}
                    </ThemeText>
                  </td>
                  <td className={listTable.td}>
                    <ThemeText tone="primary" className="text-sm">
                      {item.probability.toFixed(4)}%
                    </ThemeText>
                    <ThemeText tone="faint" className="text-xs">
                      real {item.actualDropPercent.toFixed(4)}%
                    </ThemeText>
                  </td>
                  <td className={listTable.td}>
                    <ThemeText tone="primary" className="text-sm">
                      {item.timesWon.toLocaleString('pt-BR')}×
                    </ThemeText>
                    {item.lastWonAt ? (
                      <ThemeText tone="faint" className="text-xs">
                        {formatDateTime(item.lastWonAt)}
                      </ThemeText>
                    ) : null}
                  </td>
                  <td className={listTable.td}>{money(item.totalPaidOut)}</td>
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
          </table>
        </div>
      </Surface>

      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-3">Configuração</SectionTitle>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <InfoRow label="Preço de tabela" value={money(lootCase.listPrice)} />
            <InfoRow label="Desconto" value={`${lootCase.discountPercent}%`} />
            <InfoRow label="Preço sugerido" value={money(lootCase.suggestedPrice)} />
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
              value={`${lootCase.enabledItemsCount} habilitados de ${lootCase.itemsCount}`}
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
