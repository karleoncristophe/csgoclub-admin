import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ThemeText } from '@/components/ui/ThemeText'
import { pickBotFallbackAvatar } from '@/lib/bot-avatar'
import type { AdminSiteBot } from '@/redux/store/api/site-bots/api.site-bots'
import { matchFileToBot } from './siteBotsBulk'

type PairRow = {
  id: string
  file: File
  previewUrl: string
  botId: string
  match: 'filename' | 'manual' | 'none'
}

type SiteBotsAvatarAssignModalProps = {
  open: boolean
  bots: AdminSiteBot[]
  files: File[]
  busy?: boolean
  onClose: () => void
  onConfirm: (pairs: Array<{ file: File; botId: string }>) => void
}

function buildPairs(files: File[], bots: AdminSiteBot[]): PairRow[] {
  const used = new Set<string>()
  return files.map((file, index) => {
    const matched = matchFileToBot(file.name, bots, used)
    if (matched) used.add(matched._id)
    return {
      id: `${file.name}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      botId: matched?._id ?? '',
      match: matched ? 'filename' : 'none',
    }
  })
}

export function SiteBotsAvatarAssignModal({
  open,
  bots,
  files,
  busy = false,
  onClose,
  onConfirm,
}: SiteBotsAvatarAssignModalProps) {
  const [rows, setRows] = useState<PairRow[]>([])
  const filesKey = files.map((file) => `${file.name}:${file.size}:${file.lastModified}`).join('|')

  useEffect(() => {
    if (!open) {
      setRows((current) => {
        for (const row of current) URL.revokeObjectURL(row.previewUrl)
        return []
      })
      return
    }
    const next = buildPairs(files, bots)
    setRows(next)
    return () => {
      for (const row of next) URL.revokeObjectURL(row.previewUrl)
    }
    // Só remonta o lote quando o modal abre com outro conjunto de arquivos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filesKey])

  const assignedIds = useMemo(
    () => new Set(rows.map((row) => row.botId).filter(Boolean)),
    [rows],
  )
  const paired = rows.filter((row) => row.botId)
  const unmatched = rows.length - paired.length
  const filenameMatches = rows.filter((row) => row.match === 'filename').length

  function assignRow(id: string, botId: string) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, botId, match: botId ? 'manual' : 'none' }
          : row,
      ),
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose()
      }}
      title="Combinar fotos com bots"
      description="O arquivo casa com o nick quando o nome é o mesmo (soUmTap.png → soUmTap). O que não casar fica sem bot até você escolher."
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || paired.length === 0}
            isLoading={busy}
            onClick={() =>
              onConfirm(paired.map((row) => ({ file: row.file, botId: row.botId })))
            }
          >
            Enviar {paired.length > 0 ? `(${paired.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ThemeText as="p" tone="faint" className="text-xs">
          {rows.length} arquivo(s) · {filenameMatches} casou pelo nome · {paired.length} vai
          enviar · {unmatched} sem bot
        </ThemeText>

        {bots.length === 0 ? (
          <ThemeText as="p" className="text-sm text-red-500">
            Nenhum bot no alvo deste lote. Selecione quem vai receber as fotos.
          </ThemeText>
        ) : null}

        <div className="max-h-[min(52vh,28rem)] overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-secondary text-left text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Arquivo</th>
                <th className="px-3 py-2">Bot</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const bot = bots.find((item) => item._id === row.botId)
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.previewUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <ThemeText as="p" tone="primary" className="truncate font-mono text-xs">
                            {row.file.name}
                          </ThemeText>
                          <ThemeText as="p" tone="faint" className="text-[11px]">
                            {row.match === 'filename'
                              ? 'Casou pelo nome do arquivo'
                              : row.botId
                                ? 'Escolha manual'
                                : 'Sem bot — não envia'}
                          </ThemeText>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            bot?.avatarUrl?.trim() ||
                            pickBotFallbackAvatar(bot?._id || bot?.name || row.id)
                          }
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <select
                          aria-label={`Bot para ${row.file.name}`}
                          value={row.botId}
                          disabled={busy}
                          onChange={(event) => assignRow(row.id, event.target.value)}
                          className="min-w-0 flex-1 rounded-field border border-field-border bg-field px-2 py-1.5 text-sm text-field-foreground outline-none focus:border-focus focus:ring-4 focus:ring-focus/15"
                        >
                          <option value="">Não enviar</option>
                          {bots.map((item) => (
                            <option
                              key={item._id}
                              value={item._id}
                              disabled={assignedIds.has(item._id) && item._id !== row.botId}
                            >
                              {item.name}
                              {item.avatarUrl?.trim() ? '' : ' · sem foto'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
