import type { DocumentationCategory, DocumentationItem } from './types'

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function matchesQuery(query: string, text: string): boolean {
  const normalizedQuery = normalizeText(query)
  const normalizedText = normalizeText(text)
  if (!normalizedQuery) return true
  if (normalizedText.includes(normalizedQuery)) return true
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length >= 3)
  return words.some((word) => normalizedText.includes(word))
}

export function filterDocumentation(
  items: DocumentationItem[],
  searchQuery: string,
  selectedCategory: DocumentationCategory,
  selectedTag: string | null,
): DocumentationItem[] {
  let filtered = items

  if (selectedCategory !== 'all') {
    filtered = filtered.filter((item) => item.category === selectedCategory)
  }

  if (selectedTag) {
    filtered = filtered.filter((item) =>
      item.tags?.some((tag) => tag === selectedTag),
    )
  }

  const trimmedQuery = searchQuery.trim()
  if (!trimmedQuery) return filtered

  return filtered.filter((item) => {
    const searchable = [
      item.question,
      item.answer,
      ...(item.bullets ?? []),
      ...(item.tags ?? []),
      ...(item.fields?.flatMap((field) => [
        field.name,
        field.label,
        field.description,
      ]) ?? []),
      ...(item.enumGroups?.flatMap((group) => [
        group.title,
        group.description ?? '',
        ...group.entries.flatMap((entry) => [
          entry.code,
          entry.label,
          entry.hint ?? '',
        ]),
      ]) ?? []),
    ]

    return searchable.some((text) => matchesQuery(trimmedQuery, text))
  })
}
