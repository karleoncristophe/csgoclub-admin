/** Cards de métrica — dark mode usa zinc/brand/amber com opacidade (brand-950 não existe no tema). */
export const userStatCardClass = {
  default:
    'rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-2.5 dark:border-zinc-700/80 dark:bg-zinc-900/60',
  brand:
    'rounded-xl border border-brand-200/80 bg-brand-50/50 px-3 py-2.5 dark:border-brand-400/35 dark:bg-brand-500/10 dark:ring-1 dark:ring-inset dark:ring-brand-400/15',
  amber:
    'rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10 dark:ring-1 dark:ring-inset dark:ring-amber-500/15',
} as const

export const userBalanceTileClass = {
  default:
    'rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-700/80 dark:bg-zinc-900/60',
  accent:
    'rounded-2xl border border-brand-200/80 bg-brand-50/50 p-4 dark:border-brand-400/35 dark:bg-brand-500/10 dark:ring-1 dark:ring-inset dark:ring-brand-400/15',
} as const

export const userHighlightBoxClass =
  'rounded-2xl border border-brand-200/80 bg-brand-50/50 p-4 dark:border-brand-400/35 dark:bg-brand-500/10 dark:ring-1 dark:ring-inset dark:ring-brand-400/15'

export const userInfluencerPanelClass =
  'border-dashed border-amber-400/50 bg-amber-50/30 dark:border-amber-500/25 dark:bg-amber-500/5'

export const userInfluencerBannerClass =
  'rounded-2xl border border-amber-300/60 bg-amber-50/50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10'
