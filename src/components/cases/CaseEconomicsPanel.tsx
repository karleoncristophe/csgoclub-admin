import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  computePriceAfterDiscount,
  computeProbabilitySum,
  computeRealMargin,
  computeSuggestedSalePrice,
  computeTotalExpectedValue,
  getProbabilityDelta,
  isProbabilitySumValid,
  roundEconomics,
  roundPrice,
  type CaseEconomicsConfig,
  type CaseEconomicsItem,
  type CaseValueMode,
} from '@/utils/caseEconomics'

type CaseEconomicsPanelProps = {
  items: CaseEconomicsItem[]
  currency: SkinsCurrency
  valueMode: CaseValueMode
  config: CaseEconomicsConfig
  listPrice: number
  finalPrice: number
}

export function CaseEconomicsPanel({
  items,
  currency,
  valueMode,
  config,
  listPrice,
  finalPrice,
}: CaseEconomicsPanelProps) {
  const probabilitySum = roundEconomics(
    computeProbabilitySum(items.map((item) => item.probability)),
    4,
  )
  const probabilityValid = isProbabilitySumValid(probabilitySum, {
    probabilityTargetPercent: config.probabilityTargetPercent,
    probabilityTolerance: config.probabilityTolerance,
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

  return (
    <div className="space-y-4">
      <Surface variant="cardInset" className="!p-5">
        <ThemeText as="h3" tone="primary" className="mb-1 text-sm font-semibold">
          Economia da caixa (tempo real)
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-4 text-xs">
          Preços dos itens vêm da API SkinsBack com taxas das categorias de arma aplicadas.
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
              Margem real
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
          <div className="sm:col-span-2 lg:col-span-4">
            <ThemeText tone="label" className="text-xs uppercase">
              Soma das chances (meta: {config.probabilityTargetPercent}% ±{' '}
              {config.probabilityTolerance}%)
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
                Dentro da tolerância configurada
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
            Preço final menor que o VE — margem negativa. Ajuste o preço ou as probabilidades.
          </ThemeText>
        ) : null}
      </Surface>
    </div>
  )
}

export function getCaseValidationErrors(input: {
  items: Array<CaseEconomicsItem & { skinName: string }>
  valueMode: CaseValueMode
  config: CaseEconomicsConfig
  listPrice: number
  finalPrice: number
  name: string
  slug: string
}): string[] {
  const errors: string[] = []
  const sum = computeProbabilitySum(input.items.map((item) => item.probability))

  if (!input.name.trim()) errors.push('Informe o nome da caixa.')
  if (!input.slug.trim()) errors.push('Informe o slug da caixa.')
  if (input.items.length === 0) errors.push('Adicione pelo menos um item.')
  if (
    !isProbabilitySumValid(sum, {
      probabilityTargetPercent: input.config.probabilityTargetPercent,
      probabilityTolerance: input.config.probabilityTolerance,
    })
  ) {
    const delta = getProbabilityDelta(sum, input.config.probabilityTargetPercent)
    errors.push(
      `Soma das probabilidades deve ser ${input.config.probabilityTargetPercent}% (±${input.config.probabilityTolerance}). Atual: ${roundEconomics(sum, 4)}% — ${
        delta > 0 ? 'falta' : 'sobra'
      } ${Math.abs(delta).toFixed(4)}%`,
    )
  }

  for (const item of input.items) {
    if (item.basePrice <= 0 || item.priceWithTax <= 0) {
      errors.push(`"${item.skinName}" está sem preço válido no catálogo.`)
    }
  }

  const totalEV = computeTotalExpectedValue(input.items, input.valueMode)
  if (input.finalPrice < totalEV) {
    errors.push('Preço final não pode ser menor que o valor esperado.')
  }

  if (input.listPrice <= 0) {
    errors.push('Preço de tabela deve ser maior que zero.')
  }

  return errors
}
