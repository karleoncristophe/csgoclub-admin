import { DocumentationAccordion } from '@/features/documentation/components/DocumentationAccordion'
import { DocumentationCategories } from '@/features/documentation/components/DocumentationCategories'
import {
  DocumentationFooter,
  DocumentationSummary,
} from '@/features/documentation/components/DocumentationFooter'
import { DocumentationHero } from '@/features/documentation/components/DocumentationHero'
import {
  DocumentationActiveTag,
  DocumentationTags,
} from '@/features/documentation/components/DocumentationTags'
import { useDocumentationFilters } from '@/features/documentation/hooks/useDocumentationFilters'
import { ThemeText } from '@/components/ui/ThemeText'

export default function DocumentationPage() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    selectedTag,
    filteredItems,
    handleCategoryClick,
    handleTagClick,
  } = useDocumentationFilters()

  const showTags = !searchQuery && selectedCategory === 'all'

  return (
    <div className="mx-auto max-w-5xl">
      <DocumentationHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {showTags ? <DocumentationSummary /> : null}

      {showTags ? (
        <DocumentationTags
          selectedTag={selectedTag}
          onTagClick={handleTagClick}
        />
      ) : null}

      {selectedTag ? (
        <DocumentationActiveTag
          tag={selectedTag}
          onClear={() => handleTagClick(selectedTag)}
        />
      ) : null}

      <DocumentationCategories
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
      />

      <DocumentationAccordion
        items={filteredItems}
        searchQuery={searchQuery}
        onTagClick={handleTagClick}
      />

      <DocumentationFooter />

      <ThemeText
        as="p"
        tone="faint"
        className="mt-8 text-center text-xs"
      >
        Última atualização:{' '}
        {new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}{' '}
        · Versão 1.0
      </ThemeText>
    </div>
  )
}
