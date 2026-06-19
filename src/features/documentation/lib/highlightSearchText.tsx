import { Fragment, type ReactNode } from 'react'

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function buildNormalizedIndexMap(text: string) {
  const normalizedChars: string[] = []
  const originalIndices: number[] = []

  for (let index = 0; index < text.length; index += 1) {
    const normalizedChar = normalizeText(text[index] ?? '')
    for (const char of normalizedChar) {
      normalizedChars.push(char)
      originalIndices.push(index)
    }
  }

  return {
    normalized: normalizedChars.join(''),
    originalIndices,
  }
}

function findHighlightRanges(text: string, query: string): Array<[number, number]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const { normalized, originalIndices } = buildNormalizedIndexMap(text)
  const normalizedQuery = normalizeText(trimmedQuery)
  if (!normalizedQuery) return []

  const ranges: Array<[number, number]> = []
  let searchFrom = 0

  while (searchFrom <= normalized.length - normalizedQuery.length) {
    const matchIndex = normalized.indexOf(normalizedQuery, searchFrom)
    if (matchIndex === -1) break

    const normalizedEnd = matchIndex + normalizedQuery.length - 1
    const originalStart = originalIndices[matchIndex] ?? 0
    const originalEnd = (originalIndices[normalizedEnd] ?? originalStart) + 1

    const previous = ranges[ranges.length - 1]
    if (previous && originalStart <= previous[1]) {
      previous[1] = Math.max(previous[1], originalEnd)
    } else {
      ranges.push([originalStart, originalEnd])
    }

    searchFrom = matchIndex + 1
  }

  return ranges
}

export function renderHighlightedText(text: string, query: string): ReactNode {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return text

  const ranges = findHighlightRanges(text, trimmedQuery)
  if (ranges.length === 0) return text

  const parts: ReactNode[] = []
  let cursor = 0

  ranges.forEach(([start, end], index) => {
    if (cursor < start) {
      parts.push(
        <Fragment key={`text-${index}-${cursor}`}>{text.slice(cursor, start)}</Fragment>,
      )
    }

    parts.push(
      <mark
        key={`mark-${index}-${start}`}
        className="rounded-sm bg-yellow-300 px-0.5 text-zinc-900 dark:bg-yellow-300 dark:text-zinc-900"
      >
        {text.slice(start, end)}
      </mark>,
    )

    cursor = end
  })

  if (cursor < text.length) {
    parts.push(<Fragment key="text-tail">{text.slice(cursor)}</Fragment>)
  }

  return parts
}
