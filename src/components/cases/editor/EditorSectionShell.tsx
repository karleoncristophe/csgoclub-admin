import type { ReactNode } from 'react'
import { Surface } from '@/components/ui/Surface'

type EditorSectionShellProps = {
  /** Sem card externo — para uso dentro de modal ou accordion */
  embedded?: boolean
  className?: string
  children: ReactNode
}

export function EditorSectionShell({
  embedded = false,
  className = '',
  children,
}: EditorSectionShellProps) {
  if (embedded) {
    return <div className={className}>{children}</div>
  }

  return (
    <Surface variant="card" className={`!p-6 ${className}`.trim()}>
      {children}
    </Surface>
  )
}
