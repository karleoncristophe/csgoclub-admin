import { Chip } from '@heroui/react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { DocumentationAccordion } from '@/features/documentation/components/DocumentationAccordion'
import { DocumentationCategories } from '@/features/documentation/components/DocumentationCategories'
import {
  DocumentationFooter,
  DocumentationSummary,
} from '@/features/documentation/components/DocumentationFooter'
import { DocumentationHero } from '@/features/documentation/components/DocumentationHero'
import { DocumentationTags } from '@/features/documentation/components/DocumentationTags'
import { useDocumentationFilters } from '@/features/documentation/hooks/useDocumentationFilters'

export default function DocumentationPage() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    selectedTag,
    filteredItems,
    hasFilters,
    handleCategoryClick,
    handleTagClick,
    clearFilters,
  } = useDocumentationFilters()

  const showLanding =
    !searchQuery.trim() && selectedCategory === 'all' && !selectedTag

  return (
    <div>
      <PageTitle subtitle="Referência operacional do admin: caixas, upgrade, arena, battles, câmbio, carteiras e fluxos do dia a dia.">
        Documentação
      </PageTitle>

      <Surface variant="card">
        <DocumentationHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filteredItems.length}
        />

        {showLanding ? (
          <DocumentationSummary
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />
        ) : null}

        <DocumentationCategories
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />

        {showLanding ? (
          <DocumentationTags
            selectedTag={selectedTag}
            onTagClick={handleTagClick}
          />
        ) : null}

        {hasFilters ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {selectedTag ? (
              <Chip size="sm" variant="soft" color="accent">
                {selectedTag}
              </Chip>
            ) : null}
            <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        ) : null}

        <DocumentationAccordion
          items={filteredItems}
          searchQuery={searchQuery}
          onTagClick={handleTagClick}
        />

        <DocumentationFooter />
      </Surface>

      <ThemeText as="p" tone="faint" className="mt-6 text-xs">
        Última atualização:{' '}
        {new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}{' '}
        · Versão 1.3
      </ThemeText>
    </div>
  )
}
