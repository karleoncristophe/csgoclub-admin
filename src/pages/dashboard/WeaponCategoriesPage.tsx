import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import {
  useCreateWeaponCategoryMutation,
  useDeleteWeaponCategoryMutation,
  useGetWeaponCategoriesQuery,
  useUpdateWeaponCategoryMutation,
  type WeaponCategory,
} from '@/redux/store/api/weapon-categories/api.weapon-categories'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { FALLBACK_WEAPON_CATEGORY, WEAPON_TYPE_OPTIONS } from '@/utils/skinWeaponType'

function categoryDisplayName(name: string) {
  if (name === FALLBACK_WEAPON_CATEGORY) {
    return 'All (sem tipo de arma)'
  }
  return name
}

function isProtectedCategory(category: WeaponCategory) {
  return category.name === FALLBACK_WEAPON_CATEGORY
}

function clampTax(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1000, Math.max(0, value))
}

function normalizeCategoryName(name: string) {
  return name.trim()
}

export default function WeaponCategoriesPage() {
  const { confirm } = useConfirm()
  const { data = [], isLoading, isError, error } = useGetWeaponCategoriesQuery()
  const [createCategory, createState] = useCreateWeaponCategoryMutation()
  const [updateCategory, updateState] = useUpdateWeaponCategoryMutation()
  const [deleteCategory, deleteState] = useDeleteWeaponCategoryMutation()

  const [createName, setCreateName] = useState('')
  const [createTax, setCreateTax] = useState('0')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTax, setEditTax] = useState('0')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const existingNames = useMemo(
    () => new Set(data.map((item) => item.name.trim().toLowerCase())),
    [data],
  )

  const createNameNormalized = normalizeCategoryName(createName)
  const createNameTaken = createNameNormalized
    ? existingNames.has(createNameNormalized.toLowerCase())
    : false

  const nameSuggestions = useMemo(() => {
    const suggested = [...WEAPON_TYPE_OPTIONS, 'Charm', 'Sticker', 'Agent']
    return [...new Set(suggested)].filter(
      (name) => !existingNames.has(name.toLowerCase()),
    )
  }, [existingNames])

  const startEdit = (category: WeaponCategory) => {
    setEditingId(category._id)
    setEditName(category.name)
    setEditTax(String(category.taxPercent))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditTax('0')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createNameNormalized || createNameTaken) return

    try {
      await createCategory({
        name: createNameNormalized,
        taxPercent: clampTax(Number(createTax)),
      }).unwrap()
      setCreateName('')
      setCreateTax('0')
    } catch {
      // error handled by mutation state
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await updateCategory({
        id,
        name: normalizeCategoryName(editName),
        taxPercent: clampTax(Number(editTax)),
      }).unwrap()
      cancelEdit()
    } catch {
      // error handled by mutation state
    }
  }

  const handleDelete = async (category: WeaponCategory) => {
    if (isProtectedCategory(category)) return

    const label = categoryDisplayName(category.name)
    const confirmed = await confirm({
      title: 'Excluir categoria',
      description: 'A categoria será removida e as skins associadas passarão a usar a taxa padrão All.',
      subjectLabel: 'Categoria',
      subjectName: label,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      warning: 'Esta ação não pode ser desfeita.',
    })

    if (!confirmed) return

    if (editingId === category._id) {
      cancelEdit()
    }

    setDeletingId(category._id)
    try {
      await deleteCategory(category._id).unwrap()
    } catch {
      // error handled by mutation state
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Taxas por tipo de arma (porcentagem sobre o preço base do catálogo).">
        Categorias
      </PageTitle>

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Nova categoria
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-4 text-xs">
          Informe um nome livre (ex.: Charm, Sticker) ou um tipo de arma ainda não cadastrado.
        </ThemeText>

        <form
          onSubmit={handleCreate}
          className="mb-2 grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end"
        >
          <div>
            <Input
              label="Nome da categoria"
              name="createName"
              list="weapon-category-suggestions"
              placeholder="Ex.: Charm, Rifle..."
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <datalist id="weapon-category-suggestions">
              {nameSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {createNameTaken ? (
              <ThemeText as="p" tone="secondary" className="mt-1 text-xs text-red-500">
                Já existe uma categoria com este nome.
              </ThemeText>
            ) : null}
          </div>

          <Input
            label="Taxa (%)"
            name="createTax"
            type="number"
            min={0}
            step="0.01"
            value={createTax}
            onChange={(e) => setCreateTax(e.target.value)}
          />

          <Button
            type="submit"
            isLoading={createState.isLoading}
            disabled={!createNameNormalized || createNameTaken}
          >
            Criar
          </Button>
        </form>

        {createState.isError ? (
          <p className={`mb-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(createState.error)}
          </p>
        ) : null}

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando categorias...
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Tipo de arma</th>
                  <th className={listTable.th}>Taxa (%)</th>
                  <th className={listTable.th}>Ações</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={listTable.empty}>
                      Nenhuma categoria cadastrada.
                    </td>
                  </tr>
                ) : (
                  data.map((category) => {
                    const isEditing = editingId === category._id
                    const isDeleting = deletingId === category._id
                    const protectedCategory = isProtectedCategory(category)

                    return (
                      <tr key={category._id} className={listTable.tr}>
                        <td className={listTable.tdStrong}>
                          {isEditing ? (
                            <Input
                              name={`edit-name-${category._id}`}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              disabled={protectedCategory}
                            />
                          ) : (
                            categoryDisplayName(category.name)
                          )}
                        </td>
                        <td className={listTable.td}>
                          {isEditing ? (
                            <Input
                              name={`edit-tax-${category._id}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={editTax}
                              onChange={(e) => setEditTax(e.target.value)}
                            />
                          ) : (
                            `${category.taxPercent}%`
                          )}
                        </td>
                        <td className={listTable.td}>
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                isLoading={updateState.isLoading}
                                onClick={() => handleSaveEdit(category._id)}
                              >
                                Salvar
                              </Button>
                              <Button size="sm" variant="secondary" onClick={cancelEdit}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <IconButton
                                label="Editar categoria"
                                onClick={() => startEdit(category)}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </IconButton>
                              {!protectedCategory ? (
                                <IconButton
                                  label="Excluir categoria"
                                  variant="danger"
                                  disabled={isDeleting && deleteState.isLoading}
                                  onClick={() => handleDelete(category)}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </IconButton>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {updateState.isError ? (
          <p className={`mt-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(updateState.error)}
          </p>
        ) : null}

        {deleteState.isError ? (
          <p className={`mt-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(deleteState.error)}
          </p>
        ) : null}
      </Surface>
    </div>
  )
}
