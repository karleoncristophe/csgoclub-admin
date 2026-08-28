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
import useDebounce from '@/hooks/useDebounce'
import {
  useGetArenaMatchesQuery,
  type ArenaMatchStatus,
  type ArenaPaymentMethod,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import {
  filterChipClasses,
  userStatCardSpaciousClass,
} from '@/components/users/userPanelClasses'

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
      <ThemeText as="p" tone="primary" className="mt-2 text-xl font-bold sm:text-2xl">
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

      <Surface variant="card" className="!p-6">
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

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value || 'all-status'}
              type="button"
              onClick={() => {
                setStatus(option.value)
                setPage(1)
              }}
              className={filterChipClasses(status === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {PAYMENT_FILTERS.map((option) => (
            <button
              key={option.value || 'all-pay'}
              type="button"
              onClick={() => {
                setPaymentMethod(option.value)
                setPage(1)
              }}
              className={filterChipClasses(paymentMethod === option.value, 'amber')}
            >
              {option.label}
            </button>
          ))}
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
          <div className={`flex flex-col gap-2 ${isFetching ? 'opacity-70' : ''}`}>
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
                <div
                  key={playId}
                  className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3 transition hover:border-brand-300 hover:bg-brand-50/30 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand-400/40 dark:hover:bg-brand-500/10 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatarLink
                      userId={play.user?.id || play.user?._id}
                      name={play.user?.name}
                      avatar={play.user?.avatar}
                    />
                    <Link
                      to={`/dashboard/arena/plays/${playId}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <ThemeText as="p" tone="primary" className="truncate text-sm font-semibold">
                          {play.user?.name ?? 'Jogador'}
                        </ThemeText>
                        <ArenaMatchStatusBadge status={play.status} />
                        <TextBadge>{arenaPaymentLabel(play.paymentMethod)}</TextBadge>
                      </div>
                      {play.user?.steamId ? (
                        <div className="mt-1">
                          <SteamIdLink steamId={play.user.steamId} />
                        </div>
                      ) : null}
                      <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                        {formatArenaPlayDateTime(play.createdAt ?? play.startedAt)}
                        {' · '}
                        {formatArenaPlayMoney(play.chargedAmount, play.currency)}
                      </ThemeText>
                    </Link>
                  </div>

                  <Link
                    to={`/dashboard/arena/plays/${playId}`}
                    className="flex min-w-0 items-center gap-3 sm:w-[42%] sm:justify-end"
                  >
                    {prize ? (
                      <>
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-zinc-100 dark:bg-zinc-950"
                          style={{
                            borderColor: `${arenaRaritySwatch(prize.rarity)}88`,
                          }}
                        >
                          {prize.image ? (
                            <img
                              src={prize.image}
                              alt=""
                              className="max-h-14 max-w-full object-contain"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 sm:max-w-[220px]">
                          <ThemeText as="p" tone="primary" className="truncate text-sm font-medium">
                            {prize.crateName ?? prize.name}
                          </ThemeText>
                          <ThemeText
                            as="p"
                            tone="secondary"
                            className="mt-0.5 truncate text-xs"
                            style={{ color: arenaRaritySwatch(prize.rarity) }}
                          >
                            {arenaRarityLabel(prize.rarity)}
                            {play.awarded && play.awarded.length > 1
                              ? ` · +${play.awarded.length - 1}`
                              : ''}
                          </ThemeText>
                        </div>
                      </>
                    ) : (
                      <ThemeText as="p" tone="faint" className="text-sm">
                        Sem crate
                      </ThemeText>
                    )}
                  </Link>
                </div>
              )
            })}
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
