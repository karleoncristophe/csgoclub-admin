import { Trash2 } from 'lucide-react'
import { SkinRarityBar } from '@/components/skins/SkinRarityBar'
import { SkinTripleCurrencyPrices } from '@/components/skins/SkinTripleCurrencyPrices'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import type { ArenaCrateItem } from '@/redux/store/api/arena/api.arena'
import type { ReactNode } from 'react'

type ArenaCrateItemsTableProps = {
  items: ArenaCrateItem[]
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
  itemsError,
  headerAction,
  onItemsChange,
}: ArenaCrateItemsTableProps) {
  const sum = enabledProbabilitySum(items)

  const updateItem = (skinName: string, patch: Partial<ArenaCrateItem>) => {
    onItemsChange(
      items.map((item) =>
        item.skinName === skinName ? { ...item, ...patch } : item,
      ),
    )
  }

  return (
    <Surface variant="card" className="!p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ThemeText as="h2" tone="primary" className="text-base font-semibold">
            Skins da crate ({items.length})
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Chance e prêmio são coisas diferentes. Os valores BRL / USD / EUR
            congelam na hora de adicionar a skin — é o que o jogador recebe na
            carteira ativa. Só a chance é editável. Soma dos itens habilitados:{' '}
            {sum.toFixed(4)}%.
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
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4">Skin</th>
                <th className="py-2 pr-4">Prêmio</th>
                <th className="py-2 pr-4">Chance %</th>
                <th className="py-2 pr-4">Ativa</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.skinName}
                  className={`border-b border-zinc-100 dark:border-zinc-800 ${
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  )
}
