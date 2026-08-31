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
          className="text-sm font-medium text-foreground"
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
            ? 'border-accent/40 bg-accent-soft focus:border-accent focus:ring-accent/15'
            : 'border-border bg-field focus:border-accent focus:ring-accent/15'
        }`}
      >
        <span
          className={`text-sm font-medium ${
            checked
              ? 'text-accent-soft-foreground'
              : 'text-muted'
          }`}
        >
          {checked ? 'Ativa' : 'Inativa'}
        </span>
        <span
          aria-hidden
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            checked ? 'bg-accent' : 'bg-default'
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
        <p className="text-xs leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
