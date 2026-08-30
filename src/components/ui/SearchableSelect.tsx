import { useEffect, useId, useMemo, useState } from 'react'
import { Check, ChevronDown, Search, UserRound, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ThemeText } from '@/components/ui/ThemeText'
import useDebounce from '@/hooks/useDebounce'

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
  imageUrl?: string
}

type SearchableSelectProps = {
  label: string
  placeholder?: string
  searchPlaceholder?: string
  hint?: string
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  emptyMessage?: string
  modalTitle?: string
  modalDescription?: string
  clearable?: boolean
  /** Quando true, a busca é só UI — o pai filtra via onSearchChange (server). */
  serverSearch?: boolean
  onSearchChange?: (search: string) => void
  loading?: boolean
  totalCount?: number
  /** Mantém o selecionado visível mesmo se sumir da página atual. */
  selectedOption?: SearchableSelectOption | null
  resultNoun?: string
}

function OptionAvatar({
  option,
  size = 'md',
}: {
  option: Pick<SearchableSelectOption, 'label' | 'imageUrl'>
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-xs'
  const initial = option.label?.trim()?.[0]?.toUpperCase() ?? '?'

  if (option.imageUrl) {
    return (
      <img
        src={option.imageUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full bg-default object-cover`}
        loading="lazy"
      />
    )
  }

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-default font-semibold text-muted`}
      aria-hidden
    >
      {initial || <UserRound className="h-4 w-4" />}
    </span>
  )
}

export function SearchableSelect({
  label,
  placeholder = 'Selecionar…',
  searchPlaceholder = 'Filtrar por nome…',
  hint,
  options,
  value,
  onChange,
  disabled = false,
  emptyMessage = 'Nenhum resultado.',
  modalTitle = 'Selecionar',
  modalDescription,
  clearable = true,
  serverSearch = false,
  onSearchChange,
  loading = false,
  totalCount,
  selectedOption = null,
  resultNoun = 'resultado',
}: SearchableSelectProps) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 250)

  const selected = useMemo(() => {
    if (selectedOption && selectedOption.value === value) return selectedOption
    return options.find((option) => option.value === value) ?? null
  }, [options, value, selectedOption])

  const filtered = useMemo(() => {
    if (serverSearch) return options
    const query = debouncedSearch.toLowerCase()
    if (!query) return options
    return options.filter((option) => {
      const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [options, debouncedSearch, serverSearch])

  useEffect(() => {
    if (!open || !serverSearch) return
    onSearchChange?.(debouncedSearch)
  }, [debouncedSearch, open, serverSearch, onSearchChange])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearch('')
      onSearchChange?.('')
    }
  }

  const pick = (next: string) => {
    onChange(next)
    handleOpenChange(false)
  }

  const shownCount = filtered.length
  const total = totalCount ?? options.length
  const noun = total === 1 ? resultNoun : `${resultNoun}s`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`${uid}-trigger`}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>

      <div className="relative">
        <button
          id={`${uid}-trigger`}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex h-10 w-full items-center gap-2.5 rounded-field border border-field-border bg-field px-3 text-left text-sm text-field-foreground shadow-field transition-colors hover:bg-field-hover focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selected ? <OptionAvatar option={selected} size="sm" /> : null}
          <span className="min-w-0 flex-1 truncate">
            {selected ? (
              <span className="font-medium">{selected.label}</span>
            ) : (
              <span className="text-field-placeholder">{placeholder}</span>
            )}
          </span>
          {selected?.description ? (
            <span className="max-w-[45%] truncate text-xs text-muted">
              {selected.description}
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        </button>

        {clearable && selected && !disabled ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onChange('')
            }}
            className="absolute right-9 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-default hover:text-foreground"
            aria-label="Limpar seleção"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {hint ? (
        <ThemeText as="p" tone="faint" className="text-xs">
          {hint}
        </ThemeText>
      ) : null}

      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title={modalTitle}
        description={modalDescription}
        size="md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-field border border-field-border bg-field py-0 pl-10 pr-3 text-sm text-field-foreground shadow-field placeholder:text-field-placeholder focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/15"
            />
          </div>

          <ThemeText as="p" tone="faint" className="text-xs">
            {loading
              ? 'Carregando…'
              : `${shownCount} de ${total} ${noun}${debouncedSearch ? ` · filtro “${debouncedSearch}”` : ''}`}
          </ThemeText>

          <div className="max-h-[min(50vh,360px)] overflow-y-auto rounded-xl border border-border">
            {loading && filtered.length === 0 ? (
              <ThemeText as="p" tone="secondary" className="px-4 py-6 text-center text-sm">
                Carregando…
              </ThemeText>
            ) : filtered.length === 0 ? (
              <ThemeText as="p" tone="secondary" className="px-4 py-6 text-center text-sm">
                {emptyMessage}
              </ThemeText>
            ) : (
              <ul className="divide-y divide-separator">
                {filtered.map((option) => {
                  const isSelected = option.value === value
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => pick(option.value)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? 'bg-accent-soft'
                            : 'hover:bg-default'
                        }`}
                      >
                        <OptionAvatar option={option} />
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
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            isSelected
                              ? 'border-accent bg-accent text-accent-foreground'
                              : 'border-border bg-default text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
