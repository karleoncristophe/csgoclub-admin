import { useMemo, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { BankProgressBar } from '@/components/cases/BankProgressBar'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { FieldLabelWithHelp } from '@/components/ui/FieldLabelWithHelp'
import {
  ProbabilityRemainderHint,
  ProbabilityRemainderSuggest,
} from '@/components/ui/ProbabilityRemainderSuggest'
import { SortableTh, sortByNumericColumn, useTableSort } from '@/components/ui/SortableTh'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { Switch } from '@/components/ui/Switch'
import { listTableAlt } from '@/components/ui/listTable'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { CaseDropItem } from '@/redux/store/api/cases/api.cases'
import {
  computeBankInjection,
  computeOpensToUnlockItem,
  evaluateDropEligibility,
  resolveItemEconomicsValue,
  roundPrice,
  describeDropEligibility,
  type CaseEconomyLedger,
  type CaseValueMode,
} from '@/utils/caseEconomics'
import {
  DEFAULT_PROBABILITY_TARGET,
  roundProbability,
  suggestProbabilityRemainder,
} from '@/utils/probabilityRemainder'
import {
  formatNumberFieldValue,
  selectNumberInputOnFocus,
  updateCaseDropItem,
} from './caseEditor.utils'

type CaseEditorItemsTableProps = {
  items: CaseDropItem[]
  currency: SkinsCurrency
  valueMode: CaseValueMode
  openPrice: number
  targetMarginPercent: number
  ledger: CaseEconomyLedger
  itemsError?: string
  onItemsChange: (items: CaseDropItem[]) => void
  /** Botões exibidos no cabeçalho do card (adicionar skins, presets) */
  headerAction?: ReactNode
  probabilityTargetPercent?: number
}

type CaseItemSortKey = 'value' | 'drop' | 'bank' | 've'

const FIXED_VALUE_INPUTS = [
  { currency: SkinsCurrency.BRL, field: 'fixedValueBrl', label: 'BRL' },
  { currency: SkinsCurrency.USD, field: 'fixedValueUsd', label: 'USD' },
  { currency: SkinsCurrency.EUR, field: 'fixedValueEur', label: 'EUR' },
] as const

export function CaseEditorItemsTable({
  items,
  currency,
  valueMode,
  openPrice,
  targetMarginPercent,
  ledger,
  itemsError,
  onItemsChange,
  headerAction,
  probabilityTargetPercent = DEFAULT_PROBABILITY_TARGET,
}: CaseEditorItemsTableProps) {
  const bankInjection = computeBankInjection(openPrice, targetMarginPercent)
  const bankAvailable = roundPrice((ledger.bankBalance ?? 0) + bankInjection)
  const { sort, toggle } = useTableSort<CaseItemSortKey>()
  const remainderSuggestion = useMemo(
    () => suggestProbabilityRemainder(items, probabilityTargetPercent),
    [items, probabilityTargetPercent],
  )
  const displayedItems = useMemo(
    () =>
      sortByNumericColumn(items, sort, (item, key) => {
        const itemValue = resolveItemEconomicsValue(item, valueMode)
        if (key === 'value') return itemValue
        if (key === 'drop') return item.probability
        if (key === 've') return roundPrice(itemValue * (item.probability / 100))
        const eligibility = evaluateDropEligibility({
          item,
          openPrice,
          bankBalance: bankAvailable,
          valueMode,
        })
        return eligibility.coveredByOpenPrice ? 0 : eligibility.requiredBankBalance
      }),
    [bankAvailable, items, openPrice, sort, valueMode],
  )

  const updateItem = (skinName: string, patch: Partial<CaseDropItem>) => {
    onItemsChange(updateCaseDropItem(items, skinName, patch))
  }

  const applyRemainderSuggestion = () => {
    if (!remainderSuggestion) return
    updateItem(remainderSuggestion.skinName, {
      probability: remainderSuggestion.nextProbability,
    })
  }

  const handleProbabilityChange = (skinName: string, rawValue: string) => {
    const probability = Number(rawValue.replace(',', '.'))
    updateItem(skinName, {
      probability: Number.isFinite(probability)
        ? Math.max(0, roundProbability(probability))
        : 0,
    })
  }

  return (
    <Surface variant="card" className="border-b border-separator !pb-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ThemeText as="h2" tone="primary" className="text-base font-semibold">
            Itens da caixa ({items.length})
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Configure o drop % de cada item. Itens acima do preço da abertura só ficam
            elegíveis quando o banco virtual acumula o valor de mercado deles.
          </ThemeText>
        </div>
        {headerAction ? (
          <div className="flex shrink-0 flex-wrap gap-2">{headerAction}</div>
        ) : null}
      </div>

      <ProbabilityRemainderSuggest
        suggestion={remainderSuggestion}
        error={itemsError}
        onApply={applyRemainderSuggestion}
      />

      {items.length === 0 ? (
        <ThemeText tone="secondary" className="text-sm">
          Nenhum item adicionado. Use “Adicionar skins” para montar a caixa.
        </ThemeText>
      ) : (
        <div className={listTableAlt.wrap}>
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className={listTableAlt.theadRow}>
                <th className="px-3 py-2">
                  <FieldLabelWithHelp
                    label="Ativo"
                    fieldHelp={caseFieldProps('itemEnabled').fieldHelp}
                    className="text-xs uppercase tracking-wide text-zinc-500"
                  />
                </th>
                <th className="px-3 py-2">Item</th>
                <SortableTh
                  label="Valor"
                  sortKey="value"
                  sort={sort}
                  onSort={toggle}
                  fieldHelp={caseFieldProps('itemValue').fieldHelp}
                />
                <th className="px-3 py-2">Raridade</th>
                <SortableTh
                  label="Drop %"
                  sortKey="drop"
                  sort={sort}
                  onSort={toggle}
                  fieldHelp={caseFieldProps('dropPercent').fieldHelp}
                />
                <SortableTh
                  label="Banco exigido"
                  sortKey="bank"
                  sort={sort}
                  onSort={toggle}
                  fieldHelp={caseFieldProps('requiredBankBalance').fieldHelp}
                />
                <SortableTh
                  label="VE item"
                  sortKey="ve"
                  sort={sort}
                  onSort={toggle}
                  fieldHelp={caseFieldProps('itemVe').fieldHelp}
                />
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
            <tbody className={listTableAlt.tbody}>
              {displayedItems.map((item) => {
                const itemValue = resolveItemEconomicsValue(item, valueMode)
                const activeFixedValueField =
                  currency === SkinsCurrency.USD
                    ? 'fixedValueUsd'
                    : currency === SkinsCurrency.EUR
                      ? 'fixedValueEur'
                      : 'fixedValueBrl'
                const veItem = roundPrice(itemValue * (item.probability / 100))
                const eligibility = evaluateDropEligibility({
                  item,
                  openPrice,
                  bankBalance: bankAvailable,
                  valueMode,
                })
                const opensToUnlock = computeOpensToUnlockItem({
                  itemValue,
                  openPrice,
                  targetMarginPercent,
                })
                const rowMuted = item.enabled === false

                return (
                  <tr
                    key={item.skinName}
                    className={`${listTableAlt.tr} ${
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
                    <td className="px-3 py-3 whitespace-nowrap font-medium">
                      <div className="flex min-w-[455px] items-end gap-3">
                        <div className="w-28 shrink-0 pb-1.5">
                          <Switch
                            label="Fixar valor"
                            name={`fixed-${item.skinName}`}
                            checked={item.useFixedValue === true}
                            bare
                            onChange={(checked) =>
                              updateItem(item.skinName, {
                                useFixedValue: checked,
                                ...(checked
                                  ? {
                                      price: item[activeFixedValueField] ?? itemValue,
                                      ...(valueMode === 'base'
                                        ? { basePrice: item[activeFixedValueField] ?? itemValue }
                                        : { priceWithTax: item[activeFixedValueField] ?? itemValue }),
                                    }
                                  : {}),
                                ...(checked && item[activeFixedValueField] == null
                                  ? { [activeFixedValueField]: itemValue }
                                  : {}),
                                ...(!checked && item.flexiblePrice != null
                                  ? {
                                      price: item.flexiblePrice,
                                      ...(valueMode === 'base'
                                        ? { basePrice: item.flexiblePrice }
                                        : { priceWithTax: item.flexiblePrice }),
                                    }
                                  : {}),
                              })
                            }
                          />
                        </div>
                        <div className="grid flex-1 grid-cols-3 gap-2">
                          {FIXED_VALUE_INPUTS.map((input) => {
                            const isActiveCurrency = input.currency === currency
                            return (
                              <label key={input.field} className="block min-w-0">
                                <ThemeText
                                  tone={isActiveCurrency ? 'label' : 'faint'}
                                  className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
                                >
                                  {input.label}
                                </ThemeText>
                                <input
                                  type="number"
                                  min={0.01}
                                  step="0.01"
                                  value={formatNumberFieldValue(
                                    item[input.field] ??
                                      (isActiveCurrency ? itemValue : undefined),
                                  )}
                                  disabled={item.useFixedValue !== true}
                                  onChange={(event) => {
                                    const parsedValue = Number(event.target.value)
                                    const value = Number.isFinite(parsedValue)
                                      ? Math.max(0, parsedValue)
                                      : 0
                                    updateItem(item.skinName, {
                                      [input.field]: value,
                                      ...(isActiveCurrency
                                        ? {
                                            price: value,
                                            ...(valueMode === 'base'
                                              ? { basePrice: value }
                                              : { priceWithTax: value }),
                                          }
                                        : {}),
                                    })
                                  }}
                                  onFocus={selectNumberInputOnFocus}
                                  className="w-full rounded-field border border-field-border bg-field px-2 py-1.5 text-sm font-medium text-field-foreground shadow-none outline-none transition placeholder:text-field-placeholder focus:border-focus focus:ring-4 focus:ring-focus/15 disabled:cursor-not-allowed disabled:bg-default disabled:text-muted disabled:opacity-70"
                                  aria-label={`Valor fixo de ${item.skinName} em ${input.label}`}
                                />
                              </label>
                            )
                          })}
                        </div>
                      </div>
                      <ThemeText tone="faint" className="mt-0.5 block text-[10px]">
                        {item.useFixedValue
                          ? `Valor operacional em ${currency}; demais moedas ficam salvas para a troca de moeda.`
                          : 'Acompanha o catálogo'}
                      </ThemeText>
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
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.0001"
                        value={formatNumberFieldValue(item.probability)}
                        onChange={(e) =>
                          handleProbabilityChange(item.skinName, e.target.value)
                        }
                        onFocus={selectNumberInputOnFocus}
                        disabled={item.enabled === false}
                        className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      {item.enabled !== false ? (
                        <ProbabilityRemainderHint
                          suggestion={remainderSuggestion}
                          skinName={item.skinName}
                          onApply={applyRemainderSuggestion}
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {eligibility.coveredByOpenPrice ? (
                        <ThemeText tone="faint" className="text-xs">
                          Cabe no preço
                        </ThemeText>
                      ) : (
                        <>
                          <ThemeText tone="primary" className="text-xs font-medium">
                            {formatSkinsPrice(
                              eligibility.requiredBankBalance,
                              currency,
                            )}
                          </ThemeText>
                          <ThemeText tone="faint" className="mt-0.5 block text-[10px]">
                            {Number.isFinite(opensToUnlock)
                              ? `~${opensToUnlock.toLocaleString('pt-BR')} abertura(s)`
                              : 'sem injeção'}
                          </ThemeText>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-brand-700 dark:text-brand-400">
                      {formatSkinsPrice(veItem, currency)}
                    </td>
                    <td className="px-3 py-3">
                      {item.enabled === false ? (
                        <ThemeText tone="faint" className="text-xs">
                          Off
                        </ThemeText>
                      ) : (
                        <div className="min-w-[8.5rem] space-y-1.5">
                          {eligibility.eligible ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Sim
                            </span>
                          ) : (
                            <span
                              className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                              title={`Banco em ${formatSkinsPrice(eligibility.bankBalance, currency)} · exige ${formatSkinsPrice(eligibility.requiredBankBalance, currency)} · faltam ${formatSkinsPrice(eligibility.bankShortfall, currency)}`}
                            >
                              {describeDropEligibility(eligibility)}
                            </span>
                          )}
                          <BankProgressBar
                            ratio={
                              eligibility.coveredByOpenPrice ||
                              eligibility.requiredBankBalance <= 0
                                ? 1
                                : eligibility.bankBalance /
                                  eligibility.requiredBankBalance
                            }
                          />
                        </div>
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
    </Surface>
  )
}
