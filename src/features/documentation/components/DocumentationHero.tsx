import { BookOpenText, Search } from 'lucide-react'
import { ThemeText } from '@/components/ui/ThemeText'

type DocumentationHeroProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function DocumentationHero({
  searchQuery,
  onSearchChange,
}: DocumentationHeroProps) {
  return (
    <header className="mb-10 text-center">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-brand-50 p-5 ring-1 ring-brand-200/60 dark:bg-brand-500/15 dark:ring-brand-400/25">
          <BookOpenText className="h-14 w-14 text-brand-700 dark:text-brand-300" />
        </div>
      </div>

      <ThemeText
        as="h1"
        tone="primary"
        className="text-3xl font-bold sm:text-4xl"
      >
        Documentação
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="mx-auto mt-3 max-w-2xl text-base">
        Guia do painel CS2Club em linguagem direta: caixas, usuários, inventário e
        catálogo. Busque por palavra-chave ou filtre por categoria — sem precisar ser
        desenvolvedor.
      </ThemeText>

      <div className="relative mx-auto mt-8 max-w-2xl">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por palavra-chave..."
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-400 dark:focus:ring-brand-400/20"
        />
      </div>
    </header>
  )
}
