import { Button as HeroButton } from '@heroui/react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

type IconButtonVariant = 'ghost' | 'danger'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> & {
  label: string
  variant?: IconButtonVariant
  children: ReactNode
}

const variantClass: Record<IconButtonVariant, string> = {
  ghost:
    'rounded-lg text-muted hover:bg-default hover:text-foreground',
  danger:
    'rounded-lg text-danger hover:bg-danger-soft hover:text-danger',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, variant = 'ghost', className = '', children, type = 'button', ...rest },
    ref,
  ) {
    return (
      <Tooltip content={label}>
        <HeroButton
          ref={ref}
          type={type}
          aria-label={label}
          isIconOnly
          size="sm"
          variant={variant === 'danger' ? 'danger-soft' : 'tertiary'}
          className={`shrink-0 ${variantClass[variant]} ${className}`}
          {...(rest as Record<string, unknown>)}
        >
          {children}
        </HeroButton>
      </Tooltip>
    )
  },
)
