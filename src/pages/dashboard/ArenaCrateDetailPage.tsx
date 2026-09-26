import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Box, ExternalLink, Package, Pencil } from 'lucide-react'
import {
  ARENA_RARITY_COLOR,
  ARENA_RARITY_LABEL,
} from '@/components/arena/arenaRarity'
import { BankProgressBar } from '@/components/cases/BankProgressBar'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { useGetArenaCrateDetailsQuery } from '@/redux/store/api/arena/api.arena'
import {
  describeDropEligibility,
  evaluateDropEligibility,
} from '@/utils/caseEconomics'
import { getErrorMessage } from '@/utils/getErrorMessage'

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-3">
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">{label}</ThemeText>
      <div className="mt-2 text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</div>
      {hint ? <div className="mt-1.5 text-xs leading-relaxed text-muted/75">{hint}</div> : null}
    </div>
  )
}

function ItemEligibilityCell({
  enabled,
  eligibility,
  currency,
}: {
  enabled: boolean
  eligibility: ReturnType<typeof evaluateDropEligibility>
  currency: string
}) {
  if (!enabled) {
    return <ThemeText tone="faint" className="text-xs">Desabilitado</ThemeText>
  }

  return (
    <div className="min-w-[8.5rem] space-y-1.5">
      {eligibility.eligible ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          Sim
        </span>
      ) : (
        <span
          className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          title={`Banco em ${formatSkinsPrice(eligibility.bankBalance, currency)} · exige ${formatSkinsPrice(eligibility.requiredBankBalance, currency)} · faltam ${formatSkinsPrice(eligibility.bankShortfall, currency)}`}
        >
          {describeDropEligibility(eligibility)}
        </span>
      )}
      <BankProgressBar
        ratio={
          eligibility.coveredByOpenPrice || eligibility.requiredBankBalance <= 0
            ? 1
            : eligibility.bankBalance / eligibility.requiredBankBalance
        }
      />
    </div>
  )
}

export default function ArenaCrateDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { data, isLoading, isError, error } = useGetArenaCrateDetailsQuery(
    { id, dataEnvironment, currency: SkinsCurrency.BRL },
    { skip: !id, refetchOnMountOrArgChange: true },
  )

  if (isLoading) return <ThemeText tone="secondary" className="py-10 text-sm">Carregando detalhes da crate...</ThemeText>
  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/arena" className={`inline-flex items-center gap-2 ${linkBrand}`}><ArrowLeft className="h-4 w-4" />Voltar para Arena</Link>
        <Surface variant="errorBanner">{isError ? getErrorMessage(error) : 'Crate não encontrada.'}</Surface>
      </div>
    )
  }

  const { crate, bank, items } = data
  const currency = data.currency
  const money = (value: unknown) => formatSkinsPrice(asNumber(value), currency)
  const nextOpenBalance =
    asNumber(bank.balance) + asNumber(bank.injectionPerOpen)

  return (
    <div className="space-y-6">
      <Link to="/dashboard/arena" className={`inline-flex items-center gap-2 ${linkBrand}`}><ArrowLeft className="h-4 w-4" />Voltar para Arena</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle={`/${crate.slug} · ${isSandbox ? 'Visão Dev: aberturas de teste.' : 'Visão Produção: aberturas reais.'}`}>{crate.name}</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/arena/crate-opens?crateId=${crate._id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60"><ExternalLink className="h-4 w-4" />Aberturas</Link>
          <Link to={`/dashboard/arena/${crate._id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"><Pencil className="h-4 w-4" />Editar crate</Link>
        </div>
      </div>

      <Surface variant="settingsPanel" className="!p-5">
        <div className="flex flex-wrap items-start gap-5">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-950/60">
            {crate.imageUrl ? <img src={crate.imageUrl} alt={crate.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-8 w-8 text-zinc-400" aria-hidden /></div>}
          </div>
          <div className="min-w-[14rem] flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TextBadge>{crate.active ? 'Ativa' : 'Inativa'}</TextBadge>
              <TextBadge>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: crate.color || ARENA_RARITY_COLOR[crate.rarity] }}
                  />
                  {ARENA_RARITY_LABEL[crate.rarity] ?? crate.rarity}
                </span>
              </TextBadge>
              <TextBadge>{currency}</TextBadge>
            </div>
            {crate.description ? <ThemeText tone="secondary" className="text-sm leading-relaxed">{crate.description}</ThemeText> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-2 xl:grid-cols-4 dark:border-zinc-800">
          <Metric label="VE" value={money(crate.expectedValue)} />
        </div>
      </Surface>

      <Surface variant="settingsPanel" className="!p-5">
        <SectionTitle className="mb-1">Banco da crate</SectionTitle>
        <Metric label="Saldo agora" value={money(bank.balance)} />
      </Surface>

      <Surface variant="settingsPanel" className="!p-5">
        <div className="mb-4">
          <SectionTitle>Itens da crate</SectionTitle>
          <ThemeText tone="secondary" className="mt-1 text-sm">Preço da skin, quanto ela contribui na caixa e se o banco já libera o drop.</ThemeText>
        </div>
        <div className={listTable.wrap}>
          <table className={listTable.table}>
            <thead><tr className={listTable.theadRow}><th className={listTable.th}>Item</th><th className={listTable.th}>Valor</th><th className={listTable.th}>Chance</th><th className={listTable.th}>Elegível</th></tr></thead>
            <tbody className={listTable.tbody}>
              {items.map((item, index) => {
                const eligibility = evaluateDropEligibility({
                  item: {
                    basePrice: item.price,
                    priceWithTax: item.price,
                    price: item.price,
                    probability: item.probability,
                  },
                  openPrice: crate.expectedValue,
                  bankBalance: nextOpenBalance,
                  valueMode: 'with_tax',
                })

                return (
                  <tr key={`${item.skinName}-${index}`} className={listTable.tr}>
                    <td className={listTable.td}>
                      <div className="flex items-center gap-3">
                        <SkinRarityVisual rarity={{ name: item.rarityName, color: item.rarityColor }} className="h-12 w-12 shrink-0" showStar={false}>
                          {item.image ? <img src={item.image} alt={item.skinName} className="h-10 w-10 object-contain" /> : <Box className="h-5 w-5 text-zinc-400" aria-hidden />}
                        </SkinRarityVisual>
                        <div className="min-w-0">
                          <ThemeText tone="primary" className="truncate text-sm font-medium">{item.skinName}</ThemeText>
                          {item.rarityName ? <ThemeText tone="faint" className="text-xs">{item.rarityName}</ThemeText> : null}
                        </div>
                      </div>
                    </td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm font-medium tabular-nums">{money(item.price)}</ThemeText>
                      <ThemeText tone="faint" className="text-xs tabular-nums">Contribuição {money(item.expectedValue)}</ThemeText>
                    </td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm tabular-nums">{item.probability.toFixed(4)}%</ThemeText>
                    </td>
                    <td className={listTable.td}>
                      <ItemEligibilityCell
                        enabled={item.enabled}
                        eligibility={eligibility}
                        currency={currency}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  )
}
