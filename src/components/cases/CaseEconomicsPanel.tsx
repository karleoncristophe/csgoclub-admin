import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  computePriceAfterDiscount,
  computeProbabilitySum,
  computeRealMargin,
  computeSuggestedSalePrice,
  computeTotalExpectedValue,
  computeAggregatedProbabilityTolerance,
  countEligibleDropItems,
  getEnabledDropItems,
  getProbabilityDelta,
  isProbabilitySumValid,
  roundEconomics,
  roundPrice,
  type CaseEconomicsConfig,
  type CaseEconomicsItem,
  type CaseEconomyLedger,
  type CaseValueMode,
} from '@/utils/caseEconomics'

type CaseEconomicsPanelProps = {
  items: CaseEconomicsItem[]
  currency: SkinsCurrency
  valueMode: CaseValueMode
  config: CaseEconomicsConfig
  listPrice: number
  finalPrice: number
  ledger?: CaseEconomyLedger
}

export function CaseEconomicsPanel({
  items,
  currency,
  valueMode,
  config,
  listPrice,
  finalPrice,
  ledger = { totalRevenue: 0, totalPayout: 0, totalRealOpens: 0 },
}: CaseEconomicsPanelProps) {
  const enabledItems = getEnabledDropItems(items)
  const aggregatedTolerance = computeAggregatedProbabilityTolerance(items)
  const probabilitySum = roundEconomics(
    computeProbabilitySum(items),
    4,
  )
  const probabilityValid = isProbabilitySumValid(probabilitySum, {
    probabilityTargetPercent: config.probabilityTargetPercent,
    probabilityTolerance: aggregatedTolerance,
  })
  const probabilityDelta = getProbabilityDelta(
    probabilitySum,
    config.probabilityTargetPercent,
  )

  const totalEV = roundPrice(computeTotalExpectedValue(items, valueMode))
  const suggestedPrice = roundPrice(
    computeSuggestedSalePrice(totalEV, config.targetMarginPercent),
  )
  const priceAfterDiscount = roundPrice(
    computePriceAfterDiscount(listPrice, config.discountPercent),
  )
  const realMarginPercent = roundEconomics(
    computeRealMargin(finalPrice, totalEV) * 100,
    2,
  )
  const negativeMargin = finalPrice > 0 && finalPrice < totalEV
  const targetMargin = config.targetMarginPercent / 100

  const eligibleDropCount = countEligibleDropItems({
    items,
    openPrice: finalPrice,
    caseTargetMarginPercent: config.targetMarginPercent,
    ledger,
    valueMode,
  })
  const blockedDropCount = Math.max(0, enabledItems.length - eligibleDropCount)

  const cumulativeMarginPercent =
    ledger.totalRevenue > 0
      ? roundEconomics(
          ((ledger.totalRevenue - ledger.totalPayout) / ledger.totalRevenue) * 100,
          2,
        )
      : null

  return (
    <div className="space-y-4">
      <Surface variant="cardInset" className="!p-5">
        <ThemeText as="h3" tone="primary" className="mb-1 text-sm font-semibold">
          Economia da caixa (tempo real)
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-4 text-xs">
          Motor de drop com margem instantânea por item e margem acumulada no ledger da caixa.
        </ThemeText>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Valor esperado (VE)
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
              {formatSkinsPrice(totalEV, currency)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              {valueMode === 'with_tax' ? 'Com taxa de categoria' : 'Preço base'}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Preço sugerido ({config.targetMarginPercent}%)
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
              {formatSkinsPrice(suggestedPrice, currency)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              VE ÷ {(1 - targetMargin).toFixed(2)}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Pool elegível
            </ThemeText>
            <ThemeText
              tone="primary"
              className={`mt-1 text-lg font-semibold ${
                eligibleDropCount === 0 ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {eligibleDropCount} / {enabledItems.length}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              {blockedDropCount} bloqueado(s) por margem
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Margem real (design)
            </ThemeText>
            <ThemeText
              tone="primary"
              className={`mt-1 text-lg font-semibold ${
                negativeMargin ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {realMarginPercent.toFixed(2)}%
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Com desconto ({config.discountPercent}%)
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
              {formatSkinsPrice(priceAfterDiscount, currency)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              Tabela: {formatSkinsPrice(listPrice, currency)}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Ledger acumulado
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(ledger.totalRevenue, currency)} receita
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              {formatSkinsPrice(ledger.totalPayout, currency)} pago ·{' '}
              {cumulativeMarginPercent != null
                ? `${cumulativeMarginPercent.toFixed(2)}% margem`
                : 'sem aberturas reais'}
            </ThemeText>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <ThemeText tone="label" className="text-xs uppercase">
              Soma das chances habilitadas (meta: {config.probabilityTargetPercent}%)
            </ThemeText>
            <ThemeText
              tone="primary"
              className={`mt-1 text-lg font-semibold ${
                probabilityValid ? '' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {probabilitySum.toFixed(4)}%
            </ThemeText>
            {!probabilityValid ? (
              <ThemeText tone="secondary" className="text-xs text-amber-700 dark:text-amber-300">
                {probabilityDelta > 0 ? 'Falta' : 'Sobra'} {Math.abs(probabilityDelta).toFixed(4)}%
              </ThemeText>
            ) : (
              <ThemeText tone="faint" className="text-xs">
                Soma válida
              </ThemeText>
            )}
          </div>
        </div>

        {negativeMargin ? (
          <ThemeText
            as="p"
            tone="secondary"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            Preço final menor que o VE — margem negativa. Ajuste o preço ou as chances.
          </ThemeText>
        ) : null}

        {eligibleDropCount === 0 && enabledItems.length > 0 ? (
          <ThemeText
            as="p"
            tone="secondary"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            Nenhum item pode cair com margem instantânea e acumulada no preço atual. Aumente o
            preço da caixa ou reduza margem mín. dos itens caros.
          </ThemeText>
        ) : null}
      </Surface>
    </div>
  )
}
