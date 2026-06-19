import { Fragment, useEffect, useMemo, useState } from 'react'
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  addDaysLocal,
  addMonthsLocal,
  buildRangeSet,
  formatDateKeyLocal,
  getMatrixForMonth,
  getRangeForWeekLocal,
  getUpcomingWeekendLocal,
  parseDateKeyLocal,
} from '@/utils/dateRangePickerCalendar'
import { endOfLocalDay, startOfLocalDay } from '@/utils/metricsDateRange'

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const MAX_RANGE_DAYS = 366

type QuickOption = {
  id: string
  label: string
  getRange: () => { from: Date; to: Date }
}

function todayLocal(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const QUICK_OPTIONS: QuickOption[] = [
  {
    id: 'last-7',
    label: 'Últimos 7 dias',
    getRange: () => {
      const end = todayLocal()
      const from = addDaysLocal(end, -7)
      return { from, to: end }
    },
  },
  {
    id: 'last-30',
    label: 'Últimos 30 dias',
    getRange: () => {
      const end = todayLocal()
      const from = addDaysLocal(end, -30)
      return { from, to: end }
    },
  },
  {
    id: 'last-90',
    label: 'Últimos 90 dias',
    getRange: () => {
      const end = todayLocal()
      const from = addDaysLocal(end, -90)
      return { from, to: end }
    },
  },
  {
    id: 'last-365',
    label: 'Último ano',
    getRange: () => {
      const end = todayLocal()
      const from = addDaysLocal(end, -365)
      return { from, to: end }
    },
  },
  {
    id: 'today',
    label: 'Hoje',
    getRange: () => {
      const d = todayLocal()
      return { from: d, to: d }
    },
  },
  {
    id: 'tomorrow',
    label: 'Amanhã',
    getRange: () => {
      const d = addDaysLocal(todayLocal(), 1)
      return { from: d, to: d }
    },
  },
  {
    id: 'this-week',
    label: 'Nesta semana',
    getRange: () => {
      const days = getRangeForWeekLocal(new Date())
      return { from: days[0]!, to: days[days.length - 1]! }
    },
  },
  {
    id: 'this-weekend',
    label: 'Neste fim de semana',
    getRange: () => {
      const [sat, sun] = getUpcomingWeekendLocal(new Date())
      return { from: sat, to: sun }
    },
  },
  {
    id: 'next-week',
    label: 'Na próxima semana',
    getRange: () => {
      const days = getRangeForWeekLocal(addDaysLocal(new Date(), 7))
      return { from: days[0]!, to: days[days.length - 1]! }
    },
  },
]

function dayKey(d: Date): string {
  return formatDateKeyLocal(startOfLocalDay(d))
}

/** Indica se o intervalo (início/fim em dias locais) é exatamente o que o atalho geraria hoje. */
export function dateRangeMatchesQuickPreset(
  rangeStart: Date,
  rangeEnd: Date,
  opt: QuickOption,
): boolean {
  const { from, to } = opt.getRange()
  return dayKey(from) === dayKey(rangeStart) && dayKey(to) === dayKey(rangeEnd)
}

export function getActiveQuickPresetLabel(
  rangeStart: Date,
  rangeEnd: Date,
): string | null {
  for (const opt of QUICK_OPTIONS) {
    if (dateRangeMatchesQuickPreset(rangeStart, rangeEnd, opt)) {
      return opt.label
    }
  }
  return null
}

export type DateRangePickerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Intervalo atualmente aplicado (para abrir o modal alinhado). */
  appliedStart: Date
  appliedEnd: Date
  onApply: (start: Date, end: Date) => void
}

