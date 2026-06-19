const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000

export type PeriodPresetId = '7d' | '30d' | '90d' | '365d'

export function endOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function applyPreset(preset: PeriodPresetId): { start: Date; end: Date } {
  const end = endOfLocalDay(new Date())
  const start = startOfLocalDay(new Date())
  switch (preset) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case '365d':
      start.setDate(start.getDate() - 365)
      break
    default:
      break
  }
  return { start, end }
}

export function parseDateInputLocal(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null
  }
  return dt
}

export function formatDateInputLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function rangeSpanMs(start: Date, end: Date): number {
  return end.getTime() - start.getTime()
}

export function isRangeWithinMaxYear(start: Date, end: Date): boolean {
  return rangeSpanMs(start, end) <= MAX_RANGE_MS && rangeSpanMs(start, end) >= 0
}
