import type { ReactNode } from 'react'
import { useGoBack } from '@/hooks/useGoBack'

export function BackLink({
  fallback,
  className,
  children,
}: {
  fallback: string
  className?: string
  children: ReactNode
}) {
  const goBack = useGoBack(fallback)

  return (
    <button
      type="button"
      onClick={goBack}
      className={className ? `cursor-pointer ${className}` : 'cursor-pointer'}
    >
      {children}
    </button>
  )
}
