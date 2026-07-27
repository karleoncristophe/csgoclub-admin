import type { AdminBattleSeat } from '@/redux/store/api/battles/api.battles'

export function formatBattleMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatBattleDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export function battleStatusLabel(status: string) {
  switch (status) {
    case 'lobby':
      return 'Lobby'
    case 'countdown':
      return 'Countdown'
    case 'running':
      return 'Em andamento'
    case 'settling':
      return 'Liquidando'
    case 'finished':
      return 'Finalizada'
    case 'cancelled':
      return 'Cancelada'
    default:
      return status
  }
}

export function battleModeLabel(mode: string) {
  if (mode === 'crazy') return 'Crazy'
  if (mode === 'classic') return 'Classic'
  return mode
}

export function battleSeatTypeLabel(type: string) {
  if (type === 'user') return 'Jogador'
  if (type === 'bot') return 'Bot'
  if (type === 'empty') return 'Vazio'
  return type
}

const statusBadgeClass: Record<string, string> = {
  lobby:
    'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950/45 dark:text-sky-200 dark:ring-sky-600/25',
  countdown:
    'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/45 dark:text-amber-200 dark:ring-amber-600/25',
  running:
    'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-600/25',
  settling:
    'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-600/25',
  finished:
    'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-600/25',
  cancelled:
    'bg-zinc-100 text-zinc-600 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/30',
}

export function BattleStatusBadge({ status }: { status: string }) {
  const tone =
    statusBadgeClass[status] ??
    'bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600/35'

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {battleStatusLabel(status)}
    </span>
  )
}

export function BattlePlayerAvatars({
  seats,
  winnerSeatIndex,
  size = 'md',
}: {
  seats: AdminBattleSeat[]
  winnerSeatIndex?: number | null
  size?: 'sm' | 'md'
}) {
  const occupied = seats.filter((s) => s.type !== 'empty')
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const overlap = size === 'sm' ? '-space-x-2' : '-space-x-2.5'

  if (occupied.length === 0) {
    return <span className="text-xs text-zinc-500">—</span>
  }

  return (
    <div className={`flex items-center ${overlap}`}>
      {occupied.map((seat) => {
        const isWinner = winnerSeatIndex === seat.index
        const label = seat.name ?? (seat.type === 'bot' ? 'Bot' : 'Jogador')
        return (
          <div
            key={`${seat.index}-${seat.userId ?? seat.botId ?? 'x'}`}
            className={`relative rounded-full ring-2 ${
              isWinner
                ? 'ring-emerald-500 dark:ring-emerald-400'
                : 'ring-white dark:ring-zinc-900'
            }`}
            title={`${label}${isWinner ? ' (vencedor)' : ''}`}
          >
            {seat.avatarUrl ? (
              <img
                src={seat.avatarUrl}
                alt={label}
                className={`${dim} rounded-full object-cover bg-zinc-200 dark:bg-zinc-800`}
              />
            ) : (
              <div
                className={`${dim} flex items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
              >
                {(label[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
