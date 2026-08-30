import { useEffect, useRef, useState } from 'react'
import { Loader2, Package, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { TextBadge } from '@/components/StatusPill'
import { listTable } from '@/components/ui/listTable'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
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

function groupedItemKey(item: SiteInventoryGroupedItem) {
  return `${item.skinName}|${item.value}|${item.status}|${item.currency}`
}

type UserSiteInventoryPanelProps = {
  userId: string
  isInfluencer: boolean
  walletCurrency?: string
  onConverted?: () => void
}

const USER_INVENTORY_FILTER_DEFAULTS = {
  invStatus: 'active',
  invPage: '1',
}

export function UserSiteInventoryPanel({
  userId,
  isInfluencer,
  walletCurrency = 'USD',
  onConverted,
}: UserSiteInventoryPanelProps) {
  const { confirm } = useConfirm()
  const productsAnchorRef = useRef<HTMLDivElement>(null)
  const { filters, setFilters, setFilter } = useUrlFilters(USER_INVENTORY_FILTER_DEFAULTS)
  const status =
    filters.invStatus === 'all'
      ? ''
      : (filters.invStatus as 'active' | 'converted' | '')
  const page = parsePositiveInt(filters.invPage, 1)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const pageSize = 20
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
      setFilter('invPage', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

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
      setFilter('invPage', '1', { resetPage: false })
      onConverted?.()
    } catch {
      // erro exibido via convertState.error
    }
  }

  return (
    <Surface variant="settingsPanel" className="!p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle className="mb-0.5 flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Inventário do site
          </SectionTitle>
          <ThemeText as="p" tone="faint" className="text-xs">
            Itens de aberturas ainda não convertidos em saldo.
          </ThemeText>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
              Converter tudo
            </Button>
          ) : null}
          <select
            value={filters.invStatus || 'active'}
            onChange={(event) => {
              setFilters(
                { invStatus: event.target.value, invPage: '1' },
                { resetPage: false },
              )
            }}
            className="h-9 min-w-[8.5rem] rounded-lg border border-field-border bg-field px-2.5 text-sm text-field-foreground"
          >
            <option value="active">Ativos</option>
            <option value="converted">Convertidos</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {successMessage ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {successMessage}
        </p>
      ) : null}

      {convertState.isError ? (
        <p className={`${surfaceClass('errorBanner')} mb-3`}>
          {getErrorMessage(convertState.error)}
        </p>
      ) : null}

      {!isLoading && !isError && data?.summary ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <div className={userStatCardClass.brand}>
            <ThemeText as="p" tone="label" className="text-[10px] uppercase">
              No inventário
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-0.5 text-sm font-semibold">
              {formatMoney(data.summary.activeTotalValue, displayCurrency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-[11px]">
              {data.summary.activeCount} ativos
            </ThemeText>
          </div>
          <div className={userStatCardClass.default}>
            <ThemeText as="p" tone="label" className="text-[10px] uppercase">
              Convertidos
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-0.5 text-sm font-semibold">
              {formatMoney(data.summary.convertedTotalValue, displayCurrency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-[11px]">
              {data.summary.convertedCount} itens
            </ThemeText>
          </div>
          <div className={userStatCardClass.amber}>
            <ThemeText as="p" tone="label" className="text-[10px] uppercase">
              Filtro
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-0.5 text-sm font-semibold">
              {formatMoney(data.summary.filteredTotalValue, displayCurrency)}
            </ThemeText>
            <ThemeText as="p" tone="faint" className="text-[11px]">
              {isGrouped
                ? `${total} skins · ${totalItems} un.`
                : `${total} itens`}
            </ThemeText>
          </div>
          {data.spend ? (
            <div className={`${userStatCardClass.default} sm:col-span-2 xl:col-span-2`}>
              <ThemeText as="p" tone="label" className="text-[10px] uppercase">
                Gasto em caixas
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-0.5 text-sm font-semibold">
                {formatMoney(data.spend.totalSpent, data.spend.currency)}
              </ThemeText>
              <ThemeText as="p" tone="faint" className="text-[11px]">
                {data.spend.totalOpens.toLocaleString('pt-BR')} aberturas ·{' '}
                {formatMoney(data.spend.spentUsd, 'USD')} ·{' '}
                {formatMoney(data.spend.spentBrl, 'BRL')} ·{' '}
                {formatMoney(data.spend.spentEur, 'EUR')}
              </ThemeText>
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando inventário...
        </div>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data && data.data.length === 0 ? (
        <ThemeText as="p" tone="faint" className="py-8 text-center text-sm">
          Nenhum item no inventário do site.
        </ThemeText>
      ) : null}

      {data && data.data.length > 0 ? (
        <>
          <ThemeText as="p" tone="faint" className="mb-2 text-xs">
            {isGrouped
              ? `${pageStart}–${pageEnd} de ${total} skins · ${totalItems} itens`
              : `${pageStart}–${pageEnd} de ${total} itens`}
          </ThemeText>

          <div
            ref={productsAnchorRef}
            className={`scroll-mt-6 ${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}
          >
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Item</th>
                  <th className={listTable.th}>Qtd</th>
                  <th className={`${listTable.th} text-right`}>Valor</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th}>Raridade</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {(data.data as SiteInventoryGroupedItem[]).map((item) => (
                  <tr key={groupedItemKey(item)} className={listTable.tr}>
                    <td className={listTable.td}>
                      <div className="flex min-w-[220px] items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-secondary">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-muted" />
                          )}
                        </div>
                        <span className="line-clamp-2 text-sm font-medium">
                          {item.skinName}
                        </span>
                      </div>
                    </td>
                    <td className={`${listTable.tdMuted} tabular-nums`}>
                      {item.count}
                    </td>
                    <td className={`${listTable.tdStrong} text-right tabular-nums`}>
                      <div>{formatMoney(item.totalValue, item.currency)}</div>
                      {item.count > 1 ? (
                        <div className="text-xs font-normal text-muted">
                          {item.count} × {formatMoney(item.value, item.currency)}
                        </div>
                      ) : null}
                    </td>
                    <td className={listTable.td}>
                      <TextBadge>
                        {item.status === 'active' ? 'No inventário' : 'Convertido'}
                      </TextBadge>
                    </td>
                    <td className={listTable.tdMuted}>
                      {item.rarityName ? (
                        <span style={{ color: item.rarityColor ?? undefined }}>
                          {item.rarityName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            className="mt-4"
            page={currentPage}
            totalPages={totalPages}
            scrollTargetRef={productsAnchorRef}
            onPageChange={(next) =>
              setFilter(
                'invPage',
                String(Math.min(Math.max(next, 1), totalPages)),
                { resetPage: false },
              )
            }
          />
        </>
      ) : null}
    </Surface>
  )
}
