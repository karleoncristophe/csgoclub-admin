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
  VITRINE_LOCALE_LABELS,
  VITRINE_LOCALES,
  type CaseVitrine,
  type VitrineLocale,
  type VitrineLocaleTextMap,
} from '@/redux/store/api/case-vitrines/api.case-vitrines'
import { getErrorMessage } from '@/utils/getErrorMessage'

function normalizeName(name: string) {
  return name.trim()
}

function emptyLocaleMap(): Record<VitrineLocale, string> {
  return { 'pt-BR': '', 'en-US': '', 'es-ES': '' }
}

function toLocalePayload(map: Record<VitrineLocale, string>): VitrineLocaleTextMap {
  const result: VitrineLocaleTextMap = {}
  for (const locale of VITRINE_LOCALES) {
    const value = map[locale].trim()
    if (value) result[locale] = value
  }
  return result
}

function preloadNameI18n(vitrine: CaseVitrine): Record<VitrineLocale, string> {
  return {
    'pt-BR': vitrine.nameI18n?.['pt-BR'] ?? vitrine.name ?? '',
    'en-US': vitrine.nameI18n?.['en-US'] ?? '',
    'es-ES': vitrine.nameI18n?.['es-ES'] ?? '',
  }
}

function preloadDescriptionI18n(vitrine: CaseVitrine): Record<VitrineLocale, string> {
  return {
    'pt-BR': vitrine.descriptionI18n?.['pt-BR'] ?? vitrine.description ?? '',
    'en-US': vitrine.descriptionI18n?.['en-US'] ?? '',
    'es-ES': vitrine.descriptionI18n?.['es-ES'] ?? '',
  }
}

