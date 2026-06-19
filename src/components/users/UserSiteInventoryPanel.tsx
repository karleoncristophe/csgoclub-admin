import { useEffect, useRef, useState } from 'react'
import { Loader2, Package, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import {
  useConvertAllUserSiteInventoryMutation,
  useGetUserSiteInventoryQuery,
  type SiteInventoryGroupedItem,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { userStatCardClass } from './userPanelClasses'

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatSpendBreakdown(spend: {
  spentUsd: number
  spentBrl: number
  spentEur: number
}) {
  return [
    formatMoney(spend.spentUsd, 'USD'),
    formatMoney(spend.spentBrl, 'BRL'),
    formatMoney(spend.spentEur, 'EUR'),
  ].join(' · ')
}

function groupedItemKey(item: SiteInventoryGroupedItem) {
  return `${item.skinName}|${item.value}|${item.status}|${item.currency}`
}

function formatStackBadge(count: number) {
  if (count <= 1) return null
  return `+${count - 1}`
}

type UserSiteInventoryPanelProps = {
  userId: string
  isInfluencer: boolean
  walletCurrency?: string
  onConverted?: () => void
}

export function UserSiteInventoryPanel({
  userId,
  isInfluencer,
  walletCurrency = 'USD',
  onConverted,
}: UserSiteInventoryPanelProps) {
  const { confirm } = useConfirm()
  const productsAnchorRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'active' | 'converted' | ''>('active')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const pageSize = 12
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetUserSiteInventoryQuery({
      userId,
      page: safePage,
      limit: pageSize,
      grouped: true,
      ...(status ? { status } : {}),
    })

  const [convertAll, convertState] = useConvertAllUserSiteInventoryMutation()

  const isGrouped = data?.grouped ?? true
  const total = data?.total ?? 0
  const totalItems = data?.totalItems ?? total
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const currentPage = Math.min(safePage, totalPages)
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, total)
  const activeCount = data?.summary.activeCount ?? 0
  const activeTotalValue = data?.summary.activeTotalValue ?? 0
  const displayCurrency = data?.summary.currency ?? walletCurrency
  const canConvertAll = activeCount > 0

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleConvertAll = async () => {
    setSuccessMessage(null)

    const balanceLabel = isInfluencer ? 'saldo bônus (não sacável)' : 'saldo real'
    const accepted = await confirm({
      title: 'Converter inventário em saldo?',
      description: `Todos os ${activeCount} item(ns) ativos (${formatMoney(activeTotalValue, displayCurrency)}) serão convertidos em ${balanceLabel}, na moeda ${displayCurrency} da carteira do usuário. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Converter tudo',
      cancelLabel: 'Cancelar',
    })

    if (!accepted) return

    try {
      const result = await convertAll({ userId }).unwrap()
      setSuccessMessage(
        `${result.convertedCount} item(ns) convertidos — ${formatMoney(result.creditedAmount, displayCurrency)} creditados.`,
      )
      setPage(1)
      onConverted?.()
    } catch {
      // erro exibido via convertState.error
    }
  }

  return (
    <Surface variant="card" className="!p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Inventário do site
          </SectionTitle>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            Itens ganhos em aberturas de caixa na plataforma. Não entram no saldo até serem
            convertidos.
          </ThemeText>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canConvertAll ? (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={convertState.isLoading}
              onClick={() => void handleConvertAll()}
            >
              {convertState.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Converter tudo em saldo
            </Button>
          ) : null}
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'active' | 'converted' | '')
              setPage(1)
            }}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="active">Ativos</option>
            <option value="converted">Convertidos</option>
            <option value="">Todos</option>
          </select>
        </div>
      </div>

      {successMessage ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {successMessage}
        </p>
      ) : null}

      {convertState.isError ? (
        <p className={`${surfaceClass('errorBanner')} mb-4`}>
          {getErrorMessage(convertState.error)}
        </p>
      ) : null}

      {!isLoading && !isError && data?.summary ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className={userStatCardClass.brand}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Valor no inventário
            </ThemeText>
            <ThemeText
              as="p"
              tone="primary"
              className="mt-1 text-xl font-bold dark:text-brand-100"
            >
              {formatMoney(data.summary.activeTotalValue, displayCurrency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="mt-1 text-xs">
              {data.summary.activeCount} item(ns) ativos — não sacável até converter
            </ThemeText>
          </div>
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Itens ativos
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-bold">
              {data.summary.activeCount}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="mt-1 text-xs">
              Guardados na plataforma
            </ThemeText>
          </div>
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Já convertidos
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-bold">
              {formatMoney(data.summary.convertedTotalValue, displayCurrency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="mt-1 text-xs">
              {data.summary.convertedCount} item(ns) viraram saldo
            </ThemeText>
          </div>
          <div className={userStatCardClass.amber}>
            <ThemeText as="p" tone="label" className="text-[11px] uppercase">
              Filtro atual
            </ThemeText>
            <ThemeText
              as="p"
              tone="primary"
              className="mt-1 text-xl font-bold dark:text-amber-100"
            >
              {formatMoney(data.summary.filteredTotalValue, displayCurrency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="mt-1 text-xs">
              {isGrouped
                ? `${total} skin(s) únicas · ${totalItems} itens`
                : `${total} item(ns) nesta listagem`}
            </ThemeText>
          </div>
          {data.spend ? (
            <div className={`${userStatCardClass.default} dark:border-rose-500/30 dark:bg-rose-500/10`}>
              <ThemeText as="p" tone="label" className="text-[11px] uppercase">
                Total gasto em caixas
              </ThemeText>
              <ThemeText
                as="p"
                tone="primary"
                className="mt-1 text-xl font-bold dark:text-rose-100"
              >
                {formatMoney(data.spend.totalSpent, data.spend.currency)}
              </ThemeText>
              <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                {data.spend.totalOpens} abertura(s)
              </ThemeText>
              <ThemeText as="p" tone="faint" className="mt-1 text-[11px] leading-5">
                {formatSpendBreakdown(data.spend)}
              </ThemeText>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando inventário do site...
        </div>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data && data.data.length === 0 ? (
        <ThemeText as="p" tone="faint" className="py-10 text-center text-sm">
          Nenhum item no inventário do site.
        </ThemeText>
      ) : null}

      {data && data.data.length > 0 ? (
        <>
          <ThemeText as="p" tone="faint" className="mb-3 text-xs">
            {isGrouped
              ? `Exibindo ${pageStart}–${pageEnd} de ${total} skin(s) · ${totalItems} itens`
              : `Exibindo ${pageStart}–${pageEnd} de ${total} item(ns)`}
          </ThemeText>

          <div
            ref={productsAnchorRef}
            className="scroll-mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {(data.data as SiteInventoryGroupedItem[]).map((item) => {
              const stackBadge = formatStackBadge(item.count)

              return (
                <div
                  key={groupedItemKey(item)}
                  className={`flex gap-3 p-3 ${userStatCardClass.default}`}
                >
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Package className="h-6 w-6 text-zinc-400" />
                    )}
                    {stackBadge ? (
                      <span className="absolute right-1 top-1 rounded-md bg-zinc-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                        {stackBadge}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <ThemeText as="p" tone="primary" className="line-clamp-2 text-sm font-medium">
                      {item.skinName}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="mt-1 text-sm font-semibold">
                      {formatMoney(item.totalValue, item.currency)}
                    </ThemeText>
                    {item.count > 1 ? (
                      <ThemeText as="p" tone="faint" className="text-xs">
                        {item.count} un. × {formatMoney(item.value, item.currency)}
                      </ThemeText>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {item.status === 'active' ? 'No inventário' : 'Convertido'}
                      </span>
                      {item.rarityName ? (
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: item.rarityColor ?? undefined }}
                        >
                          {item.rarityName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            className="mt-6"
            page={currentPage}
            totalPages={totalPages}
            scrollTargetRef={productsAnchorRef}
            onPageChange={(next) => setPage(Math.min(Math.max(next, 1), totalPages))}
          />

          {isFetching && !isLoading ? (
            <ThemeText as="p" tone="faint" className="mt-3 text-center text-xs">
              Atualizando inventário...
            </ThemeText>
          ) : null}
        </>
      ) : null}
    </Surface>
  )
}
