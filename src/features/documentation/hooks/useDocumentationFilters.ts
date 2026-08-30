import { useEffect, useMemo, useState } from 'react'
import { DOCUMENTATION_DATA } from '@/features/documentation/lib/constants'
import type { DocumentationCategory } from '@/features/documentation/lib/types'
import { filterDocumentation } from '@/features/documentation/lib/utils'
import useDebounce from '@/hooks/useDebounce'
import { useUrlFilters } from '@/hooks/useUrlFilters'

const DOCUMENTATION_FILTER_DEFAULTS = {
  q: '',
  cat: 'all',
  tag: '',
}

export function useDocumentationFilters() {
  const { filters, setFilters } = useUrlFilters(DOCUMENTATION_FILTER_DEFAULTS)

  const [searchInput, setSearchInput] = useState(filters.q)
  useEffect(() => {
    setSearchInput(filters.q)
  }, [filters.q])

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  useEffect(() => {
    if (debouncedSearch === filters.q) return
    setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  const selectedCategory = (filters.cat || 'all') as DocumentationCategory
  const selectedTag = filters.tag || null

  const filteredItems = useMemo(
    () =>
      filterDocumentation(
        DOCUMENTATION_DATA,
        searchInput,
        selectedCategory,
        selectedTag,
      ),
    [searchInput, selectedCategory, selectedTag],
  )

  const handleCategoryClick = (category: DocumentationCategory) => {
    setFilters({ cat: category, tag: '' })
  }

  const handleTagClick = (tag: string) => {
    setFilters({
      tag: tag === filters.tag ? '' : tag,
      cat: 'all',
    })
  }

  const hasFilters = Boolean(
    searchInput.trim() || selectedCategory !== 'all' || selectedTag,
  )

  const clearFilters = () => {
    setSearchInput('')
    setFilters({ q: '', cat: 'all', tag: '' })
  }

  return {
    searchQuery: searchInput,
    setSearchQuery: setSearchInput,
    selectedCategory,
    selectedTag,
    filteredItems,
    hasFilters,
    handleCategoryClick,
    handleTagClick,
    clearFilters,
  }
}
