import { useEffect, useMemo, useState } from 'react'
import { FlaskConical, Loader2, Play } from 'lucide-react'
import { Autocomplete } from '@/components/ui/Autocomplete'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import {
  useSimulateCaseOpensMutation,
  type CaseOpenSimulationResult,
  type LootCase,
} from '@/redux/store/api/cases/api.cases'
import { getErrorMessage } from '@/utils/getErrorMessage'

const METHOD_LABEL: Record<CaseOpenSimulationResult['opens'][number]['dropResolutionMethod'], string> = {
  direct: 'Direto',
  reroll: 'Re-roll',
  fallback: 'Fallback',
}

type CaseDevSimulatorPanelProps = {
  cases: LootCase[]
  initialCaseId?: string | null
}

export function CaseDevSimulatorPanel({
  cases,
  initialCaseId = null,
}: CaseDevSimulatorPanelProps) {
  if (!import.meta.env.DEV) return null

  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId ?? cases[0]?._id ?? '')
  const [count, setCount] = useState('10')
  const [result, setResult] = useState<CaseOpenSimulationResult | null>(null)
  const [simulateOpens, simulateState] = useSimulateCaseOpensMutation()

  useEffect(() => {
    if (initialCaseId) {
      setSelectedCaseId(initialCaseId)
      setResult(null)
    }
  }, [initialCaseId])

  const selectedCase = useMemo(
    () => cases.find((item) => item._id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  )

  const caseOptions = useMemo(
    () =>
      cases.map((lootCase) => ({
        value: lootCase._id,
        label: lootCase.name,
        description: lootCase.slug,
      })),
    [cases],
  )

  const handleSimulate = async () => {
    if (!selectedCaseId) return

    const parsedCount = Math.min(100, Math.max(1, Number(count) || 1))
    setCount(String(parsedCount))

    try {
      const response = await simulateOpens({
        id: selectedCaseId,
        count: parsedCount,
      }).unwrap()
      setResult(response)
    } catch {
      setResult(null)
    }
  }

  if (cases.length === 0) return null

  return (
    <Surface variant="card" className="!p-6 border-dashed border-amber-400/50 bg-amber-50/20 dark:bg-amber-950/10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <div>
            <ThemeText as="p" tone="primary" className="text-sm font-semibold">
              Dev — simulador de aberturas
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-xs">
              Dry-run no motor real de drop. Não persiste aberturas nem altera o ledger.
            </ThemeText>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-[1fr_140px_auto] md:items-end">
        <Autocomplete
          label="Caixa"
          name="simulatorCaseId"
          value={selectedCaseId}
          options={caseOptions}
          maxVisible={10}
          placeholder="Buscar caixa por nome ou slug..."
          onChange={(nextCaseId) => {
            setSelectedCaseId(nextCaseId)
            setResult(null)
          }}
        />

        <Input
          label="Quantidade"
          name="simulatorCount"
          type="number"
          min={1}
          max={100}
          step={1}
          value={count}
          onChange={(event) => setCount(event.target.value)}
        />

        <Button
          type="button"
          onClick={() => void handleSimulate()}
          isLoading={simulateState.isLoading}
          disabled={!selectedCaseId}
        >
          <Play className="h-4 w-4" />
          Simular
        </Button>
      </div>

      {selectedCase ? (
        <ThemeText as="p" tone="faint" className="mb-4 text-xs">
          Preço simulado: {formatSkinsPrice(selectedCase.price, selectedCase.currency)} · VE:{' '}
          {formatSkinsPrice(selectedCase.expectedValue, selectedCase.currency)} · Ledger atual:{' '}
          {formatSkinsPrice(selectedCase.economyLedger?.totalRevenue ?? 0, selectedCase.currency)}{' '}
          receita /{' '}
          {formatSkinsPrice(selectedCase.economyLedger?.totalPayout ?? 0, selectedCase.currency)} pago
          {(selectedCase.sharedCaseIds?.length ?? 0) > 0
            ? ' (compartilhado — simulação parte desse saldo)'
            : ''}
        </ThemeText>
      ) : null}

      {simulateState.isError ? (
        <p className={`mb-4 ${surfaceClass('errorBanner')}`}>
          {getErrorMessage(simulateState.error)}
        </p>
      ) : null}

      {simulateState.isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rodando simulação...
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={surfaceClass('statTile')}>
              <ThemeText tone="label" className="text-xs uppercase">
                Margem simulada
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
                {result.summary.marginPercent.toFixed(2)}%
              </ThemeText>
            </div>
            <div className={surfaceClass('statTile')}>
              <ThemeText tone="label" className="text-xs uppercase">
                Lucro simulado
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
                {selectedCase
                  ? formatSkinsPrice(result.summary.profit, selectedCase.currency)
                  : result.summary.profit.toFixed(2)}
              </ThemeText>
            </div>
            <div className={surfaceClass('statTile')}>
              <ThemeText tone="label" className="text-xs uppercase">
                Re-rolls
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
                {result.summary.rerollCount}
              </ThemeText>
            </div>
            <div className={surfaceClass('statTile')}>
              <ThemeText tone="label" className="text-xs uppercase">
                Fallbacks
              </ThemeText>
              <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
                {result.summary.fallbackCount}
              </ThemeText>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/35">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Método</th>
                  <th className="px-3 py-2">Margem inst.</th>
                  <th className="px-3 py-2">Margem acum.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {result.opens.map((open) => (
                  <tr key={open.index}>
                    <td className="px-3 py-2 text-zinc-500">{open.index}</td>
                    <td className="px-3 py-2">
                      <ThemeText tone="primary" className="text-xs font-medium">
                        {open.wonSkinName}
                      </ThemeText>
                      {open.wasRerolled && open.originalRolledSkinName ? (
                        <ThemeText tone="faint" className="text-[10px]">
                          era {open.originalRolledSkinName}
                        </ThemeText>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {selectedCase
                        ? formatSkinsPrice(open.itemValue, selectedCase.currency)
                        : open.itemValue.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          open.dropResolutionMethod === 'direct'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : open.dropResolutionMethod === 'reroll'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                        }`}
                      >
                        {METHOD_LABEL[open.dropResolutionMethod]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {open.marginAtDropInstantPercent.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2">
                      {open.marginAtDropCumulativePercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Surface>
  )
}
