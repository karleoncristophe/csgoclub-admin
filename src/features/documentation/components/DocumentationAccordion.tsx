import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Chip } from '@heroui/react'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { renderHighlightedText } from '@/features/documentation/lib/highlightSearchText'
import type { DocumentationItem } from '@/features/documentation/lib/types'
import { groupDocumentationByCategory } from '@/features/documentation/lib/utils'

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
    <Surface variant="docEnumBox" className="overflow-hidden !p-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-accent-soft/35"
      >
        <ThemeText as="span" tone="primary" className="font-medium leading-6">
          <Highlight text={item.question} query={searchQuery} />
        </ThemeText>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId} className="border-t border-separator px-4 py-4">
          <div className="space-y-3 text-sm leading-7 text-foreground/80">
            {item.answer.split('\n\n').map((paragraph, index) => (
              <p key={`${item.id}-p-${index}`}>
                <Highlight text={paragraph} query={searchQuery} />
              </p>
            ))}
          </div>

          {item.bullets?.length ? (
            <Surface variant="docInset" className="mt-4 !p-4">
              <ThemeText
                as="p"
                tone="muted"
                className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Pontos principais
              </ThemeText>
              <ul className="space-y-2 text-sm text-foreground/80">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>
                      <Highlight text={bullet} query={searchQuery} />
                    </span>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {item.fields?.length ? (
            <div className="mt-4 space-y-3">
              <ThemeText
                as="p"
                tone="muted"
                className="text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Campos do sistema
              </ThemeText>
              {item.fields.map((field) => (
                <Surface variant="docInset" key={field.name} className="!p-4">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <code className="rounded-md bg-default px-2 py-0.5 font-mono text-xs">
                      <Highlight text={field.name} query={searchQuery} />
                    </code>
                    <ThemeText as="span" tone="primary" className="text-sm font-semibold">
                      <Highlight text={field.label} query={searchQuery} />
                    </ThemeText>
                  </div>
                  <ThemeText as="p" tone="secondary" className="mt-2 text-sm leading-6">
                    <Highlight text={field.description} query={searchQuery} />
                  </ThemeText>
                </Surface>
              ))}
            </div>
          ) : null}

          {item.enumGroups?.length ? (
            <div className="mt-4 space-y-3">
              {item.enumGroups.map((group) => (
                <Surface variant="docInset" key={group.title} className="!p-4">
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
                        className="text-sm text-foreground/80"
                      >
                        <code className="rounded-md bg-default px-2 py-0.5 font-mono text-xs">
                          <Highlight text={entry.code} query={searchQuery} />
                        </code>
                        <span className="mx-2 text-muted">→</span>
                        <span className="font-medium text-foreground">
                          <Highlight text={entry.label} query={searchQuery} />
                        </span>
                        {entry.hint ? (
                          <span className="text-muted">
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
                    <Chip size="sm" variant="soft">
                      <Highlight text={tag} query={searchQuery} />
                    </Chip>
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

function TopicList({
  items,
  openIds,
  onToggle,
  onTagClick,
  searchQuery,
}: {
  items: DocumentationItem[]
  openIds: Set<string>
  onToggle: (id: string) => void
  onTagClick: (tag: string) => void
  searchQuery: string
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          open={openIds.has(item.id)}
          onToggle={() => onToggle(item.id)}
          onTagClick={onTagClick}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  )
}

export function DocumentationAccordion({
  items,
  searchQuery,
  onTagClick,
}: DocumentationAccordionProps) {
  const trimmedQuery = searchQuery.trim()
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const groups = useMemo(() => groupDocumentationByCategory(items), [items])
  const grouped = groups.length > 0

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
        <ThemeText as="p" tone="muted" className="mb-4 text-sm">
          {items.length} resultado{items.length === 1 ? '' : 's'} para{' '}
          <mark className="rounded-sm bg-yellow-300 px-1 text-zinc-900">
            {trimmedQuery}
          </mark>
        </ThemeText>
      ) : null}

      {items.length === 0 ? (
        <Surface variant="docSection" className="py-12 text-center">
          <HelpCircle className="mx-auto mb-4 h-10 w-10 text-muted" />
          <ThemeText as="p" tone="primary" className="text-lg font-medium">
            Nenhum tópico encontrado
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
            Tente outra palavra-chave ou limpe os filtros ativos.
          </ThemeText>
        </Surface>
      ) : grouped ? (
        <div className="space-y-8">
          {groups.map((group) => {
            const Icon = group.icon
            return (
              <section key={group.id}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" aria-hidden />
                  <SectionTitle className="text-base">{group.label}</SectionTitle>
                  <ThemeText as="span" tone="muted" className="text-sm">
                    {group.items.length}
                  </ThemeText>
                </div>
                <TopicList
                  items={group.items}
                  openIds={openIds}
                  onToggle={toggle}
                  onTagClick={onTagClick}
                  searchQuery={searchQuery}
                />
              </section>
            )
          })}
        </div>
      ) : (
        <TopicList
          items={items}
          openIds={openIds}
          onToggle={toggle}
          onTagClick={onTagClick}
          searchQuery={searchQuery}
        />
      )}
    </section>
  )
}
