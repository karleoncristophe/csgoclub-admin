import { useMemo, useRef, type ReactNode } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { BankProgressBar } from '@/components/cases/BankProgressBar'
import { caseFieldProps } from '@/components/cases/editor/caseFieldHelp'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { Button } from '@/components/ui/Button'
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
import type { CaseDropItem, LootCase } from '@/redux/store/api/cases/api.cases'
import { useGetSkinsbackRatesQuery } from '@/redux/store/api/skins/api.skins'
import { previewItemValues } from '@/utils/skinsbackFx'
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
  lockCaseDropItemToCurrentValue,
  operationalCaseDropValue,
  selectNumberInputOnFocus,
  unlockCaseDropItemToLiveValue,
  updateCaseDropItem,
} from './caseEditor.utils'

type CatalogValueAlert = NonNullable<LootCase['itemValueAlerts']>[number]

type CaseEditorItemsTableProps = {
  items: CaseDropItem[]
  currency: SkinsCurrency
  valueMode: CaseValueMode
  openPrice: number
  ledger: CaseEconomyLedger
  itemsError?: string
  onItemsChange: (items: CaseDropItem[]) => void
  /** Botões exibidos no cabeçalho do card (adicionar skins, presets) */
  headerAction?: ReactNode
  probabilityTargetPercent?: number
  catalogAlerts?: CatalogValueAlert[]
  /** Qual ledger o banco da tabela está usando (Produção vs Influencer). */
  bankLedgerHint?: string
}

type CaseItemSortKey = 'value' | 'drop' | 'bank' | 've'

const FIXED_VALUE_INPUTS = [
  { currency: SkinsCurrency.BRL, field: 'fixedValueBrl', label: 'BRL' },
  { currency: SkinsCurrency.USD, field: 'fixedValueUsd', label: 'USD' },
  { currency: SkinsCurrency.EUR, field: 'fixedValueEur', label: 'EUR' },
] as const

function fixedValueFieldFor(currency: SkinsCurrency) {
  return FIXED_VALUE_INPUTS.find((input) => input.currency === currency)!.field
}

function itemForEconomics(
  item: CaseDropItem,
  valueMode: CaseValueMode,
  currency: SkinsCurrency,
): CaseDropItem {
  if (item.useFixedValue === true) return item
  const live = operationalCaseDropValue(item, currency)
  return {
    ...item,
    price: live,
    ...(valueMode === 'base' ? { basePrice: live } : { priceWithTax: live }),
  }
}

