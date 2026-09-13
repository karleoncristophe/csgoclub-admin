import { Chip } from '@heroui/react'
import type { AdminSwapListItem, SwapStatus } from '@/redux/store/api/swaps/api.swaps'

export function formatSwapMoney(value?: number | null, currency = 'BRL') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatSwapDateTime(value?: string | null, style: 'short' | 'long' = 'short') {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: style === 'long' ? 'full' : 'short',
    timeStyle: 'short',
  }).format(date)
}

export function swapStatusLabel(status: string) {
  if (status === 'completed') return 'Concluído'
  if (status === 'failed') return 'Falhou'
  if (status === 'reserved') return 'Reservado'
  if (status === 'debited') return 'Debitado'
  if (status === 'created') return 'Criado'
  if (status === 'in_progress') return 'Em andamento'
  return status
}

export function SwapStatusBadge({ status }: { status: SwapStatus | string }) {
  const color =
    status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'default'
  return (
    <Chip size="sm" variant="soft" color={color}>
      {swapStatusLabel(status)}
    </Chip>
  )
}

export function swapFundingLabel(swap: Pick<AdminSwapListItem, 'sourceItemCount' | 'balanceUsed'>) {
  const hasSkins = swap.sourceItemCount > 0
  const hasBalance = swap.balanceUsed > 0
  if (hasSkins && hasBalance) return 'Skins + saldo'
  if (hasBalance) return 'Só saldo'
  if (hasSkins) {
    return swap.sourceItemCount === 1 ? '1 skin' : `${swap.sourceItemCount} skins`
  }
  return '—'
}

export function swapLeftAccountHint(swap: Pick<AdminSwapListItem, 'sourceItemCount' | 'balanceUsed' | 'currency'>) {
  const parts: string[] = []
  if (swap.sourceItemCount > 0) {
    parts.push(swap.sourceItemCount === 1 ? '1 skin' : `${swap.sourceItemCount} skins`)
  }
  if (swap.balanceUsed > 0) {
    parts.push(formatSwapMoney(swap.balanceUsed, swap.currency))
  }
  return parts.length ? parts.join(' + ') : 'Nada debitado'
}
