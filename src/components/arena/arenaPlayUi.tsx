import { ARENA_RARITY_COLOR, ARENA_RARITY_LABEL } from '@/components/arena/arenaRarity'
import type {
  ArenaMatchStatus,
  ArenaPaymentMethod,
  ArenaRarity,
  ArenaScriptGroup,
} from '@/redux/store/api/arena/api.arena'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import { Chip } from '@heroui/react'

export function formatArenaPlayMoney(value: number, currency = 'BRL') {
  const code =
    currency === 'BRL' || currency === 'EUR' || currency === 'USD'
      ? currency
      : 'BRL'
  return formatSkinsPrice(value, code)
}

export function formatArenaPlayDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export function arenaMatchStatusLabel(status: ArenaMatchStatus | string) {
  switch (status) {
    case 'playing':
      return 'Jogando'
    case 'settling':
      return 'Liquidando'
    case 'finished':
      return 'Finalizada'
    case 'lost':
      return 'Perdida'
    case 'disconnected':
      return 'Desconectou'
    default:
      return status
  }
}

export function arenaPaymentLabel(method: ArenaPaymentMethod | string) {
  if (method === 'ticket') return 'Ticket'
  if (method === 'balance') return 'Saldo'
  return method
}

export function arenaScriptGroupLabel(group?: ArenaScriptGroup | string | null) {
  if (group === 'common') return 'Comum (94%)'
  if (group === 'rare') return 'Raro (5%)'
  if (group === 'jackpot') return 'Jackpot (1%)'
  return group || '—'
}

const statusColor: Record<string, 'accent' | 'warning' | 'success' | 'danger' | 'default'> = {
  playing: 'accent',
  settling: 'warning',
  finished: 'success',
  lost: 'danger',
  disconnected: 'default',
}

export function ArenaMatchStatusBadge({ status }: { status: string }) {
  return (
    <Chip size="sm" variant="soft" color={statusColor[status] ?? 'default'}>
      {arenaMatchStatusLabel(status)}
    </Chip>
  )
}

export function arenaRaritySwatch(rarity?: ArenaRarity | null) {
  if (!rarity) return '#71717a'
  return ARENA_RARITY_COLOR[rarity] ?? '#71717a'
}

export function arenaRarityLabel(rarity?: ArenaRarity | null) {
  if (!rarity) return '—'
  return ARENA_RARITY_LABEL[rarity] ?? rarity
}
