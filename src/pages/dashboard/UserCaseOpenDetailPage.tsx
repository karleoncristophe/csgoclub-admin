import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Box, CheckCircle2, XCircle } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { useGetCaseOpenByIdQuery } from '@/redux/store/api/case-opens/api.case-opens'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(date)
}

function formatPercent(value: number) {
  return `${value.toFixed(3).replace(/\.?0+$/, '')}%`
}

function dispositionLabel(value: 'pending' | 'kept' | 'converted') {
  if (value === 'kept') return 'Guardado no inventário'
  if (value === 'converted') return 'Convertido em saldo'
  return 'Pendente de decisão'
}

function MethodBadge({
  method,
}: {
  method?: 'direct' | 'reroll' | 'fallback'
}) {
  if (!method) return null
  const label =
    method === 'direct' ? 'Direto' : method === 'reroll' ? 'Re-roll' : 'Fallback'
  return <TextBadge>{label}</TextBadge>
}

function ValueTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="p" tone="primary" className="mt-1 text-lg font-semibold">
        {value}
      </ThemeText>
      {hint ? (
        <ThemeText as="p" tone="faint" className="mt-1 text-xs">
          {hint}
        </ThemeText>
      ) : null}
    </div>
  )
}

export default function UserCaseOpenDetailPage() {
  const { id = '', openId = '' } = useParams()
  const resolvedOpenId = openId
  const { data, isLoading, isError, error } = useGetCaseOpenByIdQuery(resolvedOpenId, {
    skip: !resolvedOpenId,
  })

  const backHref = id ? `/dashboard/users/${id}` : '/dashboard/case-opens'
  const backLabel = id ? 'Voltar ao usuário' : 'Voltar às aberturas'

  return (
    <div className="space-y-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <PageTitle subtitle="Resultado completo da abertura, com valores, raridade e conteúdo da caixa.">
        Detalhe da abertura
      </PageTitle>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-10 text-sm">
          Carregando abertura…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <>
          <Surface variant="card" className="!p-6">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="mx-auto w-full max-w-[220px]">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  {data.case.imageUrl ? (
                    <img
                      src={data.case.imageUrl}
                      alt={data.case.name}
                      className="aspect-square w-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-zinc-400">
                      <Box className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <ThemeText as="p" tone="primary" className="mt-3 text-center text-base font-semibold">
                  {data.case.name}
                </ThemeText>
                {data.case.slug ? (
                  <ThemeText as="p" tone="faint" className="mt-1 text-center text-xs">
                    {data.case.slug}
                  </ThemeText>
                ) : null}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <TextBadge>{dispositionLabel(data.disposition)}</TextBadge>
                  {data.isTestOpen ? <TextBadge>Abertura de teste</TextBadge> : null}
                  <MethodBadge method={data.dropResolutionMethod} />
                  {data.wasRerolled ? <TextBadge>Re-roll</TextBadge> : null}
                </div>

                <ThemeText as="p" tone="secondary" className="mt-3 text-sm">
                  {formatDateTime(data.createdAt)}
                </ThemeText>

                {data.userId ? (
                  <Link
                    to={`/dashboard/users/${data.userId}`}
                    className="mt-3 inline-flex text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Ver perfil do cliente
                  </Link>
                ) : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <ValueTile
                    label="Preço pago"
                    value={formatMoney(data.pricePaid, data.currency)}
                    hint={
                      data.paymentFromBalance != null || data.paymentFromBonusBalance != null
                        ? `Saldo ${formatMoney(data.paymentFromBalance ?? 0, data.currency)} · Bônus ${formatMoney(data.paymentFromBonusBalance ?? 0, data.currency)}`
                        : undefined
                    }
                  />
                  <ValueTile
                    label="Valor do prêmio"
                    value={formatMoney(data.itemValue, data.currency)}
                    hint={data.currency}
                  />
                  <ValueTile
                    label="Convertido"
                    value={
                      data.convertedAmount != null
                        ? formatMoney(data.convertedAmount, data.currency)
                        : '—'
                    }
                  />
                  <ValueTile label="USD" value={formatMoney(data.valueUsd, 'USD')} />
                  <ValueTile
                    label="BRL"
                    value={formatMoney(data.valueBrl, 'BRL')}
                    hint={data.rateBrl != null ? `Taxa ${data.rateBrl}` : undefined}
                  />
                  <ValueTile
                    label="EUR"
                    value={formatMoney(data.valueEur, 'EUR')}
                    hint={data.rateEur != null ? `Taxa ${data.rateEur}` : undefined}
                  />
                </div>
              </div>
            </div>
          </Surface>

          <Surface variant="card" className="!p-6">
            <SectionTitle className="mb-4">Item sorteado</SectionTitle>
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <SkinRarityVisual
                rarity={{
                  name: data.wonItemRarityName,
                  color: data.wonItemRarityColor,
                }}
                className="h-64"
              >
                {data.wonItemImage ? (
                  <img
                    src={data.wonItemImage}
                    alt={data.wonSkinName}
                    className="max-h-56 max-w-full object-contain"
                  />
                ) : (
                  <ThemeText as="span" tone="faint">
                    Sem imagem
                  </ThemeText>
                )}
              </SkinRarityVisual>

              <div>
                <ThemeText as="h3" tone="primary" className="text-xl font-semibold">
                  {data.wonSkinName}
                </ThemeText>
                {data.wonItemRarityName ? (
                  <ThemeText
                    as="p"
                    tone="secondary"
                    className="mt-1 text-sm font-medium"
                    style={{ color: data.wonItemRarityColor }}
                  >
                    {data.wonItemRarityName}
                  </ThemeText>
                ) : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ValueTile
                    label="Valor na abertura"
                    value={formatMoney(data.itemValue, data.currency)}
                  />
                  <ValueTile
                    label="Método do drop"
                    value={
                      data.dropResolutionMethod === 'direct'
                        ? 'Direto'
                        : data.dropResolutionMethod === 'reroll'
                          ? 'Re-roll'
                          : 'Fallback'
                    }
                    hint={
                      data.originalRolledSkinName
                        ? `Primeiro roll: ${data.originalRolledSkinName}`
                        : `${data.rerollAttempts ?? 0} tentativas de re-roll`
                    }
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      {data.instantMarginOk ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      )}
                      <ThemeText as="p" tone="primary" className="text-sm font-medium">
                        Margem instantânea
                      </ThemeText>
                    </div>
                    <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
                      {data.marginAtDropInstantPercent.toFixed(2)}% (exigida{' '}
                      {data.requiredMarginPercent.toFixed(2)}%)
                    </ThemeText>
                  </div>
                  <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      {data.cumulativeMarginOk ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      )}
                      <ThemeText as="p" tone="primary" className="text-sm font-medium">
                        Margem acumulada
                      </ThemeText>
                    </div>
                    <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
                      {data.marginAtDropCumulativePercent.toFixed(2)}%
                    </ThemeText>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          <Surface variant="card" className="!p-6">
            <SectionTitle className="mb-1">Itens da caixa</SectionTitle>
            <ThemeText as="p" tone="secondary" className="mb-5 text-sm">
              Conteúdo atual da caixa, com destaque no item que caiu nesta abertura.
            </ThemeText>

            {data.caseItems.length === 0 ? (
              <ThemeText as="p" tone="secondary" className="text-sm">
                A caixa não possui itens cadastrados (ou foi removida).
              </ThemeText>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.caseItems.map((item) => (
                  <div
                    key={`${item.skinName}-${item.probability}`}
                    className={`rounded-2xl border p-4 ${
                      item.isWon
                        ? 'border-brand-400 bg-brand-50/50 ring-2 ring-brand-400/30 dark:border-brand-500/60 dark:bg-brand-950/30'
                        : 'border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40'
                    } ${item.enabled ? '' : 'opacity-50'}`}
                  >
                    <SkinRarityVisual
                      rarity={{
                        name: item.rarityName,
                        color: item.rarityColor,
                      }}
                      className="mb-3 h-28"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="max-h-24 max-w-full object-contain"
                        />
                      ) : (
                        <ThemeText as="span" tone="faint" className="text-xs">
                          Sem imagem
                        </ThemeText>
                      )}
                    </SkinRarityVisual>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.isWon ? <TextBadge>Sorteado</TextBadge> : null}
                      {!item.enabled ? <TextBadge>Inativo</TextBadge> : null}
                    </div>

                    <ThemeText as="p" tone="primary" className="mt-2 text-sm font-semibold">
                      {item.skinName}
                    </ThemeText>
                    {item.rarityName ? (
                      <ThemeText
                        as="p"
                        tone="secondary"
                        className="mt-0.5 text-xs"
                        style={{ color: item.rarityColor }}
                      >
                        {item.rarityName}
                      </ThemeText>
                    ) : null}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <ThemeText as="p" tone="faint">
                          Drop
                        </ThemeText>
                        <ThemeText as="p" tone="secondary" className="font-medium">
                          {formatPercent(item.probability)}
                        </ThemeText>
                      </div>
                      <div>
                        <ThemeText as="p" tone="faint">
                          Valor VE
                        </ThemeText>
                        <ThemeText as="p" tone="secondary" className="font-medium">
                          {formatMoney(item.price, data.currency)}
                        </ThemeText>
                      </div>
                      <div>
                        <ThemeText as="p" tone="faint">
                          Base
                        </ThemeText>
                        <ThemeText as="p" tone="secondary" className="font-medium">
                          {formatMoney(item.basePrice, data.currency)}
                        </ThemeText>
                      </div>
                      <div>
                        <ThemeText as="p" tone="faint">
                          Com taxa
                        </ThemeText>
                        <ThemeText as="p" tone="secondary" className="font-medium">
                          {formatMoney(item.priceWithTax, data.currency)}
                        </ThemeText>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </>
      ) : null}
    </div>
  )
}
