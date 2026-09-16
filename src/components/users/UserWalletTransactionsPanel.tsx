import { ReceiptText } from 'lucide-react'
import { TextBadge } from '@/components/StatusPill'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { SKINS_CURRENCY_OPTIONS, type SkinsCurrency } from '@/constants/skinsCurrency'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import {
  WALLET_TRANSACTION_TYPES,
  useGetUserWalletTransactionsQuery,
  type WalletTransactionItem,
  type WalletTransactionType,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatMoney(value: number, currency: string | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(value)
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const TYPE_LABELS: Record<WalletTransactionType, string> = {
  deposit: 'Depósito',
  case_open_debit: 'Caixa (débito)',
  case_open_convert: 'Caixa (prêmio convertido)',
  inventory_convert: 'Inventário convertido',
  upgrade_debit: 'Upgrade (débito)',
  swap_debit: 'Swap (débito)',
  swap_change: 'Swap (troco)',
  swap_refund: 'Swap (estorno Steam)',
  swap_change_reversal: 'Swap (estorno do troco)',
  battle_escrow_debit: 'Battle (escrow)',
  battle_escrow_refund: 'Battle (estorno)',
  battle_payout: 'Battle (prêmio)',
  arena_entry_debit: 'Arena (entrada)',
  arena_entry_refund: 'Arena (estorno)',
  admin_bonus_credit: 'Bônus (admin)',
  admin_balance_adjust: 'Ajuste / quitar rollover',
  wallet_fx_debit: 'Câmbio (saída)',
  wallet_fx_credit: 'Câmbio (entrada)',
}

/** Como cada lançamento interage com o rollover — ajuda o suporte a ler o extrato. */
const ROLLOVER_HINTS: Partial<Record<WalletTransactionType, string>> = {
  deposit: 'soma ao rollover e ao preso',
  case_open_debit: 'abate rollover',
  upgrade_debit: 'abate rollover',
  battle_escrow_debit: 'abate rollover',
  arena_entry_debit: 'abate rollover',
  battle_escrow_refund: 'restaura rollover',
  arena_entry_refund: 'restaura rollover',
  case_open_convert: 'preso se houver rollover',
  inventory_convert: 'preso se houver rollover',
  battle_payout: 'preso se houver rollover',
  swap_change: 'preso se houver rollover',
  swap_refund: 'preso se houver rollover',
  swap_debit: 'só saldo liberado · não abate rollover',
  admin_balance_adjust: 'quita rollover (master) ou ajuste manual',
}

type LedgerTab = 'all' | 'game' | 'swap' | 'deposit'

const TAB_TYPES: Record<Exclude<LedgerTab, 'all'>, WalletTransactionType[]> = {
  game: [
    'case_open_debit',
    'upgrade_debit',
    'battle_escrow_debit',
    'arena_entry_debit',
  ],
  swap: ['swap_debit', 'swap_change', 'swap_refund', 'swap_change_reversal'],
  deposit: ['deposit'],
}

function isWalletTransactionType(value: string): value is WalletTransactionType {
  return (WALLET_TRANSACTION_TYPES as readonly string[]).includes(value)
}

const LEDGER_FILTER_DEFAULTS = {
  ledgerType: '',
  ledgerCurrency: '',
  ledgerPage: '1',
}

type UserWalletTransactionsPanelProps = {
  userId: string
}

export function UserWalletTransactionsPanel({ userId }: UserWalletTransactionsPanelProps) {
  const { filters, setFilters, setFilter } = useUrlFilters(LEDGER_FILTER_DEFAULTS)
  const type = isWalletTransactionType(filters.ledgerType) ? filters.ledgerType : undefined
  const currency = SKINS_CURRENCY_OPTIONS.some((o) => o.value === filters.ledgerCurrency)
    ? (filters.ledgerCurrency as SkinsCurrency)
    : undefined
  const page = Math.max(1, parsePositiveInt(filters.ledgerPage, 1))
  const pageSize = 25

  const { data, isLoading, isFetching, isError, error } = useGetUserWalletTransactionsQuery({
    userId,
    page,
    limit: pageSize,
    ...(type ? { type } : {}),
    ...(currency ? { currency } : {}),
  })

  const items: WalletTransactionItem[] = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))

  // Aba ativa deriva do tipo selecionado (um tipo por vez no backend).
  const activeTab: LedgerTab = !type
    ? 'all'
    : (Object.entries(TAB_TYPES).find(([, types]) => types.includes(type))?.[0] as
        | LedgerTab
        | undefined) ?? 'all'

  const typeOptions: WalletTransactionType[] =
    activeTab === 'all' ? [...WALLET_TRANSACTION_TYPES] : TAB_TYPES[activeTab]

  return (
    <Surface variant="settingsPanel" className="!p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle className="mb-0.5 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Extrato da carteira
          </SectionTitle>
          <ThemeText as="p" tone="faint" className="text-xs">
            Ledger de todos os movimentos de saldo. Use para auditar rollover, saldo preso e swaps.
          </ThemeText>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          {data?.total ?? 0} lançamentos
        </span>
      </div>

      <SegmentedTabs
        ariaLabel="Categoria do lançamento"
        className="mb-3"
        value={activeTab}
        items={[
          { id: 'all', label: 'Todos' },
          { id: 'deposit', label: 'Depósitos' },
          { id: 'game', label: 'Jogo' },
          { id: 'swap', label: 'Swap' },
        ]}
        onChange={(next) => {
          const tab = next as LedgerTab
          setFilters(
            {
              ledgerType: tab === 'all' ? '' : TAB_TYPES[tab][0],
              ledgerPage: '1',
            },
            { resetPage: false },
          )
        }}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <Select
          label="Tipo"
          name="ledgerType"
          value={type ?? ''}
          onChange={(event) =>
            setFilters(
              { ledgerType: event.target.value, ledgerPage: '1' },
              { resetPage: false },
            )
          }
        >
          <option value="">{activeTab === 'all' ? 'Todos os tipos' : 'Todos da categoria'}</option>
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {TYPE_LABELS[option]}
            </option>
          ))}
        </Select>
        <Select
          label="Moeda"
          name="ledgerCurrency"
          value={currency ?? ''}
          onChange={(event) =>
            setFilters(
              { ledgerCurrency: event.target.value, ledgerPage: '1' },
              { resetPage: false },
            )
          }
        >
          <option value="">Todas</option>
          {SKINS_CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="py-8 text-sm">
          Carregando extrato…
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <ThemeText as="p" tone="secondary" className="py-8 text-center text-sm">
          Nenhum lançamento com esses filtros.
        </ThemeText>
      ) : null}

      {items.length > 0 ? (
        <div className={`${listTable.wrap} ${isFetching ? 'opacity-70' : ''}`}>
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Quando</th>
                <th className={listTable.th}>Tipo</th>
                <th className={`${listTable.th} text-right`}>Valor</th>
                <th className={`${listTable.th} text-right`}>Saldo após</th>
                <th className={listTable.th}>Carteira</th>
                <th className={listTable.th}>Referência</th>
              </tr>
            </thead>
            <tbody className={listTable.tbody}>
              {items.map((item) => {
                const isCredit = item.amount > 0
                const hint = ROLLOVER_HINTS[item.type]
                return (
                  <tr key={item.id} className={listTable.tr}>
                    <td className={listTable.tdMuted}>{formatDateTime(item.createdAt)}</td>
                    <td className={listTable.tdStrong}>
                      <div className="min-w-[180px]">
                        <span>{TYPE_LABELS[item.type] ?? item.type}</span>
                        {hint ? (
                          <ThemeText as="span" tone="faint" className="mt-0.5 block text-[11px]">
                            {hint}
                          </ThemeText>
                        ) : null}
                        {item.description ? (
                          <ThemeText as="span" tone="secondary" className="mt-0.5 block text-xs">
                            {item.description}
                          </ThemeText>
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={`${listTable.td} whitespace-nowrap text-right font-semibold tabular-nums ${
                        isCredit
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {formatMoney(item.amount, item.currency)}
                    </td>
                    <td className={`${listTable.tdMuted} text-right tabular-nums`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: item.currency ?? 'USD',
                        minimumFractionDigits: 2,
                      }).format(item.balanceAfter)}
                    </td>
                    <td className={listTable.td}>
                      <div className="flex flex-wrap gap-1.5">
                        <TextBadge>{item.currency ?? '—'}</TextBadge>
                        <TextBadge>
                          {item.balanceType === 'bonusBalance' ? 'Bônus' : 'Real'}
                        </TextBadge>
                      </div>
                    </td>
                    <td className={listTable.tdMuted}>
                      {item.referenceId ? (
                        <span className="font-mono text-[11px]" title={item.referenceId}>
                          {item.referenceId.length > 18
                            ? `${item.referenceId.slice(0, 8)}…${item.referenceId.slice(-6)}`
                            : item.referenceId}
                        </span>
                      ) : (
                        '—'
                      )}
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
            page={page}
            totalPages={totalPages}
            onPageChange={(next) =>
              setFilter('ledgerPage', String(next), { resetPage: false })
            }
          />
        </div>
      ) : null}
    </Surface>
  )
}
