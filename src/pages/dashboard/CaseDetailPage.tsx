import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Box, ExternalLink, Package, Pencil } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle, SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import { computeBankInjection, evaluateDropEligibility } from '@/utils/caseEconomics'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { useGetCaseDetailsQuery } from '@/redux/store/api/cases/api.cases'
import { getErrorMessage } from '@/utils/getErrorMessage'

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatPercent(value: unknown) {
  return `${asNumber(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-3">
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">{label}</ThemeText>
      <ThemeText as="p" tone="primary" className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</ThemeText>
      {hint ? <ThemeText as="p" tone="faint" className="mt-1.5 text-xs leading-relaxed">{hint}</ThemeText> : null}
    </div>
  )
}

export default function CaseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { data, isLoading, isError, error } = useGetCaseDetailsQuery(
    { id, dataEnvironment },
    { skip: !id, refetchOnMountOrArgChange: true },
  )

  if (isLoading) return <ThemeText tone="secondary" className="py-10 text-sm">Carregando detalhes da caixa...</ThemeText>
  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/cases" className={`inline-flex items-center gap-2 ${linkBrand}`}><ArrowLeft className="h-4 w-4" />Voltar para caixas</Link>
        <Surface variant="errorBanner">{isError ? getErrorMessage(error) : 'Caixa não encontrada.'}</Surface>
      </div>
    )
  }

  const { case: lootCase, bank, financials, items } = data
  const currency = lootCase.currency
  const money = (value: unknown) => formatSkinsPrice(asNumber(value), currency)
  const opens = asNumber(
    financials.totalOpens ??
      (isSandbox ? lootCase.totalTestOpens : lootCase.totalOpens),
  )
  const nextOpenBalance =
    asNumber(bank?.balance) + computeBankInjection(asNumber(lootCase.expectedValue))

  return (
    <div className="space-y-6">
      <Link to="/dashboard/cases" className={`inline-flex items-center gap-2 ${linkBrand}`}><ArrowLeft className="h-4 w-4" />Voltar para caixas</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle={`/${lootCase.slug} · ${isSandbox ? 'Visão Dev: aberturas de teste.' : 'Visão Produção: aberturas reais.'}`}>{lootCase.name}</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/case-opens?caseId=${lootCase._id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60"><ExternalLink className="h-4 w-4" />Aberturas</Link>
          {!lootCase.deleted && !lootCase.archivedAt ? <Link to={`/dashboard/cases/${lootCase._id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"><Pencil className="h-4 w-4" />Editar caixa</Link> : null}
        </div>
      </div>

      <Surface variant="settingsPanel" className="!p-5">
        <div className="flex flex-wrap items-start gap-5">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-950/60">
            {lootCase.imageUrl ? <img src={lootCase.imageUrl} alt={lootCase.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-8 w-8 text-zinc-400" aria-hidden /></div>}
          </div>
          <div className="min-w-[14rem] flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TextBadge>{lootCase.deleted || lootCase.archivedAt ? 'Excluída do catálogo — histórico preservado' : lootCase.active ? 'Ativa' : 'Inativa'}</TextBadge>
              <TextBadge>{currency}</TextBadge>
            </div>
            {lootCase.description ? <ThemeText tone="secondary" className="text-sm leading-relaxed">{lootCase.description}</ThemeText> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-2 xl:grid-cols-4 dark:border-zinc-800">
          <Metric label="Preço da caixa" value={money(lootCase.price)} hint={lootCase.discountPercent > 0 ? `Tabela ${money(lootCase.listPrice)} · −${lootCase.discountPercent}%` : undefined} />
          <Metric label="VE" value={money(lootCase.expectedValue)} />
          <Metric label="Margem agora × alvo" value={`${formatPercent(lootCase.realMarginPercent)} × ${formatPercent(lootCase.targetMarginPercent)}`} />
          <Metric label="Montante bruto da margem" value={money(financials.houseMarginValue)} hint={`${opens.toLocaleString('pt-BR')} aberturas no ambiente atual`} />
        </div>
      </Surface>

      <Surface variant="settingsPanel" className="!p-5">
        <SectionTitle className="mb-1">Banco da caixa</SectionTitle>
        <Metric label="Saldo agora" value={money(bank.balance)} />
      </Surface>

      <Surface variant="settingsPanel" className="!p-5">
        <div className="mb-4">
          <SectionTitle>Itens da caixa</SectionTitle>
          <ThemeText tone="secondary" className="mt-1 text-sm">VE por skin e elegibilidade com o saldo mais o VE da próxima abertura.</ThemeText>
        </div>
        <div className={listTable.wrap}>
          <table className={listTable.table}>
            <thead><tr className={listTable.theadRow}><th className={listTable.th}>Item</th><th className={listTable.th}>Valor</th><th className={listTable.th}>Chance</th><th className={listTable.th}>Elegibilidade</th></tr></thead>
            <tbody className={listTable.tbody}>
              {items.map((item, index) => (
                <tr key={`${item.skinName}-${index}`} className={listTable.tr}>
                  <td className={listTable.td}><div className="flex items-center gap-3"><SkinRarityVisual rarity={{ name: item.rarityName, color: item.rarityColor }} className="h-12 w-12 shrink-0" showStar={false}>{item.image ? <img src={item.image} alt={item.skinName} className="h-10 w-10 object-contain" /> : <Box className="h-5 w-5 text-zinc-400" aria-hidden />}</SkinRarityVisual><div className="min-w-0"><ThemeText tone="primary" className="truncate text-sm font-medium">{item.skinName}</ThemeText>{item.rarityName ? <ThemeText tone="faint" className="text-xs">{item.rarityName}</ThemeText> : null}</div></div></td>
                  <td className={listTable.td}><ThemeText tone="primary" className="text-sm font-medium tabular-nums">{money(item.price)}</ThemeText><ThemeText tone="faint" className="text-xs tabular-nums">VE {money(item.expectedValue)}</ThemeText></td>
                  <td className={listTable.td}><ThemeText tone="primary" className="text-sm tabular-nums">{item.probability.toFixed(4)}%</ThemeText></td>
                  <td className={listTable.td}>{!item.enabled ? <ThemeText tone="faint" className="text-xs">Desabilitado</ThemeText> : <TextBadge>{evaluateDropEligibility({ item: { basePrice: item.basePrice, priceWithTax: item.priceWithTax, price: item.price, probability: item.probability }, openPrice: lootCase.price, bankBalance: nextOpenBalance, valueMode: lootCase.valueMode }).eligible ? 'Elegível' : 'Aguardando saldo'}</TextBadge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  )
}
