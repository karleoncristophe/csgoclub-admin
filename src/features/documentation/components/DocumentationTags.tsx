import { Chip } from '@heroui/react'
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
    <section className="mb-6">
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
              className="rounded-full"
            >
              <Chip size="sm" variant="soft" color={active ? 'accent' : 'default'}>
                {tag}
              </Chip>
            </button>
          )
        })}
      </div>
    </section>
  )
}
