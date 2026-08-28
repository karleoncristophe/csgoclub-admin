import { ARENA_RARITY_COLOR, ARENA_RARITY_LABEL } from '@/components/arena/arenaRarity'
import type {
  ArenaMatchStatus,
  ArenaPaymentMethod,
  ArenaRarity,
  ArenaScriptGroup,
} from '@/redux/store/api/arena/api.arena'
import { formatSkinsPrice } from '@/constants/skinsCurrency'

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

const statusBadgeClass: Record<string, string> = {
  playing:
    'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/25',
  settling:
    'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-400/25',
  finished:
    'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/25',
  lost:
    'bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/25',
  disconnected:
    'bg-zinc-100 text-zinc-600 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600/30',
}

export function ArenaMatchStatusBadge({ status }: { status: string }) {
  const tone =
    statusBadgeClass[status] ??
    'bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600/35'

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {arenaMatchStatusLabel(status)}
    </span>
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
