const filterChipBase =
  'rounded-lg border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40'

export const filterChipClass = {
  active:
    `${filterChipBase} border-accent/30 bg-accent-soft text-accent shadow-sm`,
  inactive:
    `${filterChipBase} border-border bg-surface text-muted hover:bg-default hover:text-foreground`,
} as const
