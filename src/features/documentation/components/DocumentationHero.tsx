import { Input } from '@/components/ui/Input'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'

type DocumentationHeroProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  resultCount: number
}

export function DocumentationHero({
  searchQuery,
  onSearchChange,
  resultCount,
}: DocumentationHeroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <SectionTitle>Tópicos</SectionTitle>
        <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
          {resultCount} tópico{resultCount === 1 ? '' : 's'}
        </ThemeText>
      </div>
      <div className="w-full sm:max-w-sm">
        <Input
          label="Buscar"
          name="search"
          type="search"
          placeholder="Upgrade, arena, câmbio, banco virtual…"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
