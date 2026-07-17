import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, ExternalLink, Package, Search } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import useDebounce from '@/hooks/useDebounce'
import {
  useGetAllCaseOpensQuery,
  type AdminCaseOpenGlobalItem,
} from '@/redux/store/api/case-opens/api.case-opens'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { filterChipClasses, userStatCardSpaciousClass } from '@/components/users/userPanelClasses'

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
      <ThemeText as="p" tone="primary" className="mt-2 text-xl font-bold sm:text-2xl">
        {value}
      </ThemeText>
      <ThemeText as="p" tone="faint" className="mt-2 text-xs leading-relaxed">
        {hint}
      </ThemeText>
    </div>
  )
}

export default function CaseOpensPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [disposition, setDisposition] = useState<'pending' | 'kept' | 'converted' | ''>('')
  const [isTestOpen, setIsTestOpen] = useState<'all' | 'true' | 'false'>('all')
  const debouncedSearch = useDebounce(search.trim(), 300)
  const pageSize = 30
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetAllCaseOpensQuery({
    page: safePage,
    limit: pageSize,
    ...(disposition ? { disposition } : {}),
    ...(isTestOpen === 'all' ? {} : { isTestOpen: isTestOpen === 'true' }),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })

  const summary = data?.summary
  const opens = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Histórico de aberturas de todos os clientes, com prêmio, valores e imagem da caixa.">
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

      <Surface variant="card" className="!p-6">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              label="Buscar"
              name="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Usuário, Steam ID, skin ou caixa…"
            />
          </div>
          <ThemeText as="p" tone="faint" className="inline-flex items-center gap-1.5 pb-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            {data?.total ?? 0} resultados
          </ThemeText>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { value: '', label: 'Todas' },
              { value: 'pending', label: 'Pendentes' },
              { value: 'kept', label: 'Guardados' },
              { value: 'converted', label: 'Convertidos' },
            ] as const
          ).map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => {
                setDisposition(option.value)
                setPage(1)
              }}
              className={filterChipClasses(disposition === option.value, 'brand')}
            >
              {option.label}
            </button>
          ))}
          <span className="mx-1 hidden h-8 w-px bg-zinc-200 dark:bg-zinc-700 sm:inline-block" />
          {(
            [
              { value: 'all', label: 'Real + teste' },
              { value: 'false', label: 'Só reais' },
              { value: 'true', label: 'Só teste' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setIsTestOpen(option.value)
                setPage(1)
              }}
              className={filterChipClasses(isTestOpen === option.value, 'amber')}
            >
              {option.label}
            </button>
          ))}
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
          <div className={`flex flex-col gap-2 ${isFetching ? 'opacity-70' : ''}`}>
            {opens.map((open) => {
              const avatar =
                open.user?.avatarFull ?? open.user?.avatarMedium ?? open.user?.avatar

              return (
                <Link
                  key={open._id}
                  to={`/dashboard/case-opens/${open._id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3 transition hover:border-brand-300 hover:bg-brand-50/30 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-brand-700 dark:hover:bg-brand-950/20 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                      {open.case.imageUrl ? (
                        <img
                          src={open.case.imageUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-zinc-400">
                          <Box className="h-5 w-5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ThemeText as="p" tone="primary" className="truncate text-sm font-semibold">
                          {open.case.name}
                        </ThemeText>
                        <TextBadge>{dispositionLabel(open.disposition)}</TextBadge>
                        {open.isTestOpen ? <TextBadge>Teste</TextBadge> : null}
                      </div>
                      <ThemeText as="p" tone="faint" className="mt-0.5 text-xs">
                        {formatDateTime(open.createdAt)}
                      </ThemeText>

                      {open.user ? (
                        <div className="mt-2 flex min-w-0 items-center gap-2">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
                              {open.user.name?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                          <ThemeText as="p" tone="secondary" className="truncate text-xs">
                            {open.user.name}
                            {open.user.steamId ? (
                              <span className="ml-1.5 font-mono text-[10px] text-zinc-400">
                                {open.user.steamId}
                              </span>
                            ) : null}
                          </ThemeText>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-3 sm:w-[42%] sm:justify-end">
                    <SkinRarityVisual
                      rarity={{
                        name: open.wonItemRarityName,
                        color: open.wonItemRarityColor,
                      }}
                      className="h-16 w-20 shrink-0"
                      showStar={false}
                    >
                      {open.wonItemImage ? (
                        <img
                          src={open.wonItemImage}
                          alt=""
                          className="max-h-14 max-w-full object-contain"
                        />
                      ) : (
                        <ThemeText as="span" tone="faint" className="text-[10px]">
                          —
                        </ThemeText>
                      )}
                    </SkinRarityVisual>

                    <div className="min-w-0 flex-1 sm:max-w-[220px]">
                      <ThemeText as="p" tone="primary" className="truncate text-sm font-medium">
                        {open.wonSkinName}
                      </ThemeText>
                      {open.wonItemRarityName ? (
                        <ThemeText
                          as="p"
                          tone="secondary"
                          className="mt-0.5 truncate text-xs"
                          style={{ color: open.wonItemRarityColor }}
                        >
                          {open.wonItemRarityName}
                        </ThemeText>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <ThemeText as="p" tone="primary" className="text-sm font-semibold">
                        {formatMoney(open.itemValue, open.currency)}
                      </ThemeText>
                      <ThemeText as="p" tone="faint" className="text-[11px]">
                        pago {formatMoney(open.pricePaid, open.currency)}
                      </ThemeText>
                      <ThemeText
                        as="p"
                        tone="secondary"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:underline dark:text-brand-400"
                      >
                        Ver detalhe
                        <ExternalLink className="h-3.5 w-3.5" />
                      </ThemeText>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-5">
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </Surface>
    </div>
  )
}
