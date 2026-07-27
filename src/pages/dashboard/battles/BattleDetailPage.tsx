import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bot, Crown, Swords, User } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import {
  useGetAdminBattleByIdQuery,
} from '@/redux/store/api/battles/api.battles'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  BattleStatusBadge,
  battleModeLabel,
  battleSeatTypeLabel,
  formatBattleDateTime,
  formatBattleMoney,
} from './battleUi'

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

export default function BattleDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error } = useGetAdminBattleByIdQuery(id, {
    skip: !id,
  })

  const winner =
    data && data.winnerSeatIndex != null
      ? data.seats.find((s) => s.index === data.winnerSeatIndex)
      : null

  const allDrops =
    data?.seats.flatMap((seat) =>
      seat.drops.map((drop) => ({ seat, drop })),
    ) ?? []

  const dropsByRound = allDrops.reduce<
    Record<number, typeof allDrops>
  >((acc, item) => {
    const key = item.drop.roundIndex
    ;(acc[key] ??= []).push(item)
    return acc
  }, {})

  const roundKeys = Object.keys(dropsByRound)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/battles"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às battles
      </Link>

      <PageTitle
        subtitle={
          data
            ? `${battleModeLabel(data.mode)} · ${data.slots} slots · criada em ${formatBattleDateTime(data.createdAt)}`
            : 'Detalhe completo da battle, jogadores, caixas e drops.'
        }
      >
        Battle {id ? id.slice(-8) : ''}
      </PageTitle>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-10 text-sm">
          Carregando battle…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <BattleStatusBadge status={data.status} />
            <TextBadge>{battleModeLabel(data.mode)}</TextBadge>
            <TextBadge>{data.visibility === 'private' ? 'Privada' : 'Pública'}</TextBadge>
            {data.tieBreak ? <TextBadge>Desempate</TextBadge> : null}
            {data.fillWithBots ? <TextBadge>Fill bots</TextBadge> : null}
            {data.joinCode ? (
              <TextBadge>Código {data.joinCode}</TextBadge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ValueTile
              label="Preço total"
              value={formatBattleMoney(data.priceTotal, data.currency)}
            />
            <ValueTile
              label="Round atual"
              value={String(data.currentRound)}
              hint={`${data.caseSequence.length} caixas na sequência`}
            />
            <ValueTile
              label="Vencedor"
              value={
                winner?.name ??
                (data.winnerSeatIndex != null
                  ? `Seat #${data.winnerSeatIndex + 1}`
                  : '—')
              }
              hint={
                winner
                  ? `${battleSeatTypeLabel(winner.type)} · ${formatBattleMoney(winner.totalValue, data.currency)}`
                  : undefined
              }
            />
            <ValueTile
              label="Finalizada"
              value={formatBattleDateTime(data.finishedAt)}
              hint={
                data.startedAt
                  ? `Início ${formatBattleDateTime(data.startedAt)}`
                  : undefined
              }
            />
          </div>

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Jogadores</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.seats.map((seat) => {
                const isWinner = data.winnerSeatIndex === seat.index
                const SeatIcon =
                  seat.type === 'bot' ? Bot : seat.type === 'user' ? User : Swords
                return (
                  <div
                    key={seat.index}
                    className={`rounded-2xl border p-4 ${
                      isWinner
                        ? 'border-emerald-500/50 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-950/20'
                        : 'border-zinc-200 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {seat.avatarUrl ? (
                        <img
                          src={seat.avatarUrl}
                          alt={seat.name ?? 'Seat'}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <SeatIcon className="h-5 w-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <ThemeText
                            as="p"
                            className="truncate font-semibold"
                          >
                            {seat.name ?? `Seat #${seat.index + 1}`}
                          </ThemeText>
                          {isWinner ? (
                            <Crown className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <TextBadge>{battleSeatTypeLabel(seat.type)}</TextBadge>
                          <TextBadge>
                            {seat.paid ? 'Pago' : 'Não pago'}
                          </TextBadge>
                        </div>
                        <ThemeText
                          as="p"
                          className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          {formatBattleMoney(seat.totalValue, data.currency)}
                        </ThemeText>
                        {seat.userId ? (
                          <Link
                            to={`/dashboard/users/${seat.userId}`}
                            className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Ver usuário
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    {seat.drops.length > 0 ? (
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {seat.drops.map((drop, i) => (
                          <SkinRarityVisual
                            key={`${drop.roundIndex}-${drop.skinName}-${i}`}
                            rarity={{
                              name: drop.rarityName ?? undefined,
                              color: drop.rarityColor ?? undefined,
                            }}
                            showStar={false}
                            className="aspect-square p-1"
                          >
                            {drop.image ? (
                              <img
                                src={drop.image}
                                alt={drop.skinName}
                                className="max-h-full max-w-full object-contain"
                                title={`${drop.skinName} · R${drop.roundIndex + 1}`}
                              />
                            ) : (
                              <span className="px-1 text-center text-[9px] leading-tight text-zinc-500">
                                {drop.skinName}
                              </span>
                            )}
                          </SkinRarityVisual>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </Surface>

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Sequência de caixas</SectionTitle>
            {data.caseSequence.length === 0 ? (
              <ThemeText as="p" tone="secondary" className="text-sm">
                Nenhuma caixa
              </ThemeText>
            ) : (
              <div className="flex flex-wrap gap-3">
                {data.caseSequence.map((c, idx) => (
                  <div
                    key={`${c.caseId}-${idx}`}
                    className="flex w-36 flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex h-24 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="max-h-full max-w-full object-contain p-2"
                        />
                      ) : (
                        <Swords className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="space-y-0.5 p-2.5">
                      <ThemeText as="p" className="text-[10px] uppercase tracking-wide text-zinc-500">
                        Round {idx + 1}
                      </ThemeText>
                      <ThemeText as="p" className="truncate text-xs font-medium">
                        {c.name}
                      </ThemeText>
                      <ThemeText as="p" tone="secondary" className="text-xs">
                        {formatBattleMoney(c.price, data.currency)}
                      </ThemeText>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Drops por round</SectionTitle>
            {roundKeys.length === 0 ? (
              <ThemeText as="p" tone="secondary" className="text-sm">
                Nenhum drop registrado
              </ThemeText>
            ) : (
              <div className="space-y-6">
                {roundKeys.map((round) => (
                  <div key={round} className="space-y-3">
                    <ThemeText as="h3" className="text-sm font-semibold">
                      Round {round + 1}
                      {data.caseSequence[round] ? (
                        <span className="ml-2 font-normal text-zinc-500">
                          · {data.caseSequence[round].name}
                        </span>
                      ) : null}
                    </ThemeText>
                    <div className={listTable.wrap}>
                      <table className={listTable.table}>
                        <thead>
                          <tr>
                            <th className={listTable.th}>Jogador</th>
                            <th className={listTable.th}>Skin</th>
                            <th className={listTable.th}>Raridade</th>
                            <th className={listTable.th}>Valor</th>
                            <th className={listTable.th}>Método</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dropsByRound[round].map(({ seat, drop }, i) => (
                            <tr key={`${seat.index}-${drop.skinName}-${i}`}>
                              <td className={listTable.td}>
                                <div className="flex items-center gap-2">
                                  {seat.avatarUrl ? (
                                    <img
                                      src={seat.avatarUrl}
                                      alt=""
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : null}
                                  <span>
                                    {seat.name ?? `#${seat.index + 1}`}
                                  </span>
                                </div>
                              </td>
                              <td className={listTable.td}>
                                <div className="flex items-center gap-2">
                                  {drop.image ? (
                                    <img
                                      src={drop.image}
                                      alt=""
                                      className="h-8 w-8 object-contain"
                                    />
                                  ) : null}
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {drop.skinName}
                                  </span>
                                </div>
                              </td>
                              <td className={listTable.td}>
                                {drop.rarityName ? (
                                  <span
                                    className="inline-flex items-center gap-1.5 text-xs font-medium"
                                    style={
                                      drop.rarityColor
                                        ? { color: drop.rarityColor }
                                        : undefined
                                    }
                                  >
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          drop.rarityColor ?? '#71717a',
                                      }}
                                    />
                                    {drop.rarityName}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className={listTable.tdStrong}>
                                {formatBattleMoney(
                                  drop.itemValue,
                                  data.currency,
                                )}
                              </td>
                              <td className={listTable.tdMuted}>
                                {drop.dropResolutionMethod ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface variant="card" className="!p-4">
            <ThemeText as="p" tone="faint" className="font-mono text-xs break-all">
              ID: {data.id}
              {data.hostUserId ? ` · Host: ${data.hostUserId}` : ''}
            </ThemeText>
          </Surface>
        </>
      ) : null}
    </div>
  )
}
