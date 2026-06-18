import { Link2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseEconomyLedger } from '@/redux/store/api/cases/api.cases'

export type CaseEconomyPoolOption = {
  _id: string
  name: string
}

type CaseEditorEconomyPoolSectionProps = {
  currency: SkinsCurrency
  currentCaseId?: string
  sharedCaseIds: string[]
  availableCases: CaseEconomyPoolOption[]
  economyLedger?: CaseEconomyLedger
  onSharedCaseIdsChange: (ids: string[]) => void
}

export function CaseEditorEconomyPoolSection({
  currency,
  currentCaseId,
  sharedCaseIds,
  availableCases,
  economyLedger,
  onSharedCaseIdsChange,
}: CaseEditorEconomyPoolSectionProps) {
  const selectableCases = availableCases.filter((item) => item._id !== currentCaseId)
  const sharedNames = selectableCases
    .filter((item) => sharedCaseIds.includes(item._id))
    .map((item) => item.name)

  const toggleCase = (caseId: string, checked: boolean) => {
    if (checked) {
      onSharedCaseIdsChange([...new Set([...sharedCaseIds, caseId])])
      return
    }
    onSharedCaseIdsChange(sharedCaseIds.filter((id) => id !== caseId))
  }

  return (
    <Surface variant="card" className="!p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
          <Link2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <ThemeText as="h2" tone="primary" className="text-base font-semibold">
            Margem acumulada compartilhada
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Aberturas reais das caixas selecionadas entram no mesmo ledger. O motor de drop usa essa
            margem acumulada em todas elas — útil para equilibrar várias caixas do mesmo tier.
          </ThemeText>
        </div>
      </div>

      {economyLedger ? (
        <div className="mb-4 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 sm:grid-cols-3">
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Receita acumulada
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(economyLedger.totalRevenue, currency)}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Payout acumulado
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {formatSkinsPrice(economyLedger.totalPayout, currency)}
            </ThemeText>
          </div>
          <div>
            <ThemeText tone="label" className="text-xs uppercase">
              Aberturas reais
            </ThemeText>
            <ThemeText tone="primary" className="mt-1 text-sm font-semibold">
              {economyLedger.totalRealOpens ?? 0}
            </ThemeText>
          </div>
        </div>
      ) : null}

      {sharedNames.length > 0 ? (
        <ThemeText as="p" tone="secondary" className="mb-3 text-xs">
          Compartilhando com: {sharedNames.join(', ')}
        </ThemeText>
      ) : (
        <ThemeText as="p" tone="faint" className="mb-3 text-xs">
          Nenhuma outra caixa selecionada — ledger isolado nesta caixa.
        </ThemeText>
      )}

      {selectableCases.length === 0 ? (
        <ThemeText tone="secondary" className="text-sm">
          Crie outras caixas para habilitar o compartilhamento de margem.
        </ThemeText>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {selectableCases.map((lootCase) => {
            const checked = sharedCaseIds.includes(lootCase._id)
            return (
              <div
                key={lootCase._id}
                className={`rounded-xl border px-3 py-2.5 transition ${
                  checked
                    ? 'border-brand-300 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/30'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Checkbox
                  label={lootCase.name}
                  checked={checked}
                  onChange={(event) => toggleCase(lootCase._id, event.target.checked)}
                />
              </div>
            )
          })}
        </div>
      )}
    </Surface>
  )
}
