import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  DateRangePickerModal,
  DateRangePickerTrigger,
  getActiveQuickPresetLabel,
} from '@/components/ui/DateRangePickerModal'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { listTable, linkBrand } from '@/components/ui/listTable'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import useDebounce from '@/hooks/useDebounce'
import {
  parseBoundedInt,
  parsePositiveInt,
  useUrlFilters,
} from '@/hooks/useUrlFilters'
import {
  useApprovePaymentDepositMutation,
  useGetPaymentDepositsQuery,
  type AdminPaymentDeposit,
  type AdminPaymentDepositStatus,
} from '@/redux/store/api/payment/api.payment'
import { useGetCouponsQuery } from '@/redux/store/api/coupons/api.coupons'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  PaymentDepositDetails,
  requestedAmountLabel,
} from '@/pages/dashboard/PaymentDepositDetails'

function formatWhen(iso?: string) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR')
}

function formatMoney(value?: number, currency = 'USD') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Pendente'
  if (status === 'processing') return 'Processando'
  if (status === 'paid') return 'Pago'
  if (status === 'failed') return 'Falhou'
  if (status === 'cancelled') return 'Cancelado'
  return status
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'paid'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200'
      : status === 'failed' || status === 'cancelled'
        ? 'bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-950/40 dark:text-red-200'
        : status === 'processing'
          ? 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-200'
          : 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/45 dark:text-amber-200'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {statusLabel(status)}
    </span>
  )
}

function methodLabel(item: AdminPaymentDeposit) {
  if (item.method === 'pix') return 'Pix'
  const symbol = item.symbol || 'Cripto'
  return item.network ? `${symbol} · ${item.network}` : symbol
}

function expectedAmount(item: AdminPaymentDeposit) {
  if (item.method === 'pix') return formatMoney(item.expectedBrlAmount ?? item.brlAmount, 'BRL')
  return formatMoney(item.expectedUsdAmount ?? item.usdAmount ?? item.cryptoAmount, 'USD')
}

