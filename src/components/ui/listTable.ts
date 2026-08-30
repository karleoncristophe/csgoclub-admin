/**
 * Classes compartilhadas para tabelas de listagem (light + dark).
 * Evita repetir dark: em cada página.
 */
export const listTable = {
  wrap: 'scrollbar-list overflow-x-auto overflow-y-hidden rounded-[var(--radius)] border border-separator bg-surface p-0 shadow-none',
  table: 'min-w-full divide-y divide-separator text-left text-sm',
  theadRow: 'bg-transparent',
  th: 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted',
  tbody: 'divide-y divide-separator bg-surface',
  tr: 'transition-colors hover:bg-accent-soft/45',
  tdStrong: 'px-3 py-2.5 font-medium text-foreground',
  td: 'px-3 py-2.5 text-foreground/75',
  tdMuted: 'whitespace-nowrap px-3 py-2.5 text-muted',
  empty: 'px-4 py-12 text-center text-muted',
} as const

/** Tabelas border-collapse (cabeçalho com border-b, linhas separadas). */
export const listTableAlt = {
  wrap: 'scrollbar-list overflow-x-auto overflow-y-hidden rounded-[var(--radius)] border border-separator bg-surface p-0 shadow-none [&_th]:px-3 [&_td]:px-3',
  theadRow:
    'bg-transparent text-xs font-semibold uppercase tracking-wide text-muted',
  th: 'py-2.5',
  tbody: 'bg-surface text-foreground',
  tr: 'border-b border-separator transition-colors last:border-b-0 hover:bg-accent-soft/45',
  tdStrong: 'font-medium text-foreground',
  td: 'text-foreground/75',
  tdMuted: 'text-muted',
  empty: 'py-10 text-center text-muted',
} as const

export const linkBrand =
  'text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300'
