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

const docFooterLinkClass =
  'gap-2 border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-700'

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
      className="mt-12 overflow-hidden border-brand-200/60 bg-gradient-to-br from-brand-50/80 via-white to-white dark:border-brand-500/25 dark:bg-gradient-to-br dark:from-brand-500/10 dark:via-zinc-900/95 dark:to-zinc-950 dark:ring-1 dark:ring-inset dark:ring-brand-400/10"
    >
      <div className="flex flex-col items-center px-4 py-8 text-center sm:px-8 sm:py-10">
        <div
          className={surfaceClass(
            'docIconWrap',
            'mb-5 !h-14 !w-14 rounded-2xl dark:bg-brand-500/20 dark:ring-brand-400/30',
          )}
        >
          <MessageCircle className="h-7 w-7" aria-hidden />
        </div>
        <ThemeText as="h2" tone="primary" className="text-2xl font-bold">
          Precisa ir direto à operação?
        </ThemeText>
        <ThemeText
          as="p"
          tone="secondary"
          className="mt-3 max-w-xl text-sm leading-relaxed dark:text-zinc-300"
        >
          Acesse as telas relacionadas ao que você está consultando nesta
          documentação.
        </ThemeText>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard/cases">
            <Button type="button" size="lg" className="gap-2 shadow-lg shadow-brand-600/20">
              <Package className="h-4 w-4" aria-hidden />
              Caixas
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <Link to="/dashboard/users">
            <Button type="button" size="lg" variant="secondary" className={docFooterLinkClass}>
              <Users className="h-4 w-4" aria-hidden />
              Usuários
            </Button>
          </Link>
          <Link to="/dashboard/skins">
            <Button type="button" size="lg" variant="secondary" className={docFooterLinkClass}>
              <Gem className="h-4 w-4" aria-hidden />
              Skins
            </Button>
          </Link>
          <Link to="/dashboard/categorias">
            <Button type="button" size="lg" variant="secondary" className={docFooterLinkClass}>
              <Layers className="h-4 w-4" aria-hidden />
              Categorias
            </Button>
          </Link>
        </div>
      </div>
    </Surface>
  )
}