function parseDateParam(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const
const DEFAULT_PAGE_SIZE = 20

const DEPOSITS_FILTER_DEFAULTS = {
  q: '',
  status: '',
  method: '',
  provider: '',
  coupon: '',
  from: '',
  to: '',
  page: '1',
  limit: String(DEFAULT_PAGE_SIZE),
}

export function PaymentDepositsPanel() {
  const { filters, setFilters, setFilter } = useUrlFilters(DEPOSITS_FILTER_DEFAULTS)

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
  const itemsPerPage = parseBoundedInt(
    filters.limit,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS[0],
    PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1],
  )
  const status = filters.status as AdminPaymentDepositStatus | ''
  const method = filters.method
  const provider = filters.provider
  const couponCode = filters.coupon
  const periodStart = parseDateParam(filters.from)
  const periodEnd = parseDateParam(filters.to)

  const [couponSearch, setCouponSearch] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState<SearchableSelectOption | null>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [selected, setSelected] = useState<AdminPaymentDeposit | null>(null)
  const [details, setDetails] = useState<AdminPaymentDeposit | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const safePage = Math.max(page, 1)

  const periodPresetLabel =
    periodStart && periodEnd ? getActiveQuickPresetLabel(periodStart, periodEnd) : null

  const { data, isLoading, isFetching, isError, error } = useGetPaymentDepositsQuery(
    {
      page: safePage,
      limit: itemsPerPage,
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
      ...(provider ? { provider } : {}),
      ...(couponCode ? { couponCode } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(periodStart ? { from: periodStart.toISOString() } : {}),
      ...(periodEnd ? { to: periodEnd.toISOString() } : {}),
    },
    { pollingInterval: 10_000, refetchOnFocus: true },
  )
  const [approve, approveState] = useApprovePaymentDepositMutation()
  const { data: couponsData, isFetching: couponsLoading } = useGetCouponsQuery({
    page: 1,
    limit: 50,
    ...(couponSearch ? { search: couponSearch } : {}),
  })
  const couponOptions = useMemo<SearchableSelectOption[]>(
    () =>
      (couponsData?.data ?? []).map((coupon) => ({
        value: coupon.code,
        label: coupon.ownerUserName || coupon.code,
        description: coupon.ownerUserName ? coupon.code : undefined,
        imageUrl: coupon.ownerAvatar,
      })),
    [couponsData],
  )

  useEffect(() => {
    if (!couponCode) {
      setSelectedCoupon(null)
      return
    }
    const match = couponOptions.find((option) => option.value === couponCode)
    if (match) {
      setSelectedCoupon(match)
      return
    }
    setSelectedCoupon((prev) =>
      prev?.value === couponCode
        ? prev
        : { value: couponCode, label: couponCode },
    )
  }, [couponCode, couponOptions])

  const rows = data?.data ?? []
  const summary = data?.summary
  const totals = data?.totals
  const moneyFiltered = Boolean(
    couponCode || periodStart || periodEnd || method || provider || debouncedSearch,
  )
  const couponFilterLabel =
    couponCode && selectedCoupon?.label && selectedCoupon.label !== couponCode
      ? `${selectedCoupon.label} · ${couponCode}`
      : couponCode
  const total = data?.total ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const currentPage = Math.min(safePage, totalPages)
  const pageLimit = data?.limit ?? itemsPerPage
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageLimit + 1
  const pageEnd = Math.min(currentPage * pageLimit, total)

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

  const openApprove = (item: AdminPaymentDeposit) => {
    setSelected(item)
    setAmount(
      item.method === 'pix'
        ? ''
        : String(item.expectedUsdAmount ?? item.usdAmount ?? item.cryptoAmount ?? ''),
    )
    setNote(item.approveNote ?? '')
    setPassword('')
    setFormError(null)
  }

  const closeApprove = () => {
    setSelected(null)
    setPassword('')
    setFormError(null)
  }

  const isPix = selected?.method === 'pix'

  const handleApprove = async (force: boolean) => {
    if (!selected) return
    setFormError(null)
    const parsedAmount = Number(amount.replace(',', '.'))
    const netAmount =
      !isPix && Number.isFinite(parsedAmount) && parsedAmount >= 1
        ? Math.round(parsedAmount * 100) / 100
        : undefined
    if (force && !isPix && netAmount == null) {
      setFormError('Informe o valor que chegou na carteira, depois da taxa de rede.')
      return
    }
    try {
      await approve({
        id: selected.id,
        body: {
          force,
          amount: netAmount,
          note: isPix ? undefined : note.trim() || undefined,
          password: isPix ? password : undefined,
        },
      }).unwrap()
      closeApprove()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const stats = useMemo(
    () => [
      { label: 'Pendentes', value: summary?.pending ?? 0 },
      { label: 'Processando', value: summary?.processing ?? 0 },
      { label: 'Pagos', value: summary?.paid ?? 0 },
      { label: 'Falharam', value: summary?.failed ?? 0 },
      { label: 'Cancelados', value: summary?.cancelled ?? 0 },
    ],
    [summary],
  )

  return (
    <>
    <Surface variant="card" className="!p-5">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => (
          <Surface key={item.label} variant="statTile" className="!px-3 !py-2.5">
            <ThemeText as="p" tone="secondary" className="text-xs uppercase tracking-wide">
              {item.label}
            </ThemeText>
            <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold tabular-nums">
              {item.value}
            </ThemeText>
          </Surface>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-accent/20 bg-accent-soft px-3 py-3">
          <ThemeText as="p" tone="secondary" className="text-xs uppercase tracking-wide">
            Pix (BRL)
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold tabular-nums">
            {formatMoney(totals?.volumeBrl ?? 0, 'BRL')}
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-xs">
            {moneyFiltered ? 'Valor filtrado' : 'Total pago'}
            {couponFilterLabel ? ` · ${couponFilterLabel}` : ''}
          </ThemeText>
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent-soft px-3 py-3">
          <ThemeText as="p" tone="secondary" className="text-xs uppercase tracking-wide">
            Cripto (USD)
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-xl font-semibold tabular-nums">
            {formatMoney(totals?.volumeUsd ?? 0, 'USD')}
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-xs">
            {moneyFiltered ? 'Valor filtrado' : 'Total pago'}
            {couponFilterLabel ? ` · ${couponFilterLabel}` : ''}
          </ThemeText>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Input
          label="Busca"
          name="payment-deposit-search"
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Nome, Steam ID, Pix ou id"
          value={searchInput}
        />
        <Select
          label="Status"
          name="payment-deposit-status"
          onChange={(event) => setFilter('status', event.target.value)}
          value={status}
        >
          <option value="">Todos</option>
          <option value="pending">Pendente</option>
          <option value="processing">Processando</option>
          <option value="paid">Pago</option>
          <option value="failed">Falhou</option>
          <option value="cancelled">Cancelado</option>
        </Select>
        <Select
          label="Método"
          name="payment-deposit-method"
          onChange={(event) => setFilter('method', event.target.value)}
          value={method}
        >
          <option value="">Todos</option>
          <option value="pix">Pix</option>
          <option value="crypto">Cripto</option>
        </Select>
        <Select
          label="Gateway"
          name="payment-deposit-provider"
          onChange={(event) => setFilter('provider', event.target.value)}
          value={provider}
        >
          <option value="">Todas</option>
          <option value="woovi">Woovi</option>
          <option value="xgate">XGate</option>
        </Select>
        <SearchableSelect
          clearable
          emptyMessage="Nenhum cupom encontrado."
          label="Cupom"
          loading={couponsLoading}
          modalDescription="Busque pelo nick ou pelo código. Todos os cupons da pessoa aparecem juntos."
          modalTitle="Cupons"
          onChange={(code) => {
            setFilter('coupon', code)
            setSelectedCoupon(
              code
                ? (couponOptions.find((option) => option.value === code) ??
                    selectedCoupon ?? { value: code, label: code })
                : null,
            )
          }}
          onSearchChange={setCouponSearch}
          options={couponOptions}
          placeholder="Todos os cupons"
          resultNoun="cupom"
          searchPlaceholder="Nick ou código do cupom…"
          selectedOption={selectedCoupon}
          serverSearch
          totalCount={couponsData?.total}
          value={couponCode}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-[12rem]">
          <Select
            label="Itens por página"
            name="payment-deposit-page-size"
            onChange={(event) => setFilter('limit', event.target.value)}
            value={String(itemsPerPage)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:max-w-md sm:items-stretch">
          <ThemeText as="p" className="text-sm font-medium text-foreground">
            Período
          </ThemeText>
          <DateRangePickerTrigger
            appliedEnd={periodEnd}
            appliedStart={periodStart}
            emptyLabel="Todo o período"
            onClear={() => setFilters({ from: '', to: '' })}
            onClick={() => setPeriodOpen(true)}
            presetLabel={periodPresetLabel}
          />
        </div>
      </div>

      {isError ? <Surface variant="errorBanner">{getErrorMessage(error)}</Surface> : null}

      <div className={listTable.wrap}>
        <table className={listTable.table}>
          <thead>
            <tr className={listTable.theadRow}>
              <th className={listTable.th}>Quando</th>
              <th className={listTable.th}>Jogador</th>
              <th className={listTable.th}>Método</th>
              <th className={listTable.th}>Cupom</th>
              <th className={listTable.th}>Valor</th>
              <th className={listTable.th}>Creditado</th>
              <th className={listTable.th}>Status</th>
              <th className={listTable.th}>Ação</th>
            </tr>
          </thead>
          <tbody className={listTable.tbody}>
            {isLoading ? (
              <tr>
                <td className={listTable.empty} colSpan={8}>
                  Carregando transações...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className={listTable.empty} colSpan={8}>
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr className={listTable.tr} key={item.id}>
                  <td className={listTable.tdMuted}>{formatWhen(item.createdAt)}</td>
                  <td className={listTable.td}>
                    <div className="flex items-center gap-2">
                      <UserAvatarLink
                        avatar={item.user?.avatar}
                        name={item.user?.name}
                        size="sm"
                        userId={item.user?.id}
                      />
                      <div className="min-w-0">
                        {item.user?.id ? (
                          <Link className={linkBrand} to={`/dashboard/users/${item.user.id}`}>
                            {item.user.name || item.user.id}
                          </Link>
                        ) : (
                          <ThemeText tone="primary">—</ThemeText>
                        )}
                        <ThemeText as="p" tone="secondary" className="text-xs">
                          {item.user?.steamId || '—'}
                        </ThemeText>
                      </div>
                    </div>
                  </td>
                  <td className={listTable.td}>
                    <ThemeText as="p" tone="primary">
                      {methodLabel(item)}
                    </ThemeText>
                    <ThemeText as="p" tone="secondary" className="text-xs">
                      {item.provider}
                      {item.creditSource === 'admin' ? ' · aprovado no admin' : ''}
                    </ThemeText>
                  </td>
                  <td className={listTable.td}>
                    {item.couponCode ? (
                      <div className="flex items-center gap-2">
                        <UserAvatarLink
                          avatar={item.couponOwner?.avatar}
                          name={item.couponOwner?.name || item.couponCode}
                          size="sm"
                          userId={item.couponOwner?.userId}
                        />
                        <div className="min-w-0">
                          {item.couponOwner?.userId ? (
                            <Link
                              className={linkBrand}
                              to={`/dashboard/users/${item.couponOwner.userId}`}
                            >
                              {item.couponOwner.name || item.couponCode}
                            </Link>
                          ) : (
                            <ThemeText tone="primary">
                              {item.couponOwner?.name || item.couponCode}
                            </ThemeText>
                          )}
                          <ThemeText as="p" tone="secondary" className="text-xs">
                            {item.couponCode}
                          </ThemeText>
                        </div>
                      </div>
                    ) : (
                      <ThemeText tone="primary">—</ThemeText>
                    )}
                  </td>
                  <td className={`${listTable.td} tabular-nums`}>{expectedAmount(item)}</td>
                  <td className={`${listTable.td} tabular-nums`}>
                    {formatMoney(item.walletAmount, item.walletCurrency || 'USD')}
                  </td>
                  <td className={listTable.td}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className={listTable.td}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setDetails(item)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Detalhes
                      </Button>
                      {item.canApprove ? (
                        <Button
                          onClick={() => openApprove(item)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          Aprovar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ThemeText as="p" tone="secondary" className="text-xs">
          {total === 0
            ? 'Nenhum depósito nesta página'
            : `Mostrando ${pageStart}–${pageEnd} de ${total}`}
          {isFetching && !isLoading ? ' · atualizando…' : ''}
        </ThemeText>
        <Pagination
          onPageChange={(next) =>
            setFilter('page', String(Math.min(Math.max(next, 1), totalPages)), {
              resetPage: false,
            })
          }
          page={currentPage}
          totalPages={totalPages}
        />
      </div>

      <Modal
        description={
          isPix
            ? 'Confirme com a senha da sua conta do admin. A aprovação entra na audiência.'
            : 'Primeiro consulta a API da gateway. Se ela ainda não confirmar e o jogador tiver comprovante, force a aprovação.'
        }
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={closeApprove} type="button" variant="ghost">
              Cancelar
            </Button>
            {isPix ? (
              <Button
                disabled={approveState.isLoading || !selected || !password.trim()}
                isLoading={approveState.isLoading}
                onClick={() => void handleApprove(true)}
                type="button"
              >
                Aprovar
              </Button>
            ) : (
              <>
                <Button
                  disabled={approveState.isLoading || !selected}
                  isLoading={approveState.isLoading}
                  onClick={() => void handleApprove(false)}
                  type="button"
                  variant="secondary"
                >
                  Consultar e creditar
                </Button>
                <Button
                  disabled={
                    approveState.isLoading ||
                    !selected ||
                    note.trim().length < 8 ||
                    !(Number(amount.replace(',', '.')) >= 1)
                  }
                  isLoading={approveState.isLoading}
                  onClick={() => void handleApprove(true)}
                  type="button"
                >
                  Aprovar com comprovante
                </Button>
              </>
            )}
          </div>
        }
        onOpenChange={(open) => {
          if (!open) closeApprove()
        }}
        open={Boolean(selected)}
        size="lg"
        title="Aprovar depósito"
      >
        {selected ? (
          <div className="space-y-4">
            {formError ? <Surface variant="errorBanner">{formError}</Surface> : null}
            <ThemeText as="p" tone="secondary" className="text-sm">
              {methodLabel(selected)} · {selected.user?.name || selected.user?.id} ·{' '}
              {statusLabel(selected.status)}
            </ThemeText>
            {selected.address ? (
              <ThemeText as="p" tone="secondary" className="break-all text-xs">
                {selected.method === 'pix' ? 'Pix copia e cola' : 'Endereço'}: {selected.address}
              </ThemeText>
            ) : null}
            <div className="rounded-xl border border-separator bg-surface-secondary px-3 py-2.5">
              <ThemeText as="p" tone="label" className="text-[10px] uppercase tracking-wide">
                Pedido no site
              </ThemeText>
              <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold tabular-nums">
                {requestedAmountLabel(selected)}
              </ThemeText>
              <ThemeText as="p" tone="secondary" className="mt-1 text-xs">
                {isPix
                  ? 'Pix credita este valor. Sem taxa de rede.'
                  : 'O jogador pediu isso no site. O crédito real é o que chegou na carteira depois da taxa (ex.: 5 USDT − 1,5 de taxa = 3,5).'}
              </ThemeText>
            </div>
            {isPix ? null : (
              <Input
                description="O que caiu no endereço, já descontada a taxa de rede. Se a XGate confirmar, ela manda esse valor líquido. Sem API, ajuste aqui (5 − 1,5 = 3,5)."
                label="Valor creditado (USD)"
                name="approve-amount"
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                value={amount}
              />
            )}
            {isPix ? (
              <Input
                autoComplete="current-password"
                description="Senha da sua conta neste painel. Não é gravada; só confirma a identidade na audiência."
                label="Senha do admin"
                name="approve-password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            ) : (
              <Input
                description="Hash da transação ou protocolo do suporte. Obrigatório para forçar."
                label="Comprovante"
                name="approve-note"
                onChange={(event) => setNote(event.target.value)}
                value={note}
              />
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        description="Pedido no site, o que a gateway reportou, crédito na carteira e identificadores da transação."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => setDetails(null)} type="button" variant="ghost">
              Fechar
            </Button>
            {details?.canApprove ? (
              <Button
                onClick={() => {
                  const item = details
                  setDetails(null)
                  if (item) openApprove(item)
                }}
                type="button"
                variant="secondary"
              >
                Aprovar
              </Button>
            ) : null}
          </div>
        }
        onOpenChange={(open) => {
          if (!open) setDetails(null)
        }}
        open={Boolean(details)}
        size="xl"
        title="Detalhes do depósito"
      >
        {details ? <PaymentDepositDetails item={details} /> : null}
      </Modal>
    </Surface>
    <DateRangePickerModal
      appliedEnd={periodEnd}
      appliedStart={periodStart}
      onApply={(start, end) => {
        setFilters({
          from: start.toISOString(),
          to: end.toISOString(),
        })
      }}
      onClear={() => setFilters({ from: '', to: '' })}
      onOpenChange={setPeriodOpen}
      open={periodOpen}
    />
    </>
  )
}
