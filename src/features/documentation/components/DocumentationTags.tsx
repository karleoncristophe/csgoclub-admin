import { TextBadge } from '@/components/StatusPill'
import { ThemeText } from '@/components/ui/ThemeText'
import { DOCUMENTATION_POPULAR_TAGS } from '@/features/documentation/lib/constants'

type DocumentationTagsProps = {
  selectedTag: string | null
  onTagClick: (tag: string) => void
}

export function DocumentationTags({
  selectedTag,
  onTagClick,
}: DocumentationTagsProps) {
  return (
    <section className="mb-8">
      <ThemeText as="p" tone="muted" className="mb-3 text-sm font-medium">
        Tags populares
      </ThemeText>
      <div className="flex flex-wrap gap-2">
        {DOCUMENTATION_POPULAR_TAGS.map((tag) => {
          const active = selectedTag === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                  : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/15 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600/35 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function DocumentationActiveTag({
  tag,
  onClear,
}: {
  tag: string
  onClear: () => void
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <ThemeText as="span" tone="muted" className="text-sm">
        Filtrando por tag:
      </ThemeText>
      <TextBadge>{tag}</TextBadge>
      <button
        type="button"
        onClick={onClear}
        className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        Limpar
      </button>
    </div>
  )
}
