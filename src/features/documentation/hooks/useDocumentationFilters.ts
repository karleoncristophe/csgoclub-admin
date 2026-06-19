import { useMemo, useState } from 'react'
import { DOCUMENTATION_DATA } from '@/features/documentation/lib/constants'
import type { DocumentationCategory } from '@/features/documentation/lib/types'
import { filterDocumentation } from '@/features/documentation/lib/utils'

export function useDocumentationFilters() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentationCategory>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filteredItems = useMemo(
    () =>
      filterDocumentation(
        DOCUMENTATION_DATA,
        searchQuery,
        selectedCategory,
        selectedTag,
      ),
    [searchQuery, selectedCategory, selectedTag],
  )

  const handleCategoryClick = (category: DocumentationCategory) => {
    setSelectedCategory(category)
    setSelectedTag(null)
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag)
    setSelectedCategory('all')
  }

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    selectedTag,
    filteredItems,
    handleCategoryClick,
    handleTagClick,
  }
}
