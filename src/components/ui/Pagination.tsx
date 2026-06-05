import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RefObject } from 'react'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  /** Rola até o topo da lista ao mudar de página */
  scrollTargetRef?: RefObject<HTMLElement | null>
}

const controlBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:pointer-events-none disabled:opacity-40'

const controlNav =
  `${controlBase} border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`

const pageIdle =
  `${controlBase} border-transparent bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`

const pageActive =
  `${controlBase} border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 dark:border-brand-500 dark:bg-brand-500 dark:hover:bg-brand-600`

function buildPageItems(
  page: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | 'ellipsis'> = []
  const siblings = 1
  const start = Math.max(2, page - siblings)
  const end = Math.min(totalPages - 1, page + siblings)

  items.push(1)
  if (start > 2) items.push('ellipsis')

  for (let current = start; current <= end; current += 1) {
    items.push(current)
  }

  if (end < totalPages - 1) items.push('ellipsis')
  items.push(totalPages)

  return items
}

function scrollToTarget(ref?: RefObject<HTMLElement | null>) {
  ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
  scrollTargetRef,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pageItems = buildPageItems(page, totalPages)

  const handlePageChange = (next: number) => {
    onPageChange(next)
    scrollToTarget(scrollTargetRef)
  }

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-1 sm:justify-end ${className}`}
      aria-label="Paginação"
    >
      <button
        type="button"
        className={controlNav}
        disabled={page <= 1}
        onClick={() => handlePageChange(page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>

      <div className="flex flex-wrap items-center gap-1 px-0.5">
        {pageItems.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === page ? pageActive : pageIdle}
              onClick={() => handlePageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Página ${item}`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className={controlNav}
        disabled={page >= totalPages}
        onClick={() => handlePageChange(page + 1)}
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </nav>
  )
}