export function DateRangePickerTrigger({
  appliedStart,
  appliedEnd,
  presetLabel,
  onClick,
}: {
  appliedStart: Date
  appliedEnd: Date
  /** Quando o intervalo bate com um atalho (ex.: Últimos 7 dias), exibido acima das datas. */
  presetLabel?: string | null
  onClick: () => void
}) {
  const label = `${appliedStart.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} – ${appliedEnd.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={surfaceClass('dateRangeTrigger')}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
        <CalendarRange className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
        <span className="min-w-0 flex-1">
          {presetLabel ? (
            <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
              {presetLabel}
            </span>
          ) : null}
          <ThemeText as="span" tone="primary" className="font-medium">
            {label}
          </ThemeText>
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
    </button>
  )
}

export function DateRangePickerModal({
  open,
  onOpenChange,
  appliedStart,
  appliedEnd,
  onApply,
}: DateRangePickerModalProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfLocalDay(new Date(appliedStart.getFullYear(), appliedStart.getMonth(), 1)),
  )
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() =>
    buildRangeSet(appliedStart, appliedEnd),
  )
  const [applyError, setApplyError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setApplyError(null)
    const s = startOfLocalDay(appliedStart)
    const e = startOfLocalDay(appliedEnd)
    setSelectedDates(buildRangeSet(s, e))
    setVisibleMonth(new Date(s.getFullYear(), s.getMonth(), 1))
  }, [open, appliedStart, appliedEnd])

  useEffect(() => {
    if (!open) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const monthsToRender = useMemo(
    () => [visibleMonth, addMonthsLocal(visibleMonth, 1)],
    [visibleMonth],
  )

  const selectionDayRange = useMemo(() => {
    if (selectedDates.size === 0) return null
    const sorted = [...selectedDates].sort()
    const startK = sorted[0]!
    const endK = sorted[sorted.length - 1]!
    return {
      start: parseDateKeyLocal(startK),
      end: parseDateKeyLocal(endK),
    }
  }, [selectedDates])

  const toggleDate = (day: Date | null) => {
    if (!day) return
    const clickedDate = new Date(day)
    clickedDate.setHours(0, 0, 0, 0)

    setSelectedDates((prev) => {
      const dates = Array.from(prev)
        .map((k) => parseDateKeyLocal(k))
        .sort((a, b) => a.getTime() - b.getTime())

      if (dates.length === 0) {
        return new Set([formatDateKeyLocal(clickedDate)])
      }

      const first = dates[0]!
      const last = dates[dates.length - 1]!
      let start = first
      let end = clickedDate

      if (clickedDate.getTime() < first.getTime()) {
        start = clickedDate
        end = last
      }

      const nextSelection = new Set<string>()
      let current = new Date(start)
      while (current.getTime() <= end.getTime()) {
        nextSelection.add(formatDateKeyLocal(current))
        current = addDaysLocal(current, 1)
      }
      return nextSelection
    })
  }

  const applyQuick = (opt: QuickOption) => {
    const { from, to } = opt.getRange()
    setSelectedDates(buildRangeSet(from, to))
  }

  const handleClear = () => {
    setSelectedDates(new Set())
    setApplyError(null)
  }

  const handleApply = () => {
    setApplyError(null)
    if (selectedDates.size === 0) {
      setApplyError('Selecione pelo menos um dia.')
      return
    }
    const sorted = Array.from(selectedDates).sort()
    const start = parseDateKeyLocal(sorted[0]!)
    const endDay = parseDateKeyLocal(sorted[sorted.length - 1]!)
    const spanDays =
      Math.floor(
        (endDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
      ) + 1
    if (spanDays > MAX_RANGE_DAYS) {
      setApplyError(`O período não pode ultrapassar ${MAX_RANGE_DAYS} dias.`)
      return
    }
    onApply(startOfLocalDay(start), endOfLocalDay(endDay))
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className={surfaceClass('modalBackdrop')}
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <Surface
        variant="modalShell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-range-title"
      >
        <Surface variant="modalHeaderRow">
          <div>
            <ThemeText
              as="h2"
              id="date-range-title"
              tone="primary"
              className="text-lg font-semibold"
            >
              Período
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
              Selecione um intervalo de datas (máx. {MAX_RANGE_DAYS} dias)
            </ThemeText>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={surfaceClass('ghostIconButton', 'p-2')}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </Surface>

        <div className="max-h-[min(70vh,calc(100dvh-8rem))] overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((opt) => {
              const active =
                selectionDayRange != null &&
                dateRangeMatchesQuickPreset(
                  selectionDayRange.start,
                  selectionDayRange.end,
                  opt,
                )
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyQuick(opt)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 ring-2 ring-brand-400/40 ring-offset-2 ring-offset-white dark:ring-brand-500/35 dark:ring-offset-zinc-900'
                      : 'bg-brand-600/10 text-brand-700 hover:bg-brand-600/20 dark:bg-brand-600/15 dark:text-brand-300 dark:hover:bg-brand-600/25'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => setVisibleMonth((m) => addMonthsLocal(m, -1))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setVisibleMonth((m) => addMonthsLocal(m, 1))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-8 md:grid-cols-2">
            {monthsToRender.map((monthDate) => (
              <div key={monthDate.toISOString()} className="flex flex-col gap-3">
                <div className="text-center text-sm font-semibold capitalize text-zinc-800 dark:text-zinc-300">
                  {MONTHS_PT[monthDate.getMonth()]} {monthDate.getFullYear()}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {WEEKDAY_SHORT.map((day) => (
                    <span key={`${monthDate.getTime()}-${day}`}>{day}</span>
                  ))}
                  {getMatrixForMonth(monthDate).map((week, weekIndex) => (
                    <Fragment key={`${monthDate.getTime()}-w-${weekIndex}`}>
                      {week.map((cell, dayIndex) => {
                        if (!cell) {
                          return (
                            <span
                              key={`e-${weekIndex}-${dayIndex}`}
                              className="h-9"
                            />
                          )
                        }
                        const key = formatDateKeyLocal(cell)
                        const isSelected = selectedDates.has(key)
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleDate(cell)}
                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                              isSelected
                                ? 'bg-brand-500 font-medium text-white shadow-md shadow-brand-600/30'
                                : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {cell.getDate()}
                          </button>
                        )
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {applyError ? (
            <ThemeText as="p" tone="warning" className="mt-4 text-sm">
              {applyError}
            </ThemeText>
          ) : null}
        </div>

        <Surface variant="modalFooterRow">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Limpar
          </button>
          <Button type="button" onClick={handleApply}>
            Aplicar período
          </Button>
        </Surface>
      </Surface>
    </div>
  )
}
