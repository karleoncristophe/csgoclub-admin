import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Package, Search } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import useDebounce from '@/hooks/useDebounce'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import {
  useGetArenaCrateOpensQuery,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { filterChipClasses, userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

const PAGE_SIZE = 30

const FILTER_DEFAULTS = {
  crateId: '',
  matchId: '',
  q: '',
  page: '1',
}

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
      <ThemeText as="p" tone="primary" className="mt-1 text-lg font-semibold">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-2 text-xs leading-relaxed">
        {hint}
      </ThemeText>
    </div>
  )
}

export default function ArenaCrateOpensPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(FILTER_DEFAULTS)

  const [searchInput, setSearchInput] = useState(filters.q)
  useEffect(() => {
    setSearchInput(filters.q)
  }, [filters.q])

  const debouncedSearch = useDebounce(searchInput.trim(), 300)
  useEffect(() => {
    if (debouncedSearch === filters.q) return
    setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  const page = parsePositiveInt(filters.page, 1)
  const safePage = Math.max(page, 1)
  const crateId = filters.crateId
  const matchId = filters.matchId

  const { data, isLoading, isFetching, isError, error } = useGetArenaCrateOpensQuery({
    page: safePage,
    limit: PAGE_SIZE,
    dataEnvironment,
    ...(crateId ? { crateId } : {}),
    ...(matchId ? { matchId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })

  const filteredCrateName = crateId ? data?.data[0]?.crate.name : undefined
  const summary = data?.summary
  const opens = data?.data ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

  return (
    <div className="space-y-6">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Skins sorteadas ao abrir crates da Arena (teste/influencer). Visão Dev.'
            : 'Skins sorteadas ao abrir crates da Arena. Visão Produção.'
        }
      >
        Aberturas Arena
      </PageTitle>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summary.topWonItem ? (
            <Link
              to={`/dashboard/arena/crate-opens/${summary.topWonItem.openId}`}
              className={`${userStatCardSpaciousClass.brand} group flex items-center gap-3 transition hover:border-brand-400 dark:hover:border-brand-400/50`}
            >
              <SkinRarityVisual
                rarity={{
                  name: summary.topWonItem.rarityName,
                  color: summary.topWonItem.rarityColor,
                }}
                className="h-16 w-16 shrink-0"
                showStar={false}
              >
                {summary.topWonItem.image ? (
                  <img
                    src={summary.topWonItem.image}
                    alt=""
                    className="max-h-14 max-w-full object-contain"
                  />
                ) : (
                  <ThemeText as="span" tone="faint" className="text-[10px]">
                    —
                  </ThemeText>
                )}
              </SkinRarityVisual>
              <div className="min-w-0">
                <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
                  Maior valor sorteado
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 truncate text-sm font-semibold">
                  {summary.topWonItem.skinName}
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold">
                  {formatMoney(summary.topWonItem.itemValue, summary.topWonItem.currency)}
                </ThemeText>
                <ThemeText as="p" tone="faint" className="mt-1 truncate text-xs">
                  {[summary.topWonItem.userName, summary.topWonItem.crateName]
                    .filter(Boolean)
                    .join(' · ') || 'Ver abertura'}
                </ThemeText>
              </div>
            </Link>
          ) : (
            <StatCard
              label="Maior valor sorteado"
              value="—"
              hint="Nenhuma abertura ainda"
              variant="brand"
            />
          )}
          <StatCard
            label="Total de aberturas"
            value={String(summary.totalOpens)}
            hint={`${summary.testOpensCount} de teste`}
          />
          <StatCard
            label="Preço das jogadas"
            value={formatMoney(summary.totalPaid)}
            hint="Soma do preço de jogada injetado no banco"
          />
          <StatCard
            label="Total creditado"
            value={formatMoney(summary.totalWonValue)}
            hint={`${summary.convertedCount} convertidos em saldo`}
            variant="amber"
          />
        </div>
      ) : null}

      <Surface variant="card">
        <div className="flex flex-wrap items-end gap-3 p-5 pb-0">
          <div className="min-w-[220px] flex-1">
            <Input
              label="Buscar"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Usuário, Steam ID, skin ou crate…"
            />
          </div>
          <ThemeText as="p" tone="faint" className="inline-flex items-center gap-1.5 pb-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            {data?.total ?? 0} resultados
          </ThemeText>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 px-5 pt-4">
          <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
            {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
          </span>
          {crateId ? (
            <button
              type="button"
              onClick={() => setFilters({ crateId: '', page: '1' }, { resetPage: false })}
              className={filterChipClasses(true, 'brand')}
            >
              Crate: {filteredCrateName ?? 'filtrada'} ✕
            </button>
          ) : null}
          {matchId ? (
            <button
              type="button"
              onClick={() => setFilters({ matchId: '', page: '1' }, { resetPage: false })}
              className={filterChipClasses(true, 'brand')}
            >
              Jogada: {matchId.slice(-6)} ✕
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando aberturas…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError ? (
          <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Quando</th>
                  <th className={listTable.th}>Jogador</th>
                  <th className={listTable.th}>Crate</th>
                  <th className={listTable.th}>Item recebido</th>
                  <th className={`${listTable.th} text-right`}>Valores</th>
                  <th className={listTable.th}>Destino</th>
                  <th className={`${listTable.th} text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {opens.length === 0 ? (
                  <tr>
                    <td className={listTable.empty} colSpan={7}>
                      <div className="mx-auto max-w-md space-y-2 py-2">
                        <p>
                          Nenhuma abertura de crate Arena nesta visão
                          {isSandbox ? ' (Dev / teste)' : ' (Produção)'}.
                        </p>
                        <p className="text-xs text-muted">
                          Só entram aberturas novas (depois deste recurso). Aberturas
                          antigas não aparecem. Confira também Produção ↔ Influencer.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  opens.map((open) => (
                    <tr key={open._id} className={listTable.tr}>
                      <td className={listTable.tdMuted}>{formatDateTime(open.createdAt)}</td>
                      <td className={listTable.td}>
                        {open.user ? (
                          <div>
                            <Link
                              to={`/dashboard/users/${open.userId}`}
                              className={linkBrand}
                            >
                              {open.user.name}
                            </Link>
                            {open.user.steamId ? (
                              <SteamIdLink steamId={open.user.steamId} className="mt-0.5 block" />
                            ) : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={listTable.tdStrong}>
                        <Link to={`/dashboard/arena/${open.crateId}`} className={linkBrand}>
                          {open.crate.name}
                        </Link>
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
                          <span className="line-clamp-2">{open.wonSkinName}</span>
                        </div>
                      </td>
                      <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                        <div>{formatMoney(open.itemValue, open.currency)}</div>
                        <div className="text-xs">pago {formatMoney(open.pricePaid, open.currency)}</div>
                      </td>
                      <td className={listTable.td}>
                        <TextBadge>Convertido</TextBadge>
                      </td>
                      <td className={`${listTable.td} text-right`}>
                        <Link
                          to={`/dashboard/arena/crate-opens/${open._id}`}
                          className={`${linkBrand} inline-flex items-center gap-1`}
                        >
                          Detalhe
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="p-5">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={(next) => setFilter('page', String(next), { resetPage: false })}
            />
          </div>
        ) : null}
      </Surface>
    </div>
  )
}
