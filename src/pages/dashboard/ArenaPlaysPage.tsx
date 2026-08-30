import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Crosshair, Package, Search } from 'lucide-react'
import {
  ArenaMatchStatusBadge,
  arenaPaymentLabel,
  arenaRarityLabel,
  arenaRaritySwatch,
  formatArenaPlayDateTime,
  formatArenaPlayMoney,
} from '@/components/arena/arenaPlayUi'
import { TextBadge } from '@/components/StatusPill'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { listTable, linkBrand } from '@/components/ui/listTable'
import useDebounce from '@/hooks/useDebounce'
import {
  useGetArenaMatchesQuery,
  type ArenaMatchStatus,
  type ArenaPaymentMethod,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import { userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

const PAGE_SIZE = 20

const STATUS_FILTERS: Array<{ value: ArenaMatchStatus | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'finished', label: 'Finalizadas' },
  { value: 'lost', label: 'Perdidas' },
  { value: 'disconnected', label: 'Desconectou' },
  { value: 'playing', label: 'Jogando' },
]

const PAYMENT_FILTERS: Array<{ value: ArenaPaymentMethod | ''; label: string }> = [
  { value: '', label: 'Pagamento' },
  { value: 'balance', label: 'Saldo' },
  { value: 'ticket', label: 'Ticket' },
]

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

export default function ArenaPlaysPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ArenaMatchStatus | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<ArenaPaymentMethod | ''>('')
  const debouncedSearch = useDebounce(search.trim(), 300)

  const { data, isLoading, isFetching, isError, error } = useGetArenaMatchesQuery({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })

  const plays = data?.items ?? []
  const summary = data?.summary
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle="Todas as jogadas da Arena: pagamento, resultado e crates premiadas.">
          Jogadas da Arena
        </PageTitle>
        <Link
          to="/dashboard/arena"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
        >
          <Crosshair className="h-4 w-4" />
          Crates
        </Link>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Jogadas"
            value={String(summary.total)}
            hint="Total de plays neste filtro"
          />
          <StatCard
            label="Finalizadas"
            value={String(summary.finished)}
            hint="Partidas concluídas no jogo"
            variant="brand"
          />
          <StatCard
            label="Sem prêmio"
            value={String(summary.lost)}
            hint="Perdeu ou desconectou"
            variant="rose"
          />
          <StatCard
            label="Com crate"
            value={String(summary.withPrizes)}
            hint="Plays que entregaram pelo menos uma crate"
            variant="amber"
          />
        </div>
      ) : null}

      <Surface variant="card" className="!p-5">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              label="Buscar"
              name="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Nome do jogador ou Steam ID…"
            />
          </div>
          <ThemeText as="p" tone="faint" className="inline-flex items-center gap-1.5 pb-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            {data?.total ?? 0} resultados
          </ThemeText>
        </div>

        <div className="mb-5 grid gap-2 lg:grid-cols-2">
          <SegmentedTabs
            ariaLabel="Status da jogada"
            value={status || 'all'}
            items={STATUS_FILTERS.map((option) => ({
              id: option.value || 'all',
              label: option.label,
            }))}
            onChange={(next) => {
              setStatus(next === 'all' ? '' : (next as ArenaMatchStatus))
              setPage(1)
            }}
          />
          <SegmentedTabs
            ariaLabel="Forma de pagamento"
            value={paymentMethod || 'all'}
            items={PAYMENT_FILTERS.map((option) => ({
              id: option.value || 'all',
              label: option.label,
            }))}
            onChange={(next) => {
              setPaymentMethod(next === 'all' ? '' : (next as ArenaPaymentMethod))
              setPage(1)
            }}
          />
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando jogadas…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError && plays.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="h-8 w-8 text-zinc-400" />
            <ThemeText as="p" tone="secondary" className="text-sm">
              Nenhuma jogada encontrada para este filtro.
            </ThemeText>
          </div>
        ) : null}

        {plays.length > 0 ? (
          <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Quando</th>
                  <th className={listTable.th}>Jogador</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th}>Pagamento</th>
                  <th className={listTable.th}>Prêmio</th>
                  <th className={`${listTable.th} text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
            {plays.map((play) => {
              const prize = play.awarded?.[0]
              const playId = [play._id, play.id].find(
                (value) =>
                  typeof value === 'string' &&
                  value.length > 0 &&
                  value !== 'undefined',
              )
              if (!playId) return null
              return (
                <tr key={playId} className={listTable.tr}>
                  <td className={listTable.tdMuted}>{formatArenaPlayDateTime(play.createdAt ?? play.startedAt)}</td>
                  <td className={listTable.td}>
                    <div className="flex min-w-[190px] items-center gap-2">
                    <UserAvatarLink
                      userId={play.user?.id || play.user?._id}
                      name={play.user?.name}
                      avatar={play.user?.avatar}
                    />
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{play.user?.name ?? 'Jogador'}</span>
                      {play.user?.steamId ? (
                        <SteamIdLink steamId={play.user.steamId} />
                      ) : null}
                    </div>
                    </div>
                  </td>
                  <td className={listTable.td}><ArenaMatchStatusBadge status={play.status} /></td>
                  <td className={listTable.td}>
                    <TextBadge>{arenaPaymentLabel(play.paymentMethod)}</TextBadge>
                    <span className="mt-1 block whitespace-nowrap text-xs text-muted">{formatArenaPlayMoney(play.chargedAmount, play.currency)}</span>
                  </td>
                  <td className={listTable.td}>
                    {prize ? (
                      <div className="flex min-w-[240px] items-center gap-2">
                        <div
                          className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-secondary"
                          style={{
                            borderColor: `${arenaRaritySwatch(prize.rarity)}88`,
                          }}
                        >
                          {prize.image ? (
                            <img
                              src={prize.image}
                              alt=""
                              className="max-h-9 max-w-full object-contain"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{prize.crateName ?? prize.name}</span>
                          <span className="block truncate text-xs" style={{ color: arenaRaritySwatch(prize.rarity) }}>
                            {arenaRarityLabel(prize.rarity)}
                            {play.awarded && play.awarded.length > 1
                              ? ` · +${play.awarded.length - 1}`
                              : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted">Sem crate</span>
                    )}
                  </td>
                  <td className={`${listTable.td} text-right`}>
                    <Link to={`/dashboard/arena/plays/${playId}`} className={linkBrand}>Detalhes</Link>
                  </td>
                </tr>
              )
            })}
              </tbody>
            </table>
          </div>
        ) : null}

        {totalPages > 1 ? (
          <Pagination
            className="mt-6"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </Surface>
    </div>
  )
}
