import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Box } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { useGetArenaCrateOpenByIdQuery } from '@/redux/store/api/arena/api.arena'
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
    <div className="rounded-xl border border-border bg-surface-secondary p-3">
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

export default function ArenaCrateOpenDetailPage() {
  const { openId = '' } = useParams()
  const { data, isLoading, isError, error } = useGetArenaCrateOpenByIdQuery(openId, {
    skip: !openId,
  })

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/arena/crate-opens"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às aberturas Arena
      </Link>

      <PageTitle subtitle="Skin sorteada ao abrir a crate, com auditoria do banco e tabela de drops.">
        Detalhe da abertura Arena
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
          <Surface variant="settingsPanel" className="!p-5">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="mx-auto w-full max-w-[220px]">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  {data.crate.imageUrl ? (
                    <img
                      src={data.crate.imageUrl}
                      alt={data.crate.name}
                      className="aspect-square w-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-zinc-400">
                      <Box className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <ThemeText as="p" tone="primary" className="mt-3 text-center text-base font-semibold">
                  {data.crate.name}
                </ThemeText>
                {data.crate.slug ? (
                  <ThemeText as="p" tone="faint" className="mt-1 text-center text-xs">
                    {data.crate.slug}
                  </ThemeText>
                ) : null}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <TextBadge>Convertido</TextBadge>
                  {data.isTestOpen ? <TextBadge>Abertura de teste</TextBadge> : null}
                  <MethodBadge method={data.dropResolutionMethod} />
                  {data.wasRerolled ? <TextBadge>Re-roll</TextBadge> : null}
                </div>

                <ThemeText as="p" tone="secondary" className="mt-3 text-sm">
                  {formatDateTime(data.createdAt)}
                </ThemeText>

                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link to={`/dashboard/users/${data.userId}`} className={linkBrand}>
                    Ver perfil do cliente
                  </Link>
                  <Link to={`/dashboard/arena/${data.crateId}`} className={linkBrand}>
                    Ver crate
                  </Link>
                  {data.matchId ? (
                    <Link to={`/dashboard/arena/plays/${data.matchId}`} className={linkBrand}>
                      Ver jogada
                    </Link>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <ValueTile
                    label="Preço da jogada"
                    value={formatMoney(data.pricePaid, data.currency)}
                    hint="Injeção no banco da crate"
                  />
                  <ValueTile
                    label="Valor creditado"
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
                </div>
              </div>
            </div>
          </Surface>

          <Surface variant="settingsPanel" className="!p-5">
            <SectionTitle>Item sorteado</SectionTitle>
            <div className="mt-4 flex items-center gap-4">
              <SkinRarityVisual
                rarity={{
                  name: data.wonItemRarityName,
                  color: data.wonItemRarityColor,
                }}
                className="h-24 w-28 shrink-0"
                showStar={false}
              >
                {data.wonItemImage ? (
                  <img
                    src={data.wonItemImage}
                    alt=""
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : null}
              </SkinRarityVisual>
              <div className="min-w-0">
                <ThemeText as="p" tone="primary" className="text-lg font-semibold">
                  {data.wonSkinName}
                </ThemeText>
                {data.wonItemRarityName ? (
                  <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                    {data.wonItemRarityName}
                  </ThemeText>
                ) : null}
                {data.originalRolledSkinName &&
                data.originalRolledSkinName !== data.wonSkinName ? (
                  <ThemeText as="p" tone="faint" className="mt-2 text-xs">
                    Primeiro roll: {data.originalRolledSkinName}
                  </ThemeText>
                ) : null}
              </div>
            </div>
          </Surface>

          <Surface variant="settingsPanel" className="!p-5">
            <SectionTitle>Banco virtual</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ValueTile
                label="Antes"
                value={formatMoney(data.bankBalanceBefore, data.currency)}
              />
              <ValueTile
                label="Injeção"
                value={formatMoney(data.bankInjection, data.currency)}
              />
              <ValueTile
                label="Depois"
                value={formatMoney(data.bankBalanceAfter, data.currency)}
              />
              <ValueTile
                label="Exigido / coberto"
                value={formatMoney(data.requiredBankBalance, data.currency)}
                hint={
                  data.coveredByOpenPrice
                    ? 'Coberto pelo preço da jogada'
                    : `Campo ${data.bankField}`
                }
              />
            </div>
          </Surface>

          <Surface variant="settingsPanel" className="!p-5">
            <SectionTitle>Itens da crate</SectionTitle>
            <div className={`mt-4 ${listTable.wrap}`}>
              <table className={listTable.table}>
                <thead>
                  <tr className={listTable.theadRow}>
                    <th className={listTable.th}>Item</th>
                    <th className={listTable.th}>Chance</th>
                    <th className={listTable.th}>Valor</th>
                  </tr>
                </thead>
                <tbody className={listTable.tbody}>
                  {data.crateItems.map((item) => (
                    <tr
                      key={item.skinName}
                      className={`${listTable.tr} ${item.isWon ? 'bg-accent-soft/40' : ''}`}
                    >
                      <td className={listTable.td}>
                        <div className="flex items-center gap-3">
                          <SkinRarityVisual
                            rarity={{
                              name: item.rarityName,
                              color: item.rarityColor,
                            }}
                            className="h-10 w-12 shrink-0"
                            showStar={false}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="max-h-8 max-w-full object-contain"
                              />
                            ) : null}
                          </SkinRarityVisual>
                          <span className={item.isWon ? 'font-semibold' : undefined}>
                            {item.skinName}
                            {item.isWon ? ' · ganhou' : ''}
                          </span>
                        </div>
                      </td>
                      <td className={listTable.tdMuted}>{formatPercent(item.probability)}</td>
                      <td className={listTable.tdMuted}>
                        {formatMoney(
                          data.currency === 'BRL'
                            ? (item.valueBrl ?? 0)
                            : data.currency === 'EUR'
                              ? (item.valueEur ?? 0)
                              : (item.valueUsd ?? 0),
                          data.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      ) : null}
    </div>
  )
}
