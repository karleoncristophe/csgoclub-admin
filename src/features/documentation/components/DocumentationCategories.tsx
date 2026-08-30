import { Tabs } from '@/components/ui/Tabs'
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
    <Tabs
      tabs={DOCUMENTATION_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
      }))}
      activeId={selectedCategory}
      onChange={(id) => onCategoryClick(id as DocumentationCategory)}
      className="mb-6"
      ariaLabel="Categorias da documentação"
    />
  )
}
