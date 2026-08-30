import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, ExternalLink, Package, Search } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { listTable, linkBrand } from '@/components/ui/listTable'
import useDebounce from '@/hooks/useDebounce'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import {
  useGetAllCaseOpensQuery,
  type AdminCaseOpenGlobalItem,
} from '@/redux/store/api/case-opens/api.case-opens'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { SteamIdLink } from '@/components/users/SteamIdLink'
import { filterChipClasses, userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

const PAGE_SIZE = 30

const CASE_OPENS_FILTER_DEFAULTS = {
  caseId: '',
  q: '',
  disposition: '',
  page: '1',
}

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

function dispositionLabel(value: AdminCaseOpenGlobalItem['disposition']) {
  if (value === 'kept') return 'Guardado'
  if (value === 'converted') return 'Convertido'
  return 'Pendente'
}

function StatCard({
  label,
  value,
  hint,
  variant = 'default',
}: {
  label: string
  value: string
  hint: string
  variant?: keyof typeof userStatCardSpaciousClass
}) {
  return (
    <div className={userStatCardSpaciousClass[variant]}>
      <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <ThemeText as="p" tone="primary" className="mt-1 text-lg font-semibold">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-2 text-xs leading-relaxed">
        {hint}
      </ThemeText>
    </div>
  )
}

export default function CaseOpensPage() {
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilters, setFilter } = useUrlFilters(CASE_OPENS_FILTER_DEFAULTS)

  const [searchInput, setSearchInput] = useState(filters.q)
  useEffect(() => {
    setSearchInput(filters.q)
  }, [filters.q])

  const debouncedSearch = useDebounce(searchInput.trim(), 300)
  useEffect(() => {
    if (debouncedSearch === filters.q) return
    setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  const page = parsePositiveInt(filters.page, 1)
  const safePage = Math.max(page, 1)
  const caseId = filters.caseId
  const disposition = filters.disposition as AdminCaseOpenGlobalItem['disposition'] | ''

  const { data, isLoading, isFetching, isError, error } = useGetAllCaseOpensQuery({
    page: safePage,
    limit: PAGE_SIZE,
    dataEnvironment,
    ...(caseId ? { caseId } : {}),
    ...(disposition ? { disposition } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })

  const filteredCaseName = caseId ? data?.data[0]?.case.name : undefined

  const clearCaseFilter = () => {
    setFilters({ caseId: '', page: '1' }, { resetPage: false })
  }

  const summary = data?.summary
  const opens = data?.data ?? []
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

  return (
    <div className="space-y-6">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Histórico de aberturas de teste (influencer). Visão Dev — não mistura com produção.'
            : 'Histórico de aberturas reais. Visão Produção — testes ficam de fora.'
        }
      >
        Aberturas
      </PageTitle>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summary.topWonItem ? (
            <Link
              to={`/dashboard/case-opens/${summary.topWonItem.openId}`}
              className={`${userStatCardSpaciousClass.brand} group flex items-center gap-3 transition hover:border-brand-400 dark:hover:border-brand-400/50`}
            >
              <SkinRarityVisual
                rarity={{
                  name: summary.topWonItem.rarityName,
                  color: summary.topWonItem.rarityColor,
                }}
                className="h-16 w-16 shrink-0"
                showStar={false}
              >
                {summary.topWonItem.image ? (
                  <img
                    src={summary.topWonItem.image}
                    alt=""
                    className="max-h-14 max-w-full object-contain"
                  />
                ) : (
                  <ThemeText as="span" tone="faint" className="text-[10px]">
                    —
                  </ThemeText>
                )}
              </SkinRarityVisual>
              <div className="min-w-0">
                <ThemeText as="p" tone="label" className="text-[11px] uppercase tracking-wide">
                  Maior valor sorteado
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 truncate text-sm font-semibold">
                  {summary.topWonItem.skinName}
                </ThemeText>
                <ThemeText as="p" tone="primary" className="mt-1 text-lg font-bold">
                  {formatMoney(summary.topWonItem.itemValue, summary.topWonItem.currency)}
                </ThemeText>
                <ThemeText as="p" tone="faint" className="mt-1 truncate text-xs">
                  {[summary.topWonItem.userName, summary.topWonItem.caseName]
                    .filter(Boolean)
                    .join(' · ') || 'Ver abertura'}
                </ThemeText>
              </div>
            </Link>
          ) : (
            <StatCard
              label="Maior valor sorteado"
              value="—"
              hint="Nenhuma abertura ainda"
              variant="brand"
            />
          )}
          <StatCard
            label="Total de aberturas"
            value={String(summary.totalOpens)}
            hint={`${summary.testOpensCount} de teste`}
          />
          <StatCard
            label="Total pago"
            value={formatMoney(summary.totalPaid)}
            hint="Soma do preço pago nas aberturas"
          />
          <StatCard
            label="Total ganho"
            value={formatMoney(summary.totalWonValue)}
            hint="Soma do valor dos itens dropados"
            variant="amber"
          />
          <StatCard
            label="Destinos"
            value={`${summary.keptCount} / ${summary.convertedCount}`}
            hint={`${summary.pendingCount} pendentes · guardados / convertidos`}
            variant="rose"
          />
        </div>
      ) : null}

      <Surface variant="card" className="!p-5">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              label="Buscar"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Usuário, Steam ID, skin ou caixa…"
            />
          </div>
          <ThemeText as="p" tone="faint" className="inline-flex items-center gap-1.5 pb-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            {data?.total ?? 0} resultados
          </ThemeText>
        </div>

        <SegmentedTabs
          ariaLabel="Destino da abertura"
          className="mb-3"
          value={disposition || 'all'}
          items={[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'kept', label: 'Guardados' },
            { id: 'converted', label: 'Convertidos' },
          ]}
          onChange={(next) => setFilter('disposition', next === 'all' ? '' : next)}
        />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
            {isSandbox ? 'Só teste (Dev)' : 'Só reais (Produção)'}
          </span>
          {caseId ? (
            <button
              type="button"
              onClick={clearCaseFilter}
              className={filterChipClasses(true, 'brand')}
            >
              Caixa: {filteredCaseName ?? 'filtrada'} ✕
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando aberturas…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError && opens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="h-8 w-8 text-zinc-400" />
            <ThemeText as="p" tone="secondary" className="text-sm">
              Nenhuma abertura encontrada para este filtro.
            </ThemeText>
          </div>
        ) : null}

        {opens.length > 0 ? (
          <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Quando</th>
                  <th className={listTable.th}>Jogador</th>
                  <th className={listTable.th}>Caixa</th>
                  <th className={listTable.th}>Item recebido</th>
                  <th className={`${listTable.th} text-right`}>Valores</th>
                  <th className={listTable.th}>Destino</th>
                  <th className={`${listTable.th} text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {opens.map((open) => {
                  const avatar = open.user?.avatarFull ?? open.user?.avatarMedium ?? open.user?.avatar
                  return (
                    <tr key={open._id} className={listTable.tr}>
                      <td className={listTable.tdMuted}>{formatDateTime(open.createdAt)}</td>
                      <td className={listTable.td}>
                        <div className="flex min-w-[170px] items-center gap-2">
                          {avatar ? <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : null}
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{open.user?.name ?? '—'}</span>
                            {open.user?.steamId ? <SteamIdLink steamId={open.user.steamId} /> : null}
                          </div>
                        </div>
                      </td>
                      <td className={listTable.tdStrong}>
                        <div className="flex min-w-[170px] items-center gap-2">
                          <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                            {open.case.imageUrl ? <img src={open.case.imageUrl} alt="" className="max-h-9 max-w-11 object-contain" /> : <Box className="h-4 w-4 text-muted" />}
                          </span>
                          <span className="truncate">{open.case.name}</span>
                        </div>
                      </td>
                      <td className={listTable.td}>
                        <div className="flex min-w-[230px] items-center gap-2">
                          <SkinRarityVisual rarity={{ name: open.wonItemRarityName, color: open.wonItemRarityColor }} className="h-10 w-14 shrink-0" showStar={false}>
                            {open.wonItemImage ? <img src={open.wonItemImage} alt="" className="max-h-9 max-w-full object-contain" /> : null}
                          </SkinRarityVisual>
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{open.wonSkinName}</span>
                            <span className="text-xs" style={{ color: open.wonItemRarityColor }}>{open.wonItemRarityName}</span>
                          </div>
                        </div>
                      </td>
                      <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                        <span className="block font-medium text-foreground">{formatMoney(open.itemValue, open.currency)}</span>
                        <span className="text-[11px]">pago {formatMoney(open.pricePaid, open.currency)}</span>
                      </td>
                      <td className={listTable.td}>
                        <div className="flex gap-1"><TextBadge>{dispositionLabel(open.disposition)}</TextBadge>{open.isTestOpen ? <TextBadge>Teste</TextBadge> : null}</div>
                      </td>
                      <td className={`${listTable.td} text-right`}>
                        <Link to={`/dashboard/case-opens/${open._id}`} className={`${linkBrand} inline-flex items-center gap-1`}>
                          Detalhes <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
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
                setFilter('page', String(next), { resetPage: false })
              }
            />
          </div>
        ) : null}
      </Surface>
    </div>
  )
}
