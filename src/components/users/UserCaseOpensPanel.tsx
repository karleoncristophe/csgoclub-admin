import { Link } from 'react-router-dom'
import { ExternalLink, Package } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import {
  useGetUserCaseOpensQuery,
  type AdminCaseOpenListItem,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { userStatCardClass } from './userPanelClasses'

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
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

function dispositionLabel(value: AdminCaseOpenListItem['disposition']) {
  if (value === 'kept') return 'Guardado'
  if (value === 'converted') return 'Convertido'
  return 'Pendente'
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
  variant?: 'default' | 'brand' | 'amber' | 'rose'
}) {
  const cardClass =
    variant === 'brand'
      ? userStatCardClass.brand
      : variant === 'amber'
        ? userStatCardClass.amber
        : userStatCardClass.default
  return (
    <div className={cardClass}>
      <ThemeText as="p" tone="label" className="text-[10px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="p" tone="primary" className="mt-0.5 text-sm font-semibold">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-0.5 text-[11px] leading-snug">
        {hint}
      </ThemeText>
    </div>
  )
}

type UserCaseOpensPanelProps = {
  userId: string
}

const USER_OPENS_FILTER_DEFAULTS = {
  opensDisp: '',
  opensPage: '1',
}

export function UserCaseOpensPanel({ userId }: UserCaseOpensPanelProps) {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(USER_OPENS_FILTER_DEFAULTS)
  const disposition = filters.opensDisp as
    | 'pending'
    | 'kept'
    | 'converted'
    | ''
  const page = parsePositiveInt(filters.opensPage, 1)
  const pageSize = 20
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetUserCaseOpensQuery({
    userId,
    page: safePage,
    limit: pageSize,
    dataEnvironment,
    ...(disposition ? { disposition } : {}),
  })

  const summary = data?.summary
  const opens = data?.data ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  return (
    <Surface variant="settingsPanel" className="!p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle className="mb-0.5">Histórico de caixas</SectionTitle>
          <ThemeText as="p" tone="faint" className="text-xs">
            Skins sorteadas nas aberturas de caixas.
          </ThemeText>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          <Package className="h-3.5 w-3.5" />
          {summary?.totalOpens ?? 0} aberturas
        </span>
      </div>

      {summary ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total pago"
            value={formatMoney(summary.totalPaid)}
            hint="Preço pago"
            variant="brand"
          />
          <StatCard
            label="Total ganho"
            value={formatMoney(summary.totalWonValue)}
            hint="Itens dropados"
          />
          <StatCard
            label="Guardados"
            value={String(summary.keptCount)}
            hint={`${summary.convertedCount} conv. · ${summary.pendingCount} pend.`}
            variant="amber"
          />
          <StatCard
            label="Teste"
            value={String(summary.testOpensCount)}
            hint="Influencer / teste"
            variant="rose"
          />
        </div>
      ) : null}

      <SegmentedTabs
        ariaLabel="Destino da abertura"
        className="mb-3"
        value={disposition || 'all'}
        items={[
          { id: 'all', label: 'Todas' },
          { id: 'pending', label: 'Pendentes' },
          { id: 'kept', label: 'Guardados' },
          { id: 'converted', label: 'Convertidos' },
        ]}
        onChange={(next) => {
          setFilters(
            {
              opensDisp: next === 'all' ? '' : next,
              opensPage: '1',
            },
            { resetPage: false },
          )
        }}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
          {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
        </span>
      </div>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-8 text-sm">
          Carregando histórico…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {!isLoading && !isError && opens.length === 0 ? (
        <div className="py-8 text-center">
          <ThemeText as="p" tone="secondary" className="text-sm">
            Nenhuma abertura de caixa nesta visão
            {isSandbox ? ' (Dev / teste)' : ' (Produção)'}.
          </ThemeText>
          <ThemeText as="p" tone="faint" className="mt-2 text-xs">
            Se o cliente abriu caixas na outra visão, troque Produção ↔ Influencer no menu.
            {disposition ? ' Ou limpe o filtro de destino.' : null}
          </ThemeText>
        </div>
      ) : null}

      {opens.length > 0 ? (
        <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Quando</th>
                <th className={listTable.th}>Caixa</th>
                <th className={listTable.th}>Item recebido</th>
                <th className={`${listTable.th} text-right`}>Valores</th>
                <th className={listTable.th}>Destino</th>
                <th className={`${listTable.th} text-right`}>Ação</th>
              </tr>
            </thead>
            <tbody className={listTable.tbody}>
              {opens.map((open) => (
                <tr key={open._id} className={listTable.tr}>
                  <td className={listTable.tdMuted}>{formatDateTime(open.createdAt)}</td>
                  <td className={listTable.tdStrong}>
                    <div className="flex min-w-[160px] items-center gap-2">
                      {open.case.imageUrl ? (
                        <img
                          src={open.case.imageUrl}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg border border-separator object-contain"
                        />
                      ) : null}
                      <span className="truncate">{open.case.name}</span>
                    </div>
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
                      <div className="min-w-0">
                        <span className="line-clamp-2">{open.wonSkinName}</span>
                        {open.wonItemRarityName ? (
                          <ThemeText
                            as="span"
                            tone="secondary"
                            className="mt-0.5 block text-xs"
                            style={{ color: open.wonItemRarityColor }}
                          >
                            {open.wonItemRarityName}
                          </ThemeText>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                    <div>{formatMoney(open.itemValue, open.currency)}</div>
                    <div className="text-xs">
                      pago {formatMoney(open.pricePaid, open.currency)}
                    </div>
                  </td>
                  <td className={listTable.td}>
                    <div className="flex flex-wrap gap-1.5">
                      <TextBadge>{dispositionLabel(open.disposition)}</TextBadge>
                      {open.isTestOpen ? <TextBadge>Teste</TextBadge> : null}
                    </div>
                  </td>
                  <td className={`${listTable.td} text-right`}>
                    <Link
                      to={`/dashboard/case-opens/${open._id}`}
                      className={`${linkBrand} inline-flex items-center gap-1`}
                    >
                      Detalhe
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-5">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(next) =>
              setFilter('opensPage', String(next), { resetPage: false })
            }
          />
        </div>
      ) : null}
    </Surface>
  )
}
