import { Link } from 'react-router-dom'
import { ExternalLink, Package, Sparkles } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import { useGetArenaCrateOpensQuery } from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

type UserArenaCrateOpensPanelProps = {
  userId: string
}

const FILTER_DEFAULTS = {
  arenaOpensPage: '1',
}

export function UserArenaCrateOpensPanel({ userId }: UserArenaCrateOpensPanelProps) {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilter } = useUrlFilters(FILTER_DEFAULTS)
  const page = parsePositiveInt(filters.arenaOpensPage, 1)
  const pageSize = 20
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetArenaCrateOpensQuery({
    userId,
    page: safePage,
    limit: pageSize,
    dataEnvironment,
  })

  const opens = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  return (
    <Surface variant="settingsPanel" className="!p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle className="mb-1">Histórico Arena</SectionTitle>
          <ThemeText as="p" tone="secondary" className="text-sm">
            Skins sorteadas ao abrir crates ganhas na Arena.
          </ThemeText>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          <Sparkles className="h-3.5 w-3.5" />
          {total} aberturas
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
          {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
        </span>
      </div>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-8 text-sm">
          Carregando histórico Arena…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {!isLoading && !isError && opens.length === 0 ? (
        <div className="py-8 text-center">
          <ThemeText as="p" tone="secondary" className="text-sm">
            Nenhuma abertura de crate Arena nesta visão
            {isSandbox ? ' (Dev / teste)' : ' (Produção)'}.
          </ThemeText>
          <ThemeText as="p" tone="faint" className="mt-2 text-xs">
            Só entram aberturas registradas após o histórico Arena. Troque a visão se
            precisar ver testes vs produção.
          </ThemeText>
        </div>
      ) : null}

      {opens.length > 0 ? (
        <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Quando</th>
                <th className={listTable.th}>Crate</th>
                <th className={listTable.th}>Item recebido</th>
                <th className={`${listTable.th} text-right`}>Valores</th>
                <th className={listTable.th}>Destino</th>
                <th className={`${listTable.th} text-right`}>Ação</th>
              </tr>
            </thead>
            <tbody className={listTable.tbody}>
              {opens.map((open) => (
                <tr key={open._id} className={listTable.tr}>
                  <td className={listTable.tdMuted}>{formatDateTime(open.createdAt)}</td>
                  <td className={listTable.tdStrong}>
                    <Link to={`/dashboard/arena/${open.crateId}`} className={linkBrand}>
                      {open.crate.name}
                    </Link>
                  </td>
                  <td className={listTable.td}>
                    <div className="flex min-w-[200px] items-center gap-3">
                      <SkinRarityVisual
                        rarity={{
                          name: open.wonItemRarityName,
                          color: open.wonItemRarityColor,
                        }}
                        className="h-12 w-14 shrink-0"
                        showStar={false}
                      >
                        {open.wonItemImage ? (
                          <img
                            src={open.wonItemImage}
                            alt=""
                            className="max-h-10 max-w-full object-contain"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted" />
                        )}
                      </SkinRarityVisual>
                      <span className="line-clamp-2">{open.wonSkinName}</span>
                    </div>
                  </td>
                  <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                    <div>{formatMoney(open.itemValue, open.currency)}</div>
                    <div className="text-xs">
                      pago {formatMoney(open.pricePaid, open.currency)}
                    </div>
                  </td>
                  <td className={listTable.td}>
                    <TextBadge>Convertido</TextBadge>
                  </td>
                  <td className={`${listTable.td} text-right`}>
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        to={`/dashboard/arena/crate-opens/${open._id}`}
                        className={`${linkBrand} inline-flex items-center gap-1`}
                      >
                        Detalhe
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      {open.matchId ? (
                        <Link
                          to={`/dashboard/arena/plays/${open.matchId}`}
                          className="text-xs text-muted hover:text-foreground"
                        >
                          Jogada
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-5">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(next) =>
              setFilter('arenaOpensPage', String(next), { resetPage: false })
            }
          />
        </div>
      ) : null}
    </Surface>
  )
}
