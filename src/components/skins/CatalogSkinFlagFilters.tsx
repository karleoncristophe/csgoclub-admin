import { useId } from 'react'
import { Select } from '@/components/ui/Select'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  SKIN_WEARS,
  toggleWearCode,
  type SkinWearCode,
} from '@/constants/skinCatalogFlags'
import { filterChipClass } from '@/components/skins/filterChipClass'

type CatalogSkinFlagFiltersProps = {
  wears: SkinWearCode[]
  onWearsChange: (wears: SkinWearCode[]) => void
  stattrak: boolean
  onStattrakChange: (value: boolean) => void
  souvenir: boolean
  onSouvenirChange: (value: boolean) => void
  compact?: boolean
}

type CatalogSkinVariantFiltersProps = Pick<
  CatalogSkinFlagFiltersProps,
  'stattrak' | 'onStattrakChange' | 'souvenir' | 'onSouvenirChange'
>

type CatalogSkinWearFiltersProps = Pick<
  CatalogSkinFlagFiltersProps,
  'wears' | 'onWearsChange' | 'compact'
>

export function CatalogSkinVariantFilters({
  stattrak,
  onStattrakChange,
  souvenir,
  onSouvenirChange,
}: CatalogSkinVariantFiltersProps) {
  const id = useId()
  return (
    <>
      <Select
        label="StatTrak™"
        name={`${id}-stattrak`}
        value={stattrak ? '1' : ''}
        onChange={(event) => onStattrakChange(event.target.value === '1')}
      >
        <option value="">Todos</option>
        <option value="1">Somente StatTrak™</option>
      </Select>
      <Select
        label="Souvenir"
        name={`${id}-souvenir`}
        value={souvenir ? '1' : ''}
        onChange={(event) => onSouvenirChange(event.target.value === '1')}
      >
        <option value="">Todos</option>
        <option value="1">Somente Souvenir</option>
      </Select>
    </>
  )
}

export function CatalogSkinWearFilters({
  wears,
  onWearsChange,
  compact = false,
}: CatalogSkinWearFiltersProps) {
  return (
    <div className="w-full">
      <ThemeText as="p" tone="primary" className="mb-2 text-sm font-medium">
        Desgaste
      </ThemeText>
      <div
        className={
          compact
            ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'
            : 'flex flex-wrap gap-2'
        }
      >
        {SKIN_WEARS.map((wear) => {
          const active = wears.includes(wear.code)
          return (
            <button
              key={wear.code}
              type="button"
              aria-pressed={active}
              onClick={() => onWearsChange(toggleWearCode(wears, wear.code))}
              title={wear.name}
              className={`${active ? filterChipClass.active : filterChipClass.inactive} inline-flex min-h-10 items-center justify-center gap-2 ${compact ? '!px-3 text-center' : ''}`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: wear.color }}
                aria-hidden
              />
              {compact ? (
                <span className="text-sm font-medium">{wear.name}</span>
              ) : (
                <>
                  <span className="font-semibold">{wear.shortLabel}</span>
                  <span className="text-xs opacity-80">{wear.name}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CatalogSkinFlagFilters({
  wears,
  onWearsChange,
  stattrak,
  onStattrakChange,
  souvenir,
  onSouvenirChange,
  compact = false,
}: CatalogSkinFlagFiltersProps) {
  return (
    <div className="grid gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
      <CatalogSkinVariantFilters
        stattrak={stattrak}
        onStattrakChange={onStattrakChange}
        souvenir={souvenir}
        onSouvenirChange={onSouvenirChange}
      />
      <div className="md:col-span-2 xl:col-span-3">
        <CatalogSkinWearFilters
          wears={wears}
          onWearsChange={onWearsChange}
          compact={compact}
        />
      </div>
    </div>
  )
}
