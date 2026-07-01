import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { TextBadge } from '@/components/StatusPill'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { useGetCasesQuery, type LootCase } from '@/redux/store/api/cases/api.cases'
import {
  useCreateCaseVitrineMutation,
  useDeleteCaseVitrineMutation,
  useGetCaseVitrinesQuery,
  useUpdateCaseVitrineMutation,
  type CaseVitrine,
} from '@/redux/store/api/case-vitrines/api.case-vitrines'
import { getErrorMessage } from '@/utils/getErrorMessage'

function normalizeName(name: string) {
  return name.trim()
}

function buildCaseOptions(cases: LootCase[], currentVitrineId?: string | null) {
  return [...cases]
    .filter((lootCase) => {
      if (!lootCase.vitrineId) return true
      if (!currentVitrineId) return false
      return String(lootCase.vitrineId) === currentVitrineId
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((lootCase) => ({
      value: lootCase._id,
      label: lootCase.name,
      description: lootCase.active ? undefined : 'Inativa',
    }))
}

export default function VitrinesPage() {
  const { confirm } = useConfirm()
  const { data = [], isLoading, isError, error } = useGetCaseVitrinesQuery()
  const { data: cases = [] } = useGetCasesQuery()
  const [createVitrine, createState] = useCreateCaseVitrineMutation()
  const [updateVitrine, updateState] = useUpdateCaseVitrineMutation()
  const [deleteVitrine, deleteState] = useDeleteCaseVitrineMutation()

  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createSortOrder, setCreateSortOrder] = useState('0')
  const [createActive, setCreateActive] = useState(true)
  const [createCaseIds, setCreateCaseIds] = useState<string[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSortOrder, setEditSortOrder] = useState('0')
  const [editActive, setEditActive] = useState(true)
  const [editCaseIds, setEditCaseIds] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const existingNames = useMemo(
    () => new Set(data.map((item) => item.name.trim().toLowerCase())),
    [data],
  )

  const createNameNormalized = normalizeName(createName)
  const createNameTaken = createNameNormalized
    ? existingNames.has(createNameNormalized.toLowerCase())
    : false

  const resetCreateForm = () => {
    setCreateName('')
    setCreateDescription('')
    setCreateSortOrder('0')
    setCreateActive(true)
    setCreateCaseIds([])
  }

  const startEdit = (vitrine: CaseVitrine) => {
    setEditingId(vitrine._id)
    setEditName(vitrine.name)
    setEditDescription(vitrine.description ?? '')
    setEditSortOrder(String(vitrine.sortOrder))
    setEditActive(vitrine.active)
    setEditCaseIds(
      cases.filter((item) => item.vitrineId === vitrine._id).map((item) => item._id),
    )
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setEditSortOrder('0')
    setEditActive(true)
    setEditCaseIds([])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createNameNormalized || createNameTaken) return

    try {
      await createVitrine({
        name: createNameNormalized,
        description: createDescription.trim() || undefined,
        sortOrder: Number(createSortOrder) || 0,
        active: createActive,
        caseIds: createCaseIds,
      }).unwrap()
      resetCreateForm()
    } catch {
      // mutation state
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await updateVitrine({
        id,
        name: normalizeName(editName),
        description: editDescription.trim() || undefined,
        sortOrder: Number(editSortOrder) || 0,
        active: editActive,
        caseIds: editCaseIds,
      }).unwrap()
      cancelEdit()
    } catch {
      // mutation state
    }
  }

  const handleDelete = async (vitrine: CaseVitrine) => {
    const confirmed = await confirm({
      title: 'Excluir vitrine',
      description:
        'A vitrine será removida. As caixas vinculadas ficarão sem agrupamento no site.',
      subjectLabel: 'Vitrine',
      subjectName: vitrine.name,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      warning: 'Esta ação não pode ser desfeita.',
    })

    if (!confirmed) return
    if (editingId === vitrine._id) cancelEdit()

    setDeletingId(vitrine._id)
    try {
      await deleteVitrine(vitrine._id).unwrap()
    } catch {
      // mutation state
    } finally {
      setDeletingId(null)
    }
  }

  const renderCasePicker = (
    selectedIds: string[],
    onChange: (ids: string[]) => void,
    disabled: boolean,
    currentVitrineId?: string | null,
  ) => {
    const options = buildCaseOptions(cases, currentVitrineId)
    const assignedElsewhereCount = cases.filter(
      (lootCase) =>
        lootCase.vitrineId &&
        String(lootCase.vitrineId) !== String(currentVitrineId ?? ''),
    ).length

    return (
      <SearchableMultiSelect
        label="Caixas nesta vitrine"
        placeholder="Buscar caixa pelo nome…"
        hint="Digite para filtrar e clique para adicionar. Caixas já vinculadas a outra vitrine não aparecem aqui."
        options={options}
        value={selectedIds}
        onChange={onChange}
        disabled={disabled}
        emptyMessage={
          cases.length === 0
            ? 'Nenhuma caixa cadastrada ainda.'
            : assignedElsewhereCount === cases.length
              ? 'Todas as caixas já estão em outras vitrines.'
              : 'Nenhuma caixa encontrada para esta busca.'
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Agrupe as caixas em seções no site, no estilo csgo.net (ex.: Edição Limitada, Team Spirit).">
        Vitrines
      </PageTitle>

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Nova vitrine
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
          Defina o nome da seção e use a busca para adicionar as caixas. A ordem define a
          posição no site.
        </ThemeText>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Nome da vitrine"
              name="createName"
              placeholder="Ex.: Edição Limitada"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <Input
              label="Ordem no site"
              name="createSortOrder"
              type="number"
              min={0}
              step={1}
              value={createSortOrder}
              onChange={(e) => setCreateSortOrder(e.target.value)}
            />
            <div className="flex items-end pb-1">
              <Checkbox
                label="Ativa no site"
                checked={createActive}
                onChange={(e) => setCreateActive(e.target.checked)}
              />
            </div>
          </div>

          <Input
            label="Descrição (opcional)"
            name="createDescription"
            placeholder="Texto curto exibido abaixo do título da seção"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
          />

          {createNameTaken ? (
            <ThemeText as="p" tone="danger" className="text-sm">
              Já existe uma vitrine com este nome.
            </ThemeText>
          ) : null}

          {createNameNormalized ? (
            renderCasePicker(createCaseIds, setCreateCaseIds, createState.isLoading)
          ) : (
            <ThemeText as="p" tone="faint" className="text-sm">
              Informe o nome da vitrine para buscar e adicionar caixas.
            </ThemeText>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={createState.isLoading}
              disabled={!createNameNormalized || createNameTaken}
            >
              Criar vitrine
            </Button>
          </div>
        </form>

        {createState.isError ? (
          <ThemeText as="p" tone="danger" className="mt-3 text-sm">
            {getErrorMessage(createState.error)}
          </ThemeText>
        ) : null}
      </Surface>

      <Surface variant="card" className="!p-0">
        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="p-6 text-sm">
            Carregando vitrines…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner', 'm-6')}>
            {getErrorMessage(error)}
          </p>
        ) : null}

        {!isLoading && !isError && data.length === 0 ? (
          <ThemeText as="p" tone="secondary" className="p-6 text-sm">
            Nenhuma vitrine cadastrada.
          </ThemeText>
        ) : null}

        {!isLoading && data.length > 0 ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Nome</th>
                  <th className={listTable.th}>Ordem</th>
                  <th className={listTable.th}>Caixas</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th}>Ações</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.map((vitrine) => {
                  const isEditing = editingId === vitrine._id

                  if (isEditing) {
                    return (
                      <tr key={vitrine._id} className={listTable.tr}>
                        <td colSpan={5} className={listTable.td}>
                          <div className="space-y-4 py-2">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <Input
                                label="Nome"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                              <Input
                                label="Ordem"
                                type="number"
                                min={0}
                                value={editSortOrder}
                                onChange={(e) => setEditSortOrder(e.target.value)}
                              />
                              <div className="flex items-end pb-1">
                                <Checkbox
                                  label="Ativa no site"
                                  checked={editActive}
                                  onChange={(e) => setEditActive(e.target.checked)}
                                />
                              </div>
                            </div>
                            <Input
                              label="Descrição"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                            />
                            {renderCasePicker(
                              editCaseIds,
                              setEditCaseIds,
                              updateState.isLoading,
                              vitrine._id,
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveEdit(vitrine._id)}
                                isLoading={updateState.isLoading}
                              >
                                Salvar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={cancelEdit}
                              >
                                Cancelar
                              </Button>
                            </div>
                            {updateState.isError ? (
                              <ThemeText as="p" tone="danger" className="text-sm">
                                {getErrorMessage(updateState.error)}
                              </ThemeText>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={vitrine._id} className={listTable.tr}>
                      <td className={listTable.tdStrong}>
                        <ThemeText as="p" tone="primary" className="font-medium">
                          {vitrine.name}
                        </ThemeText>
                        {vitrine.description ? (
                          <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                            {vitrine.description}
                          </ThemeText>
                        ) : null}
                      </td>
                      <td className={listTable.td}>
                        <ThemeText as="span" tone="secondary" className="tabular-nums">
                          {vitrine.sortOrder}
                        </ThemeText>
                      </td>
                      <td className={listTable.td}>
                        <ThemeText as="span" tone="secondary" className="tabular-nums">
                          {vitrine.casesCount}
                        </ThemeText>
                      </td>
                      <td className={listTable.td}>
                        <TextBadge>
                          {vitrine.active ? 'Ativa' : 'Oculta'}
                        </TextBadge>
                      </td>
                      <td className={listTable.td}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <IconButton
                            type="button"
                            label="Editar vitrine"
                            onClick={() => startEdit(vitrine)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </IconButton>
                          <IconButton
                            type="button"
                            label="Excluir vitrine"
                            variant="danger"
                            disabled={deletingId === vitrine._id && deleteState.isLoading}
                            onClick={() => handleDelete(vitrine)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
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

        {deleteState.isError ? (
          <p className={surfaceClass('errorBanner', 'm-6')}>
            {getErrorMessage(deleteState.error)}
          </p>
        ) : null}
      </Surface>
    </div>
  )
}
