import { Pagination as HeroPagination } from '@heroui/react'
import type { RefObject } from 'react'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  /** Rola até o topo da lista ao mudar de página. */
  scrollTargetRef?: RefObject<HTMLElement | null>
}

type PageItem = number | 'start-ellipsis' | 'end-ellipsis'

function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const items: PageItem[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) items.push('start-ellipsis')
  for (let current = start; current <= end; current += 1) items.push(current)
  if (end < totalPages - 1) items.push('end-ellipsis')

  items.push(totalPages)
  return items
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
  scrollTargetRef,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const changePage = (nextPage: number) => {
    onPageChange(nextPage)
    scrollTargetRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <HeroPagination size="sm" className={`flex-wrap justify-center sm:justify-end ${className}`}>
      <HeroPagination.Content>
        <HeroPagination.Item>
          <HeroPagination.Previous
            isDisabled={currentPage <= 1}
            onPress={() => changePage(currentPage - 1)}
          >
            <HeroPagination.PreviousIcon />
            <span>Anterior</span>
          </HeroPagination.Previous>
        </HeroPagination.Item>

        {getPageItems(currentPage, totalPages).map((item) => (
          <HeroPagination.Item key={item}>
            {typeof item === 'number' ? (
              <HeroPagination.Link
                isActive={item === currentPage}
                onPress={() => changePage(item)}
              >
                {item}
              </HeroPagination.Link>
            ) : (
              <HeroPagination.Ellipsis />
            )}
          </HeroPagination.Item>
        ))}

        <HeroPagination.Item>
          <HeroPagination.Next
            isDisabled={currentPage >= totalPages}
            onPress={() => changePage(currentPage + 1)}
          >
            <span>Próxima</span>
            <HeroPagination.NextIcon />
          </HeroPagination.Next>
        </HeroPagination.Item>
      </HeroPagination.Content>
    </HeroPagination>
  )
}
