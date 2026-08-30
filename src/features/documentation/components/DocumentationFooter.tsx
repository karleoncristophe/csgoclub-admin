import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  Crosshair,
  Package,
  Swords,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { DOCUMENTATION_SUMMARY } from '@/features/documentation/lib/constants'
import type { DocumentationCategory } from '@/features/documentation/lib/types'

type DocumentationSummaryProps = {
  selectedCategory: DocumentationCategory
  onCategoryClick: (category: DocumentationCategory) => void
}

export function DocumentationSummary({
  selectedCategory,
  onCategoryClick,
}: DocumentationSummaryProps) {
  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {DOCUMENTATION_SUMMARY.map((item) => {
        const Icon = item.icon
        const active = selectedCategory === item.category
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onCategoryClick(active ? 'all' : item.category)}
            className={surfaceClass(
              'docSummaryCard',
              `h-full w-full text-left transition-colors ${
                active
                  ? 'ring-2 ring-accent/40'
                  : 'hover:border-accent/30 hover:bg-accent-soft/30'
              }`,
            )}
            aria-pressed={active}
          >
            <div className={surfaceClass('docIconWrap', 'mb-3 !h-9 !w-9')}>
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <ThemeText as="span" tone="primary" className="block text-sm font-semibold">
              {item.label}
            </ThemeText>
            <ThemeText as="span" tone="secondary" className="mt-2 block text-sm leading-6">
              {item.value}
            </ThemeText>
          </button>
        )
      })}
    </section>
  )
}

export function DocumentationFooter() {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-separator pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <ThemeText as="p" tone="secondary" className="text-sm">
        Ir para a operação
      </ThemeText>
      <div className="flex flex-wrap gap-2">
        <Link to="/dashboard/cases">
          <Button type="button" size="sm" variant="secondary" className="gap-2">
            <Package className="h-4 w-4" aria-hidden />
            Caixas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </Link>
        <Link to="/dashboard/cambio">
          <Button type="button" size="sm" variant="secondary" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" aria-hidden />
            Câmbio
          </Button>
        </Link>
        <Link to="/dashboard/battles">
          <Button type="button" size="sm" variant="secondary" className="gap-2">
            <Swords className="h-4 w-4" aria-hidden />
            Battles
          </Button>
        </Link>
        <Link to="/dashboard/arena">
          <Button type="button" size="sm" variant="secondary" className="gap-2">
            <Crosshair className="h-4 w-4" aria-hidden />
            Arena
          </Button>
        </Link>
        <Link to="/dashboard/users">
          <Button type="button" size="sm" variant="secondary" className="gap-2">
            <Users className="h-4 w-4" aria-hidden />
            Usuários
          </Button>
        </Link>
      </div>
    </div>
  )
}
