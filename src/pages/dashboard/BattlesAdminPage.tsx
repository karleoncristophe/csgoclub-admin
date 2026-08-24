import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ChevronRight, Plus, Trash2 } from 'lucide-react'
import {
  CaseImageUploader,
  isPendingCaseImage,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { deleteUploadFile, uploadSingleFile } from '@/lib/upload'
import {
  useCancelAdminBattleMutation,
  useCreateBattleBotMutation,
  useDeleteBattleBotMutation,
  useGetAdminBattlesQuery,
  useGetBattleBotsQuery,
  useUpdateBattleBotMutation,
  type AdminBattleBot,
} from '@/redux/store/api/battles/api.battles'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  BattlePlayerAvatars,
  BattleStatusBadge,
  battleModeLabel,
  formatBattleMoney,
} from './battles/battleUi'

const BATTLES_PAGE_SIZE = 20
const BOT_AVATAR_FOLDER = 'bots'

function formatBotBalance(value: number | undefined) {
  return (value ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

async function uploadBotAvatar(
  image: CaseImageValue,
  previousUrl?: string,
): Promise<string | undefined> {
  if (isPendingCaseImage(image)) {
    const uploaded = await uploadSingleFile(image.file, BOT_AVATAR_FOLDER, {
      crop: image.crop,
    })
    if (previousUrl && previousUrl !== uploaded.url) {
      void deleteUploadFile(previousUrl)
    }
    return uploaded.url
  }
  if (typeof image === 'string' && image.trim()) {
    return image.trim()
  }
  if (image == null && previousUrl) {
    void deleteUploadFile(previousUrl)
    return undefined
  }
  return previousUrl
}

function BotAvatarEditor({
  bot,
  onError,
}: {
  bot: AdminBattleBot
  onError: (message: string | null) => void
}) {
  const [updateBot, { isLoading }] = useUpdateBattleBotMutation()
  const [value, setValue] = useState<CaseImageValue>(bot.avatarUrl ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(bot.avatarUrl ?? null)
  }, [bot.avatarUrl])

  async function persist(next: CaseImageValue) {
    setValue(next)
    if (typeof next === 'string' && next === (bot.avatarUrl || '')) return

    setSaving(true)
    onError(null)
    try {
      const avatarUrl = await uploadBotAvatar(next, bot.avatarUrl)
      await updateBot({
        id: bot._id,
        body: { avatarUrl: avatarUrl ?? '' },
      }).unwrap()
      setValue(avatarUrl ?? null)
    } catch (error) {
      setValue(bot.avatarUrl ?? null)
      onError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <CaseImageUploader
      variant="avatar"
      value={value}
      onChange={(next) => void persist(next)}
      disabled={isLoading || saving}
      label=""
      description=""
      emptyLabel=""
      compactActions
    />
  )
}

export default function BattlesAdminPage() {
  const { confirm } = useConfirm()
  const { data: bots = [], isLoading: botsLoading } = useGetBattleBotsQuery()
  const [page, setPage] = useState(1)
  const safePage = Math.max(page, 1)
  const {
    data: battlesData,
    isLoading: battlesLoading,
    isFetching: battlesFetching,
    refetch,
  } = useGetAdminBattlesQuery({ page: safePage, limit: BATTLES_PAGE_SIZE })
  const battles = battlesData?.data ?? []
  const totalPages = Math.max(1, battlesData?.totalPages ?? 1)
  const currentPage = Math.min(safePage, totalPages)
  const [createBot, { isLoading: creating }] = useCreateBattleBotMutation()
  const [updateBot] = useUpdateBattleBotMutation()
  const [deleteBot] = useDeleteBattleBotMutation()
  const [cancelBattle] = useCancelAdminBattleMutation()

  const [name, setName] = useState('')
  const [weight, setWeight] = useState('1')
  const [createImage, setCreateImage] = useState<CaseImageValue>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  async function handleCreate() {
    setError(null)
    try {
      setUploadingAvatar(isPendingCaseImage(createImage))
      const avatarUrl = await uploadBotAvatar(createImage)
      await createBot({
        name: name.trim(),
        weight: Number(weight) || 1,
        active: true,
        avatarUrl,
      }).unwrap()
      setName('')
      setWeight('1')
      setCreateImage(null)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageTitle subtitle="Bots abrem caixas como players e histórico de case battles.">
        Battles
      </PageTitle>

      {error ? (
        <ThemeText as="p" className="text-sm text-red-500">
          {error}
        </ThemeText>
      ) : null}

      <Surface variant="card" className="space-y-4 !p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-600" />
          <ThemeText as="h2" className="text-lg font-semibold">
            Bots
          </ThemeText>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <CaseImageUploader
            variant="avatar"
            value={createImage}
            onChange={setCreateImage}
            disabled={creating || uploadingAvatar}
          />
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Crusher"
          />
          <Input
            label="Peso"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button
            disabled={creating || uploadingAvatar || !name.trim()}
            isLoading={creating || uploadingAvatar}
            onClick={handleCreate}
          >
            <Plus className="mr-1 h-4 w-4" />
            Criar bot
          </Button>
        </div>
        <ThemeText as="p" tone="secondary" className="text-xs">
          O bot sorteia com a mesma elegibilidade do jogador. O prêmio dele não
          mexe no banco da caixa. Tem saldo próprio que começa em 1.000.000 e
          recarrega quando acaba. Peso = chance de ser escolhido na vaga.
        </ThemeText>

        <div className={listTable.wrap}>
          <table className={listTable.table}>
            <thead>
              <tr>
                <th className={listTable.th}>Foto</th>
                <th className={listTable.th}>Nome</th>
                <th className={listTable.th}>Saldo</th>
                <th className={listTable.th}>Peso</th>
                <th className={listTable.th}>Ativo</th>
                <th className={listTable.th} />
              </tr>
            </thead>
            <tbody>
              {botsLoading ? (
                <tr>
                  <td className={listTable.td} colSpan={6}>
                    Carregando...
                  </td>
                </tr>
              ) : bots.length === 0 ? (
                <tr>
                  <td className={listTable.td} colSpan={6}>
                    Nenhum bot
                  </td>
                </tr>
              ) : (
                bots.map((bot) => (
                  <tr key={bot._id}>
                    <td className={listTable.td}>
                      <BotAvatarEditor bot={bot} onError={setError} />
                    </td>
                    <td className={listTable.td}>{bot.name}</td>
                    <td className={listTable.td}>
                      {formatBotBalance(bot.balance)}
                    </td>
                    <td className={listTable.td}>
                      <Input
                        label="Peso"
                        className="w-16"
                        defaultValue={String(bot.weight)}
                        onBlur={(e) => {
                          const next = Number(e.target.value)
                          if (
                            !Number.isFinite(next) ||
                            next === bot.weight ||
                            next < 1
                          ) {
                            e.target.value = String(bot.weight)
                            return
                          }
                          void updateBot({
                            id: bot._id,
                            body: { weight: next },
                          })
                        }}
                      />
                    </td>
                    <td className={listTable.td}>
                      <button
                        className="underline"
                        onClick={() =>
                          updateBot({
                            id: bot._id,
                            body: { active: !bot.active },
                          })
                        }
                        type="button"
                      >
                        {bot.active ? 'Sim' : 'Não'}
                      </button>
                    </td>
                    <td className={listTable.td}>
                      <button
                        className="text-red-500"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Excluir bot?',
                            description: 'O bot será removido permanentemente.',
                            subjectLabel: 'Bot',
                            subjectName: bot.name,
                            confirmLabel: 'Excluir',
                            confirmVariant: 'danger',
                          })
                          if (ok) {
                            if (bot.avatarUrl) {
                              void deleteUploadFile(bot.avatarUrl)
                            }
                            await deleteBot(bot._id)
                          }
                        }}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface variant="card" className="space-y-4 !p-4">
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
              <tr>
                <th className={listTable.th}>ID</th>
                <th className={listTable.th}>Jogadores</th>
                <th className={listTable.th}>Status</th>
                <th className={listTable.th}>Modo</th>
                <th className={listTable.th}>Preço</th>
                <th className={listTable.th}>Round</th>
                <th className={listTable.th} />
              </tr>
            </thead>
            <tbody>
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
            setPage(Math.min(Math.max(next, 1), totalPages))
          }
        />

        {battlesFetching && !battlesLoading ? (
          <ThemeText as="p" tone="faint" className="text-center text-xs">
            Atualizando página...
          </ThemeText>
        ) : null}
      </Surface>
    </div>
  )
}
