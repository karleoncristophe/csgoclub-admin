import type { AdminBattleSeat } from '@/redux/store/api/battles/api.battles'
import { Chip } from '@heroui/react'

export function formatBattleMoney(value: number, currency = 'USD') {
  const code =
    currency === 'BRL' || currency === 'EUR' || currency === 'USD'
      ? currency
      : 'USD'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: code,
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

const statusColor: Record<string, 'accent' | 'warning' | 'success' | 'default'> = {
  lobby: 'accent',
  countdown: 'warning',
  running: 'accent',
  settling: 'warning',
  finished: 'success',
  cancelled: 'default',
}

export function BattleStatusBadge({ status }: { status: string }) {
  return (
    <Chip size="sm" variant="soft" color={statusColor[status] ?? 'default'}>
      {battleStatusLabel(status)}
    </Chip>
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
    return <span className="text-xs text-muted">—</span>
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
                : 'ring-surface'
            }`}
            title={`${label}${isWinner ? ' (vencedor)' : ''}`}
          >
            {seat.avatarUrl ? (
              <img
                src={seat.avatarUrl}
                alt={label}
                className={`${dim} rounded-full bg-default object-cover`}
              />
            ) : (
              <div
                className={`${dim} flex items-center justify-center rounded-full bg-default text-[10px] font-semibold uppercase text-muted`}
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
