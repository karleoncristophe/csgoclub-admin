import type { ReactNode } from 'react'

export function PageTitle({
  children,
  subtitle,
}: {
  children: ReactNode
  subtitle?: string
}) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        {children}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
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
      className={`text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 ${className}`}
    >
      {children}
    </h2>
  )
}
