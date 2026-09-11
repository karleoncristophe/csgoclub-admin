import type { ReactNode } from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import {
  CatalogSkinVariantFilters,
  CatalogSkinWearFilters,
} from '@/components/skins/CatalogSkinFlagFilters'
import { Select } from '@/components/ui/Select'
import { ThemeText } from '@/components/ui/ThemeText'
import type { SkinWearCode } from '@/constants/skinCatalogFlags'
import type {
  CatalogSort,
  SkinsCatalogRarityOption,
} from '@/redux/store/api/skins/api.skins'

type WeaponOption = {
  _id: string
  name: string
}

export type CatalogFiltersCardProps = {
  weaponType: string
  onWeaponTypeChange: (value: string) => void
  rarity: string
  onRarityChange: (value: string) => void
  rarityOptions: SkinsCatalogRarityOption[]
  weaponCategories: WeaponOption[]
  currencyLabel: string
  minPriceInput: string
  maxPriceInput: string
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  sort: CatalogSort
  onSortChange: (value: CatalogSort) => void
  wears: SkinWearCode[]
  onWearsChange: (wears: SkinWearCode[]) => void
  stattrak: boolean
  onStattrakChange: (value: boolean) => void
  souvenir: boolean
  onSouvenirChange: (value: boolean) => void
  onReset: () => void
  extraFields?: ReactNode
}

const priceFieldClass =
  'h-10 w-full rounded-xl border border-field-border bg-field px-3 text-sm text-foreground outline-none shadow-field transition placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20'

export function CatalogFiltersCard({
  weaponType,
  onWeaponTypeChange,
  rarity,
  onRarityChange,
  rarityOptions,
  weaponCategories,
  currencyLabel,
  minPriceInput,
  maxPriceInput,
  onMinPriceChange,
  onMaxPriceChange,
  sort,
  onSortChange,
  wears,
  onWearsChange,
  stattrak,
  onStattrakChange,
  souvenir,
  onSouvenirChange,
  onReset,
  extraFields,
}: CatalogFiltersCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-secondary p-4 shadow-sm shadow-black/5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-foreground">
          <SlidersHorizontal className="size-4" aria-hidden />
        </span>
        <div>
          <ThemeText as="h3" tone="primary" className="text-sm font-semibold">
            Filtros do catálogo
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="text-xs">
            Refine os resultados antes de escolher as skins.
          </ThemeText>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Tipo"
          name="catalogWeaponType"
          value={weaponType}
          onChange={(event) => onWeaponTypeChange(event.target.value)}
        >
          <option value="">Todos</option>
          {weaponCategories.map((category) => (
            <option key={category._id} value={category.name}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          label="Raridade"
          name="catalogRarity"
          value={rarity}
          onChange={(event) => onRarityChange(event.target.value)}
        >
          <option value="">Todas</option>
          {rarityOptions.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name} ({option.count})
            </option>
          ))}
        </Select>
        <CatalogSkinVariantFilters
          stattrak={stattrak}
          onStattrakChange={onStattrakChange}
          souvenir={souvenir}
          onSouvenirChange={onSouvenirChange}
        />
      </div>
      <div className="mt-3 grid gap-3 border-t border-separator pt-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Preço mínimo ({currencyLabel})
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={minPriceInput}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder="Opcional"
            className={priceFieldClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Preço máximo ({currencyLabel})
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={maxPriceInput}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="Opcional"
            className={priceFieldClass}
          />
        </div>
        <Select
          label="Ordenar"
          name="catalogSort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as CatalogSort)}
        >
          <option value="price_desc">Mais cara primeiro</option>
          <option value="price_asc">Mais barata primeiro</option>
          <option value="name_asc">A–Z</option>
          <option value="name_desc">Z–A</option>
        </Select>
        <div className="flex flex-col">
          <span className="mb-1.5 text-sm font-medium text-foreground">
            Ações
          </span>
          <button
            type="button"
            onClick={onReset}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-field-border bg-field px-3 text-sm font-medium text-muted shadow-field transition hover:border-field-border-hover hover:bg-field-hover hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
          >
            <RotateCcw className="size-4" aria-hidden />
            Limpar filtros
          </button>
        </div>
      </div>
      {extraFields ? (
        <div className="mt-3 grid gap-3 border-t border-separator pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {extraFields}
        </div>
      ) : null}
      <div className="mt-3 border-t border-separator pt-3">
        <CatalogSkinWearFilters
          wears={wears}
          onWearsChange={onWearsChange}
          compact
        />
      </div>
    </div>
  )
}
