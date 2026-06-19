import { useEffect, useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { TextBadge } from '@/components/StatusPill'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { renderHighlightedText } from '@/features/documentation/lib/highlightSearchText'
import type { DocumentationItem } from '@/features/documentation/lib/types'

type DocumentationAccordionProps = {
  items: DocumentationItem[]
  searchQuery: string
  onTagClick: (tag: string) => void
}

function Highlight({
  text,
  query,
}: {
  text: string
  query: string
}) {
  return <>{renderHighlightedText(text, query)}</>
}

function AccordionItem({
  item,
  open,
  onToggle,
  onTagClick,
  searchQuery,
}: {
  item: DocumentationItem
  open: boolean
  onToggle: () => void
  onTagClick: (tag: string) => void
  searchQuery: string
}) {
  const panelId = `doc-panel-${item.id}`

  return (
    <Surface
      variant="docEnumBox"
      className={`overflow-hidden transition-shadow ${open ? 'ring-2 ring-brand-500/20' : ''}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <ThemeText as="span" tone="primary" className="font-medium leading-6">
          <Highlight text={item.question} query={searchQuery} />
        </ThemeText>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-zinc-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="space-y-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {item.answer.split('\n\n').map((paragraph, index) => (
              <p key={`${item.id}-p-${index}`}>
                <Highlight text={paragraph} query={searchQuery} />
              </p>
            ))}
          </div>

          {item.bullets?.length ? (
            <Surface variant="docInset" className="mt-5">
              <ThemeText
                as="p"
                tone="muted"
                className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Em resumo
              </ThemeText>
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600 dark:bg-brand-500" />
                    <span>
                      <Highlight text={bullet} query={searchQuery} />
                    </span>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {item.fields?.length ? (
            <div className="mt-5 space-y-3">
              <ThemeText
                as="p"
                tone="muted"
                className="text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Campos do sistema
              </ThemeText>
              {item.fields.map((field) => (
                <Surface variant="docInset" key={field.name}>
                  <ThemeText as="span" tone="primary" className="text-sm font-semibold">
                    <Highlight text={field.label} query={searchQuery} />
                  </ThemeText>
                  <ThemeText as="p" tone="secondary" className="mt-2 text-sm leading-6">
                    <Highlight text={field.description} query={searchQuery} />
                  </ThemeText>
                </Surface>
              ))}
            </div>
          ) : null}

          {item.enumGroups?.length ? (
            <div className="mt-5 space-y-4">
              {item.enumGroups.map((group) => (
                <Surface variant="docInset" key={group.title}>
                  <ThemeText
                    as="p"
                    tone="muted"
                    className="text-xs font-semibold uppercase tracking-[0.14em]"
                  >
                    <Highlight text={group.title} query={searchQuery} />
                  </ThemeText>
                  {group.description ? (
                    <ThemeText as="p" tone="secondary" className="mt-2 text-sm leading-6">
                      <Highlight text={group.description} query={searchQuery} />
                    </ThemeText>
                  ) : null}
                  <ul className="mt-3 space-y-2">
                    {group.entries.map((entry) => (
                      <li
                        key={`${group.title}-${entry.code}`}
                        className="text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          <Highlight text={entry.label} query={searchQuery} />
                        </span>
                        {entry.hint ? (
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {' '}
                            — <Highlight text={entry.hint} query={searchQuery} />
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Surface>
              ))}
            </div>
          ) : null}

          {item.tags?.length ? (
            <div className="mt-4">
              <ThemeText
                as="p"
                tone="muted"
                className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Relacionado
              </ThemeText>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => onTagClick(tag)}>
                    <TextBadge>
                      <Highlight text={tag} query={searchQuery} />
                    </TextBadge>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Surface>
  )
}

export function DocumentationAccordion({
  items,
  searchQuery,
  onTagClick,
}: DocumentationAccordionProps) {
  const trimmedQuery = searchQuery.trim()
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!trimmedQuery) {
      setOpenIds(new Set())
      return
    }
    setOpenIds(new Set(items.map((item) => item.id)))
  }, [items, trimmedQuery])

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section>
      {trimmedQuery ? (
        <ThemeText as="p" tone="muted" className="mb-6 text-sm">
          {items.length} resultado(s) para{' '}
          <mark className="rounded-sm bg-yellow-300 px-1 text-zinc-900 dark:bg-yellow-300 dark:text-zinc-900">
            {trimmedQuery}
          </mark>
        </ThemeText>
      ) : null}

      {items.length === 0 ? (
        <Surface variant="docSection" className="py-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <ThemeText as="p" tone="primary" className="text-lg font-medium">
            Nenhum tópico encontrado
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
            Tente outra palavra-chave ou limpe os filtros ativos.
          </ThemeText>
        </Surface>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              open={openIds.has(item.id)}
              onToggle={() => toggle(item.id)}
              onTagClick={onTagClick}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </section>
  )
}
