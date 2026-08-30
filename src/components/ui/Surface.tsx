import { Card as HeroCard } from '@heroui/react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'

const variants = {
  appRoot:
    'min-h-dvh bg-background font-sans text-foreground antialiased transition-colors duration-200',
  page: 'h-dvh overflow-hidden bg-background',
  sidebarAside:
    'z-50 flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface lg:z-auto',
  sidebarStack: 'flex h-full min-h-0 flex-col bg-surface',
  drawerOverlay:
    'fixed inset-0 z-40 bg-foreground/35 backdrop-blur-[2px] lg:hidden',
  mobileHeader:
    'sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-sm lg:hidden',
  menuIconButton:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-sm transition hover:bg-default active:scale-[0.98]',
  card: 'items-stretch rounded-xl border border-border bg-surface p-5 text-left shadow-sm shadow-black/5 sm:p-6',
  cardInset:
    'rounded-xl border border-border bg-surface-secondary p-4',
  metricTile:
    'items-stretch rounded-xl border border-border bg-surface p-4 text-left shadow-sm shadow-black/5',
  chartPanel:
    'overflow-hidden rounded-3xl border border-border bg-linear-to-br from-surface via-surface to-accent-soft p-4 text-left shadow-sm shadow-black/5',
  modalBackdrop:
    'absolute inset-0 bg-backdrop backdrop-blur-sm',
  sideDrawerOverlay:
    'absolute inset-0 bg-backdrop backdrop-blur-md',
  modalShell:
    'relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-overlay text-overlay-foreground shadow-overlay',
  modalHeaderRow:
    'flex items-start justify-between gap-4 border-b border-separator px-5 py-4',
  modalFooterRow:
    'flex items-center justify-between gap-3 border-t border-separator px-5 py-4',
  loginShell:
    'relative min-h-dvh overflow-hidden bg-background text-foreground',
  loginCard:
    'w-full max-w-[440px] border-0 bg-transparent p-0 shadow-none',
  sessionLoader:
    'flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-muted',
  pillToggleTrack:
    'flex items-center gap-0.5 rounded-lg bg-default p-0.5',
  userAvatar:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-md shadow-brand-900/25 ring-2 ring-white/70 dark:from-brand-600 dark:to-brand-900 dark:text-white dark:shadow-black/40 dark:ring-zinc-600/90',
  errorBanner:
    'rounded-xl border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger',
  ghostIconButton:
    'rounded-lg p-1.5 text-muted transition-colors hover:bg-default hover:text-foreground',
  dateRangeTrigger:
    'flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-field px-4 py-3 text-left shadow-field transition hover:border-field-border-hover hover:bg-field-hover',
  docSection:
    'scroll-mt-24 rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/5',
  docNavAside:
    'rounded-xl border border-border bg-surface p-5 shadow-sm shadow-black/5',
  docNavLink:
    'block rounded-2xl px-3 py-2 text-sm text-muted transition hover:bg-default hover:text-foreground',
  docSummaryCard:
    'rounded-xl border border-border bg-surface p-5 shadow-sm shadow-black/5',
  docIconWrap:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent ring-1 ring-accent/15 dark:bg-accent dark:text-accent-foreground dark:ring-accent/40',
  docInset:
    'rounded-2xl border border-border bg-surface-secondary p-5',
  docEnumBox:
    'rounded-2xl border border-border bg-surface p-4',
  docEnumDetail:
    'mt-4 space-y-2 rounded-2xl border border-border bg-surface-secondary p-4',
  policyCard:
    'overflow-hidden rounded-xl border border-border bg-surface shadow-sm shadow-black/5',
  policyHeader:
    'flex flex-wrap items-center justify-between gap-3 border-b border-separator bg-surface-secondary px-5 py-4',
  statTile:
    'rounded-lg border border-border bg-surface-secondary px-4 py-3',
  insetPanelSm:
    'rounded-xl border border-border bg-surface-secondary p-4',
  sideDrawer:
    'flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-border bg-overlay shadow-overlay',
  sideDrawerHeader: 'border-b border-separator px-4 py-4',
  sideDrawerFooter:
    'mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-separator px-4 py-4',
  settingsPanel:
    'rounded-xl border border-border bg-surface p-4 shadow-sm shadow-black/5',
} as const

export type SurfaceVariant = keyof typeof variants

export function surfaceClass(variant: SurfaceVariant, extra?: string) {
  return [variants[variant], extra].filter(Boolean).join(' ')
}

export function pillToggleBtnClass(active: boolean) {
  return active
    ? 'rounded-md bg-surface p-1.5 text-foreground shadow-sm transition'
    : 'rounded-md p-1.5 text-muted transition hover:text-foreground'
}

type SurfaceProps = {
  variant: SurfaceVariant
  className?: string
} & ComponentPropsWithoutRef<'div'>

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface({ variant, className = '', children, ...rest }, ref) {
    const cardVariant = {
      card: 'default',
      chartPanel: 'default',
      metricTile: 'default',
      docSection: 'default',
      docNavAside: 'default',
      docSummaryCard: 'default',
      policyCard: 'default',
      statTile: 'secondary',
      settingsPanel: 'default',
    } as const
    const heroVariant = cardVariant[variant as keyof typeof cardVariant]

    if (heroVariant) {
      return (
        <HeroCard
          ref={ref}
          variant={heroVariant}
          className={surfaceClass(variant, className)}
          {...rest}
        >
          {children}
        </HeroCard>
      )
    }

    return (
      <div
        ref={ref}
        className={surfaceClass(variant, className)}
        {...rest}
      >
        {children}
      </div>
    )
  },
)
