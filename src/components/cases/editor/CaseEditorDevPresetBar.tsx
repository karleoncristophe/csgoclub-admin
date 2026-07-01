import { FlaskConical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  CSGO_NET_DEV_PRESET_ITEMS,
  estimateCsgoNetDevPresetPricing,
} from './caseDevPreset'

type CaseEditorDevPresetBarProps = {
  loading?: boolean
  error?: string | null
  targetMarginPercent?: number
  discountPercent?: number
  onApply: () => void
}

export function CaseEditorDevPresetBar({
  loading = false,
  error = null,
  targetMarginPercent = 30,
  discountPercent = 0,
  onApply,
}: CaseEditorDevPresetBarProps) {
  if (!import.meta.env.DEV) return null

  const pricing = estimateCsgoNetDevPresetPricing(targetMarginPercent, discountPercent)

  return (
    <Surface variant="card" className="!p-4 border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <ThemeText as="p" tone="primary" className="text-sm font-semibold">
            Dev preset — caixa csgo.net
          </ThemeText>
        </div>
        <ThemeText as="p" tone="secondary" className="max-w-xl text-xs">
          Preenche a caixa com as 6 skins enviadas (Turbo Peek, Fully Tuned, Quick Silver,
          Kumicho Dragon, Party Animal, Swamp DDPAT). Imagens vêm do catálogo; drops e preços
          do preset.
        </ThemeText>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {CSGO_NET_DEV_PRESET_ITEMS.map((item) => (
          <div
            key={item.skinName}
            className="relative overflow-hidden rounded-lg border px-3 py-2.5"
            style={{
              borderColor: `${item.rarityColor ?? '#71717a'}55`,
              background: `linear-gradient(135deg, ${item.rarityColor ?? '#71717a'}18 0%, transparent 60%)`,
            }}
          >
            {item.wear ? (
              <span className="absolute right-2 top-2 rounded bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                {item.wear}
              </span>
            ) : null}
            <ThemeText as="p" tone="faint" className="text-[10px] uppercase tracking-wide">
              {item.weaponLabel}
            </ThemeText>
            <ThemeText as="p" tone="primary" className="text-xs font-semibold">
              {item.skinLabel}
            </ThemeText>
            <div className="mt-2 flex items-center justify-between gap-2">
              <ThemeText as="span" tone="secondary" className="text-[11px]">
                Drop {item.probability}%
              </ThemeText>
              <ThemeText as="span" tone="faint" className="text-[10px]">
                {formatSkinsPrice(item.priceUsd, SkinsCurrency.USD)}
              </ThemeText>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <Surface variant="errorBanner" className="mb-3 !p-3 text-xs">
          {error}
        </Surface>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ThemeText as="p" tone="faint" className="text-xs">
          VE {formatSkinsPrice(pricing.expectedValue, SkinsCurrency.USD)} · preço sugerido{' '}
          {formatSkinsPrice(pricing.finalPrice, SkinsCurrency.USD)}
        </ThemeText>
        <Button type="button" size="sm" disabled={loading} onClick={onApply}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Montando preset…
            </>
          ) : (
            'Criar caixa nova com preset'
          )}
        </Button>
      </div>
    </Surface>
  )
}
