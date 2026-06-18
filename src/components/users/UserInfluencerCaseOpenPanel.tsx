import { useMemo, useState } from 'react'
import { Box, Loader2, Package, Wallet } from 'lucide-react'
import { Autocomplete } from '@/components/ui/Autocomplete'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import { useGetCasesQuery, type LootCase } from '@/redux/store/api/cases/api.cases'
import {
  useOpenUserTestCaseMutation,
  type UserCaseOpenBulkResult,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  userHighlightBoxClass,
  userInfluencerPanelClass,
  userStatCardClass,
} from './userPanelClasses'

const DROP_METHOD_LABEL = {
  direct: 'Direto',
  reroll: 'Re-roll',
  fallback: 'Fallback',
} as const

const DROP_METHOD_CLASS = {
  direct:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  reroll: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  fallback: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
} as const

function formatLedgerMargin(ledger?: LootCase['testEconomyLedger']) {
  if (!ledger || ledger.totalRevenue <= 0) return '—'
  const profit = ledger.totalRevenue - ledger.totalPayout
  const margin = (profit / ledger.totalRevenue) * 100
  return `${margin.toFixed(1)}%`
}

type UserInfluencerCaseOpenPanelProps = {
  userId: string
}

export function UserInfluencerCaseOpenPanel({ userId }: UserInfluencerCaseOpenPanelProps) {
  const { data: cases = [], isLoading: casesLoading } = useGetCasesQuery()
  const activeCases = useMemo(
    () => cases.filter((lootCase) => lootCase.active),
    [cases],
  )

  const [selectedCaseId, setSelectedCaseId] = useState(activeCases[0]?._id ?? '')
  const [count, setCount] = useState('1')
  const [disposition, setDisposition] = useState<'keep' | 'convert'>('keep')
  const [batchResult, setBatchResult] = useState<UserCaseOpenBulkResult | null>(null)
  const [openCase, openState] = useOpenUserTestCaseMutation()

  const selectedCase = useMemo(
    () => activeCases.find((item) => item._id === selectedCaseId) ?? null,
    [activeCases, selectedCaseId],
  )

  const caseOptions = useMemo(
    () =>
      activeCases.map((lootCase) => ({
        value: lootCase._id,
        label: lootCase.name,
        description: `${lootCase.slug} · ${formatSkinsPrice(lootCase.price, lootCase.currency)}`,
      })),
    [activeCases],
  )

  const parsedCount = Math.min(100, Math.max(1, Number(count) || 1))
  const estimatedCost =
    selectedCase != null ? selectedCase.price * parsedCount : 0

  const handleOpen = async () => {
    if (!selectedCaseId) return
    const normalizedCount = Math.min(100, Math.max(1, Number(count) || 1))
    setCount(String(normalizedCount))

    try {
      const response = await openCase({
        userId,
        caseId: selectedCaseId,
        count: normalizedCount,
        disposition,
      }).unwrap()
      setBatchResult(response)
    } catch {
      setBatchResult(null)
    }
  }

  if (casesLoading) {
    return (
      <Surface variant="card" className="!p-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando caixas...
        </div>
      </Surface>
    )
  }

  if (activeCases.length === 0) {
    return (
      <Surface variant="card" className="!p-6">
        <ThemeText as="p" tone="secondary" className="text-sm">
          Nenhuma caixa ativa disponível para abertura de teste.
        </ThemeText>
      </Surface>
    )
  }

  const testLedger = batchResult?.testLedgerAfter ?? selectedCase?.testEconomyLedger
  const currency = selectedCase?.currency ?? 'USD'

  return (
    <Surface variant="card" className={`!p-6 ${userInfluencerPanelClass}`}>
      <div className="mb-5">
        <SectionTitle className="flex items-center gap-2">
          <Box className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Abrir caixa de teste
        </SectionTitle>
        <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
          Abre em lote com uma única operação no MongoDB: débito atômico, insertMany nas
          aberturas/inventário e incremento da margem fake — preparado para alto volume.
        </ThemeText>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_120px_200px_auto] lg:items-end">
        <Autocomplete
          label="Caixa"
          name="influencerTestCaseId"
          value={selectedCaseId}
          options={caseOptions}
          maxVisible={10}
          placeholder="Buscar caixa..."
          onChange={(nextCaseId) => {
            setSelectedCaseId(nextCaseId)
            setBatchResult(null)
          }}
        />

        <Input
          label="Quantidade"
          name="influencerOpenCount"
          type="number"
          min={1}
          max={100}
          step={1}
          value={count}
          onChange={(event) => {
            setCount(event.target.value)
            setBatchResult(null)
          }}
        />

        <Select
          label="Destino"
          name="influencerDisposition"
          value={disposition}
          onChange={(event) => {
            setDisposition(event.target.value as 'keep' | 'convert')
            setBatchResult(null)
          }}
        >
          <option value="keep">Inventário</option>
          <option value="convert">Saldo bônus</option>
        </Select>

        <Button
          type="button"
          disabled={!selectedCaseId || openState.isLoading}
          onClick={handleOpen}
        >
          {openState.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Box className="h-4 w-4" />
          )}
          Abrir {parsedCount > 1 ? `${parsedCount}x` : ''}
        </Button>
      </div>

      {selectedCase ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Preço unitário
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(selectedCase.price, currency)}
            </ThemeText>
          </div>
          <div className={userStatCardClass.brand}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Custo total
            </ThemeText>
            <ThemeText
              as="p"
              tone="primary"
              className="mt-1 text-sm font-semibold dark:text-brand-100"
            >
              {formatSkinsPrice(estimatedCost, currency)}
            </ThemeText>
          </div>
          <div className={userStatCardClass.amber}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Margem fake
            </ThemeText>
            <ThemeText
              as="p"
              tone="primary"
              className="mt-1 text-sm font-semibold dark:text-amber-100"
            >
              {formatLedgerMargin(testLedger)}
            </ThemeText>
          </div>
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Aberturas teste
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {selectedCase.totalTestOpens}
            </ThemeText>
          </div>
        </div>
      ) : null}

      {openState.error ? (
        <p className={`${surfaceClass('errorBanner')} mb-4`}>
          {getErrorMessage(openState.error)}
        </p>
      ) : null}

      {batchResult ? (
        <div className={userHighlightBoxClass}>
          <ThemeText as="p" tone="primary" className="text-sm font-semibold">
            {batchResult.count} abertura(s) concluída(s) —{' '}
            {batchResult.disposition === 'keep'
              ? `${batchResult.inventoryItemsCreated} item(ns) no inventário`
              : `${formatSkinsPrice(batchResult.creditedAmount ?? 0, currency)} creditados`}
          </ThemeText>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ThemeText as="p" tone="secondary" className="text-xs">
              Pago: {formatSkinsPrice(batchResult.totalPaid, currency)}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-xs">
              Valor ganho: {formatSkinsPrice(batchResult.totalWonValue, currency)}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-xs">
              Saldo bônus: {formatSkinsPrice(batchResult.balances.bonusBalance, currency)}
            </ThemeText>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className={userStatCardClass.default}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase">
                Direto
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold">
                {batchResult.dropSummary.directCount}
              </ThemeText>
            </div>
            <div className={userStatCardClass.amber}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase">
                Re-roll
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold dark:text-amber-100">
                {batchResult.dropSummary.rerollCount}
              </ThemeText>
            </div>
            <div className={`${userStatCardClass.default} dark:border-rose-500/30 dark:bg-rose-500/10`}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase">
                Fallback
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold dark:text-rose-200">
                {batchResult.dropSummary.fallbackCount}
              </ThemeText>
            </div>
            <div className={userStatCardClass.brand}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase">
                Margem fake
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold dark:text-brand-100">
                {batchResult.dropSummary.marginPercent.toFixed(1)}%
              </ThemeText>
            </div>
          </div>

          <div className="mt-4 max-h-64 space-y-2 overflow-auto">
            {batchResult.items.map((item, index) => (
              <div
                key={`${item.skinName}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700/80 dark:bg-zinc-900/70"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-contain" />
                  ) : disposition === 'keep' ? (
                    <Package className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <Wallet className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <ThemeText as="p" tone="primary" className="truncate text-sm font-medium">
                    {item.skinName}
                  </ThemeText>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ThemeText as="p" tone="faint" className="text-xs">
                      {formatSkinsPrice(item.value, currency)}
                    </ThemeText>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        DROP_METHOD_CLASS[item.dropResolutionMethod]
                      }`}
                    >
                      {DROP_METHOD_LABEL[item.dropResolutionMethod]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => setBatchResult(null)}
          >
            Limpar resultado
          </Button>
        </div>
      ) : null}
    </Surface>
  )
}
