import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  CaseImageUploader,
  isPendingCaseImage,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ThemeText } from '@/components/ui/ThemeText'
import { listTable } from '@/components/ui/listTable'
import { deleteUploadFile } from '@/lib/upload'
import {
  useCreateSiteBotMutation,
  useDeleteSiteBotMutation,
  useBulkDeleteSiteBotsMutation,
  useGenerateSiteBotsMutation,
  useGetSiteBotsQuery,
  useGetSiteBotsStatusQuery,
  useUpdateSiteBotMutation,
  type AdminSiteBot,
} from '@/redux/store/api/site-bots/api.site-bots'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { pickBotFallbackAvatar } from '@/lib/bot-avatar'
import { formatBotBalance, uploadBotAvatar } from './botAvatar'

function formatShownAt(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SiteBotAvatarEditor = memo(function SiteBotAvatarEditor({
  bot,
  onError,
}: {
  bot: AdminSiteBot
  onError: (message: string | null) => void
}) {
  const [updateBot, { isLoading }] = useUpdateSiteBotMutation()
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
      placeholderSrc={pickBotFallbackAvatar(bot._id || bot.name)}
    />
  )
})

const SiteBotNameEditor = memo(function SiteBotNameEditor({
  bot,
  onError,
}: {
  bot: AdminSiteBot
  onError: (message: string | null) => void
}) {
  const [updateBot, { isLoading }] = useUpdateSiteBotMutation()
  const [value, setValue] = useState(bot.name)

  useEffect(() => {
    setValue(bot.name)
  }, [bot.name])

  async function persist() {
    const next = value.trim()
    if (next.length < 2 || next === bot.name) {
      setValue(bot.name)
      return
    }
    onError(null)
    try {
      await updateBot({ id: bot._id, body: { name: next } }).unwrap()
    } catch (error) {
      setValue(bot.name)
      onError(getErrorMessage(error))
    }
  }

  return (
    <input
      aria-label={`Nick de ${bot.name}`}
      value={value}
      maxLength={32}
      disabled={isLoading}
      className="w-full min-w-36 max-w-52 rounded-field border border-field-border bg-field px-2 py-1.5 text-sm font-medium text-field-foreground shadow-none outline-none transition placeholder:text-field-placeholder focus:border-focus focus:ring-4 focus:ring-focus/15 disabled:cursor-not-allowed disabled:bg-default disabled:text-muted disabled:opacity-70"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => void persist()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setValue(bot.name)
          event.currentTarget.blur()
        }
      }}
    />
  )
})

