import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

type IconButtonVariant = 'ghost' | 'danger'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: IconButtonVariant
  children: ReactNode
}

const variantClass: Record<IconButtonVariant, string> = {
  ghost:
    'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  danger:
    'text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, variant = 'ghost', className = '', children, type = 'button', ...rest },
    ref,
  ) {
    return (
      <Tooltip content={label}>
        <button
          ref={ref}
          type={type}
          aria-label={label}
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-40 ${variantClass[variant]} ${className}`}
          {...rest}
        >
          {children}
        </button>
      </Tooltip>
    )
  },
)
