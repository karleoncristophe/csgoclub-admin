import { useId } from 'react'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

type SwitchProps = {
  label: string
  name?: string
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: () => void
  description?: string
  hint?: string
  fieldHelp?: FieldHelp
  disabled?: boolean
}

/**
 * Switch alinhado ao layout de Input/Select: label em cima, controle h-11,
 * descrição embaixo — para caber na mesma grade sem desalinhar.
 */
export function Switch({
  label,
  name,
  checked,
  onChange,
  onBlur,
  description,
  hint,
  fieldHelp,
  disabled = false,
}: SwitchProps) {
  const uid = useId()
  const switchId = `${name ?? 'switch'}-${uid}`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={switchId}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
        {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onBlur={onBlur}
        className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 shadow-sm transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? 'border-brand-300 bg-brand-50/60 focus:border-brand-500 focus:ring-brand-500/15 dark:border-brand-400/40 dark:bg-brand-500/10'
            : 'border-zinc-200 bg-white focus:border-brand-500 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-900'
        }`}
      >
        <span
          className={`text-sm font-medium ${
            checked
              ? 'text-brand-800 dark:text-brand-100'
              : 'text-zinc-600 dark:text-zinc-300'
          }`}
        >
          {checked ? 'Ativa' : 'Inativa'}
        </span>
        <span
          aria-hidden
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </button>
      {description ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
      {hint ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  )
}
