import type { CSSProperties, ReactNode } from 'react'
import { Star } from 'lucide-react'

type SkinRarity = {
  name?: string
  color?: string
}

type SkinRarityVisualProps = {
  rarity?: SkinRarity | null
  className?: string
  children: ReactNode
}

function rarityGlowStyle(color: string, opacity: number) {
  return {
    background: `radial-gradient(ellipse 85% 75% at 50% 55%, color-mix(in srgb, ${color} ${opacity}%, transparent), transparent 72%)`,
  } satisfies CSSProperties
}

export function SkinRarityVisual({
  rarity,
  className = '',
  children,
}: SkinRarityVisualProps) {
  const color = rarity?.color

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-950/60 ${className}`.trim()}
      style={
        color
          ? {
              borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
            }
          : undefined
      }
      title={rarity?.name ? `Raridade: ${rarity.name}` : undefined}
    >
      {color ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
            aria-hidden
            style={rarityGlowStyle(color, 22)}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
            style={rarityGlowStyle(color, 34)}
          />
          <div
            className="pointer-events-none absolute left-2 top-2 z-[2] flex items-center gap-1 rounded-full border px-1.5 py-0.5 shadow-sm backdrop-blur-sm"
            style={{
              borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${color} 18%, rgb(9 9 11 / 0.72))`,
              boxShadow: `0 0 12px color-mix(in srgb, ${color} 35%, transparent)`,
            }}
            aria-hidden
          >
            <Star
              className="h-3.5 w-3.5 shrink-0"
              style={{ color, fill: color }}
            />
          </div>
        </>
      ) : null}
      <div className="relative z-[1] flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  )
}

export type { SkinRarity }
