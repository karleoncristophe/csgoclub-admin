import { type ReactNode } from 'react'

type TooltipPlacement = 'top' | 'bottom'

export type TooltipProps = {
  content: ReactNode
  children: ReactNode
  placement?: TooltipPlacement
  className?: string
}

const placementClass: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  className = '',
}: TooltipProps) {
  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-20 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:bg-zinc-100 dark:text-zinc-900 ${placementClass[placement]}`}
      >
        {content}
      </span>
    </span>
  )
}
