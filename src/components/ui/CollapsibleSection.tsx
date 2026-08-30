import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { ThemeText } from '@/components/ui/ThemeText'

type CollapsibleSectionProps = {
  title: string
  description?: string
  /** Resumo exibido no cabeçalho quando fechado (valores-chave) */
  summary?: ReactNode
  defaultOpen?: boolean
  /** Abre a seção sempre que virar true (ex.: erro de validação dentro dela) */
  forceOpen?: boolean
  variant?: 'card' | 'inset'
  children: ReactNode
}

const shellClass = {
  card: 'overflow-hidden rounded-xl border border-border bg-surface shadow-sm shadow-black/5',
  inset:
    'overflow-hidden rounded-xl border border-border bg-surface-secondary',
} as const

export function CollapsibleSection({
  title,
  description,
  summary,
  defaultOpen = false,
  forceOpen = false,
  variant = 'card',
  children,
}: CollapsibleSectionProps) {
  const [userOpen, setUserOpen] = useState(defaultOpen)
  // forceOpen mantém a seção aberta enquanto houver erro dentro dela.
  const open = userOpen || forceOpen

  return (
    <div className={shellClass[variant]}>
      <button
        type="button"
        onClick={() => setUserOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-default"
      >
        <div className="min-w-0 flex-1">
          <ThemeText as="p" tone="primary" className="text-sm font-semibold">
            {title}
          </ThemeText>
          {description ? (
            <ThemeText as="p" tone="secondary" className="mt-0.5 text-xs">
              {description}
            </ThemeText>
          ) : null}
        </div>
        {summary && !open ? (
          <div className="hidden shrink-0 sm:block">{summary}</div>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-separator px-5 py-5">
          {children}
        </div>
      ) : null}
    </div>
  )
}
