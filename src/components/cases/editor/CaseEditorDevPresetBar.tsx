import { FlaskConical, Loader2 } from 'lucide-react'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import { CSGO_NET_DEV_PRESET_ITEMS } from './caseDevPreset'

type CaseEditorDevPresetBarProps = {
  loading?: boolean
  error?: string | null
  onApply: () => void
}

export function CaseEditorDevPresetBar({
  loading = false,
  error = null,
  onApply,
}: CaseEditorDevPresetBarProps) {
  if (!import.meta.env.DEV) return null

  return (
    <Surface variant="card" className="!p-4 border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <ThemeText as="p" tone="primary" className="text-sm font-semibold">
            Dev preset — caixa csgo.net
          </ThemeText>
        </div>
        <ThemeText as="p" tone="secondary" className="text-xs">
          Valores e Drop % idênticos ao csgo.net (USD); catálogo só para imagem e raridade.
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
        className="group w-full rounded-xl border border-zinc-200/80 bg-zinc-900/95 p-4 text-left transition hover:border-amber-400/60 hover:ring-2 hover:ring-amber-400/20 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <ThemeText as="span" tone="primary" className="text-xs font-medium text-zinc-300">
            {loading ? 'Buscando imagens no catálogo...' : 'Aplicar preset completo'}
          </ThemeText>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {CSGO_NET_DEV_PRESET_ITEMS.map((item) => (
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
