import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTheme } from '@/theme/ThemeContext'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipPayload,
} from 'recharts'
import type { AdminDashboardMetricsSeriesRow } from '@/types/adminMetrics'
import { formatCentsUSD } from '@/utils/formatDisplay'

export type ChartVariant = 'area' | 'line' | 'bar'

const STORAGE_PREFIX = 'cs2club-admin-dash-chart'

const SLIDER_ORDER: ChartVariant[] = ['area', 'line', 'bar']

const VARIANT_META: Record<
  ChartVariant,
  { label: string; short: string }
> = {
  area: { label: 'Gráfico de área', short: 'Área' },
  line: { label: 'Gráfico de linhas', short: 'Linha' },
  bar: { label: 'Gráfico de barras', short: 'Barras' },
}

function MiniAreaPreview({ active }: { active: boolean }) {
  const stroke = active
    ? 'rgb(92 111 255)'
    : 'rgb(161 161 170)'
  const fillSolid = active ? 'rgb(92 111 255 / 0.2)' : 'rgb(161 161 170 / 0.12)'
  return (
    <svg
      viewBox="0 0 52 30"
      className="pointer-events-none h-5.5 w-10 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
      aria-hidden
    >
      <path
        d="M2 22 C10 8, 18 26, 26 14 C34 4, 42 18, 50 10 L50 28 L2 28 Z"
        fill={fillSolid}
        className="transition-all duration-300"
      />
      <path
        d="M2 22 C10 8, 18 26, 26 14 C34 4, 42 18, 50 10"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </svg>
  )
}

function MiniChartPreview({
  variant,
  active,
}: {
  variant: ChartVariant
  active: boolean
}) {
  if (variant === 'area') {
    return <MiniAreaPreview active={active} />
  }

  const stroke = active
    ? 'rgb(92 111 255)'
    : 'rgb(161 161 170)'
  const barMuted = active ? 'rgb(92 111 255 / 0.45)' : 'rgb(161 161 170 / 0.35)'
  const barStrong = active ? 'rgb(92 111 255)' : 'rgb(113 113 122)'

  if (variant === 'line') {
    return (
      <svg
        viewBox="0 0 52 30"
        className="pointer-events-none h-5.5 w-10 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
        aria-hidden
      >
        <path
          d="M3 20 L14 12 L25 18 L36 8 L49 14"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="58"
          strokeDashoffset={active ? 0 : 10}
          className="transition-[stroke-dashoffset,stroke] duration-500 ease-out group-hover:[stroke-dashoffset:0]"
        />
        <circle cx="3" cy="20" r="2" fill={stroke} className="opacity-80" />
        <circle cx="25" cy="18" r="2" fill={stroke} />
        <circle cx="49" cy="14" r="2" fill={stroke} className="opacity-80" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 52 30"
      className="pointer-events-none h-5.5 w-10 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
      aria-hidden
    >
      <rect x="6" y="14" width="8" height="14" rx="2" fill={barMuted} />
      <rect x="22" y="6" width="8" height="22" rx="2" fill={barStrong} />
      <rect x="38" y="11" width="8" height="17" rx="2" fill={barMuted} />
    </svg>
  )
}

function getStoredVariant(key: string): ChartVariant {
  if (typeof window === 'undefined') return 'area'
  const s = localStorage.getItem(`${STORAGE_PREFIX}-${key}`)
  if (s === 'area' || s === 'line' || s === 'bar') return s
  return 'area'
}

function setStoredVariant(key: string, v: ChartVariant) {
  localStorage.setItem(`${STORAGE_PREFIX}-${key}`, v)
}

const AXIS_TICK_LIGHT = { fontSize: 11, fill: '#71717a' }
const AXIS_TICK_DARK = { fontSize: 11, fill: '#a1a1aa' }
const GRID_STROKE_LIGHT = '#e4e4e7'
/** Grade quase imperceptível no tema escuro */
const GRID_STROKE_DARK = '#52525b'

function isMonthlyGranularity(seriesGranularity: string): boolean {
  return String(seriesGranularity).toLowerCase() === 'month'
}

function numericTooltipValue(
  value: TooltipPayload[number]['value'],
): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((acc, v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return acc + v
      if (typeof v === 'string') {
        const n = Number(v)
        return acc + (Number.isFinite(n) ? n : 0)
      }
      return acc
    }, 0)
  }
  return 0
}

