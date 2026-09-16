import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Repeat2 } from 'lucide-react'
import { BackLink } from '@/components/ui/BackLink'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import {
  SwapStatusBadge,
  formatSwapDateTime,
  formatSwapMoney,
  swapFundingLabel,
  swapLeftAccountHint,
} from '@/components/swaps/swapUi'
import { TextBadge } from '@/components/StatusPill'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { useGetAdminSwapByIdQuery } from '@/redux/store/api/swaps/api.swaps'
import { getErrorMessage } from '@/utils/getErrorMessage'

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

export default function SwapDetailPage() {
  const { id = '' } = useParams()
  const swapId = id && id !== 'undefined' ? id : ''
  const dataEnvironment = usePlatformDataEnvironment()
  const { data, isLoading, isError, error } = useGetAdminSwapByIdQuery(
    { id: swapId, dataEnvironment },
    { skip: !swapId },
  )

  const currency = data?.currency ?? 'BRL'

  return (
    <div className="space-y-6">
      <BackLink
        fallback="/dashboard/swaps"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos swaps
      </BackLink>

      <PageTitle
        subtitle={
          data
            ? `${swapLeftAccountHint(data)} · ${formatSwapDateTime(data.createdAt, 'long')}`
            : 'O que saiu da conta, o custo do alvo na dash e o que sobrou de troco.'
        }
      >
        Swap {data?.targetName ? `· ${data.targetName}` : swapId ? swapId.slice(-8) : ''}
      </PageTitle>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-10 text-sm">
          Carregando swap…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SwapStatusBadge status={data.status} />
            <TextBadge>{swapFundingLabel(data)}</TextBadge>
            <TextBadge>{data.currency}</TextBadge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ValueTile
              label="Saiu em skins"
              value={formatSwapMoney(data.sourceItemsTotal, currency)}
              hint={
                data.sourceItemCount === 0
                  ? 'Nenhuma skin ofertada'
                  : data.sourceItemCount === 1
                    ? '1 skin do inventário'
                    : `${data.sourceItemCount} skins do inventário`
              }
            />
            <ValueTile
              label="Saiu em saldo"
              value={formatSwapMoney(data.balanceUsed, currency)}
              hint={data.balanceUsed > 0 ? 'Debitado da carteira' : 'Alvo coberto só com skins'}
            />
            <ValueTile
              label="Montante"
              value={formatSwapMoney(data.offeredTotal, currency)}
              hint="Skins + saldo que saíram da conta"
            />
            <ValueTile
              label="Custou na dash"
              value={formatSwapMoney(data.targetValue, currency)}
              hint="Preço do alvo com taxa"
            />
            <ValueTile
              label="Sobrou"
              value={formatSwapMoney(data.changeCredited, currency)}
              hint={data.changeCredited > 0 ? 'Troco creditado na carteira' : 'Sem troco'}
            />
          </div>

          <Surface variant="settingsPanel" className="!p-5 space-y-3">
            <SectionTitle>Conta do swap</SectionTitle>
            <ThemeText as="p" tone="secondary" className="text-sm leading-relaxed">
              Skins ofertadas + saldo debitado = custo na dash + troco.
            </ThemeText>
            <p className="rounded-xl border border-border bg-surface-secondary px-4 py-3 font-mono text-sm tabular-nums">
              {formatSwapMoney(data.sourceItemsTotal, currency)} +{' '}
              {formatSwapMoney(data.balanceUsed, currency)} ={' '}
              {formatSwapMoney(data.targetValue, currency)} +{' '}
              {formatSwapMoney(data.changeCredited, currency)}
            </p>
            {data.status === 'failed' ? (
              <ThemeText as="p" tone="faint" className="text-xs">
                Este swap falhou: as skins reservadas voltam ao inventário e o saldo não fica
                debitado.
              </ThemeText>
            ) : null}
          </Surface>

          <Surface variant="settingsPanel" className="!p-5 space-y-4">
            <SectionTitle>Jogador</SectionTitle>
            {data.user ? (
              <div className="flex items-center gap-4">
                <UserAvatarLink
                  userId={data.user._id}
                  name={data.user.name}
                  avatar={data.user.avatarFull ?? data.user.avatarMedium ?? data.user.avatar}
                  size="lg"
                />
                <div className="min-w-0">
                  <Link
                    to={`/dashboard/users/${data.user._id}`}
                    className="text-base font-semibold text-zinc-900 hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-300"
                  >
                    {data.user.name}
                  </Link>
                  {data.user.steamId ? (
                    <div className="mt-1">
                      <SteamIdLink steamId={data.user.steamId} />
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Link to={`/dashboard/users/${data.user._id}`} className={linkBrand}>
                      Ver perfil
                    </Link>
                    <Link
                      to={`/dashboard/swaps?userId=${data.user._id}`}
                      className={linkBrand}
                    >
                      Swaps deste jogador
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <ThemeText tone="secondary" className="text-sm">
                Jogador não encontrado nesta visão.
              </ThemeText>
            )}
          </Surface>

          <Surface variant="settingsPanel" className="!p-5">
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="mx-auto w-full max-w-[220px]">
                <SkinRarityVisual
                  rarity={{
                    name: data.targetRarityName ?? undefined,
                    color: data.targetRarityColor ?? undefined,
                  }}
                  className="aspect-square w-full"
                  showStar={false}
                >
                  {data.targetImage ? (
                    <img
                      src={data.targetImage}
                      alt=""
                      className="max-h-40 max-w-full object-contain"
                    />
                  ) : (
                    <Repeat2 className="h-10 w-10 text-zinc-400" />
                  )}
                </SkinRarityVisual>
                <ThemeText as="p" tone="primary" className="mt-3 text-center text-base font-semibold">
                  {data.targetName}
                </ThemeText>
                {data.targetRarityName ? (
                  <ThemeText as="p" tone="faint" className="mt-1 text-center text-xs">
                    {data.targetRarityName}
                  </ThemeText>
                ) : null}
              </div>

              <div className="space-y-4">
                <SectionTitle>Skin que entrou</SectionTitle>
                <ThemeText as="p" tone="secondary" className="text-sm leading-relaxed">
                  Este era o alvo na dash. O valor abaixo é o preço com taxa no momento do swap —
                  o que a skin custou para fechar a troca. O envio vai direto para a Steam.
                </ThemeText>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ValueTile
                    label="Custo na dash"
                    value={formatSwapMoney(data.targetValue, currency)}
                    hint="priceWithTax do catálogo"
                  />
                  <ValueTile
                    label="Item recebido"
                    value={data.receivedItem?.id ? data.receivedItem.id.slice(-8) : '—'}
                    hint={
                      data.receivedItem
                        ? data.receivedItem.status === 'pending_withdraw' ||
                          data.receivedItem.status === 'withdrawn'
                          ? 'Envio direto para a Steam'
                          : data.receivedItem.name ?? 'Registro do envio'
                        : 'Ainda não enviado'
                    }
                  />
                </div>
              </div>
            </div>
          </Surface>

          <Surface variant="settingsPanel" className="!p-5 space-y-4">
            <SectionTitle>O que saiu da conta</SectionTitle>
            {data.sourceItems.length === 0 && data.balanceUsed <= 0 ? (
              <ThemeText as="p" tone="secondary" className="text-sm">
                Nenhum débito registrado neste swap.
              </ThemeText>
            ) : null}

            {data.balanceUsed > 0 ? (
              <div className="rounded-xl border border-border bg-surface-secondary px-4 py-3">
                <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
                  Saldo
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 text-base font-semibold">
                  {formatSwapMoney(data.balanceUsed, currency)}
                </ThemeText>
                <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                  Complemento quando as skins não cobriam o alvo.
                </ThemeText>
              </div>
            ) : null}

            {data.sourceItems.length > 0 ? (
              <div className={listTable.wrap}>
                <table className={listTable.table}>
                  <thead>
                    <tr className={listTable.theadRow}>
                      <th className={listTable.th}>Skin ofertada</th>
                      <th className={listTable.th}>Status</th>
                      <th className={`${listTable.th} text-right`}>Valor</th>
                    </tr>
                  </thead>
                  <tbody className={listTable.tbody}>
                    {data.sourceItems.map((item) => (
                      <tr key={item.id} className={listTable.tr}>
                        <td className={listTable.tdStrong}>
                          <div className="flex min-w-[220px] items-center gap-2">
                            <SkinRarityVisual
                              rarity={{
                                name: item.rarityName ?? undefined,
                                color: item.rarityColor ?? undefined,
                              }}
                              className="h-11 w-16 shrink-0"
                              showStar={false}
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt=""
                                  className="max-h-10 max-w-full object-contain"
                                />
                              ) : (
                                <ThemeText as="span" tone="faint" className="text-[10px]">
                                  —
                                </ThemeText>
                              )}
                            </SkinRarityVisual>
                            <span className="truncate">{item.name ?? 'Skin removida'}</span>
                          </div>
                        </td>
                        <td className={listTable.td}>
                          <TextBadge>
                            {item.status === 'swapped'
                              ? 'Trocada'
                              : item.status === 'active'
                                ? 'Ativa'
                                : item.status ?? '—'}
                          </TextBadge>
                        </td>
                        <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                          {formatSwapMoney(item.value, item.currency ?? currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ThemeText as="p" tone="faint" className="text-xs">
                Swap pago só com saldo — nenhuma skin saiu do inventário.
              </ThemeText>
            )}
          </Surface>
        </>
      ) : null}
    </div>
  )
}
