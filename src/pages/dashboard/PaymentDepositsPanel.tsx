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
  useApprovePaymentDepositMutation,
  useGetPaymentDepositsQuery,
  type AdminPaymentDeposit,
  type AdminPaymentDepositStatus,
} from '@/redux/store/api/payment/api.payment'
import { useGetCouponsQuery } from '@/redux/store/api/coupons/api.coupons'
import { getErrorMessage } from '@/utils/getErrorMessage'

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

function defaultApproveAmount(item: AdminPaymentDeposit) {
  if (item.method === 'pix') return item.expectedBrlAmount ?? item.brlAmount ?? ''
  return item.expectedUsdAmount ?? item.usdAmount ?? item.cryptoAmount ?? ''
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const
const DEFAULT_PAGE_SIZE = 20

export function PaymentDepositsPanel() {
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AdminPaymentDepositStatus | ''>('')
  const [method, setMethod] = useState('')
  const [provider, setProvider] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponSearch, setCouponSearch] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState<SearchableSelectOption | null>(null)
  const [periodStart, setPeriodStart] = useState<Date | null>(null)
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [selected, setSelected] = useState<AdminPaymentDeposit | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search.trim(), 300)
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
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const openApprove = (item: AdminPaymentDeposit) => {
    setSelected(item)
    setAmount(String(defaultApproveAmount(item) || ''))
    setNote(item.approveNote ?? '')
    setPassword('')
    setFormError(null)
  }

  const closeApprove = () => {
    setSelected(null)
    setPassword('')
    setFormError(null)
  }

  const amountCurrency = selected?.method === 'pix' ? 'BRL' : 'USD'
  const isPix = selected?.method === 'pix'

  const handleApprove = async (force: boolean) => {
    if (!selected) return
    setFormError(null)
    const parsedAmount = Number(amount.replace(',', '.'))
    try {
      await approve({
        id: selected.id,
        body: {
          force,
          amount: Number.isFinite(parsedAmount) && parsedAmount >= 1 ? parsedAmount : undefined,
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
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Nome, Steam ID, Pix ou id"
          value={search}
        />
        <Select
          label="Status"
          name="payment-deposit-status"
          onChange={(event) => {
            setStatus(event.target.value as AdminPaymentDepositStatus | '')
            setPage(1)
          }}
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
          onChange={(event) => {
            setMethod(event.target.value)
            setPage(1)
          }}
          value={method}
        >
          <option value="">Todos</option>
          <option value="pix">Pix</option>
          <option value="crypto">Cripto</option>
        </Select>
        <Select
          label="Gateway"
          name="payment-deposit-provider"
          onChange={(event) => {
            setProvider(event.target.value)
            setPage(1)
          }}
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
            setCouponCode(code)
            setSelectedCoupon(
              code
                ? (couponOptions.find((option) => option.value === code) ?? selectedCoupon)
                : null,
            )
            setPage(1)
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
        <div className="flex flex-col gap-1.5">
          <ThemeText as="p" className="text-sm font-medium text-foreground">
            Período
          </ThemeText>
          <DateRangePickerTrigger
            appliedEnd={periodEnd}
            appliedStart={periodStart}
            emptyLabel="Todo o período"
            onClear={() => {
              setPeriodStart(null)
              setPeriodEnd(null)
              setPage(1)
            }}
            onClick={() => setPeriodOpen(true)}
            presetLabel={periodPresetLabel}
          />
        </div>
        <Select
          label="Itens por página"
          name="payment-deposit-page-size"
          onChange={(event) => {
            setItemsPerPage(Number(event.target.value))
            setPage(1)
          }}
          value={String(itemsPerPage)}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
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
                    {item.canApprove ? (
                      <Button onClick={() => openApprove(item)} size="sm" type="button" variant="secondary">
                        Aprovar
                      </Button>
                    ) : (
                      <ThemeText tone="secondary" className="text-xs">
                        {item.creditSource === 'admin' ? 'Admin' : 'Webhook'}
                      </ThemeText>
                    )}
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
          onPageChange={(next) => setPage(Math.min(Math.max(next, 1), totalPages))}
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
                  disabled={approveState.isLoading || !selected || note.trim().length < 8}
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
            <Input
              description={`Valor pago em ${amountCurrency}. Usado se a gateway não devolver o valor.`}
              label={`Valor (${amountCurrency})`}
              name="approve-amount"
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              value={amount}
            />
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
    </Surface>
    <DateRangePickerModal
      appliedEnd={periodEnd}
      appliedStart={periodStart}
      onApply={(start, end) => {
        setPeriodStart(start)
        setPeriodEnd(end)
        setPage(1)
      }}
      onClear={() => {
        setPeriodStart(null)
        setPeriodEnd(null)
        setPage(1)
      }}
      onOpenChange={setPeriodOpen}
      open={periodOpen}
    />
    </>
  )
}
