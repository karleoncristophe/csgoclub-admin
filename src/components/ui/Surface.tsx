import { forwardRef, type ComponentPropsWithoutRef } from 'react'

const variants = {
  appRoot:
    'min-h-dvh bg-slate-50 text-zinc-900 antialiased transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100',
  page: 'min-h-dvh bg-slate-50 dark:bg-zinc-950',
  sidebarAside:
    'z-50 flex h-full w-72 shrink-0 flex-col border-r border-slate-100/90 bg-white shadow-[1px_0_0_0_rgb(15_23_42/0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none',
  sidebarStack: 'flex h-full min-h-0 flex-col bg-white dark:bg-zinc-900',
  drawerOverlay:
    'fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] dark:bg-black/45 lg:hidden',
  mobileHeader:
    'flex items-center gap-3 border-b border-slate-100/90 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 lg:hidden',
  menuIconButton:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700',
  card: 'rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 sm:p-8',
  cardInset:
    'rounded-2xl border border-zinc-100 bg-zinc-50/40 p-5 dark:border-zinc-800 dark:bg-zinc-950/50',
  metricTile:
    'rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white to-zinc-50/90 p-4 shadow-sm shadow-zinc-900/5 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950/80 dark:shadow-black/25',
  modalBackdrop:
    'absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-zinc-950/60',
  modalShell:
    'relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100',
  modalHeaderRow:
    'flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800',
  modalFooterRow:
    'flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800',
  loginShell:
    'relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-zinc-50 via-brand-50/40 to-zinc-100 px-4 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950',
  loginCard:
    'rounded-3xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-black/30 sm:p-10',
  sessionLoader:
    'flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500 dark:bg-zinc-950 dark:text-zinc-400',
  pillToggleTrack:
    'flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800',
  userAvatar:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-md shadow-brand-900/25 ring-2 ring-white/70 dark:from-brand-600 dark:to-brand-900 dark:text-white dark:shadow-black/40 dark:ring-zinc-600/90',
  errorBanner:
    'rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  ghostIconButton:
    'rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
  dateRangeTrigger:
    'flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800',
  docSection:
    'scroll-mt-24 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-900/5 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-black/30',
  docNavAside:
    'rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-black/30',
  docNavLink:
    'block rounded-2xl px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100',
  docSummaryCard:
    'rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-black/30',
  docIconWrap:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/25',
  docInset:
    'rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-700/80 dark:bg-zinc-950/60',
  docEnumBox:
    'rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-sm dark:shadow-black/25',
  docEnumDetail:
    'mt-4 space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-700/80 dark:bg-zinc-950/60',
  policyCard:
    'overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20',
  policyHeader:
    'flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/80',
  statTile:
    'rounded-xl border border-zinc-100 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60',
  insetPanelSm:
    'rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/50',
  sideDrawer:
    'flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40',
  sideDrawerHeader: 'border-b border-zinc-200 px-6 py-5 dark:border-zinc-800',
  sideDrawerFooter:
    'mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 px-6 py-5 dark:border-zinc-800',
  settingsPanel:
    'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20',
} as const

export type SurfaceVariant = keyof typeof variants

export function surfaceClass(variant: SurfaceVariant, extra?: string) {
  return [variants[variant], extra].filter(Boolean).join(' ')
}

export function pillToggleBtnClass(active: boolean) {
  return active
    ? 'rounded-md bg-white p-1.5 text-zinc-900 shadow-sm transition dark:bg-zinc-900 dark:text-zinc-100'
    : 'rounded-md p-1.5 text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
}

type SurfaceProps = {
  variant: SurfaceVariant
  className?: string
} & ComponentPropsWithoutRef<'div'>

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface({ variant, className = '', ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={surfaceClass(variant, className)}
        {...rest}
      />
    )
  },
)
