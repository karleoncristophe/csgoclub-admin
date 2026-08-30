import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useGetArenaPlayPricingHistoryQuery,
  useGetArenaPlayPricingQuery,
  useUpdateArenaPlayPricingMutation,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'

function money(value: number, currency: SkinsCurrency) {
  return formatSkinsPrice(value, currency)
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

export function ArenaPlayPricingPanel() {
  const { data, isLoading, isError, error } = useGetArenaPlayPricingQuery()
  const { data: history } = useGetArenaPlayPricingHistoryQuery({ limit: 6 })
  const [savePricing, saveState] = useUpdateArenaPlayPricingMutation()
  const [listPriceBrl, setListPriceBrl] = useState(50)
  const [listPriceUsd, setListPriceUsd] = useState(10)
  const [listPriceEur, setListPriceEur] = useState(10)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setListPriceBrl(data.listPriceBrl)
    setListPriceUsd(data.listPriceUsd)
    setListPriceEur(data.listPriceEur)
    setDiscountPercent(data.discountPercent)
  }, [data])

  const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0))

  const handleSave = async () => {
    setFormError(null)
    try {
      await savePricing({
        listPriceBrl,
        listPriceUsd,
        listPriceEur,
        discountPercent: discount,
      }).unwrap()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  return (
    <Surface variant="settingsPanel" className="!p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ThemeText as="h2" tone="primary" className="text-base font-semibold">
            Preço da jogada
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Um valor para todas as crates. O jogador clica em Iniciar e paga o
            preço final da moeda da carteira. Crates ficam só com as skins.
          </ThemeText>
        </div>
        <Button
          type="button"
          onClick={() => void handleSave()}
          isLoading={saveState.isLoading}
          disabled={isLoading}
        >
          Salvar preço
        </Button>
      </div>

      {isLoading ? (
        <ThemeText tone="secondary" className="text-sm">
          Carregando preço...
        </ThemeText>
      ) : null}

      {isError ? (
        <Surface variant="errorBanner">{getErrorMessage(error)}</Surface>
      ) : null}

      {formError ? (
        <Surface variant="errorBanner" className="mb-4">
          {formError}
        </Surface>
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CurrencyInput
              label="Tabela BRL"
              name="listPriceBrl"
              currency={SkinsCurrency.BRL}
              value={listPriceBrl}
              onChange={setListPriceBrl}
            />
            <CurrencyInput
              label="Tabela USD"
              name="listPriceUsd"
              currency={SkinsCurrency.USD}
              value={listPriceUsd}
              onChange={setListPriceUsd}
            />
            <CurrencyInput
              label="Tabela EUR"
              name="listPriceEur"
              currency={SkinsCurrency.EUR}
              value={listPriceEur}
              onChange={setListPriceEur}
            />
            <Input
              label="Desconto (%)"
              name="discountPercent"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={discountPercent}
              onChange={(event) =>
                setDiscountPercent(Number(event.target.value) || 0)
              }
            />
          </div>
          {data?.updatedAt ? (
            <ThemeText tone="faint" className="mt-3 block text-xs">
              Última alteração {formatWhen(data.updatedAt)}
            </ThemeText>
          ) : null}
        </>
      ) : null}

      {history?.items?.length ? (
        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <ThemeText tone="primary" className="mb-2 text-sm font-semibold">
            Histórico
          </ThemeText>
          <ul className="space-y-2">
            {history.items.map((item) => (
              <li key={item.id} className="text-xs">
                <ThemeText tone="secondary" className="block">
                  {formatWhen(item.changedAt)} ·{' '}
                  {money(item.from.valueBrl, SkinsCurrency.BRL)}
                  {item.from.discountPercent
                    ? ` (−${item.from.discountPercent}%)`
                    : ''}{' '}
                  → {money(item.to.valueBrl, SkinsCurrency.BRL)}
                  {item.to.discountPercent
                    ? ` (−${item.to.discountPercent}%)`
                    : ''}
                </ThemeText>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Surface>
  )
}
