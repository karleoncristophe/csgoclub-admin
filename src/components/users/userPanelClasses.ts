/** Cards de métrica — dark mode usa zinc/brand/amber com opacidade (brand-950 não existe no tema). */
export const userStatCardClass = {
  default:
    'rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-2.5 dark:border-zinc-700/80 dark:bg-zinc-900/60',
  brand:
    'rounded-xl border border-brand-200/80 bg-brand-50/50 px-3 py-2.5 dark:border-brand-400/35 dark:bg-brand-500/10 dark:ring-1 dark:ring-inset dark:ring-brand-400/15',
  amber:
    'rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10 dark:ring-1 dark:ring-inset dark:ring-amber-500/15',
} as const

/** Variante com mais respiro — painéis de inventário / resumo expandido. */
export const userStatCardSpaciousClass = {
  default:
    'rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-700/80 dark:bg-zinc-900/60',
  brand:
    'rounded-2xl border border-brand-200/80 bg-brand-50/50 p-4 dark:border-brand-400/35 dark:bg-brand-500/10 dark:ring-1 dark:ring-inset dark:ring-brand-400/15',
  amber:
    'rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 dark:ring-1 dark:ring-inset dark:ring-amber-500/15',
  rose:
    'rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-500/30 dark:bg-rose-500/10 dark:ring-1 dark:ring-inset dark:ring-rose-500/15',
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

/**
 * Chips de filtro — NÃO usar brand-950/amber-950 (não existem no tema).
 * No dark: fundo escuro + texto claro com contraste legível.
 */
export const filterChipClass = {
  base: 'rounded-full border px-3 py-1.5 text-xs font-medium transition',
  idle:
    'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60',
  brandActive:
    'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400/50 dark:bg-brand-500/20 dark:text-brand-100',
  amberActive:
    'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-100',
} as const

export function filterChipClasses(
  active: boolean,
  tone: 'brand' | 'amber' = 'brand',
) {
  const activeClass =
    tone === 'amber' ? filterChipClass.amberActive : filterChipClass.brandActive
  return `${filterChipClass.base} ${active ? activeClass : filterChipClass.idle}`
}
