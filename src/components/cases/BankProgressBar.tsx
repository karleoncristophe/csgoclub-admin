type BankProgressBarProps = {
  ratio: number
}

export function BankProgressBar({ ratio }: BankProgressBarProps) {
  const percent = Math.min(100, Math.max(0, ratio * 100))
  const label = `${Math.round(percent)}%`

  return (
    <div className="flex min-w-[7.5rem] items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={`shrink-0 text-[11px] font-medium tabular-nums ${
          percent >= 100
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-amber-700 dark:text-amber-300'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
