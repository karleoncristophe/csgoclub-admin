import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import {
  ArenaMatchStatusBadge,
  arenaPaymentLabel,
  arenaRarityLabel,
  arenaRaritySwatch,
  arenaScriptGroupLabel,
  formatArenaPlayDateTime,
  formatArenaPlayMoney,
} from '@/components/arena/arenaPlayUi'
import { ARENA_RARITY_LABEL } from '@/components/arena/arenaRarity'
import { SkinTripleCurrencyPrices } from '@/components/skins/SkinTripleCurrencyPrices'
import { TextBadge } from '@/components/StatusPill'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import {
  ARENA_RARITIES,
  useGetArenaMatchByIdQuery,
  type ArenaRarity,
} from '@/redux/store/api/arena/api.arena'
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
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
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

function ProgressRow({
  rarity,
  before,
  after,
  destroyed,
}: {
  rarity: ArenaRarity
  before: number
  after: number
  destroyed: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 px-3 py-2.5 dark:border-zinc-800">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: arenaRaritySwatch(rarity) }}
      />
      <ThemeText as="p" tone="primary" className="min-w-[7rem] text-sm font-medium">
        {ARENA_RARITY_LABEL[rarity]}
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="flex-1 text-xs">
        Destruiu {destroyed} · progresso {before} → {after}
      </ThemeText>
    </div>
  )
}

