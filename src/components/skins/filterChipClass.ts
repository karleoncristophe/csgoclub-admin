const filterChipBase =
  'rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40'

export const filterChipClass = {
  active:
    `${filterChipBase} border-brand-500 bg-brand-50/90 shadow-sm shadow-brand-500/10 ` +
    'dark:border-brand-400/50 dark:bg-brand-500/10 dark:shadow-brand-500/5 dark:ring-1 dark:ring-brand-400/20',
  inactive:
    `${filterChipBase} border-zinc-200 bg-white hover:border-brand-400 hover:bg-brand-50/40 ` +
    'dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80',
} as const
