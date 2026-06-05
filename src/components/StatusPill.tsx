import type { ReactNode } from 'react'

/** Rótulo genérico (status enum, etc.) */
export function TextBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600/35">
      {children}
    </span>
  )
}

export function StatusPill({
  active,
  deleted,
}: {
  active?: boolean
  deleted?: boolean
}) {
  if (deleted) {
    return (
      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/30">
        Removido
      </span>
    )
  }
  if (active === false) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/45 dark:text-amber-200 dark:ring-amber-600/25">
        Inativo
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-600/25">
      Ativo
    </span>
  )
}