export default function ArenaPlayDetailPage() {
  const { id = '' } = useParams()
  const matchId = id && id !== 'undefined' ? id : ''
  const { data, isLoading, isError, error } = useGetArenaMatchByIdQuery(matchId, {
    skip: !matchId,
  })

  const destroyedSet = new Set(data?.destroyedBoxIds ?? [])

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/arena/plays"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às jogadas
      </Link>

      <PageTitle
        subtitle={
          data
            ? `${arenaPaymentLabel(data.paymentMethod)} · ${formatArenaPlayDateTime(data.createdAt ?? data.startedAt)}`
            : 'Pagamento, caixas destruídas, progresso e crates premiadas.'
        }
      >
        Jogada {matchId ? matchId.slice(-8) : ''}
      </PageTitle>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-10 text-sm">
          Carregando jogada…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ArenaMatchStatusBadge status={data.status} />
            <TextBadge>{arenaPaymentLabel(data.paymentMethod)}</TextBadge>
            <TextBadge>{arenaScriptGroupLabel(data.group)}</TextBadge>
            {data.crateRarity ? (
              <TextBadge>{arenaRarityLabel(data.crateRarity)}</TextBadge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ValueTile
              label="Cobrado"
              value={formatArenaPlayMoney(data.chargedAmount, data.currency)}
              hint={data.currency}
            />
            <ValueTile
              label="Script"
              value={data.script?.name ?? '—'}
              hint={arenaScriptGroupLabel(data.script?.group ?? data.group)}
            />
            <ValueTile
              label="Início"
              value={formatArenaPlayDateTime(data.startedAt)}
              hint={`Expira ${formatArenaPlayDateTime(data.expiresAt)}`}
            />
            <ValueTile
              label="Término"
              value={formatArenaPlayDateTime(data.finishedAt)}
              hint={`${data.awarded?.length ?? 0} crate(s) premiada(s)`}
            />
          </div>

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Jogador</SectionTitle>
            {data.user ? (
              <div className="flex items-center gap-4">
                <UserAvatarLink
                  userId={data.user.id || data.user._id}
                  name={data.user.name}
                  avatar={data.user.avatar}
                  size="lg"
                />
                <div className="min-w-0">
                  <Link
                    to={`/dashboard/users/${data.user.id || data.user._id}`}
                    className="text-base font-semibold text-zinc-900 hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-300"
                  >
                    {data.user.name}
                  </Link>
                  {data.user.steamId ? (
                    <div className="mt-1">
                      <SteamIdLink steamId={data.user.steamId} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <ThemeText tone="secondary" className="text-sm">
                Jogador não encontrado.
              </ThemeText>
            )}
          </Surface>

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Prêmios</SectionTitle>
            {data.awarded?.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.awarded.map((prize, index) => (
                  <div
                    key={`${prize.crateId ?? prize.name}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-800"
                  >
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-zinc-100 dark:bg-zinc-950"
                      style={{ borderColor: `${arenaRaritySwatch(prize.rarity)}88` }}
                    >
                      {prize.image ? (
                        <img
                          src={prize.image}
                          alt=""
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {prize.crateId ? (
                        <Link
                          to={`/dashboard/arena/${prize.crateId}`}
                          className="text-sm font-semibold text-zinc-900 hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-300"
                        >
                          {prize.crateName ?? prize.name}
                        </Link>
                      ) : (
                        <ThemeText as="p" tone="primary" className="text-sm font-semibold">
                          {prize.crateName ?? prize.name}
                        </ThemeText>
                      )}
                      <ThemeText
                        as="p"
                        className="mt-0.5 text-xs"
                        style={{ color: arenaRaritySwatch(prize.rarity) }}
                      >
                        {arenaRarityLabel(prize.rarity)}
                        {prize.unopened ? ' · fechada' : ''}
                      </ThemeText>
                      <div className="mt-2">
                        <SkinTripleCurrencyPrices
                          compact
                          valueBrl={prize.valueBrl}
                          valueUsd={prize.valueUsd}
                          valueEur={prize.valueEur}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ThemeText tone="secondary" className="text-sm">
                Esta jogada não entregou crate.
              </ThemeText>
            )}
          </Surface>

          {data.pricingSnapshot ? (
            <Surface variant="card" className="!p-6 space-y-4">
              <SectionTitle>Preço da jogada (snapshot)</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ValueTile
                  label="Lista BRL"
                  value={formatArenaPlayMoney(data.pricingSnapshot.listPriceBrl, 'BRL')}
                />
                <ValueTile
                  label="Final BRL"
                  value={formatArenaPlayMoney(data.pricingSnapshot.valueBrl, 'BRL')}
                  hint={`${data.pricingSnapshot.discountPercent}% off`}
                />
                <ValueTile
                  label="Final USD"
                  value={formatArenaPlayMoney(data.pricingSnapshot.valueUsd, 'USD')}
                />
                <ValueTile
                  label="Final EUR"
                  value={formatArenaPlayMoney(data.pricingSnapshot.valueEur, 'EUR')}
                />
              </div>
            </Surface>
          ) : null}

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Progresso por raridade</SectionTitle>
            <div className="space-y-2">
              {ARENA_RARITIES.map((rarity) => (
                <ProgressRow
                  key={rarity}
                  rarity={rarity}
                  before={data.progressBefore?.[rarity] ?? 0}
                  after={data.progressAfter?.[rarity] ?? 0}
                  destroyed={data.destroyedCounts?.[rarity] ?? 0}
                />
              ))}
            </div>
          </Surface>

          <Surface variant="card" className="!p-6 space-y-4">
            <SectionTitle>Caixas da rodada</SectionTitle>
            <ThemeText tone="secondary" className="text-sm">
              {destroyedSet.size} destruída(s) de {data.boxes.length}.
            </ThemeText>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
              {data.boxes.map((box) => {
                const destroyed = destroyedSet.has(box.id)
                return (
                  <div
                    key={box.id}
                    title={`${arenaRarityLabel(box.rarity)} · #${box.index + 1}${destroyed ? ' · destruída' : ''}`}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-center ${
                      destroyed
                        ? 'border-brand-400/60 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-500/15'
                        : 'border-zinc-200 bg-zinc-50/60 opacity-60 dark:border-zinc-800 dark:bg-zinc-950/40'
                    }`}
                  >
                    <span
                      className="mb-1 h-2 w-2 rounded-full"
                      style={{ background: arenaRaritySwatch(box.rarity) }}
                    />
                    <ThemeText as="span" tone="primary" className="text-[10px] font-semibold">
                      {box.index + 1}
                    </ThemeText>
                    <ThemeText as="span" tone="faint" className="text-[9px] leading-tight">
                      {arenaRarityLabel(box.rarity)}
                    </ThemeText>
                  </div>
                )
              })}
            </div>
          </Surface>
        </>
      ) : null}
    </div>
  )
}
