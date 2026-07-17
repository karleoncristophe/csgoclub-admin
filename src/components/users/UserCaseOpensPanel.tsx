import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, ExternalLink, Package } from 'lucide-react'
import { SkinRarityVisual } from '@/components/skins/SkinRarityVisual'
import { TextBadge } from '@/components/StatusPill'
import { Pagination } from '@/components/ui/Pagination'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import {
  useGetUserCaseOpensQuery,
  type AdminCaseOpenListItem,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { filterChipClasses, userStatCardSpaciousClass } from './userPanelClasses'

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

function dispositionLabel(value: AdminCaseOpenListItem['disposition']) {
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

type UserCaseOpensPanelProps = {
  userId: string
}

export function UserCaseOpensPanel({ userId }: UserCaseOpensPanelProps) {
  const [page, setPage] = useState(1)
  const [disposition, setDisposition] = useState<'pending' | 'kept' | 'converted' | ''>('')
  const [isTestOpen, setIsTestOpen] = useState<'all' | 'true' | 'false'>('all')
  const pageSize = 12
  const safePage = Math.max(page, 1)

  const { data, isLoading, isFetching, isError, error } = useGetUserCaseOpensQuery({
    userId,
    page: safePage,
    limit: pageSize,
    ...(disposition ? { disposition } : {}),
    ...(isTestOpen === 'all' ? {} : { isTestOpen: isTestOpen === 'true' }),
  })

  const summary = data?.summary
  const opens = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <Surface variant="card" className="!p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle className="mb-1">Histórico de caixas</SectionTitle>
          <ThemeText as="p" tone="secondary" className="text-sm">
            Aberturas realizadas por este cliente, com prêmio, valores e imagem da caixa.
          </ThemeText>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          <Package className="h-3.5 w-3.5" />
          {summary?.totalOpens ?? 0} aberturas
        </span>
      </div>

      {summary ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total pago"
            value={formatMoney(summary.totalPaid)}
            hint="Soma do preço pago nas aberturas"
            variant="brand"
          />
          <StatCard
            label="Total ganho"
            value={formatMoney(summary.totalWonValue)}
            hint="Soma do valor dos itens dropados"
          />
          <StatCard
            label="Guardados"
            value={String(summary.keptCount)}
            hint={`${summary.convertedCount} convertidos · ${summary.pendingCount} pendentes`}
            variant="amber"
          />
          <StatCard
            label="Teste"
            value={String(summary.testOpensCount)}
            hint="Aberturas de influencer / teste"
            variant="rose"
          />
        </div>
      ) : null}

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
          Carregando histórico…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {!isLoading && !isError && opens.length === 0 ? (
        <ThemeText as="p" tone="secondary" className="py-8 text-sm">
          Nenhuma abertura encontrada para este filtro.
        </ThemeText>
      ) : null}

      {opens.length > 0 ? (
        <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-70' : ''}`}>
          {opens.map((open) => (
            <Link
              key={open._id}
              to={`/dashboard/case-opens/${open._id}`}
              className="group rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 transition hover:border-brand-300 hover:bg-brand-50/30 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-brand-700 dark:hover:bg-brand-950/20"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  {open.case.imageUrl ? (
                    <img
                      src={open.case.imageUrl}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-zinc-400">
                      <Box className="h-6 w-6" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <ThemeText as="p" tone="primary" className="truncate text-sm font-semibold">
                    {open.case.name}
                  </ThemeText>
                  <ThemeText as="p" tone="faint" className="mt-0.5 text-xs">
                    {formatDateTime(open.createdAt)}
                  </ThemeText>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <TextBadge>{dispositionLabel(open.disposition)}</TextBadge>
                    {open.isTestOpen ? <TextBadge>Teste</TextBadge> : null}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <SkinRarityVisual
                  rarity={{
                    name: open.wonItemRarityName,
                    color: open.wonItemRarityColor,
                  }}
                  className="h-28"
                >
                  {open.wonItemImage ? (
                    <img
                      src={open.wonItemImage}
                      alt=""
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <ThemeText as="span" tone="faint" className="text-xs">
                      Sem imagem
                    </ThemeText>
                  )}
                </SkinRarityVisual>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <ThemeText as="p" tone="primary" className="truncate text-sm font-medium">
                    {open.wonSkinName}
                  </ThemeText>
                  {open.wonItemRarityName ? (
                    <ThemeText
                      as="p"
                      tone="secondary"
                      className="mt-0.5 text-xs"
                      style={{ color: open.wonItemRarityColor }}
                    >
                      {open.wonItemRarityName}
                    </ThemeText>
                  ) : null}
                </div>
                <div className="text-right">
                  <ThemeText as="p" tone="primary" className="text-sm font-semibold">
                    {formatMoney(open.itemValue, open.currency)}
                  </ThemeText>
                  <ThemeText as="p" tone="faint" className="text-[11px]">
                    pago {formatMoney(open.pricePaid, open.currency)}
                  </ThemeText>
                </div>
              </div>

              <ThemeText
                as="p"
                tone="secondary"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:underline dark:text-brand-400"
              >
                Ver detalhe
                <ExternalLink className="h-3.5 w-3.5" />
              </ThemeText>
            </Link>
          ))}
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-5">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </Surface>
  )
}
