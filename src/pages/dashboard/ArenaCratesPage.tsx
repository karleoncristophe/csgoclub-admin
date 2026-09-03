import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  ARENA_RARITY_COLOR,
  ARENA_RARITY_LABEL,
} from '@/components/arena/arenaRarity'
import { ArenaGameBuildPanel } from '@/components/arena/ArenaGameBuildPanel'
import { ArenaPlayPricingPanel } from '@/components/arena/ArenaPlayPricingPanel'
import { CaseListNameCell } from '@/components/cases/CaseListImage'
import { IconButton } from '@/components/ui/IconButton'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { StatusPill } from '@/components/StatusPill'
import { listTable } from '@/components/ui/listTable'
import {
  useDeleteArenaCrateMutation,
  useGetArenaCratesQuery,
  type ArenaCrate,
} from '@/redux/store/api/arena/api.arena'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'
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
      warning: 'Nome, imagem e skins desta crate serão perdidos.',
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
      <div className="space-y-4">
        <PageTitle subtitle="Preço da jogada é global. O valor da caixa é o VE das skins, sem margem — publi e elegível usam esse número.">
          Arena
        </PageTitle>
        <div className="flex items-center justify-between gap-3">
          <ArenaGameBuildPanel />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              to="/dashboard/arena/plays"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
            >
              Histórico de jogadas
            </Link>
            <Link
              to="/dashboard/arena/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Nova crate
            </Link>
          </div>
        </div>
      </div>

      <ArenaPlayPricingPanel />

      <Surface variant="card" className="!p-5">
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
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Crate</th>
                  <th className={listTable.th}>Raridade</th>
                  <th className={listTable.th}>Itens</th>
                  <th className={listTable.th}>Valor da caixa</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th} />
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
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
                    <td className={listTable.td}>{crate.items?.length ?? 0}</td>
                    <td className={`${listTable.td} tabular-nums`}>
                      <ThemeText as="p" tone="primary">
                        {formatSkinsPrice(crate.valueBrl ?? 0, SkinsCurrency.BRL)}
                      </ThemeText>
                      <ThemeText as="p" tone="secondary" className="text-xs">
                        {formatSkinsPrice(crate.valueUsd ?? 0, SkinsCurrency.USD)}
                        {' · '}
                        {formatSkinsPrice(crate.valueEur ?? 0, SkinsCurrency.EUR)}
                      </ThemeText>
                    </td>
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
