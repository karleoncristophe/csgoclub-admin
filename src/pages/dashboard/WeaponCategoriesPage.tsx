import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import {
  useCreateWeaponCategoryMutation,
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

function clampTax(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1000, Math.max(0, value))
}

export default function WeaponCategoriesPage() {
  const { data = [], isLoading, isError, error } = useGetWeaponCategoriesQuery()
  const [createCategory, createState] = useCreateWeaponCategoryMutation()
  const [updateCategory, updateState] = useUpdateWeaponCategoryMutation()

  const [createName, setCreateName] = useState('')
  const [createTax, setCreateTax] = useState('0')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTax, setEditTax] = useState('0')

  const availableNames = useMemo(() => {
    const existing = new Set(data.map((item) => item.name))
    return WEAPON_TYPE_OPTIONS.filter((name) => !existing.has(name))
  }, [data])

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
    if (!createName.trim()) return

    try {
      await createCategory({
        name: createName.trim(),
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
        name: editName.trim(),
        taxPercent: clampTax(Number(editTax)),
      }).unwrap()
      cancelEdit()
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Taxas por tipo de arma (porcentagem sobre o preço base do catálogo).">
        Categorias
      </PageTitle>

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-4 text-base font-semibold">
          Nova categoria
        </ThemeText>

        <form
          onSubmit={handleCreate}
          className="mb-6 grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end"
        >
          <Select
            label="Tipo de arma"
            name="createName"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          >
            <option value="">Selecione...</option>
            {availableNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>

          <Input
            label="Taxa (%)"
            name="createTax"
            type="number"
            min={0}
            step="0.01"
            value={createTax}
            onChange={(e) => setCreateTax(e.target.value)}
          />

          <Button type="submit" isLoading={createState.isLoading} disabled={!createName}>
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

                    return (
                      <tr key={category._id} className={listTable.tr}>
                        <td className={listTable.tdStrong}>
                          {isEditing ? (
                            <Input
                              name={`edit-name-${category._id}`}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
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
                            <Button size="sm" variant="secondary" onClick={() => startEdit(category)}>
                              Editar
                            </Button>
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
      </Surface>
    </div>
  )
}
