import type { AdminBattleSeat } from '@/redux/store/api/battles/api.battles'
import { resolveBotAvatar } from '@/lib/bot-avatar'
import { Chip } from '@heroui/react'

export function battleSeatAvatarSrc(seat: AdminBattleSeat) {
  if (seat.type === 'bot') {
    return resolveBotAvatar(
      seat.avatarUrl,
      seat.botId ?? seat.name ?? String(seat.index),
    )
  }
  return seat.avatarUrl?.trim() || null
}

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

/** Resultado do bot na battle: ganho positivo, perda negativa. */
export function formatBattleHouseResult(
  result: { sign: '+' | '-'; amount: number } | null | undefined,
  currency = 'USD',
) {
  if (!result || !(result.amount > 0)) return '—'
  const money = formatBattleMoney(result.amount, currency)
  return result.sign === '-' ? `−${money}` : `+${money}`
}

export type BattleBotSignedResult = {
  sign: '+' | '-'
  amount: number
}

/**
 * Resultado do bot para a tela admin.
 * Bot ganhou → + valor das skins do(s) jogador(es).
 * Bot perdeu → − valor das skins do bot.
 * Conta qualquer assento user (inclui influencer na visão Dev).
 */
export function resolveBattleBotResult(input: {
  seats: AdminBattleSeat[]
  winnerSeatIndex?: number | null
  winnerTeamIndex?: number | null
  tieBreak?: boolean
}): BattleBotSignedResult | null {
  if (input.tieBreak) return null
  const seats = input.seats ?? []
  const bots = seats.filter((seat) => seat.type === 'bot')
  const humans = seats.filter((seat) => seat.type === 'user')
  if (bots.length === 0 || humans.length === 0) return null

  const isWinner = (seat: AdminBattleSeat) =>
    input.winnerTeamIndex != null
      ? seat.teamIndex === input.winnerTeamIndex
      : seat.index === input.winnerSeatIndex

  const botWon = bots.some(isWinner)
  const humanWon = humans.some(isWinner)
  if (botWon === humanWon) return null

  const seatAmount = (seat: AdminBattleSeat) => {
    const fromDrops = (seat.drops ?? []).reduce(
      (sum, drop) => sum + (Number(drop.itemValue) || 0),
      0,
    )
    return fromDrops > 0 ? fromDrops : Number(seat.totalValue) || 0
  }
  const round = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100

  if (botWon) {
    const amount = round(humans.reduce((sum, seat) => sum + seatAmount(seat), 0))
    return amount > 0 ? { sign: '+', amount } : null
  }
  const amount = round(bots.reduce((sum, seat) => sum + seatAmount(seat), 0))
  return amount > 0 ? { sign: '-', amount } : null
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
  if (mode === 'shared') return 'Dividido'
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
            {battleSeatAvatarSrc(seat) ? (
              <img
                src={battleSeatAvatarSrc(seat) ?? ''}
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
