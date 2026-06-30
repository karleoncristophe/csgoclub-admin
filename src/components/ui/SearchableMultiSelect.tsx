import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { ThemeText } from '@/components/ui/ThemeText'
import useDebounce from '@/hooks/useDebounce'

export type SearchableMultiSelectOption = {
  value: string
  label: string
  description?: string
}

type SearchableMultiSelectProps = {
  label: string
  placeholder?: string
  hint?: string
  options: SearchableMultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  emptyMessage?: string
}

export function SearchableMultiSelect({
  label,
  placeholder = 'Buscar para adicionar…',
  hint,
  options,
  value,
  onChange,
  disabled = false,
  emptyMessage = 'Nenhum resultado.',
}: SearchableMultiSelectProps) {
  const uid = useId()
  const listboxId = `${uid}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 200)

  const optionMap = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  )

  const selectedOptions = useMemo(
    () =>
      value
        .map((id) => optionMap.get(id))
        .filter((option): option is SearchableMultiSelectOption => Boolean(option)),
    [value, optionMap],
  )

  const availableOptions = useMemo(() => {
    const selected = new Set(value)
    return options.filter((option) => !selected.has(option.value))
  }, [options, value])

  const filteredOptions = useMemo(() => {
    if (!debouncedSearch) return availableOptions
    return availableOptions.filter((option) => {
      const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
      return haystack.includes(debouncedSearch)
    })
  }, [availableOptions, debouncedSearch])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const addOption = (optionValue: string) => {
    if (disabled || value.includes(optionValue)) return
    onChange([...value, optionValue])
    setSearch('')
    inputRef.current?.focus()
  }

  const removeOption = (optionValue: string) => {
    if (disabled) return
    onChange(value.filter((id) => id !== optionValue))
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <label
        htmlFor={`${uid}-search`}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-200/80 bg-brand-50/80 py-1 pl-3 pr-1.5 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200"
            >
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeOption(option.value)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100 disabled:opacity-40 dark:text-brand-300 dark:hover:bg-brand-500/20"
                aria-label={`Remover ${option.label}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={`${uid}-search`}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={search}
          placeholder={placeholder}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white py-0 pl-10 pr-10 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
        />
        <ChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-transform dark:text-zinc-500 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </div>

      {hint ? (
        <ThemeText as="p" tone="faint" className="text-xs">
          {hint}
        </ThemeText>
      ) : null}

      {open && !disabled ? (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable
          className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
        >
          {filteredOptions.length === 0 ? (
            <ThemeText as="p" tone="secondary" className="px-4 py-3 text-sm">
              {availableOptions.length === 0 && value.length > 0
                ? 'Todas as opções disponíveis já foram adicionadas.'
                : emptyMessage}
            </ThemeText>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => addOption(option.value)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-transparent dark:border-zinc-600 dark:bg-zinc-800">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <ThemeText as="span" tone="primary" className="block font-medium">
                        {option.label}
                      </ThemeText>
                      {option.description ? (
                        <ThemeText as="span" tone="faint" className="mt-0.5 block text-xs">
                          {option.description}
                        </ThemeText>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
