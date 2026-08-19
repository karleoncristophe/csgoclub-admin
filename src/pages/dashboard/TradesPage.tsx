import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, ExternalLink, Search } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import useDebounce from '@/hooks/useDebounce'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import {
  useGetAdminTradesQuery,
  type AdminTradeListItem,
  type AdminTradeSource,
  type AdminTradeStatus,
} from '@/redux/store/api/trades/api.trades'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { filterChipClasses, userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

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

function statusLabel(value: AdminTradeListItem['status']) {
  if (value === 'withdrawn') return 'Enviado'
  return 'Pendente'
}

function sourceLabel(value: AdminTradeListItem['source']) {
  if (value === 'upgrade') return 'Upgrade'
  if (value === 'battle') return 'Battle'
  return 'Caixa'
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

export default function TradesPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = searchParams.get('userId') ?? ''
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AdminTradeStatus | ''>('')
  const [source, setSource] = useState<AdminTradeSource | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pageSize, setPageSize] = useState(30)
  const debouncedSearch = useDebounce(search.trim(), 300)
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetAdminTradesQuery({
    page: safePage,
    limit: pageSize,
    dataEnvironment,
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  })

  const filteredUserName = userId ? data?.data[0]?.user?.name : undefined

  const clearUserFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('userId')
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  const summary = data?.summary
  const trades = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Envios de skins de teste (influencer) via SkinsBack. Visão Dev — não mistura com produção.'
            : 'Envios de skins reais via SkinsBack (market_buy). Visão Produção — testes ficam de fora.'
        }
      >
        Trades
      </PageTitle>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total de trades"
            value={String(summary.totalTrades)}
            hint={`${summary.pendingCount} pendentes`}
            variant="brand"
          />
          <StatCard
            label="Enviados"
            value={String(summary.withdrawnCount)}
            hint="Skins já compradas na SkinsBack"
          />
          <StatCard
            label="Valor enviado"
            value={formatMoney(summary.withdrawnValueUsd, 'USD')}
            hint="Soma em USD dos itens enviados"
            variant="amber"
          />
          <StatCard
            label="Volume (BRL)"
            value={formatMoney(summary.totalValueBrl, 'BRL')}
            hint="Todos os trades da visão, em reais"
            variant="rose"
          />
        </div>
      ) : null}

      <Surface variant="card" className="!p-6">
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-[220px] md:col-span-2">
            <Input
              label="Buscar"
              name="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Usuário, Steam ID, skin ou custom_id…"
            />
          </div>
          <Input
            label="De"
            name="from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
          />
          <Input
            label="Até"
            name="to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
          <Select
            label="Itens por página"
            name="pageSize"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            {[20, 30, 50, 100].map((size) => (
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

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { value: '', label: 'Todos os status' },
              { value: 'withdrawn', label: 'Enviados' },
              { value: 'pending_withdraw', label: 'Pendentes' },
            ] as const
          ).map((option) => (
            <button
              key={option.value || 'all-status'}
              type="button"
              onClick={() => {
                setStatus(option.value)
                setPage(1)
              }}
              className={filterChipClasses(status === option.value, 'brand')}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { value: '', label: 'Todas as origens' },
              { value: 'case_open', label: 'Caixa' },
              { value: 'upgrade', label: 'Upgrade' },
              { value: 'battle', label: 'Battle' },
            ] as const
          ).map((option) => (
            <button
              key={option.value || 'all-source'}
              type="button"
              onClick={() => {
                setSource(option.value)
                setPage(1)
              }}
              className={filterChipClasses(source === option.value, 'amber')}
            >
              {option.label}
            </button>
          ))}
          <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
            {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
          </span>
          {userId ? (
            <button
              type="button"
              onClick={clearUserFilter}
              className={filterChipClasses(true, 'brand')}
            >
              Usuário: {filteredUserName ?? 'filtrado'} ✕
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando trades…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError && trades.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ArrowLeftRight className="h-8 w-8 text-zinc-400" />
            <ThemeText as="p" tone="secondary" className="text-sm">
              Nenhum trade encontrado para este filtro.
            </ThemeText>
          </div>
        ) : null}

        {trades.length > 0 ? (
          <div className={`flex flex-col gap-2 ${isFetching ? 'opacity-70' : ''}`}>
            {trades.map((trade) => {
              const avatar =
                trade.user?.avatarFull ?? trade.user?.avatarMedium ?? trade.user?.avatar
              const when = trade.withdrawnAt ?? trade.createdAt

              return (
                <div
                  key={trade._id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/40 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <SkinRarityVisual
                      rarity={{
                        name: trade.rarityName,
                        color: trade.rarityColor,
                      }}
                      className="h-16 w-20 shrink-0"
                      showStar={false}
                    >
                      {trade.image ? (
                        <img
                          src={trade.image}
                          alt=""
                          className="max-h-14 max-w-full object-contain"
                        />
                      ) : (
                        <ThemeText as="span" tone="faint" className="text-[10px]">
                          —
                        </ThemeText>
                      )}
                    </SkinRarityVisual>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ThemeText as="p" tone="primary" className="truncate text-sm font-semibold">
                          {trade.skinName}
                        </ThemeText>
                        <TextBadge>{statusLabel(trade.status)}</TextBadge>
                        <TextBadge>{sourceLabel(trade.source)}</TextBadge>
                      </div>
                      <ThemeText as="p" tone="faint" className="mt-0.5 text-xs">
                        {formatDateTime(when)}
                        {trade.caseName ? ` · ${trade.caseName}` : ''}
                      </ThemeText>
                      {trade.skinsbackCustomId ? (
                        <ThemeText as="p" tone="faint" className="mt-0.5 font-mono text-[10px]">
                          {trade.skinsbackCustomId}
                        </ThemeText>
                      ) : null}

                      {trade.user ? (
                        <div className="mt-2 min-w-0">
                          <Link
                            to={`/dashboard/users/${trade.user._id}`}
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
                                {trade.user.name?.[0]?.toUpperCase() ?? '?'}
                              </span>
                            )}
                            <ThemeText as="p" tone="secondary" className="truncate text-xs">
                              {trade.user.name}
                            </ThemeText>
                          </Link>
                          {trade.user.steamId ? (
                            <div className="mt-1 pl-8">
                              <SteamIdLink steamId={trade.user.steamId} />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 text-right sm:w-40">
                    <ThemeText as="p" tone="primary" className="text-sm font-semibold">
                      {formatMoney(trade.value, trade.currency)}
                    </ThemeText>
                    <ThemeText as="p" tone="faint" className="text-[11px]">
                      {formatMoney(trade.valueUsd, 'USD')}
                    </ThemeText>
                    {trade.user?._id ? (
                      <Link
                        to={`/dashboard/users/${trade.user._id}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        Ver usuário
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-5">
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </Surface>
    </div>
  )
}
