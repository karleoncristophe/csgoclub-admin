import { type SelectHTMLAttributes, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

const selectClass =
  'peer h-11 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white py-0 pl-3.5 pr-10 text-sm text-zinc-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 [&>option]:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 dark:[&>option]:bg-zinc-900 dark:[&>option]:text-zinc-100'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  description?: string
  fieldHelp?: FieldHelp
}

export function Select({
  label,
  hint,
  description,
  fieldHelp,
  id,
  className = '',
  children,
  ...rest
}: SelectProps) {
  const uid = useId()
  const sid = id ?? `${rest.name ?? 'select'}-${uid}`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={sid} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
      </div>
      <div className="relative">
        <select id={sid} className={`${selectClass} ${className}`} {...rest}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 peer-disabled:opacity-40 dark:text-zinc-400"
          strokeWidth={2}
          aria-hidden
        />
      </div>
      {description ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {hint ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  )
}
