import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
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
  useDuplicateCaseMutation,
  useGetCasesQuery,
  type LootCase,
} from '@/redux/store/api/cases/api.cases'
import { DataVisionBanner } from '@/components/ui/DataVisionBanner'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  marginDirectionClassName,
  marginDirectionVsTarget,
  MARGIN_TARGET_DISPLAY_EPSILON,
} from '@/utils/caseEconomics'

export default function CasesPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { data = [], isLoading, isError, error } = useGetCasesQuery()
  const [deleteCase, deleteState] = useDeleteCaseMutation()
  const [duplicateCase, duplicateState] = useDuplicateCaseMutation()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (lootCase: LootCase) => {
    setActionError(null)

    const confirmed = await confirm({
      title: 'Excluir caixa',
      description: 'A caixa será arquivada e removida do catálogo, impedindo novas aberturas. O histórico e os registros financeiros serão preservados.',
      subjectLabel: 'Caixa',
      subjectName: lootCase.name,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      warning: 'Esta ação não apaga aberturas nem altera saldos anteriores.',
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

  const handleDuplicate = async (lootCase: LootCase) => {
    setActionError(null)
    setDuplicatingId(lootCase._id)
    try {
      await duplicateCase(lootCase._id).unwrap()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDuplicatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          subtitle={
            isSandbox
              ? 'Aberturas desta lista são só influencer. Preço, VE e margem agora são do catálogo (iguais nos dois lados).'
              : 'Aberturas desta lista são só produção. Preço, VE e margem agora são do catálogo (iguais nos dois lados).'
          }
        >
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

      <DataVisionBanner />

      <Surface variant="card">
        {isLoading ? (
          <ThemeText tone="secondary" className="p-5 text-sm">
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
          <ThemeText tone="secondary" className="p-5 text-sm">
            Nenhuma caixa criada ainda.
          </ThemeText>
        ) : null}

        {data.length > 0 ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Caixa</th>
                  <th className={listTable.th}>Preço</th>
                  <th className={listTable.th}>VE</th>
                  <th className={listTable.th}>Margem agora</th>
                  <th className={listTable.th}>Itens</th>
                  <th className={listTable.th}>Aberturas</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th} />
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.map((lootCase) => (
                  <tr
                    key={lootCase._id}
                    className={`${listTable.tr} ${
                      lootCase.expectedValueAlert
                        ? 'bg-red-50/90 dark:bg-red-950/25'
                        : ''
                    }`}
                    title={
                      lootCase.expectedValueAlert
                        ? `Margem agora ${lootCase.realMarginPercent.toFixed(2)}% · alvo ${lootCase.targetMarginPercent}%`
                        : undefined
                    }
                  >
                    <td className={listTable.td}>
                      <Link
                        to={`/dashboard/cases/${lootCase._id}/details`}
                        className="block rounded-xl transition hover:opacity-80"
                      >
                        <CaseListNameCell
                          name={lootCase.name}
                          slug={lootCase.slug}
                          imageUrl={lootCase.imageUrl}
                        />
                      </Link>
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
                      <ThemeText
                        tone={lootCase.expectedValueAlert ? 'danger' : 'primary'}
                        className="text-sm font-medium"
                      >
                        {formatSkinsPrice(lootCase.expectedValue, lootCase.currency)}
                      </ThemeText>
                    </td>
                    <td className={listTable.td}>
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          marginDirectionClassName(
                            marginDirectionVsTarget(
                              lootCase.realMarginPercent,
                              lootCase.targetMarginPercent,
                            ),
                          ) || 'text-foreground'
                        }`}
                      >
                        {lootCase.realMarginPercent.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        %
                      </span>
                      {Math.abs(lootCase.realMarginPercent - lootCase.targetMarginPercent) >
                      MARGIN_TARGET_DISPLAY_EPSILON ? (
                        <ThemeText tone="faint" className="text-xs tabular-nums">
                          alvo {lootCase.targetMarginPercent}%
                        </ThemeText>
                      ) : null}
                    </td>
                    <td className={listTable.td}>{lootCase.items.length}</td>
                    <td className={listTable.td}>
                      <ThemeText tone="primary" className="text-sm">
                        {isSandbox ? lootCase.totalTestOpens : lootCase.totalOpens}
                      </ThemeText>
                    </td>
                    <td className={listTable.td}>
                      <TextBadge>
                        {lootCase.active ? 'Ativa' : 'Inativa'}
                      </TextBadge>
                    </td>
                    <td className={listTable.td}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="Ver detalhes da caixa"
                          onClick={() =>
                            navigate(`/dashboard/cases/${lootCase._id}/details`)
                          }
                        >
                          <BarChart3 className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label="Duplicar caixa"
                          disabled={
                            duplicatingId === lootCase._id && duplicateState.isLoading
                          }
                          onClick={() => void handleDuplicate(lootCase)}
                        >
                          <Copy className="h-4 w-4" aria-hidden />
                        </IconButton>
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
    </div>
  )
}
