import {
  endOfLocalDay,
  isRangeWithinMaxYear,
  startOfLocalDay,
} from '@/utils/metricsDateRange'

const STORAGE_KEY = 'cs2club-admin-dashboard-metrics-date-range'

type StoredShape = { start: string; end: string }

export function loadStoredMetricsRange(): { start: Date; end: Date } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as StoredShape
    if (!o?.start || !o?.end) return null
    const start = startOfLocalDay(new Date(o.start))
    const end = endOfLocalDay(new Date(o.end))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    if (start.getTime() > end.getTime()) return null
    if (!isRangeWithinMaxYear(start, end)) return null
    return { start, end }
  } catch {
    return null
  }
}

export function saveStoredMetricsRange(start: Date, end: Date) {
  if (typeof window === 'undefined') return
  const s = startOfLocalDay(start)
  const e = endOfLocalDay(end)
  if (!isRangeWithinMaxYear(s, e) || s.getTime() > e.getTime()) return
  const payload: StoredShape = {
    start: s.toISOString(),
    end: e.toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
