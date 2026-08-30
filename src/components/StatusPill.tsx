import { Chip } from '@heroui/react'
import type { ReactNode } from 'react'

/** Rótulo genérico para enums e metadados. */
export function TextBadge({ children }: { children: ReactNode }) {
  return (
    <Chip size="sm" variant="soft">
      {children}
    </Chip>
  )
}

export function StatusPill({
  active,
  deleted,
}: {
  active?: boolean
  deleted?: boolean
}) {
  if (deleted) {
    return (
      <Chip size="sm" variant="soft">
        Removido
      </Chip>
    )
  }

  if (active === false) {
    return (
      <Chip size="sm" variant="soft" color="warning">
        Inativo
      </Chip>
    )
  }

  return (
    <Chip size="sm" variant="soft" color="success">
      Ativo
    </Chip>
  )
}