function formatChartValue(value: number, valueFormat: 'count' | 'currency') {
  if (valueFormat === 'currency') {
    return formatCentsUSD(value)
  }
  return value.toLocaleString('pt-BR')
}

function formatChartAxisTick(value: number, valueFormat: 'count' | 'currency') {
  if (valueFormat === 'currency') {
    if (value >= 1_000_000) {
      return `US$ ${(value / 100 / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
    }
    if (value >= 1_000) {
      return `US$ ${(value / 100 / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
    }
    return formatCentsUSD(value)
  }
  return value.toLocaleString('pt-BR')
}

function MetricsTooltipBody({
  active,
  payload,
  label,
  xTick,
  valueFormat = 'count',
}: {
  active?: boolean
  payload?: TooltipPayload
  label?: string
  xTick: (v: string) => string
  valueFormat?: 'count' | 'currency'
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white/95 px-4 py-3 text-sm shadow-xl shadow-zinc-900/10 backdrop-blur-md dark:border-zinc-600 dark:bg-zinc-900/95 dark:shadow-black/50">
      <p className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
        {label != null ? xTick(String(label)) : ''}
      </p>
      <ul className="space-y-2">
        {payload.map((entry, i) => (
          <li
            key={`${String(entry.dataKey)}-${i}`}
            className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs opacity-90">
              {entry.name != null ? String(entry.name) : ''}
            </span>
            <span className="tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatChartValue(numericTooltipValue(entry.value), valueFormat)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function formatSeriesAxisLabel(
  raw: string,
  seriesGranularity: string,
): string {
  if (isMonthlyGranularity(seriesGranularity) && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split('-')
    const monthShort = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(Number(y), Number(m) - 1, 1)))
    return `${monthShort.replace(/\./g, '')} ${y.slice(2)}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, mm, dd] = raw.split('-')
    return `${dd}/${mm}`
  }
  return raw
}

export function ChartTypeSelector({
  value,
  onChange,
}: {
  value: ChartVariant
  onChange: (v: ChartVariant) => void
}) {
  const idx = Math.max(0, SLIDER_ORDER.indexOf(value))

  return (
    <div
      role="radiogroup"
      aria-label="Tipo de gráfico"
      className="relative isolate flex h-14 w-full max-w-62 items-stretch gap-1 rounded-2xl border border-zinc-200/90 bg-zinc-100/95 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] dark:border-zinc-600/80 dark:bg-zinc-900/85 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] sm:max-w-68"
    >
      <div
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-xl bg-linear-to-b from-white via-white to-zinc-50/90 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.12),0_0_0_1px_rgb(92_111_255/0.12)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 dark:shadow-[0_4px_20px_-4px_rgb(0_0_0/0.45),0_0_0_1px_rgb(92_111_255/0.22)]"
        style={{
          width: 'calc((100% - 1rem) / 3)',
          transform: `translateX(calc(${idx} * (100% + 0.25rem)))`,
        }}
      />
      {SLIDER_ORDER.map((v) => {
        const active = value === v
        const meta = VARIANT_META[v]
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            title={meta.label}
            onClick={() => onChange(v)}
            className="group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 outline-none transition-[transform,color] duration-200 hover:bg-white/25 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 dark:hover:bg-white/5 dark:focus-visible:ring-offset-zinc-900 sm:px-1"
          >
            <MiniChartPreview variant={v} active={active} />
            <span
              className={`text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 sm:text-[10px] ${
                active
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300'
              }`}
            >
              {meta.short}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function useChartVariant(storageKey: string) {
  const [variant, setVariant] = useState<ChartVariant>(() =>
    getStoredVariant(storageKey),
  )
  const onChange = useCallback((v: ChartVariant) => {
    setVariant(v)
    setStoredVariant(storageKey, v)
  }, [storageKey])
  return { variant, onChange }
}

type SeriesKey = keyof Pick<
  AdminDashboardMetricsSeriesRow,
  | 'usersCreated'
  | 'caseOpensReal'
  | 'depositsCount'
  | 'revenueUsdCents'
  | 'payoutUsdCents'
  | 'marginUsdCents'
  | 'depositsVolumeCents'
>

type DualSeriesChartProps = {
  data: AdminDashboardMetricsSeriesRow[]
  seriesGranularity: string
  variant: ChartVariant
  keys: [SeriesKey, SeriesKey]
  names: [string, string]
  colors: [string, string]
  gradientIds: [string, string]
  valueFormat?: 'count' | 'currency'
  third?: {
    key: SeriesKey
    name: string
    color: string
    gradientId: string
  }
}

const CHART_HEIGHT = 308

export function DualSeriesMetricsChart({
  data,
  seriesGranularity,
  variant,
  keys,
  names,
  colors,
  gradientIds,
  valueFormat = 'count',
  third,
}: DualSeriesChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const axisTick = isDark ? AXIS_TICK_DARK : AXIS_TICK_LIGHT
  const gridStroke = isDark ? GRID_STROKE_DARK : GRID_STROKE_LIGHT
  const gridStrokeOpacity = isDark ? 0.12 : 0.9
  const legendColor = isDark ? '#a1a1aa' : '#52525b'

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        [keys[0]]: Number(d[keys[0]] ?? 0),
        [keys[1]]: Number(d[keys[1]] ?? 0),
        ...(third ? { [third.key]: Number(d[third.key] ?? 0) } : {}),
      })),
    [data, keys, third],
  )

  if (!chartData.length) {
    return (
      <div className="flex h-[308px] items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/50 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-500">
        Nenhum dado no período.
      </div>
    )
  }

  const xTick = (v: string) =>
    formatSeriesAxisLabel(String(v), seriesGranularity)

  /** Margem lateral maior no eixo Y para labels de moeda não cortarem */
  const chartMargin = {
    top: 6,
    right: 8,
    left: valueFormat === 'currency' ? 4 : 0,
    bottom: 2,
  }

  const sharedX = (
    <XAxis
      dataKey="date"
      tick={axisTick}
      axisLine={false}
      tickLine={false}
      tickMargin={8}
      tickFormatter={xTick}
      padding={{ left: 0, right: 0 }}
    />
  )
  const sharedY = (
    <YAxis
      tick={axisTick}
      axisLine={false}
      tickLine={false}
      tickMargin={4}
      width={valueFormat === 'currency' ? 72 : 36}
      allowDecimals={valueFormat === 'currency'}
      tickFormatter={(v) => formatChartAxisTick(Number(v), valueFormat)}
    />
  )
  const tip = (
    <Tooltip
      cursor={{ stroke: gridStroke, strokeOpacity: 0.35 }}
      content={({ active, payload, label }) => (
        <MetricsTooltipBody
          active={active}
          payload={payload}
          label={label != null ? String(label) : undefined}
          xTick={xTick}
          valueFormat={valueFormat}
        />
      )}
    />
  )
  const grid = (
    <CartesianGrid
      stroke={gridStroke}
      strokeOpacity={gridStrokeOpacity}
      strokeDasharray="4 6"
      vertical={false}
    />
  )
  const legend = (
    <Legend
      verticalAlign="top"
      align="right"
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ top: 0, right: 0, paddingBottom: 12 }}
      formatter={(value) => (
        <span style={{ color: legendColor, fontSize: 12, fontWeight: 500 }}>
          {value}
        </span>
      )}
    />
  )

  const [k0, k1] = keys
  const [n0, n1] = names
  const [c0, c1] = colors
  const [g0, g1] = gradientIds
  const thirdBar =
    third != null ? (
      <Bar
        dataKey={third.key}
        name={third.name}
        fill={third.color}
        radius={[6, 6, 0, 0]}
        maxBarSize={36}
      />
    ) : null
  const thirdLine =
    third != null ? (
      <Line
        type="monotone"
        dataKey={third.key}
        name={third.name}
        stroke={third.color}
        strokeWidth={2.5}
        dot={false}
        activeDot={{ r: 5, strokeWidth: 0, fill: third.color }}
      />
    ) : null
  const thirdArea =
    third != null ? (
      <Area
        type="monotone"
        dataKey={third.key}
        name={third.name}
        stroke={third.color}
        strokeWidth={2}
        fill={`url(#${third.gradientId})`}
        fillOpacity={1}
        baseValue={0}
        isAnimationActive
      />
    ) : null

  const shell = (chart: ReactNode) => (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-linear-to-b from-zinc-50/90 via-white to-white px-1 pb-1.5 pt-9 shadow-inner shadow-zinc-900/3 dark:border-zinc-700/70 dark:from-zinc-800/35 dark:via-zinc-900/50 dark:to-zinc-950/40 dark:shadow-black/20 sm:px-2 sm:pb-2 sm:pt-10">
      {chart}
    </div>
  )

  if (variant === 'bar') {
    return shell(
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={chartData}
          margin={chartMargin}
          barGap={5}
          barCategoryGap="20%"
        >
          {legend}
          {grid}
          {sharedX}
          {sharedY}
          {tip}
          <Bar
            dataKey={k0}
            name={n0}
            fill={c0}
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            dataKey={k1}
            name={n1}
            fill={c1}
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
          {thirdBar}
        </BarChart>
      </ResponsiveContainer>,
    )
  }

  if (variant === 'line') {
    return shell(
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={chartData} margin={chartMargin}>
          {legend}
          {grid}
          {sharedX}
          {sharedY}
          {tip}
          <Line
            type="monotone"
            dataKey={k0}
            name={n0}
            stroke={c0}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: c0 }}
          />
          <Line
            type="monotone"
            dataKey={k1}
            name={n1}
            stroke={c1}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: c1 }}
          />
          {thirdLine}
        </LineChart>
      </ResponsiveContainer>,
    )
  }

  return shell(
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart data={chartData} margin={chartMargin}>
        <defs>
          <linearGradient id={g0} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c0} stopOpacity={0.38} />
            <stop offset="28%" stopColor={c0} stopOpacity={0.26} />
            <stop offset="52%" stopColor={c0} stopOpacity={0.16} />
            <stop offset="76%" stopColor={c0} stopOpacity={0.08} />
            <stop offset="100%" stopColor={c0} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c1} stopOpacity={0.38} />
            <stop offset="28%" stopColor={c1} stopOpacity={0.26} />
            <stop offset="52%" stopColor={c1} stopOpacity={0.16} />
            <stop offset="76%" stopColor={c1} stopOpacity={0.08} />
            <stop offset="100%" stopColor={c1} stopOpacity={0.02} />
          </linearGradient>
          {third ? (
            <linearGradient id={third.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={third.color} stopOpacity={0.38} />
              <stop offset="28%" stopColor={third.color} stopOpacity={0.26} />
              <stop offset="52%" stopColor={third.color} stopOpacity={0.16} />
              <stop offset="76%" stopColor={third.color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={third.color} stopOpacity={0.02} />
            </linearGradient>
          ) : null}
        </defs>
        {legend}
        {grid}
        {sharedX}
        {sharedY}
        {tip}
        <Area
          type="monotone"
          dataKey={k0}
          name={n0}
          stroke={c0}
          strokeWidth={2}
          fill={`url(#${g0})`}
          fillOpacity={1}
          baseValue={0}
          isAnimationActive
        />
        <Area
          type="monotone"
          dataKey={k1}
          name={n1}
          stroke={c1}
          strokeWidth={2}
          fill={`url(#${g1})`}
          fillOpacity={1}
          baseValue={0}
          isAnimationActive
        />
        {thirdArea}
      </AreaChart>
    </ResponsiveContainer>,
  )
}
