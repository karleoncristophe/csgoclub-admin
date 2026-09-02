import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

export type SortDirection = 'asc' | 'desc'

export type TableSort<K extends string> = {
  key: K
  direction: SortDirection
} | null

/** Primeiro clique: maior → menor. Depois menor → maior. Terceiro: ordem original. */
export function useTableSort<K extends string>() {
  const [sort, setSort] = useState<TableSort<K>>(null)

  const toggle = (key: K) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'desc' }
      if (current.direction === 'desc') return { key, direction: 'asc' }
      return null
    })
  }

  return { sort, toggle }
}

export function sortByNumericColumn<T, K extends string>(
  rows: T[],
  sort: TableSort<K>,
  getValue: (row: T, key: K) => number,
): T[] {
  if (!sort) return rows
  const factor = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const diff = getValue(a, sort.key) - getValue(b, sort.key)
    return diff === 0 ? 0 : diff * factor
  })
}

type SortableThProps<K extends string> = {
  label: string
  sortKey: K
  sort: TableSort<K>
  onSort: (key: K) => void
  fieldHelp?: FieldHelp
  className?: string
  labelClassName?: string
}

export function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  fieldHelp,
  className = 'px-3 py-2',
  labelClassName = 'text-xs uppercase tracking-wide',
}: SortableThProps<K>) {
  const active = sort?.key === sortKey
  const direction = active ? sort.direction : null
  const nextHint =
    direction == null
      ? 'maior para o menor'
      : direction === 'desc'
        ? 'menor para o maior'
        : 'ordem original'

  return (
    <th
      className={className}
      aria-sort={
        !active ? 'none' : direction === 'asc' ? 'ascending' : 'descending'
      }
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={`inline-flex items-center gap-1 ${labelClassName} text-muted transition-colors hover:text-foreground`}
          aria-label={`Ordenar ${label}: ${nextHint}`}
        >
          <span>{label}</span>
          <SortGlyph direction={direction} />
        </button>
        {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
      </div>
    </th>
  )
}

function SortGlyph({ direction }: { direction: SortDirection | null }) {
  if (direction === 'asc') {
    return <ChevronUp className="h-3.5 w-3.5 text-foreground" aria-hidden />
  }
  if (direction === 'desc') {
    return <ChevronDown className="h-3.5 w-3.5 text-foreground" aria-hidden />
  }
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
}
