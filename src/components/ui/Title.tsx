import type { ReactNode } from 'react'

export function PageTitle({
  children,
  subtitle,
}: {
  children: ReactNode
  subtitle?: string
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {children}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}

export function SectionTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2
      className={`text-lg font-semibold tracking-tight text-foreground ${className}`}
    >
      {children}
    </h2>
  )
}
