import type { ReactNode } from 'react'
import {
  BookOpenText,
  Calculator,
  Coins,
  Cog,
  Gem,
  Layers,
  Package,
  Shuffle,
  TableProperties,
} from 'lucide-react'
import { TextBadge } from '@/components/StatusPill'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import {
  DOC_SECTIONS,
  DOC_SUMMARY_CARDS,
  type DocSection,
} from './documentationContent'

const SECTION_ICONS: Record<string, ReactNode> = {
  overview: <BookOpenText className="h-5 w-5" />,
  ve: <Calculator className="h-5 w-5" />,
  'drop-engine': <Shuffle className="h-5 w-5" />,
  'case-creation': <Package className="h-5 w-5" />,
  'case-fields-general': <Cog className="h-5 w-5" />,
  'case-fields-pricing': <Coins className="h-5 w-5" />,
  'case-fields-items': <TableProperties className="h-5 w-5" />,
  categories: <Layers className="h-5 w-5" />,
  currency: <Coins className="h-5 w-5" />,
  'skins-catalog': <Gem className="h-5 w-5" />,
  'economics-panel': <Calculator className="h-5 w-5" />,
  validation: <BookOpenText className="h-5 w-5" />,
}

function SectionCard({ section }: { section: DocSection }) {
  const icon = SECTION_ICONS[section.id] ?? <BookOpenText className="h-5 w-5" />

  return (
    <Surface variant="docSection" id={section.id}>
      <div className="mb-5 flex items-start gap-4">
        <div className={surfaceClass('docIconWrap')}>{icon}</div>
        <div>
          <SectionTitle>{section.title}</SectionTitle>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            {section.subtitle}
          </ThemeText>
        </div>
      </div>

      <div className="space-y-3">
        {section.paragraphs.map((paragraph) => (
          <ThemeText key={paragraph} as="p" tone="secondary" className="text-sm leading-7">
            {paragraph}
          </ThemeText>
        ))}
      </div>

      {section.bullets?.length ? (
        <Surface variant="docInset" className="mt-5">
          <ThemeText
            as="p"
            tone="muted"
            className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            Pontos principais
          </ThemeText>
          <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {section.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600 dark:bg-brand-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {section.enums?.length ? (
        <div className="mt-5 space-y-4">
          {section.enums.map((group) => (
            <Surface variant="docEnumBox" key={group.label}>
              <ThemeText
                as="p"
                tone="muted"
                className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
              >
                {group.label}
              </ThemeText>
              {group.description ? (
                <ThemeText as="p" tone="secondary" className="mb-3 text-sm leading-6">
                  {group.description}
                </ThemeText>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => (
                  <TextBadge key={value}>{value}</TextBadge>
                ))}
              </div>
              {group.details?.length ? (
                <Surface variant="docEnumDetail">
                  {group.details.map((item) => (
                    <div
                      key={`${group.label}-${item.value}`}
                      className="text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.value}:
                      </span>{' '}
                      {item.meaning}
                    </div>
                  ))}
                </Surface>
              ) : null}
            </Surface>
          ))}
        </div>
      ) : null}
    </Surface>
  )
}

export default function DocumentationPage() {
  return (
    <div>
      <PageTitle
        subtitle="Referência completa do painel CS2Club: VE, motor de drop, criação de caixas, categorias, moeda e catálogo de skins. Escrita para produto, operação e suporte — sem precisar ser dev."
      >
        Documentação
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Surface variant="docNavAside">
            <ThemeText
              as="p"
              tone="muted"
              className="text-xs font-semibold uppercase tracking-[0.16em]"
            >
              Navegação
            </ThemeText>
            <nav className="mt-4 space-y-2">
              {DOC_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={surfaceClass('docNavLink')}
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </Surface>
        </aside>

        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {DOC_SUMMARY_CARDS.map((item) => (
              <Surface variant="docSummaryCard" key={item.label}>
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
            ))}
          </section>

          {DOC_SECTIONS.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  )
}
