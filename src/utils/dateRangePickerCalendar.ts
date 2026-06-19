/** Chave local YYYY-MM-DD (sem deslocamento UTC). */
export function formatDateKeyLocal(d: Date): string {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKeyLocal(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function addDaysLocal(date: Date, amount: number): Date {
  const clone = new Date(date)
  clone.setDate(clone.getDate() + amount)
  return clone
}

export function addMonthsLocal(date: Date, amount: number): Date {
  const clone = new Date(date)
  clone.setMonth(clone.getMonth() + amount)
  return clone
}

export function getRangeForWeekLocal(date: Date): Date[] {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  start.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, index) => addDaysLocal(start, index))
}

export function getUpcomingWeekendLocal(date: Date): Date[] {
  const base = new Date(date)
  base.setHours(0, 0, 0, 0)
  const saturday = addDaysLocal(base, (6 - base.getDay() + 7) % 7)
  return [saturday, addDaysLocal(saturday, 1)]
}

export function getMatrixForMonth(base: Date): (Date | null)[][] {
  const year = base.getFullYear()
  const month = base.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const cells: (Date | null)[] = Array.from({ length: 42 }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    const index = firstDay + day - 1
    cells[index] = new Date(year, month, day)
  }

  return Array.from({ length: 6 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7),
  )
}

export function buildRangeSet(from: Date, to: Date): Set<string> {
  const s = new Set<string>()
  const c = new Date(from)
  c.setHours(0, 0, 0, 0)
  const t = new Date(to)
  t.setHours(0, 0, 0, 0)
  while (c.getTime() <= t.getTime()) {
    s.add(formatDateKeyLocal(c))
    c.setDate(c.getDate() + 1)
  }
  return s
}
