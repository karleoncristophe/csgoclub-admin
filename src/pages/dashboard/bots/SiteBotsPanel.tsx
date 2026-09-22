import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, ListPlus, Plus, Search, Trash2 } from 'lucide-react'
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
import { filterChipClass } from '@/components/skins/filterChipClass'
import { deleteUploadFile } from '@/lib/upload'
import {
  useCreateSiteBotMutation,
  useDeleteSiteBotMutation,
  useBulkDeleteSiteBotsMutation,
  useBulkImportSiteBotNamesMutation,
  useAssignSiteBotAvatarsMutation,
  useGetSiteBotsQuery,
  useGetSiteBotsStatusQuery,
  useUpdateSiteBotMutation,
  type AdminSiteBot,
  type SiteBotNameImportResult,
} from '@/redux/store/api/site-bots/api.site-bots'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { pickBotFallbackAvatar } from '@/lib/bot-avatar'
import { formatBotBalance, uploadBotAvatar } from './botAvatar'
import { SiteBotsAvatarAssignModal } from './SiteBotsAvatarAssignModal'
import {
  BULK_IMPORT_MAX_NAMES,
  BULK_STATUS_LABEL,
  botHasAvatar,
  normalizeBotKey,
  parseBulkNicknames,
  previewBulkNicknames,
  validateAvatarFiles,
} from './siteBotsBulk'

export { parseBulkNicknames, previewBulkNicknames } from './siteBotsBulk'

