import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  ARENA_RARITY_COLOR,
  ARENA_RARITY_LABEL,
} from '@/components/arena/arenaRarity'
import { CaseListNameCell } from '@/components/cases/CaseListImage'
import { IconButton } from '@/components/ui/IconButton'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { StatusPill } from '@/components/StatusPill'
import { listTable } from '@/components/ui/listTable'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
import {
  useDeleteArenaCrateMutation,
  useGetArenaCratesQuery,
  type ArenaCrate,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'

export default function ArenaCratesPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { data = [], isLoading, isError, error } = useGetArenaCratesQuery()
  const [deleteCrate] = useDeleteArenaCrateMutation()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (crate: ArenaCrate) => {
    setActionError(null)
    const confirmed = await confirm({
      title: 'Excluir crate da Arena',
      description:
        'A crate será removida do catálogo da Arena. Partidas já jogadas não são alteradas.',
      subjectLabel: 'Crate',
      subjectName: crate.name,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      warning: 'Nome, imagem, valor e skins desta crate serão perdidos.',
    })
    if (!confirmed) return

    setDeletingId(crate._id)
    try {
      await deleteCrate(crate._id).unwrap()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle="Crates da Arena com valor fixo em BRL, USD e EUR. O jogador escolhe uma crate, paga o valor da moeda da carteira e joga. Sem VE, taxa ou margem.">
          Arena
        </PageTitle>
        <Link
          to="/dashboard/arena/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova crate
        </Link>
      </div>

      <Surface variant="card" className="!p-6">
        {isLoading ? (
          <ThemeText tone="secondary" className="text-sm">
            Carregando crates...
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
            Nenhuma crate da Arena criada ainda.
          </ThemeText>
        ) : null}

        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Crate</th>
                  <th className={listTable.th}>Raridade</th>
                  <th className={listTable.th}>Valor (BRL / USD / EUR)</th>
                  <th className={listTable.th}>Itens</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th} />
                </tr>
              </thead>
              <tbody>
                {data.map((crate) => (
                  <tr key={crate._id} className={listTable.tr}>
                    <td className={listTable.td}>
                      <Link
                        to={`/dashboard/arena/${crate._id}`}
                        className="block rounded-xl transition hover:opacity-80"
                      >
                        <CaseListNameCell
                          name={crate.name}
                          slug={crate.slug}
                          imageUrl={crate.imageUrl}
                        />
                      </Link>
                    </td>
                    <td className={listTable.td}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              crate.color || ARENA_RARITY_COLOR[crate.rarity],
                          }}
                        />
                        {ARENA_RARITY_LABEL[crate.rarity] ?? crate.rarity}
                      </span>
                    </td>
                    <td className={listTable.td}>
                      <div className="flex flex-col gap-0.5">
                        <ThemeText tone="primary" className="text-sm font-medium">
                          {formatSkinsPrice(
                            crate.valueBrl ?? crate.value,
                            SkinsCurrency.BRL,
                          )}
                        </ThemeText>
                        <ThemeText tone="faint" className="text-xs">
                          {formatSkinsPrice(crate.valueUsd ?? 0, SkinsCurrency.USD)}
                          {' · '}
                          {formatSkinsPrice(crate.valueEur ?? 0, SkinsCurrency.EUR)}
                        </ThemeText>
                      </div>
                    </td>
                    <td className={listTable.td}>{crate.items?.length ?? 0}</td>
                    <td className={listTable.td}>
                      <StatusPill active={crate.active} />
                    </td>
                    <td className={listTable.td}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="Editar crate"
                          onClick={() =>
                            navigate(`/dashboard/arena/${crate._id}`)
                          }
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label="Excluir crate"
                          variant="danger"
                          disabled={deletingId === crate._id}
                          onClick={() => void handleDelete(crate)}
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
