import { useEffect, useMemo, useRef, useState } from 'react'
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
  countEligibleDropItems,
  getEnabledDropItems,
  type CaseValueMode,
} from '@/utils/caseEconomics'
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

function groupBatchItems(items: UserCaseOpenBulkResult['items']) {
  const groups = new Map<
    string,
    {
      item: UserCaseOpenBulkResult['items'][number]
      count: number
    }
  >()

  for (const item of items) {
    const key = `${item.skinName}|${item.value}|${item.dropResolutionMethod}`
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
    } else {
      groups.set(key, { item, count: 1 })
    }
  }

  return Array.from(groups.values()).sort((left, right) => right.item.value - left.item.value)
}

type UserInfluencerCaseOpenPanelProps = {
  userId: string
  walletCurrency?: string
}

export function UserInfluencerCaseOpenPanel({
  userId,
  walletCurrency = 'USD',
}: UserInfluencerCaseOpenPanelProps) {
  const { data: cases = [], isLoading: casesLoading } = useGetCasesQuery()
  const activeCases = useMemo(
    () => cases.filter((lootCase) => lootCase.active),
    [cases],
  )

  const [selectedCaseId, setSelectedCaseId] = useState(activeCases[0]?._id ?? '')
  const [count, setCount] = useState('1')
  const [disposition, setDisposition] = useState<'keep' | 'convert'>('keep')
  const [batchResult, setBatchResult] = useState<UserCaseOpenBulkResult | null>(null)
  const [resultEpoch, setResultEpoch] = useState(0)
  const resultsListRef = useRef<HTMLDivElement>(null)
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

  const testLedger = batchResult?.testLedgerAfter ?? selectedCase?.testEconomyLedger

  const eligiblePoolCount = useMemo(() => {
    if (!selectedCase) return null
    return countEligibleDropItems({
      items: selectedCase.items,
      openPrice: selectedCase.price,
      caseTargetMarginPercent: selectedCase.targetMarginPercent,
      ledger: testLedger ?? { totalRevenue: 0, totalPayout: 0 },
      valueMode: (selectedCase.valueMode ?? 'with_tax') as CaseValueMode,
    })
  }, [selectedCase, testLedger])

  const enabledPoolSize = selectedCase
    ? getEnabledDropItems(selectedCase.items).length
    : 0

  const groupedBatchItems = useMemo(
    () => (batchResult ? groupBatchItems(batchResult.items) : []),
    [batchResult],
  )

  useEffect(() => {
    if (!batchResult) return
    resultsListRef.current?.scrollTo({ top: 0 })
  }, [batchResult, resultEpoch])

  const handleOpen = async () => {
    if (!selectedCaseId || openState.isLoading) return
    const normalizedCount = Math.min(100, Math.max(1, Number(count) || 1))
    setCount(String(normalizedCount))
    setBatchResult(null)

    try {
      const response = await openCase({
        userId,
        caseId: selectedCaseId,
        count: normalizedCount,
        disposition,
      }).unwrap()
      setBatchResult(response)
      setResultEpoch((epoch) => epoch + 1)
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
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Ledger fake
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(testLedger?.totalRevenue ?? 0, currency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-[11px]">
              {formatSkinsPrice(testLedger?.totalPayout ?? 0, currency)} pago
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
              Pool elegível
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {eligiblePoolCount ?? 0} / {enabledPoolSize}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-[11px]">
              Com ledger atual
            </ThemeText>
          </div>
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Aberturas teste
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
              {batchResult?.testLedgerAfter?.totalRealOpens ??
                selectedCase.totalTestOpens}
            </ThemeText>
          </div>
        </div>
      ) : null}

      {openState.error ? (
        <p className={`${surfaceClass('errorBanner')} mb-4`}>
          {getErrorMessage(openState.error)}
        </p>
      ) : null}

      {openState.isLoading ? (
        <div className={`${userHighlightBoxClass} mb-4 flex items-center gap-2`}>
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          <ThemeText as="p" tone="secondary" className="text-sm">
            Abrindo {parsedCount} caixa(s)...
          </ThemeText>
        </div>
      ) : null}

      {batchResult ? (
        <div key={resultEpoch} className={userHighlightBoxClass}>
          <ThemeText as="p" tone="primary" className="text-sm font-semibold">
            {batchResult.count} abertura(s) concluída(s) —{' '}
            {batchResult.disposition === 'keep'
              ? `${batchResult.inventoryItemsCreated} item(ns) no inventário`
              : `${formatSkinsPrice(batchResult.creditedAmount ?? 0, walletCurrency)} creditados`}
          </ThemeText>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ThemeText as="p" tone="secondary" className="text-xs">
              Pago: {formatSkinsPrice(batchResult.totalPaid, currency)}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-xs">
              Valor ganho (caixa): {formatSkinsPrice(batchResult.totalWonValue, currency)}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-xs">
              Saldo bônus: {formatSkinsPrice(batchResult.balances.bonusBalance, walletCurrency)}
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

          <div ref={resultsListRef} className="mt-4 max-h-64 space-y-2 overflow-auto">
            {groupedBatchItems.map((group) => (
              <div
                key={`${group.item.skinName}-${group.item.value}-${group.item.dropResolutionMethod}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700/80 dark:bg-zinc-900/70"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {group.item.image ? (
                    <img src={group.item.image} alt="" className="h-full w-full object-contain" />
                  ) : disposition === 'keep' ? (
                    <Package className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <Wallet className="h-4 w-4 text-zinc-400" />
                  )}
                  {group.count > 1 ? (
                    <span className="absolute -right-1 -top-1 rounded-md bg-zinc-900 px-1 py-0.5 text-[9px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                      x{group.count}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <ThemeText as="p" tone="primary" className="truncate text-sm font-medium">
                    {group.item.skinName}
                  </ThemeText>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ThemeText as="p" tone="faint" className="text-xs">
                      {formatSkinsPrice(group.item.value, currency)}
                      {batchResult.disposition === 'convert'
                        ? ` → ${formatSkinsPrice(group.item.walletValue, group.item.walletCurrency)}`
                        : ''}
                      {group.count > 1
                        ? ` · ${formatSkinsPrice(
                            (batchResult.disposition === 'convert'
                              ? group.item.walletValue
                              : group.item.value) * group.count,
                            batchResult.disposition === 'convert'
                              ? group.item.walletCurrency
                              : currency,
                          )} total`
                        : ''}
                    </ThemeText>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        DROP_METHOD_CLASS[group.item.dropResolutionMethod]
                      }`}
                    >
                      {DROP_METHOD_LABEL[group.item.dropResolutionMethod]}
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
