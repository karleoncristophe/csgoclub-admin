import { Trash2 } from 'lucide-react'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { FieldLabelWithHelp } from '@/components/ui/FieldLabelWithHelp'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import {
  evaluateDropEligibility,
  resolveItemEconomicsValue,
  roundPrice,
  describeDropEligibility,
  type CaseEconomyLedger,
  type CaseValueMode,
} from '@/utils/caseEconomics'
import { updateCaseDropItem } from './caseEditor.utils'

type CaseEditorItemsTableProps = {
  items: CaseDropItem[]
  currency: SkinsCurrency
  valueMode: CaseValueMode
  openPrice: number
  targetMarginPercent: number
  ledger: CaseEconomyLedger
  itemsError?: string
  onItemsChange: (items: CaseDropItem[]) => void
}

export function CaseEditorItemsTable({
  items,
  currency,
  valueMode,
  openPrice,
  targetMarginPercent,
  ledger,
  itemsError,
  onItemsChange,
}: CaseEditorItemsTableProps) {
  const updateItem = (skinName: string, patch: Partial<CaseDropItem>) => {
    onItemsChange(updateCaseDropItem(items, skinName, patch))
  }

  const handleProbabilityChange = (skinName: string, rawValue: string) => {
    const probability = Number(rawValue.replace(',', '.'))
    updateItem(skinName, {
      probability: Number.isFinite(probability) ? Math.max(0, probability) : 0,
    })
  }

  const handleMinMarginChange = (skinName: string, rawValue: string) => {
    const minMarginPercent = Number(rawValue.replace(',', '.'))
    updateItem(skinName, {
      minMarginPercent: Number.isFinite(minMarginPercent)
        ? Math.min(99.99, Math.max(0, minMarginPercent))
        : 0,
    })
  }

  return (
    <Surface variant="card" className="!p-6">
      <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
        Itens da caixa ({items.length})
      </ThemeText>
      <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
        Configure o drop % e a margem mín. de cada item na linha correspondente.
      </ThemeText>

      {items.length === 0 ? (
        <ThemeText tone="secondary" className="text-sm">
          Nenhum item adicionado. Use a busca acima para montar a caixa.
        </ThemeText>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="Ativo"
                    fieldHelp={caseFieldProps('itemEnabled').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Raridade</th>
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="Valor"
                    fieldHelp={caseFieldProps('itemValue').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="Drop %"
                    fieldHelp={caseFieldProps('dropPercent').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="Margem mín."
                    fieldHelp={caseFieldProps('minMarginPercent').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="VE item"
                    fieldHelp={caseFieldProps('itemVe').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="Elegível"
                    fieldHelp={caseFieldProps('itemEligible').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemValue = resolveItemEconomicsValue(item, valueMode)
                const veItem = roundPrice(itemValue * (item.probability / 100))
                const eligibility = evaluateDropEligibility({
                  item,
                  openPrice,
                  caseTargetMarginPercent: targetMarginPercent,
                  ledger,
                  valueMode,
                })
                const rowMuted = item.enabled === false

                return (
                  <tr
                    key={item.skinName}
                    className={`border-b border-zinc-100 dark:border-zinc-800/80 ${
                      rowMuted ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) =>
                          updateItem(item.skinName, { enabled: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-zinc-300 text-brand-600"
                        aria-label={`Ativar ${item.skinName}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-10 w-12 object-contain"
                          />
                        ) : null}
                        <ThemeText tone="primary" className="max-w-[200px] text-xs font-medium">
                          {item.skinName}
                        </ThemeText>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {item.rarity?.name || item.rarity?.color ? (
                        <div className="min-w-[110px]">
                          <SkinRarityBar rarity={item.rarity} className="mb-1.5" />
                          <ThemeText tone="label" className="text-[11px]">
                            {item.rarity?.name ?? '—'}
                          </ThemeText>
                        </div>
                      ) : (
                        <ThemeText tone="faint" className="text-xs">
                          —
                        </ThemeText>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium">
                      {formatSkinsPrice(itemValue, currency)}
                      <ThemeText tone="faint" className="mt-0.5 block text-[10px]">
                        {valueMode === 'with_tax' ? 'Com taxa' : 'Base'}
                      </ThemeText>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.0001"
                        value={item.probability}
                        onChange={(e) =>
                          handleProbabilityChange(item.skinName, e.target.value)
                        }
                        disabled={item.enabled === false}
                        className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        max={99.99}
                        step="0.01"
                        value={item.minMarginPercent}
                        onChange={(e) =>
                          handleMinMarginChange(item.skinName, e.target.value)
                        }
                        disabled={item.enabled === false}
                        className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-brand-700 dark:text-brand-400">
                      {formatSkinsPrice(veItem, currency)}
                    </td>
                    <td className="px-3 py-3">
                      {item.enabled === false ? (
                        <ThemeText tone="faint" className="text-xs">
                          Off
                        </ThemeText>
                      ) : eligibility.eligible ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Sim
                        </span>
                      ) : (
                        <span
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                          title={
                            eligibility.instantApplicable
                              ? `Instant: ${eligibility.instantMarginPercent.toFixed(2)}% (mín ${eligibility.requiredMarginPercent}%) · Acum: ${eligibility.cumulativeMarginPercent.toFixed(2)}%`
                              : `Financiado pelo ledger · Acum: ${eligibility.cumulativeMarginPercent.toFixed(2)}% (mín ${eligibility.requiredMarginPercent}%)`
                          }
                        >
                          {describeDropEligibility(eligibility)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          onItemsChange(items.filter((row) => row.skinName !== item.skinName))
                        }
                        className={surfaceClass('ghostIconButton')}
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {itemsError ? (
        <ThemeText as="p" tone="secondary" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {itemsError}
        </ThemeText>
      ) : null}
    </Surface>
  )
}