export function CaseEditorItemsTable({
  items,
  currency,
  valueMode,
  openPrice,
  ledger,
  itemsError,
  onItemsChange,
  headerAction,
  probabilityTargetPercent = DEFAULT_PROBABILITY_TARGET,
  catalogAlerts = [],
  bankLedgerHint,
}: CaseEditorItemsTableProps) {
  const preLockItemsRef = useRef(new Map<string, CaseDropItem>())
  const economicsItems = items.map((item) =>
    itemForEconomics(item, valueMode, currency),
  )
  const virtualExpectedValue = roundPrice(
    economicsItems
      .filter((item) => item.enabled !== false)
      .reduce(
        (sum, item) =>
          sum + resolveItemEconomicsValue(item, valueMode) * (item.probability / 100),
        0,
      ),
  )
  const bankInjection = computeBankInjection(virtualExpectedValue)
  const bankAvailable = roundPrice((ledger.bankBalance ?? 0) + bankInjection)
  const { data: fxRates } = useGetSkinsbackRatesQuery()
  const { sort, toggle } = useTableSort<CaseItemSortKey>()
  const remainderSuggestion = useMemo(
    () => suggestProbabilityRemainder(items, probabilityTargetPercent),
    [items, probabilityTargetPercent],
  )
  const catalogAlertsByName = useMemo(() => {
    const map = new Map<string, CatalogValueAlert>()
    for (const alert of catalogAlerts) {
      map.set(alert.skinName, alert)
    }
    return map
  }, [catalogAlerts])
  const unlockedAlertNames = useMemo(() => {
    const itemsByName = new Map(items.map((item) => [item.skinName, item]))
    return catalogAlerts
      .filter((alert) => itemsByName.get(alert.skinName)?.useFixedValue !== true)
      .map((alert) => alert.skinName)
  }, [catalogAlerts, items])
  const displayedItems = useMemo(
    () =>
      sortByNumericColumn(items, sort, (item, key) => {
        const economicsItem = itemForEconomics(item, valueMode, currency)
        const itemValue = resolveItemEconomicsValue(economicsItem, valueMode)
        if (key === 'value') return itemValue
        if (key === 'drop') return item.probability
        if (key === 've') return roundPrice(itemValue * (item.probability / 100))
        const eligibility = evaluateDropEligibility({
          item: economicsItem,
          openPrice,
          bankBalance: bankAvailable,
          valueMode,
        })
        return eligibility.coveredByOpenPrice ? 0 : eligibility.requiredBankBalance
      }),
    [bankAvailable, currency, items, openPrice, sort, valueMode],
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

  const rememberPreLockItem = (item: CaseDropItem) => {
    if (!preLockItemsRef.current.has(item.skinName)) {
      preLockItemsRef.current.set(item.skinName, item)
    }
  }

  const lockItem = (skinName: string) => {
    onItemsChange(
      items.map((item) => {
        if (item.skinName !== skinName) return item
        rememberPreLockItem(item)
        return lockCaseDropItemToCurrentValue(item, currency, valueMode)
      }),
    )
  }

  const unlockItem = (skinName: string) => {
    const snapshot = preLockItemsRef.current.get(skinName)
    preLockItemsRef.current.delete(skinName)
    onItemsChange(
      items.map((item) => {
        if (item.skinName !== skinName) return item
        if (snapshot) return snapshot
        return unlockCaseDropItemToLiveValue(item, currency, valueMode)
      }),
    )
  }

  const lockAllAlertedItems = () => {
    if (unlockedAlertNames.length === 0) return
    const unlocked = new Set(unlockedAlertNames)
    onItemsChange(
      items.map((item) => {
        if (!unlocked.has(item.skinName)) return item
        rememberPreLockItem(item)
        return lockCaseDropItemToCurrentValue(item, currency, valueMode)
      }),
    )
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
            {bankLedgerHint ? ` ${bankLedgerHint}` : ''}
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

      {unlockedAlertNames.length > 0 ? (
        <Surface
          variant="cardInset"
          className="mb-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <ThemeText as="p" tone="primary" className="text-sm font-medium">
              {unlockedAlertNames.length === 1
                ? '1 skin com variação acima de 10% no catálogo'
                : `${unlockedAlertNames.length} skins com variação acima de 10% no catálogo`}
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-0.5 text-xs">
              Linhas marcadas abaixo. Fixar trava o valor operacional; o preço da caixa
              não muda.
            </ThemeText>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={lockAllAlertedItems}>
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Fixar todas
          </Button>
        </Surface>
      ) : null}

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
                const economicsItem = itemForEconomics(item, valueMode, currency)
                const liveValue = operationalCaseDropValue(item, currency)
                const itemValue = resolveItemEconomicsValue(economicsItem, valueMode)
                const veItem = roundPrice(itemValue * (item.probability / 100))
                const eligibility = evaluateDropEligibility({
                  item: economicsItem,
                  openPrice,
                  bankBalance: bankAvailable,
                  valueMode,
                })
                const opensToUnlock = computeOpensToUnlockItem({
                  itemValue,
                  expectedValue: virtualExpectedValue,
                  openPrice,
                })
                const rowMuted = item.enabled === false
                const catalogAlert = catalogAlertsByName.get(item.skinName)
                const catalogUnlocked = Boolean(
                  catalogAlert && item.useFixedValue !== true,
                )
                const catalogRose = (catalogAlert?.variationPercent ?? 0) > 0

                return (
                  <tr
                    key={item.skinName}
                    className={`${listTableAlt.tr} ${
                      rowMuted ? 'opacity-50' : ''
                    } ${
                      catalogUnlocked
                        ? 'bg-red-50/90 dark:bg-red-950/25'
                        : ''
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
                        <div className="min-w-0">
                          <ThemeText tone="primary" className="max-w-[220px] text-xs font-medium">
                            {item.skinName}
                          </ThemeText>
                          {catalogAlert ? (
                            <>
                              <ThemeText
                                as="p"
                                className={`mt-1 text-[11px] font-medium ${
                                  catalogRose
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                Catálogo {catalogRose ? '+' : ''}
                                {catalogAlert.variationPercent.toFixed(2)}%
                                {' · '}
                                {formatSkinsPrice(catalogAlert.fixedValue, currency)}
                                {' → '}
                                {formatSkinsPrice(catalogAlert.flexibleValue, currency)}
                              </ThemeText>
                              {catalogUnlocked ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="mt-1.5"
                                  onClick={() => lockItem(item.skinName)}
                                >
                                  <Lock className="h-3.5 w-3.5" aria-hidden />
                                  Fixar
                                </Button>
                              ) : (
                                <ThemeText tone="faint" className="mt-0.5 block text-[10px]">
                                  Preço fixado
                                </ThemeText>
                              )}
                            </>
                          ) : null}
                        </div>
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
                            onChange={(checked) => {
                              if (checked) {
                                lockItem(item.skinName)
                                return
                              }
                              unlockItem(item.skinName)
                            }}
                          />
                        </div>
                        <div className="grid flex-1 grid-cols-3 gap-2">
                          {FIXED_VALUE_INPUTS.map((input) => {
                            const isActiveCurrency = input.currency === currency
                            const sourceValue =
                              item.useFixedValue === true
                                ? (item[fixedValueFieldFor(currency)] ?? itemValue)
                                : liveValue
                            const fxPreview = previewItemValues(
                              item,
                              sourceValue,
                              currency,
                              fxRates,
                            )
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
                                    isActiveCurrency
                                      ? sourceValue
                                      : fxPreview?.[input.currency],
                                  )}
                                  placeholder={isActiveCurrency ? undefined : '…'}
                                  title={
                                    isActiveCurrency
                                      ? undefined
                                      : `Convertido de ${currency} pela cotação SkinsBack atual; é o que será gravado ao salvar.`
                                  }
                                  disabled={item.useFixedValue !== true || !isActiveCurrency}
                                  onChange={(event) => {
                                    if (!isActiveCurrency) return
                                    const parsedValue = Number(event.target.value)
                                    const value = Number.isFinite(parsedValue)
                                      ? Math.max(0, parsedValue)
                                      : 0
                                    updateItem(item.skinName, {
                                      [input.field]: value,
                                      price: value,
                                      ...(valueMode === 'base'
                                        ? { basePrice: value }
                                        : { priceWithTax: value }),
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
                          ? `Fixo em ${currency}; USD/EUR/BRL convertidos pela cotação SkinsBack (a mesma que o site usa).`
                          : `Acompanha o catálogo (${formatSkinsPrice(liveValue, currency)}). Snapshot antigo não entra no VE.`}
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