const SiteBotRow = memo(function SiteBotRow({
  bot,
  selected,
  onToggleSelected,
  onError,
  onToggleActive,
  onDelete,
}: {
  bot: AdminSiteBot
  selected: boolean
  onToggleSelected: (id: string, checked: boolean) => void
  onError: (message: string | null) => void
  onToggleActive: (bot: AdminSiteBot) => void
  onDelete: (bot: AdminSiteBot) => void
}) {
  return (
    <tr className={listTable.tr}>
      <td className={listTable.td}>
        <Checkbox
          name={`select-bot-${bot._id}`}
          label={`Selecionar ${bot.name}`}
          hideLabel
          checked={selected}
          onChange={(event) => onToggleSelected(bot._id, event.target.checked)}
        />
      </td>
      <td className={listTable.td}>
        <SiteBotAvatarEditor bot={bot} onError={onError} />
      </td>
      <td className={listTable.td}>
        <SiteBotNameEditor bot={bot} onError={onError} />
      </td>
      <td className={listTable.td}>{formatBotBalance(bot.balance)}</td>
      <td className={listTable.td}>{formatShownAt(bot.lastShownAt)}</td>
      <td className={listTable.td}>
        <button
          className="underline"
          onClick={() => onToggleActive(bot)}
          type="button"
        >
          {bot.active ? 'Sim' : 'Não'}
        </button>
      </td>
      <td className={listTable.td}>
        <button
          className="text-red-500"
          onClick={() => onDelete(bot)}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
})

export function SiteBotsPanel() {
  const { confirm } = useConfirm()
  const { data: bots = [], isLoading } = useGetSiteBotsQuery()
  const { data: status } = useGetSiteBotsStatusQuery()
  const [generate, { isLoading: generating }] = useGenerateSiteBotsMutation()
  const [createBot, { isLoading: creating }] = useCreateSiteBotMutation()
  const [updateBot] = useUpdateSiteBotMutation()
  const [deleteBot] = useDeleteSiteBotMutation()
  const [bulkDelete, { isLoading: deletingMany }] =
    useBulkDeleteSiteBotsMutation()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [createImage, setCreateImage] = useState<CaseImageValue>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const botIdKey = useMemo(() => bots.map((bot) => bot._id).join(','), [bots])
  const botIds = useMemo(() => (botIdKey ? botIdKey.split(',') : []), [botIdKey])
  const selectedOnPage = selectedIds.filter((id) => botIds.includes(id))
  const allSelected =
    botIds.length > 0 && selectedOnPage.length === botIds.length

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => botIds.includes(id))
      return next.length === current.length ? current : next
    })
  }, [botIds])

  const toggleSelected = useCallback((id: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id]
      }
      return current.filter((item) => item !== id)
    })
  }, [])

  const handleToggleActive = useCallback(
    (bot: AdminSiteBot) => {
      void updateBot({
        id: bot._id,
        body: { active: !bot.active },
      })
    },
    [updateBot],
  )

  const handleDeleteBot = useCallback(
    async (bot: AdminSiteBot) => {
      const ok = await confirm({
        title: 'Excluir bot do site?',
        description:
          'Ele some do gerador de livedrop. Drops antigos de vitrine continuam até expirar.',
        subjectLabel: 'Bot',
        subjectName: bot.name,
        confirmLabel: 'Excluir',
        confirmVariant: 'danger',
      })
      if (!ok) return
      if (bot.avatarUrl) {
        void deleteUploadFile(bot.avatarUrl)
      }
      await deleteBot(bot._id)
    },
    [confirm, deleteBot],
  )

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? botIds : [])
  }

  function resetCreateForm() {
    setName('')
    setCreateImage(null)
    setCreateError(null)
  }

  function closeCreateModal() {
    if (creating || uploadingAvatar) return
    setCreateModalOpen(false)
    resetCreateForm()
  }

  async function handleGenerate() {
    setPageError(null)
    try {
      await generate({ count: 100 }).unwrap()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  async function handleBulkDelete() {
    if (selectedOnPage.length === 0) return
    const ok = await confirm({
      title: 'Excluir bots selecionados?',
      description:
        `${selectedOnPage.length} bot(s) saem do pool de livedrop e battle. Drops antigos de vitrine continuam até expirar.`,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
    })
    if (!ok) return

    setPageError(null)
    try {
      const avatarUrls: string[] = []
      for (let index = 0; index < selectedOnPage.length; index += 300) {
        const result = await bulkDelete({
          ids: selectedOnPage.slice(index, index + 300),
        }).unwrap()
        avatarUrls.push(...result.avatarUrls)
      }
      for (const url of avatarUrls) {
        void deleteUploadFile(url)
      }
      setSelectedIds([])
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  async function handleCreate() {
    setCreateError(null)
    try {
      setUploadingAvatar(isPendingCaseImage(createImage))
      const avatarUrl = await uploadBotAvatar(createImage)
      await createBot({
        name: name.trim(),
        active: true,
        avatarUrl,
      }).unwrap()
      setCreateModalOpen(false)
      resetCreateForm()
    } catch (error) {
      setCreateError(getErrorMessage(error))
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-4">
      <ThemeText as="p" tone="secondary" className="max-w-3xl text-xs">
        Mesmo pool para livedrop, top drop e battle. Livedrop não cria User,
        não abre caixa de verdade e não mexe em saldo, banco, elegível nem
        contagem. Clique no ticker leva para a caixa — bot não tem perfil.
        Quando uma caixa já tem 5 itens no top drop, o gerador para de
        preencher aquela caixa. Na battle o bot entra na vaga com o saldo
        interno da lista — começa em 1.000.000 e recarrega quando acaba.
        O botão adiciona mais 100 bots no pool (não completa a lista).
      </ThemeText>

      <ThemeText as="p" tone="faint" className="text-xs">
        Livedrop {status?.enabled === false ? 'pausado' : 'ativo'}
        {status?.nextAt
          ? ` · próximo drop por volta de ${formatShownAt(status.nextAt)}`
          : ''}
        {' · '}
        {bots.length} bots
      </ThemeText>

      {pageError ? (
        <ThemeText as="p" className="text-sm text-red-500">
          {pageError}
        </ThemeText>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {selectedOnPage.length > 0 ? (
          <Button
            type="button"
            variant="danger"
            className="gap-2"
            disabled={deletingMany}
            isLoading={deletingMany}
            onClick={() => void handleBulkDelete()}
          >
            <Trash2 className="h-4 w-4" />
            Excluir selecionados ({selectedOnPage.length})
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          disabled={generating}
          isLoading={generating}
          onClick={() => void handleGenerate()}
        >
          <Sparkles className="h-4 w-4" />
          Adicionar 100 bots
        </Button>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            resetCreateForm()
            setCreateModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Criar nick
        </Button>
      </div>

      <div className={listTable.wrap}>
        <table className={listTable.table}>
          <thead>
            <tr className={listTable.theadRow}>
              <th className={`${listTable.th} w-10`}>
                <Checkbox
                  name="select-all-bots"
                  label="Selecionar todos"
                  hideLabel
                  checked={allSelected}
                  disabled={bots.length === 0}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                />
              </th>
              <th className={listTable.th}>Foto</th>
              <th className={listTable.th}>Nick</th>
              <th className={listTable.th}>Saldo</th>
              <th className={listTable.th}>Último drop</th>
              <th className={listTable.th}>Ativo</th>
              <th className={listTable.th} />
            </tr>
          </thead>
          <tbody className={listTable.tbody}>
            {isLoading ? (
              <tr>
                <td className={listTable.td} colSpan={7}>
                  Carregando...
                </td>
              </tr>
            ) : bots.length === 0 ? (
              <tr>
                <td className={listTable.td} colSpan={7}>
                  Nenhum bot. Adicione 100 ou crie um nick.
                </td>
              </tr>
            ) : (
              bots.map((bot) => (
                <SiteBotRow
                  key={bot._id}
                  bot={bot}
                  selected={selectedIds.includes(bot._id)}
                  onToggleSelected={toggleSelected}
                  onError={setPageError}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteBot}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
          else setCreateModalOpen(true)
        }}
        title="Criar bot do site"
        description="Nick no estilo Steam. Avatar pode entrar depois."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeCreateModal}
              disabled={creating || uploadingAvatar}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={creating || uploadingAvatar || !name.trim()}
              isLoading={creating || uploadingAvatar}
              onClick={() => void handleCreate()}
            >
              <Plus className="mr-1 h-4 w-4" />
              Criar nick
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <CaseImageUploader
            variant="avatar"
            value={createImage}
            onChange={setCreateImage}
            disabled={creating || uploadingAvatar}
          />
          <Input
            label="Nick"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="soUmTap"
            maxLength={32}
          />
          {createError ? (
            <ThemeText as="p" className="text-sm text-red-500">
              {createError}
            </ThemeText>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