type PhotoFilter = 'all' | 'missing' | 'has'
type ActiveFilter = 'all' | 'active' | 'inactive'

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
  const [createBot, { isLoading: creating }] = useCreateSiteBotMutation()
  const [updateBot] = useUpdateSiteBotMutation()
  const [deleteBot] = useDeleteSiteBotMutation()
  const [bulkDelete, { isLoading: deletingMany }] =
    useBulkDeleteSiteBotsMutation()
  const [assignAvatars, { isLoading: assigningAvatars }] =
    useAssignSiteBotAvatarsMutation()
  const [bulkImportNames, { isLoading: importingNames }] =
    useBulkImportSiteBotNamesMutation()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [name, setName] = useState('')
  const [createImage, setCreateImage] = useState<CaseImageValue>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [batchProgress, setBatchProgress] = useState('')
  const [batchUploading, setBatchUploading] = useState(false)
  const [bulkActiveBusy, setBulkActiveBusy] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importRaw, setImportRaw] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<SiteBotNameImportResult | null>(null)
  const [assignFiles, setAssignFiles] = useState<File[]>([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [photoTargetKeys, setPhotoTargetKeys] = useState<string[] | null>(null)

  const importPreview = useMemo(
    () =>
      previewBulkNicknames(
        parseBulkNicknames(importRaw),
        bots.map((bot) => bot.nameKey || bot.name),
      ),
    [importRaw, bots],
  )
  const importPreviewCounts = useMemo(() => {
    const counts = { ok: 0, invalid: 0, duplicate_in_request: 0, already_exists: 0 }
    for (const row of importPreview) counts[row.status] += 1
    return counts
  }, [importPreview])
  const importOverLimit = importPreview.length > BULK_IMPORT_MAX_NAMES
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const filteredBots = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return bots.filter((bot) => {
      if (
        needle &&
        !bot.name.toLowerCase().includes(needle) &&
        !(bot.nameKey || '').toLowerCase().includes(needle)
      ) {
        return false
      }
      const hasPhoto = botHasAvatar(bot)
      if (photoFilter === 'missing' && hasPhoto) return false
      if (photoFilter === 'has' && !hasPhoto) return false
      if (activeFilter === 'active' && !bot.active) return false
      if (activeFilter === 'inactive' && bot.active) return false
      return true
    })
  }, [activeFilter, bots, photoFilter, query])

  const missingAvatarCount = useMemo(
    () => bots.filter((bot) => !botHasAvatar(bot)).length,
    [bots],
  )
  const visibleMissingCount = useMemo(
    () => filteredBots.filter((bot) => !botHasAvatar(bot)).length,
    [filteredBots],
  )

  const botIdKey = useMemo(() => bots.map((bot) => bot._id).join(','), [bots])
  const botIds = useMemo(() => (botIdKey ? botIdKey.split(',') : []), [botIdKey])
  const visibleIds = useMemo(() => filteredBots.map((bot) => bot._id), [filteredBots])
  const selectedOnPage = selectedIds.filter((id) => botIds.includes(id))
  const selectedVisible = selectedOnPage.filter((id) => visibleIds.includes(id))
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length

  const assignTargetBots = useMemo(() => {
    if (photoTargetKeys?.length) {
      const keys = new Set(photoTargetKeys)
      return bots.filter((bot) => keys.has(normalizeBotKey(bot.nameKey || bot.name)))
    }
    return bots.filter((bot) => selectedOnPage.includes(bot._id))
  }, [bots, photoTargetKeys, selectedOnPage])

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

  function toggleSelectVisible(checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return [...new Set([...current, ...visibleIds])]
      }
      const hide = new Set(visibleIds)
      return current.filter((id) => !hide.has(id))
    })
  }

  function selectVisibleWithoutPhoto() {
    const ids = filteredBots.filter((bot) => !botHasAvatar(bot)).map((bot) => bot._id)
    setSelectedIds((current) => [...new Set([...current, ...ids])])
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

  function closeImportModal() {
    if (importingNames) return
    setImportModalOpen(false)
    setImportRaw('')
    setImportError(null)
    setImportResult(null)
  }

  function closeAssignModal() {
    if (batchUploading) return
    setAssignOpen(false)
    setAssignFiles([])
    setPhotoTargetKeys(null)
  }

  function openAvatarPicker(targetKeys?: string[]) {
    setPageError(null)
    setPhotoTargetKeys(targetKeys ?? null)
    avatarInputRef.current?.click()
  }

  function handleAvatarFilesPicked(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    const invalid = validateAvatarFiles(files)
    if (invalid) {
      setPageError(invalid)
      return
    }
    setAssignFiles(files)
    setAssignOpen(true)
  }

  async function handleAssignConfirm(pairs: Array<{ file: File; botId: string }>) {
    if (pairs.length === 0) return
    setBatchUploading(true)
    setPageError(null)
    setBatchProgress(`Enviando ${pairs.length} foto(s)…`)
    try {
      const form = new FormData()
      form.set('mode', 'selected')
      form.set('ids', pairs.map((pair) => pair.botId).join(','))
      for (const pair of pairs) {
        form.append('files', pair.file)
      }
      const result = await assignAvatars(form).unwrap()
      setBatchProgress(
        `Concluído: ${result.updated}/${result.attempted} avatares atualizados.`,
      )
      if (result.errors.length) setPageError(result.errors.join(' · '))
      setAssignOpen(false)
      setAssignFiles([])
      setPhotoTargetKeys(null)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setBatchUploading(false)
    }
  }

  async function handleBulkImportNames() {
    const names = parseBulkNicknames(importRaw)
    if (names.length === 0 || importOverLimit) return
    setImportError(null)
    setImportResult(null)
    try {
      const result = await bulkImportNames({ names }).unwrap()
      setImportResult(result)
      setImportRaw('')
    } catch (error) {
      setImportError(getErrorMessage(error))
    }
  }

  function handleImportPhotos() {
    const created = (importResult?.results ?? [])
      .filter((row) => row.status === 'created')
      .map((row) => normalizeBotKey(row.name))
    if (created.length === 0) return
    closeImportModal()
    openAvatarPicker(created)
  }

  async function handleBulkActive(active: boolean) {
    if (selectedOnPage.length === 0) return
    const ok = await confirm({
      title: active ? 'Ativar bots selecionados?' : 'Desativar bots selecionados?',
      description: `${selectedOnPage.length} bot(s) ${
        active ? 'entram' : 'saem'
      } do pool de livedrop e battle.`,
      confirmLabel: active ? 'Ativar' : 'Desativar',
    })
    if (!ok) return
    setBulkActiveBusy(true)
    setPageError(null)
    try {
      for (let index = 0; index < selectedOnPage.length; index += 8) {
        await Promise.all(
          selectedOnPage.slice(index, index + 8).map((id) =>
            updateBot({ id, body: { active } }).unwrap(),
          ),
        )
      }
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setBulkActiveBusy(false)
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
      <ThemeText as="p" tone="faint" className="text-xs">
        Livedrop {status?.enabled === false ? 'pausado' : 'ativo'}
        {status?.nextAt
          ? ` · próximo drop por volta de ${formatShownAt(status.nextAt)}`
          : ''}
        {' · '}
        {bots.length} bots · {missingAvatarCount} sem foto
      </ThemeText>

      {pageError ? (
        <ThemeText as="p" className="text-sm text-red-500">
          {pageError}
        </ThemeText>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[16rem] flex-1 space-y-2">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              aria-label="Buscar nick"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nick…"
              className="w-full rounded-field border border-field-border bg-field py-2 pr-3 pl-9 text-sm text-field-foreground outline-none placeholder:text-field-placeholder focus:border-focus focus:ring-4 focus:ring-focus/15"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', `Todos (${filteredBots.length})`],
                ['missing', `Sem foto (${visibleMissingCount})`],
                ['has', 'Com foto'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  photoFilter === value ? filterChipClass.active : filterChipClass.inactive
                }
                onClick={() => setPhotoFilter(value)}
              >
                {label}
              </button>
            ))}
            {(
              [
                ['all', 'Qualquer status'],
                ['active', 'Ativos'],
                ['inactive', 'Inativos'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  activeFilter === value ? filterChipClass.active : filterChipClass.inactive
                }
                onClick={() => setActiveFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={() => {
              setImportError(null)
              setImportResult(null)
              setImportModalOpen(true)
            }}
          >
            <ListPlus className="h-4 w-4" />
            Importar nicks
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
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-secondary px-3 py-2">
        <ThemeText as="p" tone="secondary" className="mr-auto text-sm">
          {selectedOnPage.length} selecionado(s)
          {selectedOnPage.length > 0
            ? ` · ${
                bots.filter((bot) => selectedOnPage.includes(bot._id) && !botHasAvatar(bot))
                  .length
              } sem foto`
            : ''}
          {query || photoFilter !== 'all' || activeFilter !== 'all'
            ? ` · ${filteredBots.length} visíveis`
            : ''}
        </ThemeText>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={visibleIds.length === 0}
          onClick={() => toggleSelectVisible(true)}
        >
          Selecionar visíveis
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={visibleMissingCount === 0}
          onClick={selectVisibleWithoutPhoto}
        >
          Selecionar sem foto
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={selectedOnPage.length === 0}
          onClick={() => setSelectedIds([])}
        >
          Limpar
        </Button>
        <input
          ref={avatarInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={batchUploading}
          onChange={(event) => {
            const list = event.target.files
            event.target.value = ''
            handleAvatarFilesPicked(list)
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={batchUploading || selectedOnPage.length === 0}
          onClick={() => openAvatarPicker()}
        >
          <ImagePlus className="h-4 w-4" />
          Fotos nestes
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={bulkActiveBusy || selectedOnPage.length === 0}
          isLoading={bulkActiveBusy}
          onClick={() => void handleBulkActive(true)}
        >
          Ativar
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={bulkActiveBusy || selectedOnPage.length === 0}
          onClick={() => void handleBulkActive(false)}
        >
          Desativar
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="gap-2"
          disabled={deletingMany || selectedOnPage.length === 0}
          isLoading={deletingMany}
          onClick={() => void handleBulkDelete()}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
        {batchProgress ? (
          <span role="status" aria-live="polite" className="text-xs text-muted">
            {batchProgress}
          </span>
        ) : null}
      </div>

      <div className={listTable.wrap}>
        <table className={listTable.table}>
          <thead>
            <tr className={listTable.theadRow}>
              <th className={`${listTable.th} w-10`}>
                <Checkbox
                  name="select-visible-bots"
                  label="Selecionar visíveis"
                  hideLabel
                  checked={allVisibleSelected}
                  disabled={filteredBots.length === 0}
                  onChange={(event) => toggleSelectVisible(event.target.checked)}
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
                  Nenhum bot. Importe nicks ou crie um.
                </td>
              </tr>
            ) : filteredBots.length === 0 ? (
              <tr>
                <td className={listTable.td} colSpan={7}>
                  Nenhum bot neste filtro.
                </td>
              </tr>
            ) : (
              filteredBots.map((bot) => (
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

      <Modal
        open={importModalOpen}
        onOpenChange={(open) => {
          if (!open) closeImportModal()
          else setImportModalOpen(true)
        }}
        title="Importar nicks"
        description="Cole os nicks que você quer criar. Nada é gerado aleatoriamente — só entra o que estiver nesta lista."
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeImportModal}
              disabled={importingNames}
            >
              {importResult ? 'Fechar' : 'Cancelar'}
            </Button>
            {importResult && importResult.created > 0 ? (
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={handleImportPhotos}
              >
                <ImagePlus className="h-4 w-4" />
                Fotos destes nicks
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={
                importingNames || importPreviewCounts.ok === 0 || importOverLimit
              }
              isLoading={importingNames}
              onClick={() => void handleBulkImportNames()}
            >
              <ListPlus className="mr-1 h-4 w-4" />
              Importar {importPreviewCounts.ok > 0 ? `(${importPreviewCounts.ok})` : ''}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <textarea
            aria-label="Nicks para importar"
            value={importRaw}
            onChange={(event) => setImportRaw(event.target.value)}
            rows={10}
            disabled={importingNames}
            placeholder={'soUmTap\nheadshotBR\nnoScope_king'}
            className="w-full rounded-field border border-field-border bg-field px-3 py-2 font-mono text-sm text-field-foreground shadow-none outline-none transition placeholder:text-field-placeholder focus:border-focus focus:ring-4 focus:ring-focus/15 disabled:cursor-not-allowed disabled:opacity-70"
          />

          {importPreview.length > 0 ? (
            <div className="space-y-2">
              <ThemeText as="p" tone="faint" className="text-xs">
                {importPreview.length} nick(s) na lista · {importPreviewCounts.ok} serão criados ·{' '}
                {importPreviewCounts.already_exists} já existem ·{' '}
                {importPreviewCounts.duplicate_in_request} repetidos ·{' '}
                {importPreviewCounts.invalid} inválidos
              </ThemeText>
              {importOverLimit ? (
                <ThemeText as="p" className="text-sm text-red-500">
                  Máximo de {BULK_IMPORT_MAX_NAMES} nicks por importação.
                </ThemeText>
              ) : null}
              {importPreview.some((row) => row.status !== 'ok') ? (
                <div className="max-h-48 overflow-auto rounded-field border border-field-border">
                  <table className="w-full text-xs">
                    <tbody>
                      {importPreview
                        .filter((row) => row.status !== 'ok')
                        .slice(0, 200)
                        .map((row, index) => (
                          <tr key={`${row.name}-${index}`} className="border-b border-field-border last:border-0">
                            <td className="px-2 py-1 font-mono">{row.name || '—'}</td>
                            <td className="px-2 py-1 text-right text-muted">
                              {BULK_STATUS_LABEL[row.status]}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          {importResult ? (
            <ThemeText as="p" className="text-sm">
              Importação concluída: {importResult.created} criado(s), {importResult.skipped}{' '}
              ignorado(s) de {importResult.requested}. Se as fotos tiverem o mesmo nome do
              nick, use “Fotos destes nicks”.
            </ThemeText>
          ) : null}

          {importError ? (
            <ThemeText as="p" className="text-sm text-red-500">
              {importError}
            </ThemeText>
          ) : null}
        </div>
      </Modal>

      <SiteBotsAvatarAssignModal
        open={assignOpen}
        bots={assignTargetBots}
        files={assignFiles}
        busy={batchUploading || assigningAvatars}
        onClose={closeAssignModal}
        onConfirm={(pairs) => void handleAssignConfirm(pairs)}
      />
    </div>
  )
}
