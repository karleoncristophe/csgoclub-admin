import { WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import {
  formatProbabilityPercent,
  type ProbabilityRemainderSuggestion,
} from '@/utils/probabilityRemainder'

type ProbabilityRemainderSuggestProps = {
  suggestion: ProbabilityRemainderSuggestion | null
  error?: string
  onApply: () => void
}

export function ProbabilityRemainderSuggest({
  suggestion,
  error,
  onApply,
}: ProbabilityRemainderSuggestProps) {
  if (!suggestion && !error) return null

  const absDelta = suggestion ? Math.abs(suggestion.delta) : 0
  const verb = suggestion && suggestion.delta > 0 ? 'Falta' : 'Sobra'
  const suggestionCopy = suggestion ? (
    <p>
      {verb} {formatProbabilityPercent(absDelta)}% para{' '}
      {formatProbabilityPercent(suggestion.target)}%. Sugerido:{' '}
      {formatProbabilityPercent(suggestion.nextProbability)}% em{' '}
      <span className="font-medium">{suggestion.skinName}</span>.
    </p>
  ) : null

  return (
    <Surface
      variant={error ? 'errorBanner' : 'cardInset'}
      className="mb-4 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="min-w-0">
        {error ? <p>{error}</p> : suggestionCopy}
      </div>
      {suggestion ? (
        <Button type="button" size="sm" variant="secondary" onClick={onApply}>
          <WandSparkles className="h-3.5 w-3.5" aria-hidden />
          Completar {formatProbabilityPercent(suggestion.target)}%
        </Button>
      ) : null}
    </Surface>
  )
}

type ProbabilityRemainderHintProps = {
  suggestion: ProbabilityRemainderSuggestion | null
  skinName: string
  onApply: () => void
}

export function ProbabilityRemainderHint({
  suggestion,
  skinName,
  onApply,
}: ProbabilityRemainderHintProps) {
  if (!suggestion || suggestion.skinName !== skinName) return null

  return (
    <button
      type="button"
      onClick={onApply}
      className="mt-1 text-left text-[11px] font-medium text-brand-700 hover:underline dark:text-brand-400"
    >
      Completar {formatProbabilityPercent(suggestion.nextProbability)}%
    </button>
  )
}
