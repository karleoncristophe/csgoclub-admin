import { forwardRef, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className = '', id, disabled, ...rest }, ref) {
    const cid = id ?? rest.name ?? 'checkbox'

    return (
      <label
        htmlFor={cid}
        className={`group inline-flex cursor-pointer select-none items-center gap-3 text-sm text-zinc-600 has-disabled:cursor-not-allowed has-disabled:opacity-55 dark:text-zinc-400 ${className}`}
      >
        <input
          ref={ref}
          id={cid}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className="relative flex size-5 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-sm transition-all duration-200 ease-out will-change-transform group-hover:border-brand-400/80 group-hover:bg-brand-50/50 group-active:scale-[0.92] dark:border-zinc-700 dark:bg-zinc-900 dark:group-hover:border-brand-500/50 dark:group-hover:bg-brand-950/25 peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/15 peer-disabled:pointer-events-none peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-checked:shadow-sm peer-checked:shadow-brand-500/20 peer-checked:[&>svg]:opacity-100 peer-checked:[&>svg]:scale-100 dark:peer-checked:border-brand-500 dark:peer-checked:bg-brand-500"
        >
          <Check
            className="h-3.5 w-3.5 text-white opacity-0 scale-[0.35] transition-all duration-200 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
            strokeWidth={2.75}
            aria-hidden
          />
        </span>
        <span className="leading-snug">{label}</span>
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
