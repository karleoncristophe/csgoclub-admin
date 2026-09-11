import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { filterChipClass } from '@/components/skins/filterChipClass'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import type { SkinsCatalogRarityOption } from '@/redux/store/api/skins/api.skins'

type TypeCounter = [string, number]

type CatalogQuickFilterCardsProps = {
  typeCounters: TypeCounter[]
  weaponType: string
  onWeaponTypeChange: (value: string) => void
  rarityOptions: SkinsCatalogRarityOption[]
  rarity: string
  onRarityChange: (value: string) => void
}

export function CatalogQuickFilterCards({
  typeCounters,
  weaponType,
  onWeaponTypeChange,
  rarityOptions,
  rarity,
  onRarityChange,
}: CatalogQuickFilterCardsProps) {
  if (typeCounters.length === 0 && rarityOptions.length === 0) return null

  return (
    <div className="mb-6 space-y-6">
      {typeCounters.length > 0 ? (
        <div>
          <SectionTitle>Tipos no catálogo</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {typeCounters.slice(0, 8).map(([type, count]) => {
              const active = weaponType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onWeaponTypeChange(active ? '' : type)}
                  className={`${active ? filterChipClass.active : filterChipClass.inactive} flex min-h-16 flex-col !px-3 !py-2`}
                >
                  <ThemeText
                    as="p"
                    tone="primary"
                    className={`text-sm font-semibold ${active ? 'dark:text-brand-100' : ''}`}
                  >
                    {type}
                  </ThemeText>
                  <ThemeText
                    as="p"
                    tone="secondary"
                    className="mt-auto pt-1 text-xs"
                  >
                    {count} skin{count === 1 ? '' : 's'}
                  </ThemeText>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {rarityOptions.length > 0 ? (
        <div>
          <SectionTitle>Raridades</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {rarityOptions.slice(0, 8).map((option) => {
              const active = rarity === option.name
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => onRarityChange(active ? '' : option.name)}
                  className={`${active ? filterChipClass.active : filterChipClass.inactive} flex min-h-28 flex-col !px-3 !py-3`}
                >
                  <SkinRarityBar rarity={option} className="mb-2" />
                  <ThemeText
                    as="p"
                    tone="primary"
                    className={`line-clamp-2 flex min-h-10 items-start text-sm font-semibold leading-5 ${active ? 'dark:text-brand-100' : ''}`}
                  >
                    {option.name}
                  </ThemeText>
                  <ThemeText
                    as="p"
                    tone="secondary"
                    className="mt-auto pt-1 text-xs"
                  >
                    {option.count} skin{option.count === 1 ? '' : 's'}
                  </ThemeText>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
