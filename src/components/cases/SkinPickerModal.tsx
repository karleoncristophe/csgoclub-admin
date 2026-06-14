import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'

type SkinPickerModalProps = {
  open: boolean
  skin: SkinsCatalogItem | null
  currency: SkinsCurrency
  alreadyAdded: boolean
  onClose: () => void
  onConfirm: (skin: SkinsCatalogItem, probability: number) => void
}

export function SkinPickerModal({
  open,
  skin,
  currency,
  alreadyAdded,
  onClose,
  onConfirm,
}: SkinPickerModalProps) {
  const [probabilityInput, setProbabilityInput] = useState('0')

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) setProbabilityInput('0')
  }, [open, skin?.name])

  if (!open || !skin) return null

  const probability = Number(probabilityInput.replace(',', '.'))
  const safeProbability = Number.isFinite(probability)
    ? Math.min(100, Math.max(0, probability))
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className={surfaceClass('modalBackdrop')}
        aria-label="Fechar"
        onClick={onClose}
      />
      <Surface variant="modalShell" className="max-w-lg">
        <div className={surfaceClass('modalHeaderRow')}>
          <div>
            <ThemeText as="h2" tone="primary" className="text-lg font-semibold">
              Adicionar à caixa
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
              Defina a chance do item. Valor vem do catálogo SkinsBack ({currency}).
            </ThemeText>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={surfaceClass('ghostIconButton')}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex gap-4">
            {skin.image ? (
              <img
                src={skin.image}
                alt=""
                className="h-24 w-32 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 object-contain p-2 dark:border-zinc-800 dark:bg-zinc-950"
              />
            ) : (
              <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <ThemeText tone="faint" className="text-xs">
                  Sem imagem
                </ThemeText>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <ThemeText as="p" tone="primary" className="text-sm font-medium leading-snug">
                {skin.name}
              </ThemeText>
              {skin.rarity?.name ? (
                <ThemeText as="p" tone="label" className="mt-1 text-xs">
                  {skin.rarity.name}
                </ThemeText>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Surface variant="statTile" className="!p-3">
              <ThemeText tone="label" className="text-[11px] uppercase">
                Preço base
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
                {formatSkinsPrice(skin.price, currency)}
              </ThemeText>
            </Surface>
            <Surface variant="statTile" className="!p-3">
              <ThemeText tone="label" className="text-[11px] uppercase">
                Taxa
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
                {skin.taxPercent}%
              </ThemeText>
            </Surface>
            <Surface variant="statTile" className="!p-3">
              <ThemeText tone="label" className="text-[11px] uppercase">
                Com taxa
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
                {formatSkinsPrice(skin.priceWithTax, currency)}
              </ThemeText>
            </Surface>
          </div>

          <Input
            label="Chance de drop (%)"
            name="itemProbability"
            type="number"
            min={0}
            max={100}
            step="0.0001"
            value={probabilityInput}
            onChange={(e) => setProbabilityInput(e.target.value)}
            placeholder="Ex.: 0.5"
          />

          {alreadyAdded ? (
            <ThemeText as="p" tone="secondary" className="text-sm text-amber-700 dark:text-amber-300">
              Esta skin já está na caixa.
            </ThemeText>
          ) : null}
        </div>

        <div className={surfaceClass('modalFooterRow')}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={alreadyAdded}
            onClick={() => onConfirm(skin, safeProbability)}
          >
            Adicionar item
          </Button>
        </div>
      </Surface>
    </div>
  )
}
