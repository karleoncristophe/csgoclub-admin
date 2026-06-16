import { useEffect, useId, useState } from 'react'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'
import {
  formatCurrencyAmountInput,
  formatCurrencyInput,
  parseCurrencyInputToAmount,
} from '@/utils/skinsCurrencyInput'

type CurrencyInputProps = {
  label: string
  name: string
  value: number
  currency: SkinsCurrency
  onChange: (amount: number) => void
  onBlur?: () => void
  error?: string
  hint?: string
  description?: string
  fieldHelp?: FieldHelp
  disabled?: boolean
}

export function CurrencyInput({
  label,
  name,
  value,
  currency,
  onChange,
  onBlur,
  error,
  hint,
  description,
  fieldHelp,
  disabled = false,
}: CurrencyInputProps) {
  const uid = useId()
  const inputId = `${name}-${uid}`
  const [display, setDisplay] = useState(() => formatCurrencyAmountInput(value, currency))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDisplay(formatCurrencyAmountInput(value, currency))
    }
  }, [value, currency, focused])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
        {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
      </div>
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        placeholder={formatCurrencyAmountInput(0, currency)}
        value={display}
        onChange={(e) => {
          const masked = formatCurrencyInput(e.target.value, currency)
          setDisplay(masked)
          onChange(parseCurrencyInputToAmount(masked))
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          onBlur?.()
        }}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-950/60 dark:disabled:text-zinc-500 ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-zinc-200'
        }`}
      />
      {description && !error ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {hint && !error ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
