/** Cards de métrica — dark mode usa zinc/brand/amber com opacidade (brand-950 não existe no tema). */
export const userStatCardClass = {
  default:
    'rounded-xl border border-border bg-surface-secondary px-3 py-2.5',
  brand:
    'rounded-xl border border-accent/20 bg-accent-soft px-3 py-2.5',
  amber:
    'rounded-xl border border-warning/20 bg-warning-soft px-3 py-2.5',
} as const

/** Variante com mais respiro — painéis de inventário / resumo expandido. */
export const userStatCardSpaciousClass = {
  default:
    'rounded-xl border border-border bg-surface-secondary p-3',
  brand:
    'rounded-xl border border-accent/20 bg-accent-soft p-3',
  amber:
    'rounded-xl border border-warning/20 bg-warning-soft p-3',
  rose:
    'rounded-xl border border-danger/20 bg-danger-soft p-3',
} as const

export const userBalanceTileClass = {
  default:
    'rounded-xl border border-separator bg-surface-secondary px-3 py-2.5',
} as const

export const userHighlightBoxClass =
  'rounded-xl border border-accent/20 bg-accent-soft p-3'

export const userInfluencerPanelClass =
  'border-dashed border-warning/30 bg-warning-soft/50'

export const userInfluencerBannerClass =
  'rounded-xl border border-warning/25 bg-warning-soft px-3 py-2.5'

/**
 * Chips de filtro — NÃO usar brand-950/amber-950 (não existem no tema).
 * No dark: fundo escuro + texto claro com contraste legível.
 */
export const filterChipClass = {
  base: 'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
  idle:
    'border-border bg-surface text-muted hover:bg-default hover:text-foreground',
  brandActive:
    'border-accent/30 bg-accent-soft text-accent-soft-foreground',
  amberActive:
    'border-warning/30 bg-warning-soft text-warning',
} as const

export function filterChipClasses(
  active: boolean,
  tone: 'brand' | 'amber' = 'brand',
) {
  const activeClass =
    tone === 'amber' ? filterChipClass.amberActive : filterChipClass.brandActive
  return `${filterChipClass.base} ${active ? activeClass : filterChipClass.idle}`
}
