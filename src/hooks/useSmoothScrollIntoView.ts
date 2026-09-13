import { useCallback } from 'react'
import { smoothScrollIntoView } from '@/utils/smoothScrollIntoView'

const ANCHOR_SELECTOR = '.list-table-wrap, [data-pagination-anchor]'

function resolveScrollTarget(
  root: HTMLElement | null,
  explicit: HTMLElement | null | undefined,
): HTMLElement | null {
  if (explicit) return explicit
  if (!root) return null

  let node: HTMLElement | null = root
  for (let depth = 0; depth < 8 && node; depth += 1) {
    const parent: HTMLElement | null = node.parentElement
    if (!parent) break
    const wraps = parent.querySelectorAll(ANCHOR_SELECTOR) as NodeListOf<HTMLElement>
    for (const wrap of wraps) {
      if (!root.contains(wrap)) return wrap
    }
    node = parent
  }

  let sibling = root.previousElementSibling
  while (sibling) {
    if (sibling instanceof HTMLElement) {
      if (
        sibling.classList.contains('list-table-wrap') ||
        sibling.hasAttribute('data-pagination-anchor')
      ) {
        return sibling
      }
      const nested = sibling.querySelector(ANCHOR_SELECTOR) as HTMLElement | null
      if (nested) return nested
    }
    sibling = sibling.previousElementSibling
  }

  return root.parentElement
}

export function useSmoothScrollIntoView() {
  return useCallback((root: HTMLElement | null, explicit?: HTMLElement | null) => {
    const pageScroller = root?.closest('[data-page-scroll-container]') as HTMLElement | null
    if (pageScroller) {
      pageScroller.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const target = resolveScrollTarget(root, explicit)
    if (target) smoothScrollIntoView(target, { block: 'start' })
  }, [])
}
