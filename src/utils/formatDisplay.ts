export function formatCentsUSD(cents: number | undefined) {
  if (cents == null || Number.isNaN(cents)) return '—'
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'USD',
  })
}
