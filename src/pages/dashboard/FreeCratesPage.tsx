import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { CaseListNameCell } from '@/components/cases/CaseListImage'
import { StatusPill, TextBadge } from '@/components/StatusPill'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { Modal } from '@/components/ui/Modal'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { freeCrateUnlockSummary } from '@/utils/freeCrateRules'
import {
  FREE_KINDS,
  FREE_LABELS,
  useGetFreeCratesQuery,
  usePublishFreeCratesMutation,
  useGetFreeGrantsQuery,
  useCancelFreeGrantMutation,
  type FreeGrant,
  type FreeKind,
} from '@/redux/store/api/free-crates/api.free-crates'

const money = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)

const statuses: Record<string, string> = {
  available: 'Disponível',
  opening: 'Abrindo',
  opened: 'Aberta',
  cancelled: 'Cancelada',
}

export default function FreeCratesPage() {
  const navigate = useNavigate()
  const environment = usePlatformDataEnvironment()
  const catalog = useGetFreeCratesQuery(environment)
  const [publish, publication] = usePublishFreeCratesMutation()
  const [cancel, cancellation] = useCancelFreeGrantMutation()
  const { confirm } = useConfirm()
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    userId: '',
    kind: '',
    status: '',
    period: '',
  })
  const [applied, setApplied] = useState(filters)
  const history = useGetFreeGrantsQuery(
    {
      environment,
      page,
      ...Object.fromEntries(
        Object.entries(applied).filter(([, value]) => value),
      ),
    },
    { pollingInterval: 30000 },
  )
  const [selected, setSelected] = useState<FreeGrant | null>(null)
  const [reason, setReason] = useState('')

  async function publishPolicy(enabled: boolean) {
    if (!catalog.data) return
    const ok = await confirm({
      title: enabled ? 'Publicar caixas gratuitas' : 'Pausar novas recompensas',
      description: enabled
        ? 'As sete configurações salvas passarão a valer para novas recompensas. Caixas já concedidas preservam seu conteúdo.'
        : 'Depósitos durante a pausa não gerarão novas recompensas. Caixas já recebidas continuam disponíveis.',
      confirmLabel: enabled ? 'Publicar' : 'Pausar',
    })
    if (!ok) return
    setError('')
    try {
      await publish({
        expectedVersion: catalog.data.policy?.version ?? 0,
        enabled,
      }).unwrap()
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const data = catalog.data

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Boas-vindas uma vez; cinco faixas acumulativas por dia; um resgate diário por sete dias após depositar. Reset às 06:00 de São Paulo. Catálogo comum; bancos e resultados separados por ambiente.">
        Caixas gratuitas
      </PageTitle>

      <Surface variant="settingsPanel" className="space-y-4 !p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <ThemeText as="p" tone="primary" className="font-semibold">
              {data?.policy?.enabled ? 'Campanha ativa' : 'Campanha pausada'}
              <span className="font-normal text-muted">
                {' '}
                · Versão {data?.policy?.version ?? 0} · Visão{' '}
                {environment === 'SANDBOX' ? 'Teste' : 'Produção'}
              </span>
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="text-sm">
              Salvar edita o rascunho de cada modalidade. Publicar aplica os sete
              rascunhos às novas concessões. Limiares de depósito são fixos por
              modalidade (R$20–R$1.000).
            </ThemeText>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!data}
              isLoading={publication.isLoading}
              onClick={() => void publishPolicy(true)}
            >
              Publicar configurações
            </Button>
            <Button
              variant="secondary"
              disabled={!data?.policy?.enabled}
              onClick={() => void publishPolicy(false)}
            >
              Pausar campanha
            </Button>
          </div>
        </div>
      </Surface>

      {(error || catalog.error) && (
        <Surface variant="errorBanner">
          {error || getErrorMessage(catalog.error)}
        </Surface>
      )}

      <Surface variant="card">
        {catalog.isLoading ? (
          <ThemeText tone="secondary" className="p-5 text-sm">
            Carregando caixas…
          </ThemeText>
        ) : null}

        {!catalog.isLoading ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Caixa</th>
                  <th className={listTable.th}>Liberação</th>
                  <th className={listTable.th}>Itens</th>
                  <th className={listTable.th}>VE / Vitrine</th>
                  <th className={listTable.th}>Banco</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th} />
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {FREE_KINDS.map((kind) => {
                  const crate = data?.crates.find((c) => c.kind === kind)
                  const bank = data?.banks.find((b) =>
                    b.key.startsWith(`${crate?._id}:`),
                  )?.ledger
                  const published = data?.policy?.crates.find(
                    (c) => c.kind === kind,
                  )
                  return (
                    <tr key={kind} className={listTable.tr}>
                      <td className={listTable.td}>
                        <Link
                          to={`/dashboard/free-crates/${kind}`}
                          className="block rounded-xl transition hover:opacity-80"
                        >
                          <CaseListNameCell
                            name={crate?.name ?? FREE_LABELS[kind]}
                            slug={kind}
                            imageUrl={crate?.imageUrl}
                          />
                        </Link>
                      </td>
                      <td className={listTable.td}>
                        <ThemeText as="p" tone="primary" className="text-sm">
                          {FREE_LABELS[kind]}
                        </ThemeText>
                        <ThemeText as="p" tone="secondary" className="text-xs">
                          {freeCrateUnlockSummary(kind)}
                        </ThemeText>
                      </td>
                      <td className={listTable.td}>
                        {crate?.items?.length ?? 0}
                      </td>
                      <td className={`${listTable.td} tabular-nums`}>
                        <ThemeText as="p" tone="primary">
                          VE{' '}
                          {formatSkinsPrice(
                            crate?.valueBrl ?? 0,
                            SkinsCurrency.BRL,
                          )}
                        </ThemeText>
                        <ThemeText as="p" tone="secondary" className="text-xs">
                          Vitrine{' '}
                          {formatSkinsPrice(
                            crate?.displayValueBrl ?? 0,
                            SkinsCurrency.BRL,
                          )}
                        </ThemeText>
                      </td>
                      <td className={`${listTable.td} tabular-nums`}>
                        <ThemeText as="p" tone="primary">
                          {formatSkinsPrice(
                            bank?.bankBalanceBrl ?? 0,
                            SkinsCurrency.BRL,
                          )}
                        </ThemeText>
                        <ThemeText as="p" tone="faint" className="text-xs">
                          {bank?.totalOpens ?? 0} aberturas
                        </ThemeText>
                      </td>
                      <td className={listTable.td}>
                        <div className="flex flex-col items-start gap-1">
                          {crate ? (
                            <StatusPill active={crate.active} />
                          ) : (
                            <TextBadge>Não configurada</TextBadge>
                          )}
                          <ThemeText tone="faint" className="text-xs">
                            rascunho v{crate?.version ?? 0}
                            {published
                              ? ` · publicada v${published.version}`
                              : ' · não publicada'}
                          </ThemeText>
                        </div>
                      </td>
                      <td className={listTable.td}>
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            label={`Editar ${FREE_LABELS[kind as FreeKind]}`}
                            onClick={() =>
                              navigate(`/dashboard/free-crates/${kind}`)
                            }
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Surface>

      <Surface variant="settingsPanel" className="space-y-4 !p-5">
        <ThemeText as="h2" tone="primary" className="text-lg font-semibold">
          Concessões e aberturas
        </ThemeText>
        <form
          className="grid items-end gap-3 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault()
            setApplied(filters)
            setPage(1)
          }}
        >
          <Input
            label="ID do usuário"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          />
          <Select
            label="Modalidade"
            value={filters.kind}
            onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
          >
            <option value="">Todas</option>
            {FREE_KINDS.map((k) => (
              <option key={k} value={k}>
                {FREE_LABELS[k]}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos</option>
            {Object.entries(statuses).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Dia global"
            type="date"
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
          />
          <Button type="submit">Filtrar</Button>
        </form>

        {history.error ? (
          <Surface variant="errorBanner">
            {getErrorMessage(history.error)}
          </Surface>
        ) : null}

        <div className="flex flex-wrap gap-4 text-sm">
          {history.data?.metrics.map((m) => (
            <p key={`${m._id.status}-${m._id.currency}`}>
              {statuses[m._id.status]} ({m._id.currency}):{' '}
              <strong>{m.count}</strong> · pago {money(m.paid, m._id.currency)}
            </p>
          ))}
        </div>

        <div className={listTable.wrap}>
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                {['Data / usuário', 'Caixa / período', 'Estado', 'Prêmio', ''].map(
                  (t) => (
                    <th key={t || 'actions'} className={listTable.th}>
                      {t}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className={listTable.tbody}>
              {history.data?.data.map((g) => (
                <tr key={g._id} className={listTable.tr}>
                  <td className={listTable.td}>
                    {new Date(g.createdAt).toLocaleString('pt-BR')}
                    <br />
                    <code className="text-xs">{g.userId}</code>
                  </td>
                  <td className={listTable.td}>
                    {FREE_LABELS[g.kind]}
                    <br />
                    <ThemeText tone="faint" className="text-xs">
                      {g.period}
                    </ThemeText>
                  </td>
                  <td className={listTable.td}>{statuses[g.status]}</td>
                  <td className={listTable.td}>
                    {g.result
                      ? `${g.result.item.skinName} · ${money(
                          (g.currency === 'BRL'
                            ? g.result.item.valueBrl
                            : g.currency === 'USD'
                              ? g.result.item.valueUsd
                              : g.result.item.valueEur) ?? 0,
                          g.currency,
                        )}`
                      : '—'}
                  </td>
                  <td className={listTable.td}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelected(g)
                          setReason('')
                          setError('')
                        }}
                      >
                        Detalhes
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.isLoading && (
          <ThemeText tone="secondary" className="text-sm">
            Carregando histórico…
          </ThemeText>
        )}
        {!history.isLoading && !history.data?.data.length && (
          <ThemeText tone="secondary" className="text-sm">
            Nenhuma concessão para os filtros selecionados.
          </ThemeText>
        )}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {page} · {history.data?.total ?? 0} registros
          </span>
          <Button
            variant="secondary"
            disabled={page * 25 >= (history.data?.total ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </Surface>

      <Modal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title="Auditoria da recompensa"
      >
        {selected && (
          <div className="space-y-4 break-words">
            <p>ID: {selected._id}</p>
            <p>
              Política v{selected.policyVersion} · Caixa v
              {selected.snapshot.version}
            </p>
            <p>Depósitos: {selected.depositIds.join(', ') || '—'}</p>
            {selected.result && (
              <p>
                Resolução: {selected.result.method} · Banco antes:{' '}
                {money(selected.result.bank.balanceBefore, selected.currency)} ·
                Injeção: {money(selected.result.bank.injection, selected.currency)}{' '}
                · Depois:{' '}
                {money(selected.result.bank.balanceAfter, selected.currency)}
              </p>
            )}
            {selected.cancelReason && (
              <p>
                Cancelamento: {selected.cancelReason} · Admin:{' '}
                {selected.cancelledBy}
              </p>
            )}
            {selected.status === 'available' && (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setError('')
                  try {
                    const updated = await cancel({
                      id: selected._id,
                      reason,
                    }).unwrap()
                    setSelected(updated)
                  } catch (err) {
                    setError(getErrorMessage(err))
                  }
                }}
              >
                <Input
                  label="Motivo do cancelamento"
                  minLength={5}
                  maxLength={500}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="danger"
                  isLoading={cancellation.isLoading}
                >
                  Cancelar esta concessão
                </Button>
                <p className="text-sm text-muted">
                  O direito não será concedido novamente. Prêmios já abertos não
                  podem ser cancelados aqui.
                </p>
              </form>
            )}
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
