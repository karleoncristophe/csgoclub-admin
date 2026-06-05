type SkinRarity = {
  name?: string
  color?: string
}

export function SkinRarityBar({
  rarity,
  className = '',
}: {
  rarity?: SkinRarity | null
  className?: string
}) {
  if (!rarity?.color) return null

  return (
    <div
      className={`h-1 rounded-full ${className}`.trim()}
      style={{ backgroundColor: rarity.color }}
      title={rarity.name ? `Raridade: ${rarity.name}` : undefined}
    />
  )
}

export type { SkinRarity }
