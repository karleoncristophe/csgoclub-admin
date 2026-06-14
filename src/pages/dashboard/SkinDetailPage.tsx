import { useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Expand } from 'lucide-react'
import {
  formatSkinsPrice,
  normalizeSkinsCurrency,
} from '@/constants/skinsCurrency'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { ImageFullscreenModal } from '@/components/skins/ImageFullscreenModal'
import { useGetSkinsCatalogItemQuery } from '@/redux/store/api/skins/api.skins'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  getSkinWeaponName,
  getSkinWeaponType,
} from '@/utils/skinWeaponType'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { SkinDescriptionHtml } from '@/components/skins/SkinDescriptionHtml'

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null

  return (
    <div className="flex flex-col gap-1 border-b border-zinc-200 py-3 last:border-b-0 dark:border-zinc-800">
      <ThemeText as="dt" tone="label" className="text-xs uppercase">
        {label}
      </ThemeText>
      <ThemeText as="dd" tone="primary" className="text-sm">
        {value}
      </ThemeText>
    </div>
  )
}

const backLinkClass =
  'inline-flex items-center gap-2 text-sm text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300'

export default function SkinDetailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const skinName = searchParams.get('name')?.trim() ?? ''
  const currency = normalizeSkinsCurrency(searchParams.get('currency'))

  const handleGoBack = () => navigate(-1)

  const { data, isLoading, isError, error } = useGetSkinsCatalogItemQuery(
    { name: skinName, currency },
    { skip: !skinName },
  )

  if (!skinName) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={handleGoBack} className={backLinkClass}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <ThemeText as="p" tone="secondary">
          Nome da skin não informado.
        </ThemeText>
      </div>
    )
  }

  const metadata = data?.metadata
  const weaponType = data?.weaponType ?? getSkinWeaponType(skinName)

  return (
    <div className="space-y-6">
      <button type="button" onClick={handleGoBack} className={backLinkClass}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <PageTitle subtitle="Detalhes completos do item no catálogo SkinsBack.">
        Detalhe da skin
      </PageTitle>

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando detalhes...
        </div>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <Surface variant="card" className="mx-auto max-w-2xl !p-6">
          <div className="group">
            <button
              type="button"
              onClick={() => data.image && setImagePreviewOpen(true)}
              disabled={!data.image}
              className="w-full cursor-zoom-in disabled:cursor-default"
              aria-label={data.image ? 'Abrir imagem em tela cheia' : undefined}
            >
              <SkinRarityVisual rarity={metadata?.rarity ?? data.rarity} className="h-56">
                {data.image ? (
                  <>
                    <img
                      src={data.image}
                      alt={data.name}
                      className="h-full max-h-48 w-auto object-contain transition group-hover:scale-[1.02]"
                      style={
                        metadata?.rarity?.color
                          ? ({ '--skin-color': metadata.rarity.color } as CSSProperties)
                          : undefined
                      }
                    />
                    <span className="pointer-events-none absolute bottom-3 right-3 z-[2] flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      <Expand className="h-3.5 w-3.5" />
                      Tela cheia
                    </span>
                  </>
                ) : (
                  <ThemeText as="span" tone="faint" className="text-sm">
                    Sem imagem
                  </ThemeText>
                )}
              </SkinRarityVisual>
            </button>
          </div>

          <ImageFullscreenModal
            open={imagePreviewOpen}
            src={data.image ?? ''}
            alt={data.name}
            onClose={() => setImagePreviewOpen(false)}
          />

          <ThemeText as="h2" tone="primary" className="mt-4 text-lg font-semibold">
            {data.name}
          </ThemeText>

          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            {weaponType} · {getSkinWeaponName(data.name)}
          </ThemeText>

          <div className="mt-4 space-y-1 border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <ThemeText as="p" tone="faint" className="text-sm line-through">
              {formatSkinsPrice(data.price, data.currency)}
            </ThemeText>
            <ThemeText as="p" tone="primary" className="text-2xl font-bold">
              {formatSkinsPrice(data.priceWithTax ?? data.price, data.currency)}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-xs">
              Taxa da categoria: {data.taxPercent ?? 0}%
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-xs">
              {data.availableCount ?? 0} disponíveis no catálogo
            </ThemeText>
          </div>

          <ThemeText as="h3" tone="primary" className="mb-2 mt-6 text-base font-semibold">
            Dados do catálogo
          </ThemeText>
          <dl>
            <DetailRow label="Nome (market hash)" value={data.name} />
            <DetailRow label="Class ID" value={data.classId} />
            <DetailRow label="Moeda" value={data.currency} />
            <DetailRow label="Preço base" value={formatSkinsPrice(data.price, data.currency)} />
            <DetailRow label="Taxa (%)" value={`${data.taxPercent ?? 0}%`} />
            <DetailRow
              label="Preço com taxa"
              value={formatSkinsPrice(data.priceWithTax ?? data.price, data.currency)}
            />
            <DetailRow label="Disponíveis" value={data.availableCount} />
            <DetailRow label="Tipo de arma" value={weaponType} />
          </dl>

          {metadata ? (
            <>
              <ThemeText as="h3" tone="primary" className="mb-2 mt-8 text-base font-semibold">
                Metadados do item
              </ThemeText>
              <dl>
                <DetailRow label="ID" value={metadata.id} />
                <DetailRow label="Nome exibido" value={metadata.name} />
                <DetailRow label="Market hash name" value={metadata.marketHashName} />
                <DetailRow label="Categoria" value={metadata.category?.name} />
                <DetailRow label="Arma" value={metadata.weapon?.name} />
                <DetailRow label="Padrão / skin" value={metadata.pattern?.name} />
                <DetailRow label="Desgaste" value={metadata.wear?.name} />
                <DetailRow label="Raridade" value={metadata.rarity?.name} />
                <DetailRow label="Time" value={metadata.team?.name} />
                <DetailRow label="Paint index" value={metadata.paintIndex} />
                <DetailRow
                  label="Float mínimo"
                  value={
                    typeof metadata.minFloat === 'number'
                      ? metadata.minFloat.toFixed(4)
                      : undefined
                  }
                />
                <DetailRow
                  label="Float máximo"
                  value={
                    typeof metadata.maxFloat === 'number'
                      ? metadata.maxFloat.toFixed(4)
                      : undefined
                  }
                />
                <DetailRow
                  label="StatTrak"
                  value={metadata.stattrak == null ? undefined : metadata.stattrak ? 'Sim' : 'Não'}
                />
                <DetailRow
                  label="Souvenir"
                  value={metadata.souvenir == null ? undefined : metadata.souvenir ? 'Sim' : 'Não'}
                />
              </dl>

              {metadata.description ? (
                <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <ThemeText as="p" tone="label" className="text-xs uppercase">
                    Descrição
                  </ThemeText>
                  <SkinDescriptionHtml
                    html={metadata.description}
                    className="mt-2"
                  />
                </div>
              ) : null}
            </>
          ) : (
            <ThemeText as="p" tone="secondary" className="mt-6 text-sm">
              Metadados adicionais não encontrados para este item.
            </ThemeText>
          )}
        </Surface>
      ) : null}
    </div>
  )
}
