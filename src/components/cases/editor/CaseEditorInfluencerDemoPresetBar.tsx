import { Sparkles, Loader2 } from 'lucide-react'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import { INFLUENCER_DEMO_PRESET_ITEMS } from './caseInfluencerDemoPreset'

type CaseEditorInfluencerDemoPresetBarProps = {
  loading?: boolean
  error?: string | null
  onApply: () => void
}

export function CaseEditorInfluencerDemoPresetBar({
  loading = false,
  error = null,
  onApply,
}: CaseEditorInfluencerDemoPresetBarProps) {
  return (
    <Surface
      variant="card"
      className="!p-4 border-dashed border-violet-400/40 bg-violet-50/20 dark:border-violet-500/25 dark:bg-violet-500/5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <ThemeText as="p" tone="primary" className="text-sm font-semibold">
            Preset — caixa demo influencer
          </ThemeText>
        </div>
        <ThemeText as="p" tone="secondary" className="max-w-xl text-xs">
          Pool balanceado (~US$ 8 caixa): itens raros podem cair de verdade no motor de
          margem. Ideal para testar aberturas de influencer.
        </ThemeText>
      </div>

      {error ? (
        <Surface variant="errorBanner" className="mb-3 !p-3 text-xs">
          {error}
        </Surface>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={onApply}
        className="group w-full rounded-xl border border-zinc-200/80 bg-zinc-900/95 p-4 text-left transition hover:border-violet-400/50 hover:ring-2 hover:ring-violet-400/15 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <ThemeText as="span" tone="primary" className="text-xs font-medium text-zinc-300">
            {loading ? 'Buscando skins no catálogo...' : 'Aplicar preset demo influencer'}
          </ThemeText>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {INFLUENCER_DEMO_PRESET_ITEMS.map((item) => (
            <div
              key={item.skinName}
              className="relative overflow-hidden rounded-lg border px-3 py-2.5 transition group-hover:border-zinc-600"
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
              <ThemeText as="p" tone="faint" className="text-[10px] uppercase tracking-wide text-zinc-500">
                {item.weaponLabel}
              </ThemeText>
              <ThemeText as="p" tone="primary" className="text-xs font-semibold text-zinc-100">
                {item.skinLabel}
              </ThemeText>
              <div className="mt-2 flex items-center justify-between gap-2">
                <ThemeText as="span" tone="secondary" className="text-[11px] text-zinc-400">
                  Drop {item.probability}%
                </ThemeText>
                <ThemeText as="span" tone="faint" className="text-[10px] text-zinc-500">
                  {formatSkinsPrice(item.priceUsd, SkinsCurrency.USD)}
                </ThemeText>
              </div>
            </div>
          ))}
        </div>
      </button>
    </Surface>
  )
}
