import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Button as HeroButton } from '@heroui/react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  children: ReactNode
}

const variants: Record<Variant, 'primary' | 'secondary' | 'tertiary' | 'danger'> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'tertiary',
  danger: 'danger',
}

/** Compatibility API backed by HeroUI's accessible Button component. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading, className, disabled, children, ...rest },
  ref,
) {
  return (
    <HeroButton
      ref={ref}
      variant={variants[variant]}
      size={size}
      isDisabled={disabled || isLoading}
      className={className}
      {...(rest as Record<string, unknown>)}
    >
      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </HeroButton>
  )
})
