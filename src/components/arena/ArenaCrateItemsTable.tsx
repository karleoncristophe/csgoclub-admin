import { Trash2 } from 'lucide-react'
import { BankProgressBar } from '@/components/cases/BankProgressBar'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { SkinTripleCurrencyPrices } from '@/components/skins/SkinTripleCurrencyPrices'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import type { ArenaCrateItem } from '@/redux/store/api/arena/api.arena'
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
import type { ReactNode } from 'react'
import { listTableAlt } from '@/components/ui/listTable'

type ArenaCrateItemsTableProps = {
  items: ArenaCrateItem[]
  crateValue: number
  currency: SkinsCurrency
  ledger?: ArenaCrateEconomyLedger
  itemsError?: string
  headerAction?: ReactNode
  onItemsChange: (items: ArenaCrateItem[]) => void
}

function enabledProbabilitySum(items: ArenaCrateItem[]) {
  return items
    .filter((item) => item.enabled)
    .reduce((sum, item) => sum + (Number(item.probability) || 0), 0)
}

export function ArenaCrateItemsTable({
  items,
  crateValue,
  currency,
  ledger,
  itemsError,
  headerAction,
  onItemsChange,
}: ArenaCrateItemsTableProps) {
  const sum = enabledProbabilitySum(items)
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

  const updateItem = (skinName: string, patch: Partial<ArenaCrateItem>) => {
    onItemsChange(
      items.map((item) =>
        item.skinName === skinName ? { ...item, ...patch } : item,
      ),
    )
  }

  return (
    <Surface variant="card" className="!p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ThemeText as="h2" tone="primary" className="text-base font-semibold">
            Skins da crate ({items.length})
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Valor da jogada é o preço global da Arena — sem margem. Skins até
            esse valor saem sempre; as mais caras só ficam elegíveis quando o
            banco acumula o prêmio delas. Elegíveis agora: {eligibleCount}/
            {enabledCount}. Soma das chances: {sum.toFixed(4)}%.
          </ThemeText>
        </div>
        {headerAction ? (
          <div className="flex shrink-0 flex-wrap gap-2">{headerAction}</div>
        ) : null}
      </div>

      {itemsError ? (
        <Surface variant="errorBanner" className="mb-4">
          {itemsError}
        </Surface>
      ) : null}

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
                <th className="py-2 pr-4">Prêmio</th>
                <th className="py-2 pr-4">Chance %</th>
                <th className="py-2 pr-4">Banco exigido</th>
                <th className="py-2 pr-4">Elegível</th>
                <th className="py-2 pr-4">Ativa</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className={listTableAlt.tbody}>
              {items.map((item) => {
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
                      <SkinTripleCurrencyPrices
                        valueBrl={item.valueBrl}
                        valueUsd={item.valueUsd}
                        valueEur={item.valueEur}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.0001}
                        value={item.probability}
                        onChange={(event) =>
                          updateItem(item.skinName, {
                            probability: Number(event.target.value) || 0,
                          })
                        }
                        className="h-10 w-28 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
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
