import { type InputHTMLAttributes, type ReactNode, useId } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  endAdornment?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  endAdornment,
  ...rest
}: InputProps) {
  const uid = useId()
  const inputId = id ?? `${rest.name ?? 'field'}-${uid}`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={`h-11 w-full rounded-xl border bg-white px-3.5 text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
            endAdornment ? 'pr-12' : ''
          } ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-zinc-200'
          } ${className}`}
          {...rest}
        />
        {endAdornment ? (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
            {endAdornment}
          </div>
        ) : null}
      </div>
      {hint && !error ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
