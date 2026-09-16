import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Pagination } from '@/components/ui/Pagination'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { DataVisionBanner } from '@/components/ui/DataVisionBanner'
import { parsePositiveInt, useUrlFilters } from '@/hooks/useUrlFilters'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import {
  useCancelAdminBattleMutation,
  useGetAdminBattlesQuery,
} from '@/redux/store/api/battles/api.battles'
import {
  BattlePlayerAvatars,
  BattleStatusBadge,
  battleModeLabel,
  formatBattleMoney,
} from './battles/battleUi'

const BATTLES_PAGE_SIZE = 20

const BATTLES_FILTER_DEFAULTS = {
  page: '1',
}

export default function BattlesAdminPage() {
  const { confirm } = useConfirm()
  const dataEnvironment = usePlatformDataEnvironment()
  const isSandbox = dataEnvironment === 'SANDBOX'
  const { filters, setFilter } = useUrlFilters(BATTLES_FILTER_DEFAULTS)
  const page = parsePositiveInt(filters.page, 1)
  const safePage = Math.max(page, 1)
  const {
    data: battlesData,
    isLoading: battlesLoading,
    isFetching: battlesFetching,
    refetch,
  } = useGetAdminBattlesQuery({
    page: safePage,
    limit: BATTLES_PAGE_SIZE,
    dataEnvironment,
  })
  const battles = battlesData?.data ?? []
  const totalPages = Math.max(1, battlesData?.totalPages ?? 1)
  const currentPage = Math.min(safePage, totalPages)
  const [cancelBattle] = useCancelAdminBattleMutation()

  useEffect(() => {
    if (page > totalPages) {
      setFilter('page', String(totalPages), { resetPage: false })
    }
  }, [page, totalPages, setFilter])

  return (
    <div className="space-y-8">
      <PageTitle
        subtitle={
          isSandbox
            ? 'Só battles com influencer na vaga. Bots de vaga e de livedrop ficam em Bots.'
            : 'Só battles de user normal (e lobbies só com bot). Bots de vaga e de livedrop ficam em Bots.'
        }
      >
        Battles
      </PageTitle>

      <DataVisionBanner />

      <div className="flex items-center justify-between gap-3">
        <ThemeText as="h2" className="text-lg font-semibold">
          Battles recentes
        </ThemeText>
        <Button variant="secondary" onClick={() => refetch()} type="button">
          Atualizar
        </Button>
      </div>
      <div className={listTable.wrap}>
        <table className={listTable.table}>
          <thead>
            <tr className={listTable.theadRow}>
              <th className={listTable.th}>ID</th>
              <th className={listTable.th}>Jogadores</th>
              <th className={listTable.th}>Status</th>
              <th className={listTable.th}>Modo</th>
              <th className={listTable.th}>Preço</th>
              <th className={listTable.th}>Round</th>
              <th className={listTable.th} />
            </tr>
          </thead>
          <tbody className={listTable.tbody}>
            {battlesLoading ? (
              <tr>
                <td className={listTable.td} colSpan={7}>
                  Carregando...
                </td>
              </tr>
            ) : battles.length === 0 ? (
              <tr>
                <td className={listTable.td} colSpan={7}>
                  Nenhuma battle
                </td>
              </tr>
            ) : (
              battles.map((battle) => {
                const canCancel =
                  battle.status === 'lobby' ||
                  battle.status === 'countdown' ||
                  battle.status === 'running'

                return (
                  <tr key={battle.id} className={listTable.tr}>
                    <td className={listTable.td}>
                      <Link
                        to={`/dashboard/battles/${battle.id}`}
                        className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {battle.id.slice(-8)}
                      </Link>
                    </td>
                    <td className={listTable.td}>
                      <Link
                        to={`/dashboard/battles/${battle.id}`}
                        className="inline-flex items-center gap-2"
                      >
                        <BattlePlayerAvatars
                          seats={battle.seats}
                          winnerSeatIndex={battle.winnerSeatIndex}
                          size="sm"
                        />
                      </Link>
                    </td>
                    <td className={listTable.td}>
                      <BattleStatusBadge status={battle.status} />
                    </td>
                    <td className={listTable.td}>
                      {battleModeLabel(battle.mode)}
                    </td>
                    <td className={listTable.tdStrong}>
                      {formatBattleMoney(battle.priceTotal, battle.currency)}
                    </td>
                    <td className={listTable.td}>
                      {battle.currentRound}
                      <span className="text-zinc-400">
                        /{battle.caseSequence?.length ?? '—'}
                      </span>
                    </td>
                    <td className={listTable.td}>
                      <div className="flex items-center justify-end gap-2">
                        {canCancel ? (
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Cancelar battle e reembolsar?',
                                description:
                                  'Jogadores humanos recebem o escrow de volta.',
                                subjectLabel: 'Battle',
                                subjectName: battle.id.slice(-8),
                                confirmLabel: 'Cancelar battle',
                                confirmVariant: 'danger',
                              })
                              if (ok) await cancelBattle(battle.id)
                            }}
                            type="button"
                          >
                            Cancelar
                          </Button>
                        ) : null}
                        <Link
                          to={`/dashboard/battles/${battle.id}`}
                          className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Detalhes
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        className="mt-2"
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(next) =>
          setFilter(
            'page',
            String(Math.min(Math.max(next, 1), totalPages)),
            { resetPage: false },
          )
        }
      />

      {battlesFetching && !battlesLoading ? (
        <ThemeText as="p" tone="faint" className="text-center text-xs">
          Atualizando página...
        </ThemeText>
      ) : null}
    </div>
  )
}