function buildCaseOptions(
  cases: LootCase[],
  options: { currentVitrineId?: string | null; allowAny?: boolean },
) {
  return [...cases]
    .filter((lootCase) => {
      if (options.allowAny) return true
      if (!lootCase.vitrineId) return true
      if (!options.currentVitrineId) return false
      return String(lootCase.vitrineId) === options.currentVitrineId
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

  const [createNameI18n, setCreateNameI18n] = useState(emptyLocaleMap)
  const [createDescriptionI18n, setCreateDescriptionI18n] = useState(emptyLocaleMap)
  const [createSortOrder, setCreateSortOrder] = useState('0')
  const [createActive, setCreateActive] = useState(true)
  const [createCaseIds, setCreateCaseIds] = useState<string[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNameI18n, setEditNameI18n] = useState(emptyLocaleMap)
  const [editDescriptionI18n, setEditDescriptionI18n] = useState(emptyLocaleMap)
  const [editSortOrder, setEditSortOrder] = useState('0')
  const [editActive, setEditActive] = useState(true)
  const [editIsHero, setEditIsHero] = useState(false)
  const [editCaseIds, setEditCaseIds] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const existingNames = useMemo(
    () => new Set(data.map((item) => item.name.trim().toLowerCase())),
    [data],
  )

  const createNameNormalized = normalizeName(createNameI18n['pt-BR'])
  const createNameTaken = createNameNormalized
    ? existingNames.has(createNameNormalized.toLowerCase())
    : false

  const setCreateNameLocale = (locale: VitrineLocale, value: string) => {
    setCreateNameI18n((prev) => ({ ...prev, [locale]: value }))
  }

  const setCreateDescriptionLocale = (locale: VitrineLocale, value: string) => {
    setCreateDescriptionI18n((prev) => ({ ...prev, [locale]: value }))
  }

  const setEditNameLocale = (locale: VitrineLocale, value: string) => {
    setEditNameI18n((prev) => ({ ...prev, [locale]: value }))
  }

  const setEditDescriptionLocale = (locale: VitrineLocale, value: string) => {
    setEditDescriptionI18n((prev) => ({ ...prev, [locale]: value }))
  }

  const resetCreateForm = () => {
    setCreateNameI18n(emptyLocaleMap())
    setCreateDescriptionI18n(emptyLocaleMap())
    setCreateSortOrder('0')
    setCreateActive(true)
    setCreateCaseIds([])
  }

  const startEdit = (vitrine: CaseVitrine) => {
    setEditingId(vitrine._id)
    setEditNameI18n(preloadNameI18n(vitrine))
    setEditDescriptionI18n(preloadDescriptionI18n(vitrine))
    setEditSortOrder(String(vitrine.sortOrder))
    setEditActive(vitrine.active)
    setEditIsHero(Boolean(vitrine.isHero))
    setEditCaseIds(
      vitrine.isHero
        ? [...(vitrine.heroCaseIds ?? [])]
        : cases
            .filter((item) => item.vitrineId === vitrine._id)
            .map((item) => item._id),
    )
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNameI18n(emptyLocaleMap())
    setEditDescriptionI18n(emptyLocaleMap())
    setEditSortOrder('0')
    setEditActive(true)
    setEditIsHero(false)
    setEditCaseIds([])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createNameNormalized || createNameTaken) return

    const nameI18n = toLocalePayload(createNameI18n)
    const descriptionI18n = toLocalePayload(createDescriptionI18n)
    const description = createDescriptionI18n['pt-BR'].trim() || undefined

    try {
      await createVitrine({
        name: createNameNormalized,
        description,
        nameI18n,
        descriptionI18n,
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
    const name = normalizeName(editNameI18n['pt-BR'])
    if (!name) return

    const nameI18n = toLocalePayload(editNameI18n)
    const descriptionI18n = toLocalePayload(editDescriptionI18n)
    const description = editDescriptionI18n['pt-BR'].trim() || undefined

    try {
      await updateVitrine({
        id,
        name,
        description,
        nameI18n,
        descriptionI18n,
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
    if (vitrine.isHero) return

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
    options: { currentVitrineId?: string | null; isHero?: boolean },
  ) => {
    const allowAny = Boolean(options.isHero)
    const selectOptions = buildCaseOptions(cases, {
      currentVitrineId: options.currentVitrineId,
      allowAny,
    })
    const assignedElsewhereCount = cases.filter(
      (lootCase) =>
        lootCase.vitrineId &&
        String(lootCase.vitrineId) !== String(options.currentVitrineId ?? ''),
    ).length

    return (
      <SearchableMultiSelect
        label={allowAny ? 'Caixas no hero da home' : 'Caixas nesta vitrine'}
        placeholder="Buscar caixa pelo nome…"
        hint={
          allowAny
            ? 'Escolha qualquer caixa do catálogo. Elas continuam nas outras vitrines normalmente.'
            : 'Digite para filtrar e clique para adicionar. Caixas já vinculadas a outra vitrine não aparecem aqui.'
        }
        options={selectOptions}
        value={selectedIds}
        onChange={onChange}
        disabled={disabled}
        emptyMessage={
          cases.length === 0
            ? 'Nenhuma caixa cadastrada ainda.'
            : !allowAny && assignedElsewhereCount === cases.length
              ? 'Todas as caixas já estão em outras vitrines.'
              : 'Nenhuma caixa encontrada para esta busca.'
        }
      />
    )
  }

  const renderLocaleTitleFields = (
    values: Record<VitrineLocale, string>,
    onChange: (locale: VitrineLocale, value: string) => void,
    namePrefix: string,
  ) => (
    <div className="grid gap-4 md:grid-cols-3">
      {VITRINE_LOCALES.map((locale) => (
        <Input
          key={`${namePrefix}-title-${locale}`}
          label={
            locale === 'pt-BR'
              ? `Título (${locale})`
              : `Título (${VITRINE_LOCALE_LABELS[locale]})`
          }
          name={`${namePrefix}Name-${locale}`}
          placeholder={locale === 'pt-BR' ? 'Ex.: Edição Limitada' : undefined}
          value={values[locale]}
          onChange={(e) => onChange(locale, e.target.value)}
          required={locale === 'pt-BR'}
        />
      ))}
    </div>
  )

  const renderLocaleDescriptionFields = (
    values: Record<VitrineLocale, string>,
    onChange: (locale: VitrineLocale, value: string) => void,
    namePrefix: string,
  ) => (
    <div className="grid gap-4 md:grid-cols-3">
      {VITRINE_LOCALES.map((locale) => (
        <Input
          key={`${namePrefix}-desc-${locale}`}
          label={`Descrição (${VITRINE_LOCALE_LABELS[locale]})`}
          name={`${namePrefix}Description-${locale}`}
          placeholder={
            locale === 'pt-BR'
              ? 'Texto curto exibido abaixo do título da seção'
              : undefined
          }
          value={values[locale]}
          onChange={(e) => onChange(locale, e.target.value)}
        />
      ))}
    </div>
  )

  const editNameNormalized = normalizeName(editNameI18n['pt-BR'])

  return (
    <div className="space-y-6">
      <PageTitle subtitle="A vitrine Hero é fixa e alimenta o banner da home. As demais agrupam seções do catálogo.">
        Vitrines
      </PageTitle>

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Nova vitrine
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
          Crie seções do catálogo (ex.: Edição Limitada). Para a faixa do banner, edite a
          vitrine Hero na lista abaixo.
        </ThemeText>

        <form onSubmit={handleCreate} className="space-y-4">
          {renderLocaleTitleFields(createNameI18n, setCreateNameLocale, 'create')}

          {renderLocaleDescriptionFields(
            createDescriptionI18n,
            setCreateDescriptionLocale,
            'create',
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          {createNameTaken ? (
            <ThemeText as="p" tone="danger" className="text-sm">
              Já existe uma vitrine com este nome.
            </ThemeText>
          ) : null}

          {createNameNormalized ? (
            renderCasePicker(createCaseIds, setCreateCaseIds, createState.isLoading, {})
          ) : (
            <ThemeText as="p" tone="faint" className="text-sm">
              Informe o título (pt-BR) da vitrine para buscar e adicionar caixas.
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
                            {renderLocaleTitleFields(
                              editNameI18n,
                              setEditNameLocale,
                              'edit',
                            )}
                            {renderLocaleDescriptionFields(
                              editDescriptionI18n,
                              setEditDescriptionLocale,
                              'edit',
                            )}
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            {editIsHero ? (
                              <ThemeText as="p" tone="secondary" className="text-sm">
                                Esta é a vitrine Hero: as caixas abaixo aparecem na faixa do
                                banner da home.
                              </ThemeText>
                            ) : null}
                            {renderCasePicker(
                              editCaseIds,
                              setEditCaseIds,
                              updateState.isLoading,
                              {
                                currentVitrineId: editIsHero ? null : vitrine._id,
                                isHero: editIsHero,
                              },
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveEdit(vitrine._id)}
                                isLoading={updateState.isLoading}
                                disabled={!editNameNormalized}
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
                        <div className="flex flex-wrap items-center gap-2">
                          <ThemeText as="p" tone="primary" className="font-medium">
                            {vitrine.name}
                          </ThemeText>
                          {vitrine.isHero ? <TextBadge>Hero</TextBadge> : null}
                        </div>
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
                          {!vitrine.isHero ? (
                            <IconButton
                              type="button"
                              label="Excluir vitrine"
                              variant="danger"
                              disabled={deletingId === vitrine._id && deleteState.isLoading}
                              onClick={() => handleDelete(vitrine)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </IconButton>
                          ) : null}
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
