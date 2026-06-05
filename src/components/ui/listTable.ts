/**
 * Classes compartilhadas para tabelas de listagem (light + dark).
 * Evita repetir dark: em cada página.
 */
export const listTable = {
  wrap: 'scrollbar-list overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800',
  table: 'min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800',
  theadRow: 'bg-zinc-50/80 dark:bg-zinc-800/35',
  th: 'px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300',
  tbody: 'divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900/70',
  tr: 'transition-colors hover:bg-brand-50/40 dark:hover:bg-zinc-800/45',
  tdStrong: 'px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100',
  td: 'px-4 py-3 text-zinc-600 dark:text-zinc-400',
  tdMuted: 'whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-500',
  empty: 'px-4 py-12 text-center text-zinc-500 dark:text-zinc-400',
} as const

/** Tabelas border-collapse (cabeçalho com border-b, linhas separadas). */
export const listTableAlt = {
  wrap: 'scrollbar-list overflow-x-auto',
  theadRow:
    'border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400',
  th: 'py-3 pr-4',
  tbody: 'text-zinc-800 dark:text-zinc-200',
  tr: 'border-b border-zinc-200 transition-colors hover:bg-zinc-50/40 dark:border-zinc-800 dark:hover:bg-zinc-800/40',
  tdStrong: 'font-medium text-zinc-900 dark:text-zinc-100',
  td: 'text-zinc-600 dark:text-zinc-400',
  tdMuted: 'text-zinc-500 dark:text-zinc-400',
  empty: 'py-10 text-center text-zinc-500 dark:text-zinc-400',
} as const

export const linkBrand =
  'text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300'
