import { useMemo, useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { BankProgressBar } from '@/components/cases/BankProgressBar'
import {
  formatNumberFieldValue,
  selectNumberInputOnFocus,
} from '@/components/cases/editor/caseEditor.utils'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { SkinTripleCurrencyPrices } from '@/components/skins/SkinTripleCurrencyPrices'
import {
  ProbabilityRemainderHint,
  ProbabilityRemainderSuggest,
} from '@/components/ui/ProbabilityRemainderSuggest'
import { SortableTh, sortByNumericColumn, useTableSort } from '@/components/ui/SortableTh'
import { Surface } from '@/components/ui/Surface'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { ArenaCrateItem } from '@/redux/store/api/arena/api.arena'
import { useGetSkinsbackRatesQuery } from '@/redux/store/api/skins/api.skins'
import { previewSkinsbackFx } from '@/utils/skinsbackFx'
import {
  arenaBankBalance,
  arenaBankInjection,
  arenaOpensToUnlock,
  arenaPrizeForCurrency,
  countArenaEligibleItems,
  evaluateArenaDropEligibility,
  type ArenaCrateEconomyLedger,
} from '@/utils/arenaCrateEconomics'
import { describeDropEligibility } from '@/utils/caseEconomics'
import {
  ARENA_CRATE_PROBABILITY_TARGET,
  arenaProbabilityInputError,
  arenaProbabilitySumError,
} from '@/validators/arenaCrateEditorSchema'
import {
  enabledProbabilitySum,
  formatProbabilityPercent,
  roundProbability,
  suggestProbabilityRemainder,
} from '@/utils/probabilityRemainder'
import { listTableAlt } from '@/components/ui/listTable'

type ArenaItemSortKey = 'prize' | 'chance' | 'bank'

const PRIZE_VALUE_INPUTS = [
  { currency: SkinsCurrency.BRL, field: 'valueBrl' as const, label: 'BRL' },
  { currency: SkinsCurrency.USD, field: 'valueUsd' as const, label: 'USD' },
  { currency: SkinsCurrency.EUR, field: 'valueEur' as const, label: 'EUR' },
]

type ArenaCrateItemsTableProps = {
  items: ArenaCrateItem[]
  crateValue: number
  currency: SkinsCurrency
  ledger?: ArenaCrateEconomyLedger
  itemsError?: string
  headerAction?: ReactNode
  onItemsChange: (items: ArenaCrateItem[]) => void
  /** Ajusta o texto de elegibilidade do pool (banco), sem misturar com liberação da campanha. */
  context?: 'arena' | 'free'
}

export function ArenaCrateItemsTable({
  items,
  crateValue,
  currency,
  ledger,
  itemsError,
  headerAction,
  onItemsChange,
  context = 'arena',
}: ArenaCrateItemsTableProps) {
  const allowEditPrize = context === 'free'
  const { data: fxRates } = useGetSkinsbackRatesQuery(undefined, {
    skip: !allowEditPrize,
  })
  const [fixedSkinNames, setFixedSkinNames] = useState<Set<string>>(
    () => new Set(),
  )

  const sum = enabledProbabilitySum(items)
  const probabilityError = itemsError ?? arenaProbabilitySumError(items)
  const chanceInputError = arenaProbabilityInputError(items)
  const remainderSuggestion = useMemo(
    () => suggestProbabilityRemainder(items, ARENA_CRATE_PROBABILITY_TARGET),
    [items],
  )
  const injection = arenaBankInjection(crateValue)
  const bankAvailable = arenaBankBalance(ledger, currency) + injection
  const enabledCount = items.filter(
    (item) => item.enabled !== false && Number(item.probability) > 0,
  ).length
  const eligibleCount = countArenaEligibleItems({
    items,
    openPrice: crateValue,
    bankBalance: bankAvailable,
    currency,
  })

  const { sort, toggle } = useTableSort<ArenaItemSortKey>()
  const displayedItems = useMemo(
    () =>
      sortByNumericColumn(items, sort, (item, key) => {
        const prize = arenaPrizeForCurrency(item, currency)
        if (key === 'prize') return prize
        if (key === 'chance') return Number(item.probability) || 0
        if (item.enabled === false) return -1
        const eligibility = evaluateArenaDropEligibility({
          item,
          openPrice: crateValue,
          bankBalance: bankAvailable,
          currency,
        })
        return eligibility.coveredByOpenPrice ? 0 : eligibility.requiredBankBalance
      }),
    [bankAvailable, crateValue, currency, items, sort],
  )

  const updateItem = (skinName: string, patch: Partial<ArenaCrateItem>) => {
    onItemsChange(
      items.map((item) =>
        item.skinName === skinName ? { ...item, ...patch } : item,
      ),
    )
  }

  const enablePrizeEdit = (skinName: string) => {
    setFixedSkinNames((current) => new Set(current).add(skinName))
  }

  const disablePrizeEdit = (skinName: string) => {
    setFixedSkinNames((current) => {
      const next = new Set(current)
      next.delete(skinName)
      return next
    })
  }

  const setPrizeFromPrimary = (skinName: string, primaryValue: number) => {
    const fx = previewSkinsbackFx(primaryValue, currency, fxRates)
    if (fx) {
      updateItem(skinName, {
        valueBrl: fx[SkinsCurrency.BRL],
        valueUsd: fx[SkinsCurrency.USD],
        valueEur: fx[SkinsCurrency.EUR],
      })
      return
    }
    const field =
      currency === SkinsCurrency.USD
        ? 'valueUsd'
        : currency === SkinsCurrency.EUR
          ? 'valueEur'
          : 'valueBrl'
    updateItem(skinName, { [field]: primaryValue })
  }

  const applyRemainderSuggestion = () => {
    if (!remainderSuggestion) return
    updateItem(remainderSuggestion.skinName, {
      probability: remainderSuggestion.nextProbability,
    })
  }

  return (
    <Surface variant="settingsPanel" className="!p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ThemeText as="h2" tone="primary" className="text-base font-semibold">
            Skins da crate ({items.length})
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            {context === 'free'
              ? 'A abertura é gratuita para o jogador — o “preço” do pool é o VE sem margem. Skins até esse valor saem sempre; as mais caras só entram no sorteio quando o banco próprio acumula o prêmio. Pool elegível agora: '
              : 'Valor da jogada é o preço global da Arena — sem margem. Skins até esse valor saem sempre; as mais caras só ficam elegíveis quando o banco acumula o prêmio delas. Elegíveis agora: '}
            {eligibleCount}/{enabledCount}. Soma das chances:{' '}
            <span
              className={
                probabilityError || remainderSuggestion
                  ? 'font-semibold text-red-600 dark:text-red-400'
                  : undefined
              }
            >
              {formatProbabilityPercent(sum)}%
            </span>
            {probabilityError ? ' — precisa fechar 100%.' : ''}
          </ThemeText>
        </div>
        {headerAction ? (
          <div className="flex shrink-0 flex-wrap gap-2">{headerAction}</div>
        ) : null}
      </div>

      <ProbabilityRemainderSuggest
        suggestion={remainderSuggestion}
        error={probabilityError}
        onApply={applyRemainderSuggestion}
      />

      {items.length === 0 ? (
        <ThemeText tone="secondary" className="text-sm">
          Nenhuma skin adicionada. Use “Adicionar skins” para montar o conteúdo.
        </ThemeText>
      ) : (
        <div className={listTableAlt.wrap}>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={listTableAlt.theadRow}>
                <th className="py-2 pr-4">Skin</th>
                <SortableTh
                  label="Prêmio"
                  sortKey="prize"
                  sort={sort}
                  onSort={toggle}
                  className="py-2 pr-4"
                  labelClassName="text-xs font-medium"
                />
                <SortableTh
                  label="Chance %"
                  sortKey="chance"
                  sort={sort}
                  onSort={toggle}
                  className="py-2 pr-4"
                  labelClassName="text-xs font-medium"
                />
                <SortableTh
                  label="Banco exigido"
                  sortKey="bank"
                  sort={sort}
                  onSort={toggle}
                  className="py-2 pr-4"
                  labelClassName="text-xs font-medium"
                />
                <th className="py-2 pr-4">Elegível</th>
                <th className="py-2 pr-4">Ativa</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className={listTableAlt.tbody}>
              {displayedItems.map((item) => {
                const prize = arenaPrizeForCurrency(item, currency)
                const eligibility = evaluateArenaDropEligibility({
                  item,
                  openPrice: crateValue,
                  bankBalance: bankAvailable,
                  currency,
                })
                const opensToUnlock = arenaOpensToUnlock({
                  itemValue: prize,
                  openPrice: crateValue,
                })

                return (
                  <tr
                    key={item.skinName}
                    className={`${listTableAlt.tr} ${
                      item.enabled === false ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-10 w-10 rounded-lg object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                        )}
                        <div className="min-w-0">
                          <ThemeText
                            tone="primary"
                            className="block truncate font-medium"
                          >
                            {item.skinName}
                          </ThemeText>
                          {item.rarity?.name ? (
                            <ThemeText tone="faint" className="text-xs">
                              {item.rarity.name}
                            </ThemeText>
                          ) : null}
                          <SkinRarityBar rarity={item.rarity} className="mt-1 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {allowEditPrize ? (
                        <div className="min-w-[280px] space-y-1 sm:min-w-[420px]">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="w-28 shrink-0 pb-1.5">
                              <Switch
                                bare
                                label="Fixar valor"
                                name={`free-fixed-${item.skinName}`}
                                checked={fixedSkinNames.has(item.skinName)}
                                onChange={(checked) => {
                                  if (checked) {
                                    enablePrizeEdit(item.skinName)
                                    return
                                  }
                                  disablePrizeEdit(item.skinName)
                                }}
                              />
                            </div>
                            <div className="grid flex-1 grid-cols-3 gap-2">
                              {PRIZE_VALUE_INPUTS.map((input) => {
                                const isActiveCurrency =
                                  input.currency === currency
                                const isEditing = fixedSkinNames.has(
                                  item.skinName,
                                )
                                const primaryValue =
                                  arenaPrizeForCurrency(item, currency)
                                const fxPreview = previewSkinsbackFx(
                                  primaryValue,
                                  currency,
                                  fxRates,
                                )
                                const displayValue = isActiveCurrency
                                  ? primaryValue
                                  : (fxPreview?.[input.currency] ??
                                    item[input.field])
                                return (
                                  <label
                                    key={input.field}
                                    className="block min-w-0"
                                  >
                                    <ThemeText
                                      tone={
                                        isActiveCurrency ? 'label' : 'faint'
                                      }
                                      className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
                                    >
                                      {input.label}
                                    </ThemeText>
                                    <input
                                      type="number"
                                      min={0.01}
                                      step="0.01"
                                      value={formatNumberFieldValue(
                                        displayValue,
                                      )}
                                      placeholder={
                                        isActiveCurrency ? undefined : '…'
                                      }
                                      title={
                                        isActiveCurrency
                                          ? undefined
                                          : `Convertido de ${currency} pela cotação SkinsBack atual.`
                                      }
                                      disabled={
                                        !isEditing || !isActiveCurrency
                                      }
                                      onChange={(event) => {
                                        if (!isActiveCurrency) return
                                        const parsed = Number(
                                          event.target.value,
                                        )
                                        const value = Number.isFinite(parsed)
                                          ? Math.max(0, parsed)
                                          : 0
                                        setPrizeFromPrimary(
                                          item.skinName,
                                          value,
                                        )
                                      }}
                                      onFocus={selectNumberInputOnFocus}
                                      className="w-full rounded-field border border-field-border bg-field px-2 py-1.5 text-sm font-medium text-field-foreground shadow-none outline-none transition placeholder:text-field-placeholder focus:border-focus focus:ring-4 focus:ring-focus/15 disabled:cursor-not-allowed disabled:bg-default disabled:text-muted disabled:opacity-70"
                                      aria-label={`Valor de ${item.skinName} em ${input.label}`}
                                    />
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                          <ThemeText
                            tone="faint"
                            className="block text-[10px]"
                          >
                            {fixedSkinNames.has(item.skinName)
                              ? `Fixo em ${currency}; as outras moedas seguem a cotação SkinsBack. Salve o rascunho para gravar.`
                              : 'Ligue “Fixar valor” para editar o prêmio desta skin.'}
                          </ThemeText>
                        </div>
                      ) : (
                        <SkinTripleCurrencyPrices
                          valueBrl={item.valueBrl}
                          valueUsd={item.valueUsd}
                          valueEur={item.valueEur}
                        />
                      )}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <Input
                        label="Chance"
                        type="number"
                        min={0}
                        max={100}
                        step={0.0001}
                        name={`chance-${item.skinName}`}
                        value={item.probability}
                        disabled={item.enabled === false}
                        error={
                          item.enabled !== false ? chanceInputError : undefined
                        }
                        onChange={(event) =>
                          updateItem(item.skinName, {
                            probability: roundProbability(
                              Number(event.target.value) || 0,
                            ),
                          })
                        }
                        className="w-28"
                      />
                      {item.enabled !== false ? (
                        <ProbabilityRemainderHint
                          suggestion={remainderSuggestion}
                          skinName={item.skinName}
                          onApply={applyRemainderSuggestion}
                        />
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {item.enabled === false ? (
                        <ThemeText tone="faint" className="text-xs">
                          Off
                        </ThemeText>
                      ) : eligibility.coveredByOpenPrice ? (
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
                              ? `~${opensToUnlock.toLocaleString('pt-BR')} jogada(s)`
                              : 'sem injeção'}
                          </ThemeText>
                        </>
                      )}
                    </td>
                    <td className="py-3 pr-4">
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
                              title={`Banco em ${formatSkinsPrice(eligibility.bankBalance, currency)} · exige ${formatSkinsPrice(eligibility.requiredBankBalance, currency)}`}
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
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(event) =>
                          updateItem(item.skinName, {
                            enabled: event.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-zinc-300 text-brand-600"
                        aria-label={`Ativar ${item.skinName}`}
                      />
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() =>
                          onItemsChange(
                            items.filter((row) => row.skinName !== item.skinName),
                          )
                        }
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        aria-label={`Remover ${item.skinName}`}
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
