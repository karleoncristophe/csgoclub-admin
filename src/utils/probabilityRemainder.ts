export const PROBABILITY_DECIMALS = 4
export const DEFAULT_PROBABILITY_TARGET = 100

export type ProbabilityLike = {
  probability: number
  enabled?: boolean
  skinName: string
}

function scale(decimals: number) {
  return 10 ** decimals
}

export function toProbabilityUnits(
  value: number,
  decimals = PROBABILITY_DECIMALS,
) {
  return Math.round((Number(value) || 0) * scale(decimals))
}

export function fromProbabilityUnits(
  units: number,
  decimals = PROBABILITY_DECIMALS,
) {
  return units / scale(decimals)
}

export function roundProbability(
  value: number,
  decimals = PROBABILITY_DECIMALS,
) {
  return fromProbabilityUnits(toProbabilityUnits(value, decimals), decimals)
}

export function formatProbabilityPercent(
  value: number,
  decimals = PROBABILITY_DECIMALS,
) {
  const text = roundProbability(value, decimals).toFixed(decimals)
  return text.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function probabilityUnitsSum(
  items: Array<Pick<ProbabilityLike, 'probability' | 'enabled'>>,
  decimals = PROBABILITY_DECIMALS,
) {
  return items
    .filter((item) => item.enabled !== false)
    .reduce(
      (sum, item) => sum + toProbabilityUnits(item.probability, decimals),
      0,
    )
}

export function enabledProbabilitySum(
  items: Array<Pick<ProbabilityLike, 'probability' | 'enabled'>>,
  decimals = PROBABILITY_DECIMALS,
) {
  return fromProbabilityUnits(probabilityUnitsSum(items, decimals), decimals)
}

export type ProbabilityRemainderSuggestion = {
  skinName: string
  index: number
  delta: number
  nextProbability: number
  currentProbability: number
  target: number
}

function enabledIndexes(items: Array<Pick<ProbabilityLike, 'enabled'>>) {
  return items.flatMap((item, index) => (item.enabled !== false ? [index] : []))
}

/**
 * Sobra ou falta para fechar a meta, em unidades de 0.0001%.
 * Ajusta o último item habilitado que ainda cabe em 0–100%.
 */
export function suggestProbabilityRemainder(
  items: ProbabilityLike[],
  target = DEFAULT_PROBABILITY_TARGET,
  decimals = PROBABILITY_DECIMALS,
): ProbabilityRemainderSuggestion | null {
  const enabled = items.filter((item) => item.enabled !== false)
  if (enabled.length === 0) return null

  const remainder =
    toProbabilityUnits(target, decimals) - probabilityUnitsSum(items, decimals)
  if (remainder === 0) return null

  const maxUnits = toProbabilityUnits(100, decimals)
  const candidates = enabledIndexes(items).reverse()

  for (const index of candidates) {
    const current = toProbabilityUnits(items[index].probability, decimals)
    const next = current + remainder
    if (next < 0 || next > maxUnits) continue
    return {
      skinName: items[index].skinName,
      index,
      delta: fromProbabilityUnits(remainder, decimals),
      nextProbability: fromProbabilityUnits(next, decimals),
      currentProbability: fromProbabilityUnits(current, decimals),
      target,
    }
  }

  return null
}
