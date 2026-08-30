/**
 * Classes compartilhadas para tabelas de listagem.
 * Espelha o HeroUI Table do tema (header surface-secondary, separators, hover accent).
 * Chrome visual (borda/radius) vem de `.list-table-wrap` em index.css.
 */
export const listTable = {
  wrap: 'scrollbar-list list-table-wrap',
  table: 'min-w-full border-collapse text-left text-sm text-foreground',
  theadRow: 'bg-surface-secondary',
  th: 'border-b border-separator px-4 py-2.5 text-xs font-medium text-muted',
  tbody: 'bg-surface',
  tr: 'list-table-row border-b border-separator transition-colors last:border-b-0',
  tdStrong: 'px-4 py-3 font-medium text-foreground',
  td: 'px-4 py-3 text-foreground',
  tdMuted: 'whitespace-nowrap px-4 py-3 text-muted',
  empty: 'px-4 py-12 text-center text-muted',
} as const

/** Mesmo visual do listTable, pensado para editors. */
export const listTableAlt = {
  wrap: 'scrollbar-list list-table-wrap [&_th]:px-4 [&_td]:px-4',
  theadRow: 'bg-surface-secondary text-xs font-medium text-muted',
  th: 'border-b border-separator py-2.5',
  tbody: 'bg-surface text-foreground',
  tr: 'list-table-row border-b border-separator transition-colors last:border-b-0',
  tdStrong: 'py-3 font-medium text-foreground',
  td: 'py-3 text-foreground',
  tdMuted: 'py-3 text-muted',
  empty: 'py-10 text-center text-muted',
} as const

export const linkBrand =
  'text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300'
