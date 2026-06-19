import { Button } from '@/components/ui/Button'
import { DOCUMENTATION_CATEGORIES } from '@/features/documentation/lib/constants'
import type { DocumentationCategory } from '@/features/documentation/lib/types'

type DocumentationCategoriesProps = {
  selectedCategory: DocumentationCategory
  onCategoryClick: (category: DocumentationCategory) => void
}

export function DocumentationCategories({
  selectedCategory,
  onCategoryClick,
}: DocumentationCategoriesProps) {
  return (
    <section className="mb-8">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {DOCUMENTATION_CATEGORIES.map((category) => {
          const Icon = category.icon
          const active = selectedCategory === category.id
          return (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={active ? 'primary' : 'secondary'}
              className="shrink-0 rounded-full"
              onClick={() => onCategoryClick(category.id)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {category.label}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
