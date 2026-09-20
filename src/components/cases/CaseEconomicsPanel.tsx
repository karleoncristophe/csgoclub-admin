import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  computeBankInjection,
  computeBankTargetForFullPool,
  computeOpensToUnlockItem,
  computePriceAfterDiscount,
  computeProbabilitySum,
  computeSuggestedSalePrice,
  computeTotalExpectedValue,
  computeAggregatedProbabilityTolerance,
  countEligibleDropItems,
  EMPTY_CASE_ECONOMY_LEDGER,
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
  sharedLedger?: boolean
  ledgerHint?: string
}

export function CaseEconomicsPanel({
  items,
  currency,
  valueMode,
  config,
  listPrice,
  finalPrice,
  ledger = EMPTY_CASE_ECONOMY_LEDGER,
  sharedLedger = false,
  ledgerHint,
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
  const negativeMargin = finalPrice > 0 && finalPrice < totalEV
  const targetMargin = config.targetMarginPercent / 100
  const currentMarginPercent =
    totalEV > 0
      ? roundEconomics(((finalPrice - totalEV) / totalEV) * 100, 2)
      : null

  const bankInjection = computeBankInjection(
    finalPrice,
    config.targetMarginPercent,
  )
  const bankBalance = roundPrice(ledger.bankBalance ?? 0)
  // O saldo avaliado já considera a injeção da próxima abertura.
  const bankAvailable = roundPrice(bankBalance + bankInjection)

  const eligibleDropCount = countEligibleDropItems({
    items,
    openPrice: finalPrice,
    bankBalance: bankAvailable,
    valueMode,
  })
  const blockedDropCount = Math.max(0, enabledItems.length - eligibleDropCount)
  const bankTargetForFullPool = computeBankTargetForFullPool(items, valueMode)
  const opensToUnlockFullPool = computeOpensToUnlockItem({
    itemValue: bankTargetForFullPool,
    openPrice: finalPrice,
    targetMarginPercent: config.targetMarginPercent,
  })

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
          VE acompanha o catálogo. A margem agora é preço contra esse VE. O banco usa a
          margem alvo — não a margem agora.
          {sharedLedger ? ' Caixas no mesmo pool compartilham o banco.' : ''}
        </ThemeText>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              VE
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
              {formatSkinsPrice(totalEV, currency)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              {valueMode === 'with_tax' ? 'Com taxa' : 'Preço base'}
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
              VE × {(1 + targetMargin).toFixed(2)}
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
              {blockedDropCount} travado(s) pelo banco agora
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Banco para o pool completo
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-lg font-semibold">
              {formatSkinsPrice(bankTargetForFullPool, currency)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              {opensToUnlockFullPool === 0
                ? 'Todos cabem no preço da abertura'
                : Number.isFinite(opensToUnlockFullPool)
                  ? `~${opensToUnlockFullPool.toLocaleString('pt-BR')} abertura(s) do zero`
                  : 'Sem injeção: itens caros nunca liberam'}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Margem agora
            </ThemeText>
            <ThemeText
              tone="primary"
              className={`mt-1 text-lg font-semibold ${
                negativeMargin ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {currentMarginPercent != null
                ? `${currentMarginPercent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                : '—'}
            </ThemeText>
            <ThemeText
              tone="faint"
              className={`text-xs ${negativeMargin ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {negativeMargin ? 'Preço abaixo do VE' : `alvo ${config.targetMarginPercent}%`}
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
              Banco virtual (saldo)
            </ThemeText>
            <ThemeText
              tone="primary"
              className={`mt-1 text-lg font-semibold ${
                bankBalance < 0 ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {formatSkinsPrice(bankBalance, currency)}
            </ThemeText>
            <ThemeText tone="faint" className="text-xs">
              +{formatSkinsPrice(bankInjection, currency)} por abertura (preço ÷ 1+alvo)
              {ledgerHint ? ` · ${ledgerHint}` : ''}
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
            Nenhum item pode cair agora: nenhum cabe no preço da abertura e o banco virtual
            não cobre os mais caros. Ajuste o preço ou inclua um item mais barato.
          </ThemeText>
        ) : null}
      </Surface>
    </div>
  )
}
