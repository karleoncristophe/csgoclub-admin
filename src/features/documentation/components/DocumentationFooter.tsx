import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Gem,
  Layers,
  MessageCircle,
  Package,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { DOCUMENTATION_SUMMARY } from '@/features/documentation/lib/constants'

export function DocumentationSummary() {
  return (
    <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {DOCUMENTATION_SUMMARY.map((item) => {
        const Icon = item.icon
        return (
          <Surface variant="docSummaryCard" key={item.label}>
            <div className={surfaceClass('docIconWrap', 'mb-4 !h-10 !w-10')}>
              <Icon className="h-5 w-5" />
            </div>
            <ThemeText
              as="p"
              tone="muted"
              className="text-xs font-semibold uppercase tracking-[0.14em]"
            >
              {item.label}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-3 text-sm leading-7">
              {item.value}
            </ThemeText>
          </Surface>
        )
      })}
    </section>
  )
}

export function DocumentationFooter() {
  return (
    <Surface
      variant="docSection"
      className="mt-12 border-brand-200/60 bg-gradient-to-br from-brand-50/80 via-white to-white dark:border-brand-900/40 dark:from-brand-950/30 dark:via-zinc-900 dark:to-zinc-900"
    >
      <div className="flex flex-col items-center px-2 py-4 text-center sm:px-6">
        <MessageCircle className="mb-4 h-12 w-12 text-brand-700 dark:text-brand-400" />
        <ThemeText as="h2" tone="primary" className="text-2xl font-bold">
          Precisa ir direto à operação?
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mt-2 max-w-xl text-sm">
          Acesse as telas relacionadas ao que você está consultando nesta
          documentação.
        </ThemeText>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard/cases">
            <Button type="button" size="lg" className="gap-2">
              <Package className="h-4 w-4" aria-hidden />
              Caixas
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <Link to="/dashboard/users">
            <Button type="button" size="lg" variant="secondary" className="gap-2">
              <Users className="h-4 w-4" aria-hidden />
              Usuários
            </Button>
          </Link>
          <Link to="/dashboard/skins">
            <Button type="button" size="lg" variant="secondary" className="gap-2">
              <Gem className="h-4 w-4" aria-hidden />
              Skins
            </Button>
          </Link>
          <Link to="/dashboard/categorias">
            <Button type="button" size="lg" variant="secondary" className="gap-2">
              <Layers className="h-4 w-4" aria-hidden />
              Categorias
            </Button>
          </Link>
        </div>
      </div>
    </Surface>
  )
}
