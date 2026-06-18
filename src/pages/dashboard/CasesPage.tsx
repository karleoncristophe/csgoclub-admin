import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { CaseDevSimulatorPanel } from '@/components/cases/CaseDevSimulatorPanel'
import { CaseListNameCell } from '@/components/cases/CaseListImage'
import { IconButton } from '@/components/ui/IconButton'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { TextBadge } from '@/components/StatusPill'
import { listTable } from '@/components/ui/listTable'
import { formatSkinsPrice } from '@/constants/skinsCurrency'
import {
  useDeleteCaseMutation,
  useGetCasesQuery,
  type LootCase,
} from '@/redux/store/api/cases/api.cases'
import { getErrorMessage } from '@/utils/getErrorMessage'

export default function CasesPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { data = [], isLoading, isError, error } = useGetCasesQuery()
  const [deleteCase, deleteState] = useDeleteCaseMutation()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [simulatorCaseId, setSimulatorCaseId] = useState<string | null>(null)

  useEffect(() => {
    if (!simulatorCaseId && data[0]?._id) {
      setSimulatorCaseId(data[0]._id)
    }
  }, [data, simulatorCaseId])

  const handleDelete = async (lootCase: LootCase) => {
    const hasRealOpens = lootCase.totalOpens > 0
    setActionError(null)

    const confirmed = await confirm({
      title: 'Excluir caixa',
      description: hasRealOpens
        ? 'Esta caixa já possui aberturas reais e não pode ser removida do sistema.'
        : 'A caixa será removida permanentemente do catálogo. Esta ação não pode ser desfeita.',
      subjectLabel: 'Caixa',
      subjectName: lootCase.name,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      confirmDisabled: hasRealOpens,
      warning: hasRealOpens
        ? 'Somente caixas sem aberturas reais podem ser excluídas.'
        : 'Itens, chances e configurações desta caixa serão perdidos.',
    })

    if (!confirmed) return

    setDeletingId(lootCase._id)
    try {
      await deleteCase(lootCase._id).unwrap()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const scrollToSimulator = (caseId: string) => {
    setSimulatorCaseId(caseId)
    document.getElementById('case-dev-simulator')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle="Caixas de drop com economia calculada em tempo real (estilo CSGONet).">
          Caixas
        </PageTitle>
        <Link
          to="/dashboard/cases/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova caixa
        </Link>
      </div>

      <Surface variant="card" className="!p-6">
        {isLoading ? (
          <ThemeText tone="secondary" className="text-sm">
            Carregando caixas...
          </ThemeText>
        ) : null}

        {isError ? (
          <Surface variant="errorBanner">{getErrorMessage(error)}</Surface>
        ) : null}

        {actionError ? (
          <Surface variant="errorBanner" className="mb-4">
            {actionError}
          </Surface>
        ) : null}

        {!isLoading && data.length === 0 ? (
          <ThemeText tone="secondary" className="text-sm">
            Nenhuma caixa criada ainda.
          </ThemeText>
        ) : null}

        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Caixa</th>
                  <th className={listTable.th}>Preço</th>
                  <th className={listTable.th}>VE</th>
                  <th className={listTable.th}>Margem</th>
                  <th className={listTable.th}>Itens</th>
                  <th className={listTable.th}>Aberturas</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th} />
                </tr>
              </thead>
              <tbody>
                {data.map((lootCase) => (
                  <tr key={lootCase._id} className={listTable.tr}>
                    <td className={listTable.td}>
                      <CaseListNameCell
                        name={lootCase.name}
                        slug={lootCase.slug}
                        imageUrl={lootCase.imageUrl}
                      />
                    </td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm font-medium">
                        {formatSkinsPrice(lootCase.price, lootCase.currency)}
                      </ThemeText>
                      {lootCase.discountPercent > 0 ? (
                        <ThemeText tone="faint" className="text-xs line-through">
                          {formatSkinsPrice(lootCase.listPrice, lootCase.currency)}
                        </ThemeText>
                      ) : null}
                    </td>
                    <td className={listTable.td}>
                      {formatSkinsPrice(lootCase.expectedValue, lootCase.currency)}
                    </td>
                    <td className={listTable.td}>{lootCase.realMarginPercent.toFixed(2)}%</td>
                    <td className={listTable.td}>{lootCase.items.length}</td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm">
                        {lootCase.totalOpens}
                      </ThemeText>
                      {lootCase.totalTestOpens > 0 ? (
                        <ThemeText tone="faint" className="text-xs">
                          +{lootCase.totalTestOpens} teste
                        </ThemeText>
                      ) : null}
                    </td>
                    <td className={listTable.td}>
                      <TextBadge>
                        {lootCase.active ? 'Ativa' : 'Inativa'}
                      </TextBadge>
                    </td>
                    <td className={listTable.td}>
                      <div className="flex items-center justify-end gap-1">
                        {import.meta.env.DEV ? (
                          <IconButton
                            label="Simular aberturas (dev)"
                            onClick={() => scrollToSimulator(lootCase._id)}
                          >
                            <Play className="h-4 w-4" aria-hidden />
                          </IconButton>
                        ) : null}
                        <IconButton
                          label="Editar caixa"
                          onClick={() => navigate(`/dashboard/cases/${lootCase._id}`)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label={
                            lootCase.totalOpens > 0
                              ? 'Não é possível excluir caixas com aberturas reais'
                              : 'Excluir caixa'
                          }
                          variant="danger"
                          disabled={deletingId === lootCase._id && deleteState.isLoading}
                          onClick={() => handleDelete(lootCase)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Surface>

      {import.meta.env.DEV && data.length > 0 ? (
        <div id="case-dev-simulator">
          <CaseDevSimulatorPanel cases={data} initialCaseId={simulatorCaseId} />
        </div>
      ) : null}
    </div>
  )
}
