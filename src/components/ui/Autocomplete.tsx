import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export type AutocompleteOption = {
  value: string
  label: string
  description?: string
}

export type AutocompleteProps = {
  label: string
  name?: string
  value: string
  options: AutocompleteOption[]
  onChange: (value: string) => void
  placeholder?: string
  maxVisible?: number
  disabled?: boolean
}

const inputClass =
  'h-11 w-full rounded-field border border-field-border bg-field py-0 pl-10 pr-10 text-sm text-field-foreground shadow-field transition-colors placeholder:text-field-placeholder focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/15 disabled:cursor-not-allowed disabled:opacity-50'

export function Autocomplete({
  label,
  name,
  value,
  options,
  onChange,
  placeholder = 'Buscar...',
  maxVisible = 10,
  disabled = false,
}: AutocompleteProps) {
  const uid = useId()
  const inputId = name ? `${name}-${uid}` : `autocomplete-${uid}`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  )

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = normalizedQuery
      ? options.filter((option) => {
          const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        })
      : options

    return filtered.slice(0, maxVisible)
  }, [options, query, maxVisible])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
    setQuery('')
  }

  const displayValue = open ? query : (selectedOption?.label ?? '')

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={displayValue}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          onFocus={() => {
            setOpen(true)
            setQuery(selectedOption?.label ?? '')
          }}
          onChange={(event) => {
            setOpen(true)
            setQuery(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              setQuery('')
            }
          }}
          className={inputClass}
        />
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />

        {open && visibleOptions.length > 0 ? (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-overlay py-1 text-overlay-foreground shadow-overlay"
          >
            {visibleOptions.map((option) => {
              const active = option.value === value
              return (
                <li key={option.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-accent-soft text-accent-soft-foreground'
                        : 'text-foreground hover:bg-default'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    {option.description ? (
                      <span
                        className={`text-xs ${
                          active
                            ? 'text-accent/80'
                            : 'text-muted'
                        }`}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}

        {open && visibleOptions.length === 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border bg-overlay px-3 py-3 text-sm text-muted shadow-overlay">
            Nenhuma opção encontrada.
          </div>
        ) : null}
      </div>
    </div>
  )
}
