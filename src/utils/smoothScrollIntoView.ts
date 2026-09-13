/**
 * Sobe até o elemento com `behavior: "smooth"`, no ancestral com overflow
 * (ex.: `main` da dashboard com overflow-y-auto). Fallback no `window`.
 * Igual ao uppass-web (`shared/lib/smooth-scroll-into-view`).
 */
export function smoothScrollIntoView(
  element: HTMLElement,
  options: { block?: 'start' | 'center' } = {},
): void {
  if (typeof window === 'undefined') return
  const block = options.block ?? 'start'
  const marginTop = parseFloat(getComputedStyle(element).scrollMarginTop) || 0

  let ancestor: HTMLElement | null = element.parentElement
  while (ancestor) {
    const { overflowY } = getComputedStyle(ancestor)
    const isTableWrap =
      ancestor.classList.contains('list-table-wrap') ||
      ancestor.hasAttribute('data-pagination-anchor')
    if (!isTableWrap && /(auto|scroll|overlay)/.test(overflowY)) {
      const aRect = ancestor.getBoundingClientRect()
      const eRect = element.getBoundingClientRect()
      const delta =
        block === 'center'
          ? eRect.top + eRect.height / 2 - (aRect.top + ancestor.clientHeight / 2)
          : eRect.top - aRect.top - marginTop
      const nextTop = ancestor.scrollTop + delta
      ancestor.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
      return
    }
    ancestor = ancestor.parentElement
  }

  const eRect = element.getBoundingClientRect()
  const top =
    block === 'center'
      ? window.scrollY + eRect.top + eRect.height / 2 - window.innerHeight / 2
      : window.scrollY + eRect.top - marginTop
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}
